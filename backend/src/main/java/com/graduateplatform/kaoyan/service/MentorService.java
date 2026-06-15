package com.graduateplatform.kaoyan.service;

import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.kaoyan.entity.CounselingMessage;
import com.graduateplatform.kaoyan.entity.CounselingSession;
import com.graduateplatform.kaoyan.entity.MentorProfile;
import com.graduateplatform.kaoyan.repository.CounselingMessageRepository;
import com.graduateplatform.kaoyan.repository.CounselingSessionRepository;
import com.graduateplatform.kaoyan.repository.MentorProfileRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Transactional
public class MentorService {

    private static final long COUNSELING_STREAM_TIMEOUT_MS = 30L * 60L * 1000L;

    private final MentorProfileRepository mentorRepository;
    private final CounselingSessionRepository sessionRepository;
    private final CounselingMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final Map<Long, List<SseEmitter>> counselingEmitters = new ConcurrentHashMap<>();

    public MentorService(MentorProfileRepository mentorRepository,
                         CounselingSessionRepository sessionRepository,
                         CounselingMessageRepository messageRepository,
                         UserRepository userRepository) {
        this.mentorRepository = mentorRepository;
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    public MentorProfile createOrUpdateProfile(Long userId, Map<String, Object> body) {
        User user = findUser(userId);
        Optional<MentorProfile> existing = mentorRepository.findByUserId(userId);
        if (existing.isPresent()) {
            MentorProfile profile = existing.get();
            if (Boolean.TRUE.equals(profile.getActive())) {
                throw new BusinessException("您已完成入驻，无需重复入驻");
            }
            applyProfileFields(profile, user, body);
            profile.setActive(true);
            return mentorRepository.save(profile);
        }

        MentorProfile profile = new MentorProfile();
        profile.setUser(user);
        applyProfileFields(profile, user, body);
        profile.setActive(true);
        return mentorRepository.save(profile);
    }

    public Map<String, Object> getMyProfile(Long userId) {
        return mentorRepository.findByUserIdAndActiveTrue(userId)
            .map(this::toMentorMap)
            .orElse(null);
    }

    public Map<String, Object> getMentorDetail(Long mentorId) {
        MentorProfile profile = mentorRepository.findByIdAndActiveTrue(mentorId)
            .orElseThrow(() -> new BusinessException("学长学姐不存在"));
        return toMentorMap(profile);
    }

    public Map<String, Object> listMentorsPage(Map<String, String> filters) {
        Page<MentorProfile> rows = mentorRepository.findAll(
            mentorSpec(filters),
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "id"))
        );
        return page(rows.map(this::toMentorMap));
    }

    public void deactivateProfile(Long userId) {
        MentorProfile profile = mentorRepository.findByUserId(userId)
            .orElseThrow(() -> new BusinessException("入驻信息不存在"));
        profile.setActive(false);
        mentorRepository.save(profile);

        List<CounselingSession> sessions = sessionRepository.findByMentorIdAndStatusNot(
            userId, CounselingSession.STATUS_CLOSED, PageRequest.of(0, 1000)
        ).getContent();
        sessions.forEach(session -> {
            session.setStatus(CounselingSession.STATUS_CLOSED);
            sessionRepository.save(session);
            emitCounselingUpdate(session, "session-closed", Map.of("sessionId", session.getId()));
        });
    }

    public Map<String, Object> createSession(Long studentId, Long mentorId, String subject) {
        MentorProfile mentorProfile = mentorRepository.findById(mentorId)
            .orElseThrow(() -> new BusinessException("学长学姐不存在"));
        if (!Boolean.TRUE.equals(mentorProfile.getActive())) {
            throw new BusinessException("学长学姐已注销入驻");
        }

        User mentor = mentorProfile.getUser();
        if (studentId.equals(mentor.getId())) {
            throw new BusinessException("不能咨询自己");
        }

        User student = findUser(studentId);
        CounselingSession session = CounselingSession.builder()
            .mentor(mentor)
            .student(student)
            .subject(subject != null ? subject : "")
            .build();
        CounselingSession saved = sessionRepository.save(session);
        emitCounselingUpdate(saved, "session-created", Map.of("sessionId", saved.getId()));
        return toSessionMap(saved);
    }

    public Map<String, Object> listSentSessions(Long userId, Map<String, String> filters) {
        Page<CounselingSession> rows = sessionRepository.findByStudentIdAndStatusNot(
            userId,
            CounselingSession.STATUS_CLOSED,
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "id"))
        );
        return page(rows.map(session -> withUnread(toSessionMap(session), session.getId(), userId)));
    }

    public Map<String, Object> listReceivedSessions(Long userId, Map<String, String> filters) {
        Page<CounselingSession> rows = sessionRepository.findByMentorIdAndStatusNot(
            userId,
            CounselingSession.STATUS_CLOSED,
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "id"))
        );
        return page(rows.map(session -> withUnread(toSessionMap(session), session.getId(), userId)));
    }

    public List<Map<String, Object>> getSessionMessages(Long sessionId, Long userId) {
        CounselingSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new BusinessException("会话不存在"));
        ensureParticipant(session, userId);
        return messageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId, PageRequest.of(0, 100))
            .getContent()
            .stream()
            .map(this::toMessageMap)
            .toList();
    }

    public Map<String, Object> sendMessage(Long sessionId, Long senderId, String content) {
        CounselingSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new BusinessException("会话不存在"));
        if (CounselingSession.STATUS_CLOSED.equals(session.getStatus())) {
            throw new BusinessException("该咨询会话已结束，无法发送消息");
        }
        ensureParticipant(session, senderId);

        User sender = findUser(senderId);
        CounselingMessage message = CounselingMessage.builder()
            .session(session)
            .sender(sender)
            .content(content)
            .build();
        CounselingMessage saved = messageRepository.save(message);
        emitCounselingUpdate(session, "message", Map.of(
            "sessionId", session.getId(),
            "messageId", saved.getId(),
            "senderId", senderId
        ));
        return toMessageMap(saved);
    }

    public void markMessagesAsRead(Long sessionId, Long userId) {
        CounselingSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new BusinessException("会话不存在"));
        ensureParticipant(session, userId);
        messageRepository.markAsReadBySessionIdAndNotSender(sessionId, userId);
        emitCounselingUpdate(session, "read", Map.of(
            "sessionId", sessionId,
            "readerId", userId
        ));
    }

    public long getUnreadCount(Long userId) {
        return sessionRepository.countUnreadByStudentId(userId) + sessionRepository.countUnreadByMentorId(userId);
    }

    public SseEmitter subscribeCounseling(Long userId) {
        findUser(userId);

        SseEmitter emitter = createCounselingEmitter();
        counselingEmitters.computeIfAbsent(userId, key -> new CopyOnWriteArrayList<>()).add(emitter);
        emitter.onCompletion(() -> removeCounselingEmitter(userId, emitter));
        emitter.onTimeout(() -> removeCounselingEmitter(userId, emitter));
        emitter.onError(error -> removeCounselingEmitter(userId, emitter));

        try {
            emitter.send(SseEmitter.event()
                .name("counseling-update")
                .data(Map.of(
                    "type", "connected",
                    "userId", userId,
                    "createdAt", LocalDateTime.now().toString()
                )));
        } catch (IOException | IllegalStateException e) {
            removeCounselingEmitter(userId, emitter);
            emitter.complete();
        }
        return emitter;
    }

    private Map<String, Object> withUnread(Map<String, Object> map, Long sessionId, Long userId) {
        map.put("unreadCount", messageRepository.countUnreadBySessionIdAndNotSender(sessionId, userId));
        return map;
    }

    private Specification<MentorProfile> mentorSpec(Map<String, String> filters) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.isTrue(root.get("active")));
            if (hasText(filters.get("graduateSchool"))) {
                predicates.add(builder.like(root.get("graduateSchool"), "%" + filters.get("graduateSchool") + "%"));
            }
            if (hasText(filters.get("enrollmentYear"))) {
                predicates.add(builder.equal(root.get("enrollmentYear"), Integer.parseInt(filters.get("enrollmentYear"))));
            }
            if (hasText(filters.get("major"))) {
                predicates.add(builder.like(root.get("major"), "%" + filters.get("major") + "%"));
            }
            if (hasText(filters.get("expertiseSubjects"))) {
                predicates.add(builder.like(root.get("expertiseSubjects"), "%" + filters.get("expertiseSubjects") + "%"));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Map<String, Object> toMentorMap(MentorProfile profile) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", profile.getId());
        map.put("avatar", profile.getAvatar());
        map.put("nickname", profile.getNickname());
        map.put("bio", profile.getBio());
        map.put("graduateSchool", profile.getGraduateSchool());
        map.put("enrollmentYear", profile.getEnrollmentYear());
        map.put("major", profile.getMajor());
        map.put("expertiseSubjects", profile.getExpertiseSubjects());
        map.put("examSubjects", profile.getExamSubjects());
        map.put("createdAt", profile.getCreatedAt());
        return map;
    }

    private Map<String, Object> toSessionMap(CounselingSession session) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", session.getId());
        map.put("mentorId", session.getMentor().getId());
        map.put("mentorName", session.getMentor().getName());
        map.put("mentorAvatar", session.getMentor().getAvatar());
        map.put("studentId", session.getStudent().getId());
        map.put("studentName", session.getStudent().getName());
        map.put("studentAvatar", session.getStudent().getAvatar());
        map.put("subject", session.getSubject());
        map.put("status", session.getStatus());
        map.put("createdAt", session.getCreatedAt());
        return map;
    }

    private Map<String, Object> toMessageMap(CounselingMessage message) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", message.getId());
        map.put("sessionId", message.getSession().getId());
        map.put("senderId", message.getSender().getId());
        map.put("senderName", message.getSender().getName());
        map.put("content", message.getContent());
        map.put("isRead", message.getIsRead());
        map.put("createdAt", message.getCreatedAt());
        return map;
    }

    private Map<String, Object> page(Page<Map<String, Object>> rows) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", rows.getContent());
        result.put("page", rows.getNumber());
        result.put("size", rows.getSize());
        result.put("totalElements", rows.getTotalElements());
        result.put("totalPages", Math.max(1, rows.getTotalPages()));
        return result;
    }

    private void applyProfileFields(MentorProfile profile, User user, Map<String, Object> body) {
        if (body.containsKey("avatar")) {
            profile.setAvatar(str(body.get("avatar")));
        }
        if (body.containsKey("nickname")) {
            profile.setNickname(str(body.get("nickname")));
        }
        if (profile.getNickname() == null || profile.getNickname().isBlank()) {
            profile.setNickname(user.getName());
        }
        if (body.containsKey("bio")) {
            profile.setBio(str(body.get("bio")));
        }
        if (body.containsKey("graduateSchool")) {
            profile.setGraduateSchool(require(body, "graduateSchool"));
        }
        if (body.containsKey("enrollmentYear")) {
            profile.setEnrollmentYear(toInt(body.get("enrollmentYear"), null));
        }
        if (body.containsKey("major")) {
            profile.setMajor(str(body.get("major")));
        }
        if (body.containsKey("expertiseSubjects")) {
            profile.setExpertiseSubjects(str(body.get("expertiseSubjects")));
        }
        if (body.containsKey("examSubjects")) {
            profile.setExamSubjects(str(body.get("examSubjects")));
        }
    }

    protected SseEmitter createCounselingEmitter() {
        return new SseEmitter(COUNSELING_STREAM_TIMEOUT_MS);
    }

    private void emitCounselingUpdate(CounselingSession session, String type, Map<String, Object> data) {
        Set<Long> participantIds = new LinkedHashSet<>();
        participantIds.add(session.getStudent().getId());
        participantIds.add(session.getMentor().getId());
        for (Long participantId : participantIds) {
            emitCounselingEvent(participantId, type, data);
        }
    }

    private void emitCounselingEvent(Long userId, String type, Map<String, Object> data) {
        List<SseEmitter> emitters = counselingEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", type);
        payload.put("userId", userId);
        payload.put("createdAt", LocalDateTime.now().toString());
        payload.put("data", data);

        for (SseEmitter emitter : new ArrayList<>(emitters)) {
            try {
                emitter.send(SseEmitter.event().name("counseling-update").data(payload));
            } catch (IOException | IllegalStateException e) {
                removeCounselingEmitter(userId, emitter);
                emitter.complete();
            }
        }
    }

    private void removeCounselingEmitter(Long userId, SseEmitter emitter) {
        List<SseEmitter> emitters = counselingEmitters.get(userId);
        if (emitters == null) {
            return;
        }
        emitters.remove(emitter);
        if (emitters.isEmpty()) {
            counselingEmitters.remove(userId);
        }
    }

    private void ensureParticipant(CounselingSession session, Long userId) {
        if (!userId.equals(session.getMentor().getId()) && !userId.equals(session.getStudent().getId())) {
            throw new BusinessException("无权访问该咨询会话");
        }
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("用户不存在"));
    }

    private String require(Map<String, Object> body, String key) {
        String value = str(body.get(key));
        if (value.isBlank()) {
            throw new BusinessException("参数缺失：" + key);
        }
        return value;
    }

    private int pageNumber(Map<String, String> filters) {
        return Math.max(0, toInt(filters.get("page"), 0));
    }

    private int pageSize(Map<String, String> filters) {
        return Math.max(1, Math.min(100, toInt(filters.get("size"), 10)));
    }

    private int toInt(Object value, Integer fallback) {
        if (value == null) {
            return fallback != null ? fallback : 0;
        }
        String text = String.valueOf(value).trim();
        if (text.isEmpty()) {
            return fallback != null ? fallback : 0;
        }
        return Integer.parseInt(text);
    }

    private boolean hasText(Object value) {
        return value != null && !String.valueOf(value).isBlank();
    }

    private String str(Object value) {
        return value == null ? null : String.valueOf(value).trim();
    }
}
