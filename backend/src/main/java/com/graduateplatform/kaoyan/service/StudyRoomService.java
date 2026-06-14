package com.graduateplatform.kaoyan.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.kaoyan.entity.*;
import com.graduateplatform.kaoyan.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Service
@Transactional
public class StudyRoomService {

    private static final long ROOM_STREAM_TIMEOUT_MS = 30L * 60L * 1000L;

    private final StudyRoomRepository roomRepository;
    private final StudyRoomMemberRepository memberRepository;
    private final StudyRoomMessageRepository messageRepository;
    private final StudyRoomSessionRepository sessionRepository;
    private final GraduateSchoolRepository schoolRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final Map<Long, List<SseEmitter>> roomEmitters = new ConcurrentHashMap<>();

    public StudyRoomService(StudyRoomRepository roomRepository,
                            StudyRoomMemberRepository memberRepository,
                            StudyRoomMessageRepository messageRepository,
                            StudyRoomSessionRepository sessionRepository,
                            GraduateSchoolRepository schoolRepository,
                            UserRepository userRepository,
                            ObjectMapper objectMapper) {
        this.roomRepository = roomRepository;
        this.memberRepository = memberRepository;
        this.messageRepository = messageRepository;
        this.sessionRepository = sessionRepository;
        this.schoolRepository = schoolRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    // ========== Room CRUD ==========

    public Map<String, Object> createRoom(Long userId, Map<String, Object> body) {
        String name = str(body.get("name"));
        if (name == null || name.isBlank()) throw new BusinessException("请输入自习室名称");
        Long schoolId = toLong(body.get("schoolId"));
        String major = str(body.get("major"));
        String schoolName = null;
        if (schoolId != null) {
            schoolName = schoolRepository.findById(schoolId)
                    .map(GraduateSchool::getName).orElse(null);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        StudyRoom room = StudyRoom.builder()
                .name(name)
                .school(schoolId != null ? GraduateSchool.builder().id(schoolId).build() : null)
                .schoolName(schoolName)
                .major(major)
                .createdBy(user)
                .status(StudyRoom.Status.OPEN)
                .build();
        room = roomRepository.save(room);

        StudyRoomMember member = StudyRoomMember.builder()
                .room(room).user(user).build();
        memberRepository.save(member);

        StudyRoomSession session = StudyRoomSession.builder()
                .room(room).user(user).build();
        sessionRepository.save(session);

        return toRoomMap(room);
    }

    public Map<String, Object> getRoomList(Map<String, String> params) {
        int page = Math.max(0, Integer.parseInt(params.getOrDefault("page", "0")));
        int size = Math.min(50, Integer.parseInt(params.getOrDefault("size", "20")));
        Long schoolId = params.get("schoolId") != null ? Long.parseLong(params.get("schoolId")) : null;
        String major = params.get("major");
        String statusStr = params.getOrDefault("status", "OPEN");

        Page<StudyRoom> rows = roomRepository.findByFilters(
                StudyRoom.Status.valueOf(statusStr), schoolId, major,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return page(rows.map(this::toRoomMap));
    }

    public Map<String, Object> getRoomDetail(Long roomId, Long userId) {
        StudyRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException("自习室不存在"));
        List<StudyRoomMember> activeMembers = memberRepository.findByRoomIdAndLeftAtIsNull(roomId);

        Map<String, Object> result = toRoomMap(room);
        result.put("members", activeMembers.stream().map(this::toMemberMap).collect(Collectors.toList()));
        result.put("myMemberId", userId != null ?
                memberRepository.findByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId).map(StudyRoomMember::getId).orElse(null) : null);
        result.put("isOwner", userId != null && room.getCreatedBy().getId().equals(userId));
        return result;
    }

    // ========== Membership ==========

    public Map<String, Object> joinRoom(Long userId, Long roomId) {
        // 如果已经是本房间的成员，直接返回，不重复创建
        Optional<StudyRoomMember> alreadyInRoom = memberRepository.findByRoomIdAndUserIdAndLeftAtIsNull(roomId, userId);
        if (alreadyInRoom.isPresent()) {
            StudyRoomSession session = sessionRepository.findByUserIdAndRoomIdAndEndedAtIsNull(userId, roomId).orElse(null);
            Map<String, Object> result = toMemberMap(alreadyInRoom.get());
            result.put("sessionStartedAt", session != null ? session.getStartedAt().toString() : alreadyInRoom.get().getJoinedAt().toString());
            return result;
        }

        Optional<StudyRoomMember> existing = memberRepository.findCurrentMembership(userId);
        if (existing.isPresent()) {
            throw new BusinessException("请先离开当前所在自习室，再加入新房间");
        }

        StudyRoom room = roomRepository.findByIdAndStatus(roomId, StudyRoom.Status.OPEN)
                .orElseThrow(() -> new BusinessException("自习室不存在或已关闭"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        StudyRoomMember member = StudyRoomMember.builder()
                .room(room).user(user).build();
        member = memberRepository.save(member);

        StudyRoomSession session = StudyRoomSession.builder()
                .room(room).user(user).build();
        sessionRepository.save(session);

        emitRoomEvent(roomId, "member-joined", Map.of(
                "member", toMemberMap(member),
                "memberCount", memberRepository.findByRoomIdAndLeftAtIsNull(roomId).size()
        ));
        emitLeaderboardUpdate(roomId, "all");

        Map<String, Object> result = toMemberMap(member);
        result.put("sessionStartedAt", session.getStartedAt().toString());
        return result;
    }

    public void leaveRoom(Long userId) {
        List<StudyRoomMember> memberships = memberRepository.findCurrentMemberships(userId);
        if (memberships.isEmpty()) {
            throw new BusinessException("当前不在任何自习室中");
        }
        StudyRoomMember member = memberships.get(0);
        Long roomId = member.getRoom().getId();

        Optional<StudyRoomSession> optSession = sessionRepository.findByUserIdAndRoomIdAndEndedAtIsNull(
                userId, roomId);
        if (optSession.isPresent()) {
            StudyRoomSession session = optSession.get();
            session.setEndedAt(LocalDateTime.now());
            int duration = (int) Duration.between(session.getStartedAt(), session.getEndedAt()).toSeconds();
            session.setDurationSeconds(Math.max(1, duration));
            sessionRepository.save(session);
        }

        member.setLeftAt(LocalDateTime.now());
        if (member.getTotalDurationSeconds() == null) member.setTotalDurationSeconds(0L);
        memberRepository.save(member);

        int activeCount = memberRepository.findByRoomIdAndLeftAtIsNull(roomId).size();
        emitRoomEvent(roomId, "member-left", Map.of(
                "userId", userId,
                "memberCount", activeCount
        ));
        emitLeaderboardUpdate(roomId, "all");
    }

    public void closeRoom(Long userId, Long roomId) {
        StudyRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException("自习室不存在"));
        if (!room.getCreatedBy().getId().equals(userId)) {
            throw new BusinessException("只有创建者可以关闭自习室");
        }
        room.setStatus(StudyRoom.Status.CLOSED);
        roomRepository.save(room);

        // 把所有成员标记为离开，并结束他们的 session
        List<StudyRoomMember> activeMembers = memberRepository.findByRoomIdAndLeftAtIsNull(roomId);
        LocalDateTime now = LocalDateTime.now();
        for (StudyRoomMember m : activeMembers) {
            m.setLeftAt(now);
            memberRepository.save(m);

            Optional<StudyRoomSession> session = sessionRepository.findByUserIdAndRoomIdAndEndedAtIsNull(
                    m.getUser().getId(), roomId);
            if (session.isPresent()) {
                StudyRoomSession s = session.get();
                s.setEndedAt(now);
                int duration = (int) Duration.between(s.getStartedAt(), now).toSeconds();
                s.setDurationSeconds(Math.max(1, duration));
                sessionRepository.save(s);
            }
        }

        // 广播关闭事件
        emitRoomEvent(roomId, "room-closed", Map.of("roomId", roomId));
        emitLeaderboardUpdate(roomId, "all");
    }

    // ========== Messages ==========

    public Map<String, Object> sendMessage(Long userId, Long roomId, Map<String, Object> body) {
        String content = str(body.get("content"));
        if (content == null || content.isBlank()) throw new BusinessException("消息内容不能为空");

        StudyRoomMember member = memberRepository.findCurrentMembershipInRoom(userId, roomId)
                .orElseThrow(() -> new BusinessException("请先加入自习室"));

        StudyRoomMessage msg = StudyRoomMessage.builder()
                .room(StudyRoom.builder().id(roomId).build())
                .sender(member.getUser())
                .content(content)
                .build();
        msg = messageRepository.save(msg);

        Map<String, Object> msgMap = toMessageMap(msg);
        emitRoomEvent(roomId, "message", msgMap);
        return msgMap;
    }

    public Map<String, Object> getMessagesAfter(Long roomId, Long userId, String sinceStr) {
        LocalDateTime since = sinceStr != null ? LocalDateTime.parse(sinceStr) : LocalDateTime.now().minusYears(1);
        // 使用 > 而不是 >=，避免因时间精度问题漏掉恰好和 since 同秒的消息
        Page<StudyRoomMessage> msgs = messageRepository.findByRoomIdAndCreatedAtGreaterThanOrderByCreatedAtAsc(
                roomId, since, PageRequest.of(0, 200));
        return page(msgs.map(this::toMessageMap));
    }

    // ========== SSE ==========

    public SseEmitter subscribeRoom(Long roomId) {
        roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException("自习室不存在"));

        SseEmitter emitter = new SseEmitter(ROOM_STREAM_TIMEOUT_MS);
        roomEmitters.computeIfAbsent(roomId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        emitter.onCompletion(() -> removeRoomEmitter(roomId, emitter));
        emitter.onTimeout(() -> removeRoomEmitter(roomId, emitter));
        emitter.onError(e -> removeRoomEmitter(roomId, emitter));

        try {
            emitter.send(SseEmitter.event().name("room-update")
                    .data(Map.of("type", "connected", "roomId", roomId,
                            "createdAt", LocalDateTime.now().toString())));
        } catch (IOException e) {
            removeRoomEmitter(roomId, emitter);
        }
        return emitter;
    }

    public List<Map<String, Object>> getMyCreatedRooms(Long userId) {
        return roomRepository.findByCreatedByIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toRoomMap)
                .collect(Collectors.toList());
    }

    // ========== Leaderboard ==========

    public Map<String, Object> getMyCurrentRoom(Long userId) {
        List<StudyRoomMember> memberships = memberRepository.findCurrentMemberships(userId);
        if (memberships.isEmpty()) {
            return Map.of("inRoom", false);
        }
        StudyRoomMember member = memberships.get(0);
        StudyRoom room = roomRepository.findById(member.getRoom().getId()).orElse(null);
        if (room == null || room.getStatus() == StudyRoom.Status.CLOSED) {
            Optional<StudyRoomSession> session = sessionRepository.findByUserIdAndRoomIdAndEndedAtIsNull(
                    member.getUser().getId(), member.getRoom().getId());
            if (session.isPresent()) {
                StudyRoomSession s = session.get();
                s.setEndedAt(LocalDateTime.now());
                s.setDurationSeconds(0);
                sessionRepository.save(s);
            }
            member.setLeftAt(LocalDateTime.now());
            memberRepository.save(member);
            return Map.of("inRoom", false);
        }
        return Map.of(
                "inRoom", true,
                "roomId", room.getId(),
                "roomName", room.getName(),
                "schoolName", room.getSchoolName(),
                "major", room.getMajor(),
                "joinedAt", member.getJoinedAt().toString()
        );
    }

    public List<Map<String, Object>> getLeaderboard(Long roomId, String period) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime since = switch (period.toLowerCase()) {
            case "day" -> now.toLocalDate().atStartOfDay();
            case "week" -> now.toLocalDate().with(DayOfWeek.MONDAY).atStartOfDay();
            default -> LocalDateTime.of(2020, 1, 1, 0, 0);
        };

        // Include every member the room has ever seen — active and
        // already-left alike — so departed users stay visible in the
        // leaderboard with their frozen final duration. Deduplicate by
        // user, keeping the most recent membership so `leftAt` reflects
        // their last session (handles users who re-join).
        List<StudyRoomMember> allMembers = memberRepository.findByRoomId(roomId);
        allMembers.sort((a, b) -> b.getJoinedAt().compareTo(a.getJoinedAt()));
        Set<Long> seenUsers = new HashSet<>();
        List<StudyRoomMember> members = new ArrayList<>();
        for (StudyRoomMember m : allMembers) {
            if (seenUsers.add(m.getUser().getId())) members.add(m);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (StudyRoomMember m : members) {
            Long durationToday = sessionRepository.sumDurationSecondsSince(m.getUser().getId(), roomId, since);
            Long durationTotal = sessionRepository.sumTotalDurationSeconds(m.getUser().getId(), roomId);
            long totalSeconds = (durationTotal != null ? durationTotal : 0L) + (durationToday != null ? durationToday : 0L);

            // Active session start time — only set when the user is
            // currently studying, so the frontend can tick locally.
            // Departed users (no open session) get a frozen duration.
            String sessionStartedAt = sessionRepository
                    .findByUserIdAndRoomIdAndEndedAtIsNull(m.getUser().getId(), roomId)
                    .map(s -> s.getStartedAt().toString())
                    .orElse(null);

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("userId", m.getUser().getId());
            entry.put("userName", m.getUser().getName());
            entry.put("todayDurationSeconds", durationToday != null ? durationToday : 0L);
            entry.put("totalDurationSeconds", totalSeconds);
            if (sessionStartedAt != null) entry.put("sessionStartedAt", sessionStartedAt);
            if (m.getLeftAt() != null) entry.put("leftAt", m.getLeftAt().toString());
            result.add(entry);
        }
        result.sort((a, b) -> Long.compare((Long) b.get("totalDurationSeconds"), (Long) a.get("totalDurationSeconds")));
        return result;
    }

    // ========== Helpers ==========

    private void emitRoomEvent(Long roomId, String type, Object data) {
        List<SseEmitter> emitters = roomEmitters.get(roomId);
        if (emitters == null || emitters.isEmpty()) return;

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", type);
        payload.put("roomId", roomId);
        payload.put("createdAt", LocalDateTime.now().toString());
        payload.put("data", data);

        for (SseEmitter emitter : new ArrayList<>(emitters)) {
            try {
                emitter.send(SseEmitter.event().name("room-update").data(payload));
            } catch (IOException | IllegalStateException e) {
                removeRoomEmitter(roomId, emitter);
                emitter.complete();
            }
        }
    }

    /**
     * Compute the leaderboard for {@code period} and push it to every
     * subscriber of {@code roomId} via a {@code leaderboard-update} SSE
     * event. Called from join/leave/close so the client list stays
     * real-time without polling.
     */
    private void emitLeaderboardUpdate(Long roomId, String period) {
        List<Map<String, Object>> board = getLeaderboard(roomId, period);
        emitRoomEvent(roomId, "leaderboard-update", Map.of(
                "period", period,
                "board", board
        ));
    }

    private void removeRoomEmitter(Long roomId, SseEmitter emitter) {
        List<SseEmitter> emitters = roomEmitters.get(roomId);
        if (emitters == null) return;
        emitters.remove(emitter);
        if (emitters.isEmpty()) roomEmitters.remove(roomId);
    }

    private Map<String, Object> toRoomMap(StudyRoom room) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", room.getId());
        m.put("name", room.getName());
        m.put("schoolId", room.getSchool() != null ? room.getSchool().getId() : null);
        m.put("schoolName", room.getSchoolName());
        m.put("major", room.getMajor());
        m.put("createdById", room.getCreatedBy().getId());
        m.put("createdByName", room.getCreatedBy().getName());
        m.put("status", room.getStatus().name());
        m.put("memberCount", memberRepository.findByRoomIdAndLeftAtIsNull(room.getId()).size());
        m.put("createdAt", room.getCreatedAt().toString());
        return m;
    }

