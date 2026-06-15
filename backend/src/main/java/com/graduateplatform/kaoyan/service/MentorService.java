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

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class MentorService {

    private final MentorProfileRepository mentorRepository;
    private final CounselingSessionRepository sessionRepository;
    private final CounselingMessageRepository messageRepository;
    private final UserRepository userRepository;

    public MentorService(MentorProfileRepository mentorRepository,
                         CounselingSessionRepository sessionRepository,
                         CounselingMessageRepository messageRepository,
                         UserRepository userRepository) {
        this.mentorRepository = mentorRepository;
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    // ========== MentorProfile CRUD ==========

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

    private void applyProfileFields(MentorProfile profile, User user, Map<String, Object> body) {
        if (body.containsKey("avatar")) profile.setAvatar(str(body.get("avatar")));
        if (body.containsKey("nickname")) profile.setNickname(str(body.get("nickname")));
        if (profile.getNickname() == null || profile.getNickname().isBlank()) profile.setNickname(user.getName());
        if (body.containsKey("bio")) profile.setBio(str(body.get("bio")));
        if (body.containsKey("graduateSchool")) profile.setGraduateSchool(require(body, "graduateSchool"));
        if (body.containsKey("enrollmentYear")) profile.setEnrollmentYear(toInt(body.get("enrollmentYear"), null));
        if (body.containsKey("major")) profile.setMajor(str(body.get("major")));
        if (body.containsKey("expertiseSubjects")) profile.setExpertiseSubjects(str(body.get("expertiseSubjects")));
        if (body.containsKey("examSubjects")) profile.setExamSubjects(str(body.get("examSubjects")));
    }

    public Map<String, Object> getMyProfile(Long userId) {
        return mentorRepository.findByUserIdAndActiveTrue(userId)
                .map(this::toMentorMap)
                .orElse(null);
    }

    public Map<String, Object> getMentorDetail(Long mentorId) {
        MentorProfile profile = mentorRepository.findByIdAndActiveTrue(mentorId)
                .orElseThrow(() -> new BusinessException("校友不存在"));
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
                userId, CounselingSession.STATUS_CLOSED, PageRequest.of(0, 1000)).getContent();
        sessions.forEach(session -> {
            session.setStatus(CounselingSession.STATUS_CLOSED);
            sessionRepository.save(session);
        });
    }

    // ========== Counseling ==========

    public Map<String, Object> createSession(Long studentId, Long mentorId, String subject) {
        // mentorId here is MentorProfile.id, so self-check must compare
        // against the mentor profile's owning user id instead of the profile id.
        MentorProfile mentorProfile = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new BusinessException("校友不存在"));
        if (!Boolean.TRUE.equals(mentorProfile.getActive())) {
            throw new BusinessException("校友已注销入驻");
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
        return toSessionMap(saved);
    }

    public Map<String, Object> listSentSessions(Long userId, Map<String, String> filters) {
        Page<CounselingSession> rows = sessionRepository.findByStudentIdAndStatusNot(
                userId, "closed", PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "id"))
        );
        return page(rows.map(s -> withUnread(toSessionMap(s), s.getId(), userId)));
    }

    public Map<String, Object> listReceivedSessions(Long userId, Map<String, String> filters) {
        Page<CounselingSession> rows = sessionRepository.findByMentorIdAndStatusNot(
                userId, "closed", PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "id"))
        );
        return page(rows.map(s -> withUnread(toSessionMap(s), s.getId(), userId)));
    }

    private Map<String, Object> withUnread(Map<String, Object> map, Long sessionId, Long userId) {
        map.put("unreadCount", messageRepository.countUnreadBySessionIdAndNotSender(sessionId, userId));
        return map;
    }

    public List<Map<String, Object>> getSessionMessages(Long sessionId, Long userId) {
        sessionRepository.findById(sessionId).orElseThrow(() -> new BusinessException("会话不存在"));
        return messageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId, PageRequest.of(0, 100))
                .getContent().stream().map(this::toMessageMap).toList();
    }

    public Map<String, Object> sendMessage(Long sessionId, Long senderId, String content) {
        CounselingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException("会话不存在"));
        if (CounselingSession.STATUS_CLOSED.equals(session.getStatus())) {
            throw new BusinessException("该咨询会话已结束，无法发送消息");
        }
        User sender = findUser(senderId);
        if (!senderId.equals(session.getMentor().getId()) && !senderId.equals(session.getStudent().getId())) {
            throw new BusinessException("无权发送消息");
        }
        CounselingMessage message = CounselingMessage.builder()
                .session(session)
                .sender(sender)
                .content(content)
                .build();
        CounselingMessage saved = messageRepository.save(message);
        return toMessageMap(saved);
    }

    public void markMessagesAsRead(Long sessionId, Long userId) {
        messageRepository.markAsReadBySessionIdAndNotSender(sessionId, userId);
    }

    public long getUnreadCount(Long userId) {
        return sessionRepository.countUnreadByStudentId(userId) + sessionRepository.countUnreadByMentorId(userId);
    }

    // ========== Specifications ==========

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

    // ========== Map converters ==========

    private Map<String, Object> toMentorMap(MentorProfile p) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", p.getId());
        map.put("avatar", p.getAvatar());
        map.put("nickname", p.getNickname());
        map.put("bio", p.getBio());
        map.put("graduateSchool", p.getGraduateSchool());
        map.put("enrollmentYear", p.getEnrollmentYear());
        map.put("major", p.getMajor());
        map.put("expertiseSubjects", p.getExpertiseSubjects());
        map.put("examSubjects", p.getExamSubjects());
        map.put("createdAt", p.getCreatedAt());
        return map;
    }

    private Map<String, Object> toSessionMap(CounselingSession s) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", s.getId());
        map.put("mentorId", s.getMentor().getId());
        map.put("mentorName", s.getMentor().getName());
        map.put("mentorAvatar", s.getMentor().getAvatar());
        map.put("studentId", s.getStudent().getId());
        map.put("studentName", s.getStudent().getName());
        map.put("studentAvatar", s.getStudent().getAvatar());
        map.put("subject", s.getSubject());
        map.put("status", s.getStatus());
        map.put("createdAt", s.getCreatedAt());
        return map;
    }

    private Map<String, Object> toMessageMap(CounselingMessage m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId());
        map.put("sessionId", m.getSession().getId());
        map.put("senderId", m.getSender().getId());
        map.put("senderName", m.getSender().getName());
        map.put("content", m.getContent());
        map.put("isRead", m.getIsRead());
        map.put("createdAt", m.getCreatedAt());
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

    // ========== Helpers ==========

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));
    }

    private String require(Map<String, Object> body, String key) {
        String value = str(body.get(key));
        if (value.isBlank()) throw new BusinessException("参数缺失：" + key);
        return value;
    }

    private int pageNumber(Map<String, String> filters) {
        return Math.max(0, toInt(filters.get("page"), 0));
    }

    private int pageSize(Map<String, String> filters) {
        return Math.max(1, Math.min(100, toInt(filters.get("size"), 10)));
    }

    private int toInt(Object value, Integer fallback) {
        if (value == null) return fallback != null ? fallback : 0;
        String s = String.valueOf(value).trim();
        if (s.isEmpty()) return fallback != null ? fallback : 0;
        return Integer.parseInt(s);
    }

    private boolean hasText(Object value) {
        return value != null && !String.valueOf(value).isBlank();
    }

    private String str(Object value) {
        return value == null ? null : String.valueOf(value).trim();
    }

    private Boolean bool(Object value) {
        if (value == null) return null;
        if (value instanceof Boolean) return (Boolean) value;
        String s = String.valueOf(value).trim().toLowerCase();
        if (s.isEmpty()) return null;
        return Boolean.parseBoolean(s);
    }
}