    private Map<String, Object> toMemberMap(StudyRoomMember member) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", member.getId());
        m.put("roomId", member.getRoom().getId());
        m.put("userId", member.getUser().getId());
        m.put("userName", member.getUser().getName());
        m.put("joinedAt", member.getJoinedAt().toString());
        m.put("totalDurationSeconds", member.getTotalDurationSeconds());
        return m;
    }

    private Map<String, Object> toMessageMap(StudyRoomMessage msg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", msg.getId());
        m.put("roomId", msg.getRoom().getId());
        m.put("senderId", msg.getSender().getId());
        m.put("senderName", msg.getSender().getName());
        m.put("content", msg.getContent());
        m.put("createdAt", msg.getCreatedAt().toString());
        return m;
    }

    private Map<String, Object> page(Page<?> page) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", page.getContent());
        result.put("page", page.getNumber());
        result.put("size", page.getSize());
        result.put("totalElements", page.getTotalElements());
        result.put("totalPages", page.getTotalPages());
        return result;
    }

    private String str(Object v) {
        return v != null ? String.valueOf(v).trim() : null;
    }

    private Long toLong(Object v) {
        if (v == null) return null;
        String s = String.valueOf(v).trim();
        if (s.isEmpty() || "null".equals(s)) return null;
        return Long.parseLong(s);
    }
}