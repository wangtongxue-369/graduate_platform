package com.graduateplatform.kaogong.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.graduateplatform.common.entity.User;
import com.graduateplatform.kaogong.entity.*;
import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.kaogong.repository.*;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Transactional
public class KaoGongService {

    private static final List<String> DEFAULT_ATTACHMENT_EXTENSIONS = List.of(
        ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".txt", ".md", ".png", ".jpg", ".jpeg", ".gif",
        ".mp3", ".wav", ".m4a", ".mp4", ".zip", ".rar"
    );
    private static final Map<String, Integer> EDUCATION_RANKS = Map.of(
        "大专", 1,
        "专科", 1,
        "本科", 2,
        "硕士", 3,
        "研究生", 3,
        "博士", 4
    );
    private static final Map<String, Integer> DEGREE_RANKS = Map.of(
        "学士", 1,
        "硕士", 2,
        "博士", 3
    );
    private static final long ROOM_STREAM_TIMEOUT_MS = 30L * 60L * 1000L;

    private final CivilServicePostRepository postRepository;
    private final JobFavoriteRepository favoriteRepository;
    private final JobMatchHistoryRepository historyRepository;
    private final InterviewScoreLineRepository scoreLineRepository;
    private final ScoreLineFavoriteRepository scoreLineFavoriteRepository;
    private final ExamCalendarEventRepository eventRepository;
    private final ReminderSubscriptionRepository subscriptionRepository;
    private final NotificationMessageRepository notificationRepository;
    private final MockInterviewRoomRepository roomRepository;
    private final MockInterviewParticipantRepository participantRepository;
    private final MockInterviewMessageRepository messageRepository;
    private final MockInterviewAttachmentRepository attachmentRepository;
    private final InterviewFeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final Map<Long, List<SseEmitter>> roomEmitters = new ConcurrentHashMap<>();

    @Value("${app.upload.mock-interview-dir:uploads/mock-interviews}")
    private String mockInterviewUploadDir;

    @Value("${app.upload.mock-interview-max-bytes:31457280}")
    private long maxAttachmentBytes;

    @Value("${app.upload.mock-interview-allowed-extensions:}")
    private String allowedAttachmentExtensions;

    public KaoGongService(CivilServicePostRepository postRepository,
                          JobFavoriteRepository favoriteRepository,
                          JobMatchHistoryRepository historyRepository,
                          InterviewScoreLineRepository scoreLineRepository,
                          ScoreLineFavoriteRepository scoreLineFavoriteRepository,
                          ExamCalendarEventRepository eventRepository,
                          ReminderSubscriptionRepository subscriptionRepository,
                          NotificationMessageRepository notificationRepository,
                          MockInterviewRoomRepository roomRepository,
                          MockInterviewParticipantRepository participantRepository,
                          MockInterviewMessageRepository messageRepository,
                          MockInterviewAttachmentRepository attachmentRepository,
                          InterviewFeedbackRepository feedbackRepository,
                          UserRepository userRepository,
                          ObjectMapper objectMapper) {
        this.postRepository = postRepository;
        this.favoriteRepository = favoriteRepository;
        this.historyRepository = historyRepository;
        this.scoreLineRepository = scoreLineRepository;
        this.scoreLineFavoriteRepository = scoreLineFavoriteRepository;
        this.eventRepository = eventRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.notificationRepository = notificationRepository;
        this.roomRepository = roomRepository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
        this.attachmentRepository = attachmentRepository;
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    public List<Map<String, Object>> matchJobs(Map<String, Object> criteria, Long userId) {
        List<Map<String, Object>> results = postRepository.findByActiveTrueOrderByRegistrationEndAsc().stream()
            .map(post -> matchPost(post, criteria))
            .filter(Objects::nonNull)
            .sorted((a, b) -> Integer.compare((Integer) b.get("matchScore"), (Integer) a.get("matchScore")))
            .toList();

        if (userId != null) {
            historyRepository.save(JobMatchHistory.builder()
                .user(findUser(userId))
                .criteriaJson(toJson(criteria))
                .resultCount(results.size())
                .build());
        }

        return results;
    }

    public List<Map<String, Object>> listJobs(Map<String, String> filters) {
        return postRepository.findAll(jobSpec(filters, true), Sort.by(Sort.Direction.ASC, "registrationEnd", "id")).stream()
            .map(post -> toPostMap(post, null, List.of()))
            .toList();
    }

    public Map<String, Object> listJobsPage(Map<String, String> filters) {
        Page<CivilServicePost> rows = postRepository.findAll(
            jobSpec(filters, true),
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.ASC, "registrationEnd", "id"))
        );
        return page(rows.map(post -> toPostMap(post, null, List.of())));
    }

    public Map<String, Object> favoriteJob(Long postId, Long userId) {
        User user = findUser(userId);
        CivilServicePost post = postRepository.findById(postId)
            .orElseThrow(() -> new BusinessException("岗位不存在"));
        if (!favoriteRepository.existsByUserIdAndPostId(userId, postId)) {
            favoriteRepository.save(JobFavorite.builder().user(user).post(post).build());
        }
        return toPostMap(post, 100, List.of("已收藏"));
    }

    public Map<String, Object> unfavoriteJob(Long postId, Long userId) {
        CivilServicePost post = postRepository.findById(postId)
            .orElseThrow(() -> new BusinessException("岗位不存在"));
        favoriteRepository.deleteByUserIdAndPostId(userId, postId);
        return toPostMap(post, null, List.of());
    }

    public List<Map<String, Object>> myFavoriteJobs(Long userId) {
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(item -> toPostMap(item.getPost(), null, List.of("已收藏")))
            .toList();
    }

    public List<Map<String, Object>> myJobMatchHistory(Long userId) {
        return historyRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(this::toHistoryMap)
            .toList();
    }

    public List<Map<String, Object>> queryScoreLines(Map<String, String> filters) {
        return scoreLineRepository.findAll(scoreLineSpec(filters, true), Sort.by(
                Sort.Order.desc("year"),
                Sort.Order.desc("scoreLine"),
                Sort.Order.desc("id")
            )).stream()
            .map(this::toScoreLineMap)
            .toList();
    }

    public Map<String, Object> queryScoreLinesPage(Map<String, String> filters) {
        Page<InterviewScoreLine> rows = scoreLineRepository.findAll(
            scoreLineSpec(filters, true),
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(
                Sort.Order.desc("year"),
                Sort.Order.desc("scoreLine"),
                Sort.Order.desc("id")
            ))
        );
        return page(rows.map(this::toScoreLineMap));
    }

    public Map<String, Object> favoriteScoreLine(Long scoreLineId, Long userId) {
        User user = findUser(userId);
        InterviewScoreLine scoreLine = scoreLineRepository.findById(scoreLineId)
            .orElseThrow(() -> new BusinessException("分数线记录不存在"));
        if (!scoreLineFavoriteRepository.existsByUserIdAndScoreLineId(userId, scoreLineId)) {
            scoreLineFavoriteRepository.save(ScoreLineFavorite.builder()
                .user(user)
                .scoreLine(scoreLine)
                .build());
        }
        return toScoreLineMap(scoreLine);
    }

    public Map<String, Object> unfavoriteScoreLine(Long scoreLineId, Long userId) {
        InterviewScoreLine scoreLine = scoreLineRepository.findById(scoreLineId)
            .orElseThrow(() -> new BusinessException("分数线记录不存在"));
        scoreLineFavoriteRepository.deleteByUserIdAndScoreLineId(userId, scoreLineId);
        return toScoreLineMap(scoreLine);
    }

    public List<Map<String, Object>> myFavoriteScoreLines(Long userId) {
        return scoreLineFavoriteRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(item -> toScoreLineMap(item.getScoreLine()))
            .toList();
    }

    public List<Map<String, Object>> listCalendarEvents(Map<String, String> filters) {
        return eventRepository.findAll(calendarSpec(filters, true), Sort.by(Sort.Direction.ASC, "eventDate", "id")).stream()
            .map(this::toEventMap)
            .toList();
    }

    public Map<String, Object> listCalendarEventsPage(Map<String, String> filters) {
        Page<ExamCalendarEvent> rows = eventRepository.findAll(
            calendarSpec(filters, true),
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.ASC, "eventDate", "id"))
        );
        return page(rows.map(this::toEventMap));
    }

    public Map<String, Object> listCalendarExamGroupsPage(Map<String, String> filters) {
        Map<String, Map<String, Object>> groups = new LinkedHashMap<>();
        for (Map<String, Object> event : listCalendarEvents(filters)) {
            String key = eventGroupKey(event);
            Map<String, Object> group = groups.computeIfAbsent(key, ignored -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("key", key);
                item.put("region", event.get("region"));
                item.put("examType", event.get("examType"));
                item.put("year", event.get("year"));
                item.put("events", new ArrayList<Map<String, Object>>());
                return item;
            });
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> events = (List<Map<String, Object>>) group.get("events");
            events.add(event);
        }

        List<Map<String, Object>> rows = groups.values().stream()
            .peek(group -> {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> events = (List<Map<String, Object>>) group.get("events");
                events.sort(Comparator.comparing(item -> String.valueOf(item.get("eventDate"))));
            })
            .sorted(Comparator.comparing(group -> firstEventDate(group)))
            .toList();
        return page(rows, filters);
    }

    public Map<String, Object> adminJobs(Map<String, String> filters) {
        Page<CivilServicePost> rows = postRepository.findAll(
            jobSpec(filters, false),
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "id"))
        );
        return page(rows.map(post -> toPostMap(post, null, List.of())));
    }

    public Map<String, Object> adminScoreLines(Map<String, String> filters) {
        Page<InterviewScoreLine> rows = scoreLineRepository.findAll(
            scoreLineSpec(filters, false),
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "id"))
        );
        return page(rows.map(this::toScoreLineMap));
    }

    public Map<String, Object> adminCalendarEvents(Map<String, String> filters) {
        Page<ExamCalendarEvent> rows = eventRepository.findAll(
            calendarSpec(filters, false),
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "id"))
        );
        return page(rows.map(this::toEventMap));
    }

    public Map<String, Object> createJob(Map<String, Object> body) {
        CivilServicePost post = postRepository.save(CivilServicePost.builder()
            .examType(require(body, "examType"))
            .year(toInteger(body.get("year")))
            .region(require(body, "region"))
            .jobName(require(body, "jobName"))
            .recruitingUnit(require(body, "recruitingUnit"))
            .unitType(str(body.get("unitType")))
            .jobCategory(str(body.get("jobCategory")))
            .recruitCount(toInt(body.get("recruitCount"), 1))
            .educationRequirement(str(body.get("educationRequirement")))
            .degreeRequirement(str(body.get("degreeRequirement")))
            .majorRequirement(str(body.get("majorRequirement")))
            .householdRequirement(str(body.get("householdRequirement")))
            .politicalStatusRequirement(str(body.get("politicalStatusRequirement")))
            .examSubjects(str(body.get("examSubjects")))
            .registrationStart(toDate(body.get("registrationStart")))
            .registrationEnd(toDate(body.get("registrationEnd")))
            .sourceUrl(str(body.get("sourceUrl")))
            .remark(str(body.get("remark")))
            .active(true)
            .build());
        return toPostMap(post, null, List.of());
    }

    public Map<String, Object> updateJob(Long id, Map<String, Object> body) {
        CivilServicePost post = postRepository.findById(id)
            .orElseThrow(() -> new BusinessException("岗位不存在"));
        post.setExamType(require(body, "examType"));
        post.setYear(toInteger(body.get("year")));
        post.setRegion(require(body, "region"));
        post.setJobName(require(body, "jobName"));
        post.setRecruitingUnit(require(body, "recruitingUnit"));
        post.setUnitType(str(body.get("unitType")));
        post.setJobCategory(str(body.get("jobCategory")));
        post.setRecruitCount(toInt(body.get("recruitCount"), 1));
        post.setEducationRequirement(str(body.get("educationRequirement")));
        post.setDegreeRequirement(str(body.get("degreeRequirement")));
        post.setMajorRequirement(str(body.get("majorRequirement")));
        post.setHouseholdRequirement(str(body.get("householdRequirement")));
        post.setPoliticalStatusRequirement(str(body.get("politicalStatusRequirement")));
        post.setExamSubjects(str(body.get("examSubjects")));
        post.setRegistrationStart(toDate(body.get("registrationStart")));
        post.setRegistrationEnd(toDate(body.get("registrationEnd")));
        post.setSourceUrl(str(body.get("sourceUrl")));
        post.setRemark(str(body.get("remark")));
        post.setActive(!Objects.equals(String.valueOf(body.get("active")), "false"));
        return toPostMap(postRepository.save(post), null, List.of());
    }

    public Map<String, Object> deactivateJob(Long id) {
        CivilServicePost post = postRepository.findById(id)
            .orElseThrow(() -> new BusinessException("岗位不存在"));
        post.setActive(false);
        return toPostMap(postRepository.save(post), null, List.of());
    }

    public Map<String, Object> createScoreLine(Map<String, Object> body) {
        InterviewScoreLine line = scoreLineRepository.save(InterviewScoreLine.builder()
            .region(require(body, "region"))
            .year(toInteger(body.get("year")))
            .examType(require(body, "examType"))
            .unitType(str(body.get("unitType")))
            .jobCategory(str(body.get("jobCategory")))
            .jobName(require(body, "jobName"))
            .recruitingUnit(require(body, "recruitingUnit"))
            .scoreLine(new java.math.BigDecimal(require(body, "scoreLine")))
            .interviewRatio(str(body.get("interviewRatio")))
            .recruitCount(toInt(body.get("recruitCount"), 1))
            .interviewCount(toInt(body.get("interviewCount"), 0))
            .dataNote(str(body.get("dataNote")))
            .source(str(body.get("source")))
            .active(true)
            .build());
        return toScoreLineMap(line);
    }

    public Map<String, Object> updateScoreLine(Long id, Map<String, Object> body) {
        InterviewScoreLine line = scoreLineRepository.findById(id)
            .orElseThrow(() -> new BusinessException("分数线记录不存在"));
        line.setRegion(require(body, "region"));
        line.setYear(toInteger(body.get("year")));
        line.setExamType(require(body, "examType"));
        line.setUnitType(str(body.get("unitType")));
        line.setJobCategory(str(body.get("jobCategory")));
        line.setJobName(require(body, "jobName"));
        line.setRecruitingUnit(require(body, "recruitingUnit"));
        line.setScoreLine(new java.math.BigDecimal(require(body, "scoreLine")));
        line.setInterviewRatio(str(body.get("interviewRatio")));
        line.setRecruitCount(toInt(body.get("recruitCount"), 1));
        line.setInterviewCount(toInt(body.get("interviewCount"), 0));
        line.setDataNote(str(body.get("dataNote")));
        line.setSource(str(body.get("source")));
        line.setActive(!Objects.equals(String.valueOf(body.get("active")), "false"));
        return toScoreLineMap(scoreLineRepository.save(line));
    }

    public Map<String, Object> deactivateScoreLine(Long id) {
        InterviewScoreLine line = scoreLineRepository.findById(id)
            .orElseThrow(() -> new BusinessException("分数线记录不存在"));
        line.setActive(false);
        return toScoreLineMap(scoreLineRepository.save(line));
    }

    public Map<String, Object> createCalendarEvent(Map<String, Object> body) {
        ExamCalendarEvent event = eventRepository.save(ExamCalendarEvent.builder()
            .region(require(body, "region"))
            .examType(require(body, "examType"))
            .year(toInteger(body.get("year")))
            .nodeType(require(body, "nodeType"))
            .title(require(body, "title"))
            .eventDate(toDate(body.get("eventDate")))
            .description(str(body.get("description")))
            .sourceUrl(str(body.get("sourceUrl")))
            .active(true)
            .build());
        return toEventMap(event);
    }

    public Map<String, Object> updateCalendarEvent(Long id, Map<String, Object> body) {
        ExamCalendarEvent event = eventRepository.findById(id)
            .orElseThrow(() -> new BusinessException("考试节点不存在"));
        event.setRegion(require(body, "region"));
        event.setExamType(require(body, "examType"));
        event.setYear(toInteger(body.get("year")));
        event.setNodeType(require(body, "nodeType"));
        event.setTitle(require(body, "title"));
        event.setEventDate(toDate(body.get("eventDate")));
        event.setDescription(str(body.get("description")));
        event.setSourceUrl(str(body.get("sourceUrl")));
        event.setActive(!Objects.equals(String.valueOf(body.get("active")), "false"));
        return toEventMap(eventRepository.save(event));
    }

    public Map<String, Object> deactivateCalendarEvent(Long id) {
        ExamCalendarEvent event = eventRepository.findById(id)
            .orElseThrow(() -> new BusinessException("考试节点不存在"));
        event.setActive(false);
        return toEventMap(eventRepository.save(event));
    }

    public Map<String, Object> subscribeCalendar(Map<String, Object> body, Long userId) {
        Long eventId = toLong(body.get("eventId"));
        ExamCalendarEvent event = eventId == null ? null : eventRepository.findById(eventId)
            .orElseThrow(() -> new BusinessException("考试节点不存在"));
        String region = event == null ? require(body, "region") : event.getRegion();
        String examType = event == null ? require(body, "examType") : event.getExamType();
        Integer examYear = event == null ? toInteger(firstPresent(body.get("examYear"), body.get("year"))) : event.getYear();
        Optional<ReminderSubscription> existing = eventId == null
            ? subscriptionRepository.findByUserIdAndRegionAndExamType(userId, region, examType).stream()
                .filter(item -> item.getEventId() == null)
                .filter(item -> Objects.equals(item.getExamYear(), examYear))
                .findFirst()
            : subscriptionRepository.findByUserIdAndEventId(userId, eventId).stream().findFirst();
        if (existing.isPresent()) {
            ReminderSubscription subscription = existing.get();
            subscription.setStatus("ACTIVE");
            subscription.setRegion(region);
            subscription.setExamType(examType);
            subscription.setExamYear(examYear);
            subscription.setEventId(eventId);
            subscription.setRemindBeforeDays(toInt(body.get("remindBeforeDays"), subscription.getRemindBeforeDays()));
            subscription.setEmail(toBool(body.get("email")));
            subscription.setSms(toBool(body.get("sms")));
            return toSubscriptionMap(subscriptionRepository.save(subscription));
        }
        ReminderSubscription subscription = subscriptionRepository.save(ReminderSubscription.builder()
            .user(findUser(userId))
            .region(region)
            .examType(examType)
            .examYear(examYear)
            .eventId(eventId)
            .remindBeforeDays(toInt(body.get("remindBeforeDays"), 3))
            .siteMessage(true)
            .email(toBool(body.get("email")))
            .sms(toBool(body.get("sms")))
            .status("ACTIVE")
            .build());
        return toSubscriptionMap(subscription);
    }

    public List<Map<String, Object>> mySubscriptions(Long userId) {
        return subscriptionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(this::toSubscriptionMap)
            .toList();
    }

    public Map<String, Object> cancelSubscription(Long id, Long userId) {
        ReminderSubscription subscription = subscriptionRepository.findById(id)
            .orElseThrow(() -> new BusinessException("订阅不存在"));
        if (!subscription.getUser().getId().equals(userId)) {
            throw new BusinessException("无权操作该订阅");
        }
        subscription.setStatus("CANCELLED");
        return toSubscriptionMap(subscriptionRepository.save(subscription));
    }

    public List<Map<String, Object>> myNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(this::toNotificationMap)
            .toList();
    }

    public List<Map<String, Object>> listInterviewRooms() {
        return roomRepository.findAllByOrderByScheduledAtAsc().stream()
            .map(this::toRoomMap)
            .toList();
    }

    public Map<String, Object> listInterviewRoomsPage(Map<String, String> filters) {
        Page<MockInterviewRoom> rows = roomRepository.findAll(
            roomSpec(filters),
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.ASC, "scheduledAt", "id"))
        );
        return page(rows.map(this::toRoomMap));
    }

    public SseEmitter subscribeInterviewRoom(Long roomId) {
        roomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException("Interview room does not exist"));

        SseEmitter emitter = new SseEmitter(ROOM_STREAM_TIMEOUT_MS);
        roomEmitters.computeIfAbsent(roomId, key -> new CopyOnWriteArrayList<>()).add(emitter);
        emitter.onCompletion(() -> removeRoomEmitter(roomId, emitter));
        emitter.onTimeout(() -> removeRoomEmitter(roomId, emitter));
        emitter.onError(error -> removeRoomEmitter(roomId, emitter));

        try {
            emitter.send(SseEmitter.event()
                .name("room-update")
                .data(Map.of("type", "connected", "roomId", roomId, "createdAt", LocalDateTime.now().toString())));
        } catch (IOException e) {
            removeRoomEmitter(roomId, emitter);
            emitter.completeWithError(e);
        }
        return emitter;
    }

    public List<Map<String, Object>> myInterviewRooms(Long userId) {
        return participantRepository.findByUserIdOrderByJoinedAtDesc(userId).stream()
            .map(item -> toRoomMap(item.getRoom()))
            .toList();
    }

    public Map<String, Object> myInterviewRoomsPage(Long userId, Map<String, String> filters) {
        Page<MockInterviewParticipant> rows = participantRepository.findByUserIdOrderByJoinedAtDesc(
            userId,
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "joinedAt", "id"))
        );
        return page(rows.map(item -> toRoomMap(item.getRoom())));
    }

    public Map<String, Object> createInterviewRoom(Map<String, Object> body, Long userId) {
        MockInterviewRoom room = roomRepository.save(MockInterviewRoom.builder()
            .title(require(body, "title"))
            .jobDirection(require(body, "jobDirection"))
            .scheduledAt(LocalDateTime.parse(require(body, "scheduledAt")))
            .description(str(body.get("description")))
            .inviteNote(str(body.get("inviteNote")))
            .status("OPEN")
            .owner(findUser(userId))
            .build());
        participantRepository.save(MockInterviewParticipant.builder()
            .room(room)
            .user(room.getOwner())
            .roleInRoom("owner")
            .build());
        return toRoomMap(room);
    }

    public Map<String, Object> joinInterviewRoom(Long roomId, Long userId) {
        MockInterviewRoom room = roomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException("面试房间不存在"));
        if ("COMPLETED".equals(room.getStatus())) {
            throw new BusinessException("房间已结束，不能再加入");
        }
        if (!participantRepository.existsByRoomIdAndUserId(roomId, userId)) {
            participantRepository.save(MockInterviewParticipant.builder()
                .room(room)
                .user(findUser(userId))
                .roleInRoom("participant")
                .build());
        }
        return toRoomMap(room);
    }

    public Map<String, Object> updateInterviewRoomStatus(Long roomId, Map<String, Object> body, Long userId) {
        MockInterviewRoom room = roomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException("面试房间不存在"));
        if (!room.getOwner().getId().equals(userId)) {
            throw new BusinessException("只有房主可以修改房间状态");
        }
        String status = require(body, "status").toUpperCase(Locale.ROOT);
        if (!List.of("OPEN", "IN_PROGRESS", "COMPLETED").contains(status)) {
            throw new BusinessException("房间状态不合法");
        }
        room.setStatus(status);
        Map<String, Object> result = toRoomMap(roomRepository.save(room));
        emitRoomEvent(roomId, "status", result);
        return result;
    }

    public List<Map<String, Object>> getInterviewMessages(Long roomId) {
        roomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException("面试房间不存在"));
        return messageRepository.findByRoomIdOrderByCreatedAtAsc(roomId).stream()
            .map(this::toMessageMap)
            .toList();
    }

    public Map<String, Object> sendInterviewMessage(Long roomId, Map<String, Object> body, Long userId) {
        MockInterviewRoom room = roomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException("面试房间不存在"));
        if ("COMPLETED".equals(room.getStatus())) {
            throw new BusinessException("房间已结束，不能继续发送消息");
        }
        if (!participantRepository.existsByRoomIdAndUserId(roomId, userId)) {
            participantRepository.save(MockInterviewParticipant.builder()
                .room(room)
                .user(findUser(userId))
                .roleInRoom("participant")
                .build());
        }
        String content = require(body, "content");
        if (content.length() > 500) {
            throw new BusinessException("消息内容不能超过500字");
        }
        MockInterviewMessage message = messageRepository.save(MockInterviewMessage.builder()
            .room(room)
            .sender(findUser(userId))
            .content(content)
            .build());
        Map<String, Object> result = toMessageMap(message);
        emitRoomEvent(roomId, "message", result);
        return result;
    }

    public Map<String, Object> getInterviewMessagesPage(Long roomId, Map<String, String> filters) {
        roomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException("Interview room does not exist"));
        Page<MockInterviewMessage> rows = messageRepository.findByRoomIdOrderByCreatedAtAsc(
            roomId,
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.ASC, "createdAt", "id"))
        );
        return page(rows.map(this::toMessageMap));
    }

    public List<Map<String, Object>> getInterviewAttachments(Long roomId) {
        roomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException("面试房间不存在"));
        return attachmentRepository.findByRoomIdOrderByCreatedAtDesc(roomId).stream()
            .map(this::toAttachmentMap)
            .toList();
    }

    public Map<String, Object> getInterviewAttachmentsPage(Long roomId, Map<String, String> filters) {
        roomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException("Interview room does not exist"));
        Page<MockInterviewAttachment> rows = attachmentRepository.findByRoomIdOrderByCreatedAtDesc(
            roomId,
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "createdAt", "id"))
        );
        return page(rows.map(this::toAttachmentMap));
    }

    public Map<String, Object> uploadInterviewAttachment(Long roomId, MultipartFile file, String note, Long userId) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("请选择要上传的附件");
        }
        if (file.getSize() > maxAttachmentBytes) {
            throw new BusinessException("单个附件不能超过30MB");
        }

        MockInterviewRoom room = roomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException("面试房间不存在"));
        User user = findUser(userId);
        if ("COMPLETED".equals(room.getStatus())) {
            throw new BusinessException("The room has ended and no more files can be uploaded");
        }
        if (!participantRepository.existsByRoomIdAndUserId(roomId, userId)) {
            participantRepository.save(MockInterviewParticipant.builder()
                .room(room)
                .user(user)
                .roleInRoom("participant")
                .build());
        }

        String originalName = sanitizeFileName(file.getOriginalFilename());
        String ext = extensionOf(originalName);
        if (!allowedExtensions().contains(ext)) {
            throw new BusinessException("Unsupported file type");
        }
        String cleanNote = note == null ? "" : note.trim();
        if (cleanNote.length() > 500) {
            throw new BusinessException("Attachment note cannot exceed 500 characters");
        }
        String storedName = UUID.randomUUID() + ext;
        Path dir = Paths.get(mockInterviewUploadDir, String.valueOf(roomId)).toAbsolutePath().normalize();
        Path target = dir.resolve(storedName).normalize();
        if (!target.startsWith(dir)) {
            throw new BusinessException("附件路径非法");
        }
        try {
            Files.createDirectories(dir);
            file.transferTo(target);
        } catch (IOException e) {
            throw new BusinessException("附件保存失败：" + e.getMessage());
        }

        MockInterviewAttachment attachment = attachmentRepository.save(MockInterviewAttachment.builder()
            .room(room)
            .uploader(user)
            .originalName(originalName)
            .storedName(storedName)
            .storagePath(target.toString())
            .contentType(file.getContentType())
            .sizeBytes(file.getSize())
            .note(cleanNote)
            .build());
        Map<String, Object> result = toAttachmentMap(attachment);
        emitRoomEvent(roomId, "attachment", result);
        return result;
    }

    public MockInterviewAttachment getAttachmentEntity(Long attachmentId) {
        return attachmentRepository.findById(attachmentId)
            .orElseThrow(() -> new BusinessException("附件不存在"));
    }

    public Resource getAttachmentResource(Long attachmentId) {
        MockInterviewAttachment attachment = getAttachmentEntity(attachmentId);
        Path path = Paths.get(attachment.getStoragePath()).toAbsolutePath().normalize();
        if (!Files.exists(path)) {
            throw new BusinessException("附件文件不存在或已被移除");
        }
        return new FileSystemResource(path);
    }

    public MockInterviewAttachment getAttachmentEntity(Long attachmentId, Long userId) {
        MockInterviewAttachment attachment = getAttachmentEntity(attachmentId);
        ensureRoomAccess(attachment.getRoom().getId(), userId);
        return attachment;
    }

    public Resource getAttachmentResource(Long attachmentId, Long userId) {
        MockInterviewAttachment attachment = getAttachmentEntity(attachmentId, userId);
        Path path = Paths.get(attachment.getStoragePath()).toAbsolutePath().normalize();
        if (!Files.exists(path)) {
            throw new BusinessException("Attachment file does not exist");
        }
        return new FileSystemResource(path);
    }

    public Map<String, Object> addInterviewFeedback(Long roomId, Map<String, Object> body, Long userId) {
        MockInterviewRoom room = roomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException("面试房间不存在"));
        InterviewFeedback feedback = feedbackRepository.save(InterviewFeedback.builder()
            .room(room)
            .reviewer(findUser(userId))
            .score(toInt(body.get("score"), 0))
            .expressionScore(toInt(body.get("expressionScore"), 0))
            .logicScore(toInt(body.get("logicScore"), 0))
            .etiquetteScore(toInt(body.get("etiquetteScore"), 0))
            .strengths(str(body.get("strengths")))
            .problems(str(body.get("problems")))
            .suggestions(str(body.get("suggestions")))
            .attachmentNote(str(body.get("attachmentNote")))
            .build());
        room.setStatus("COMPLETED");
        roomRepository.save(room);
        Map<String, Object> result = toFeedbackMap(feedback);
        emitRoomEvent(roomId, "feedback", result);
        emitRoomEvent(roomId, "status", toRoomMap(room));
        return result;
    }

    public List<Map<String, Object>> getInterviewFeedback(Long roomId) {
        return feedbackRepository.findByRoomIdOrderByCreatedAtDesc(roomId).stream()
            .map(this::toFeedbackMap)
            .toList();
    }

    public Map<String, Object> getInterviewFeedbackPage(Long roomId, Map<String, String> filters) {
        roomRepository.findById(roomId)
            .orElseThrow(() -> new BusinessException("Interview room does not exist"));
        Page<InterviewFeedback> rows = feedbackRepository.findByRoomIdOrderByCreatedAtDesc(
            roomId,
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "createdAt", "id"))
        );
        return page(rows.map(this::toFeedbackMap));
    }

    public List<Map<String, Object>> myInterviewFeedback(Long userId) {
        return feedbackRepository.findByReviewerIdOrderByCreatedAtDesc(userId).stream()
            .map(this::toFeedbackMap)
            .toList();
    }

    public Map<String, Object> myInterviewFeedbackPage(Long userId, Map<String, String> filters) {
        Page<InterviewFeedback> rows = feedbackRepository.findByReviewerIdOrderByCreatedAtDesc(
            userId,
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "createdAt", "id"))
        );
        return page(rows.map(this::toFeedbackMap));
    }

    @Scheduled(cron = "0 0 * * * *")
    public void generateReminderMessages() {
        LocalDate today = LocalDate.now();
        List<ReminderSubscription> subscriptions = subscriptionRepository.findByStatus("ACTIVE");
        for (ReminderSubscription subscription : subscriptions) {
            LocalDate targetDate = today.plusDays(subscription.getRemindBeforeDays());
            List<ExamCalendarEvent> events = eventRepository.findByActiveTrueAndEventDateBetween(today, targetDate);
            for (ExamCalendarEvent event : events) {
                if (subscription.getEventId() != null && !Objects.equals(subscription.getEventId(), event.getId())) {
                    continue;
                }
                if (!event.getRegion().contains(subscription.getRegion())
                    && !subscription.getRegion().contains(event.getRegion())) {
                    continue;
                }
                if (!Objects.equals(event.getExamType(), subscription.getExamType())) {
                    continue;
                }
                if (subscription.getExamYear() != null && !Objects.equals(event.getYear(), subscription.getExamYear())) {
                    continue;
                }
                if (notificationRepository.existsByUserIdAndSourceTypeAndSourceId(
                    subscription.getUser().getId(), "exam_calendar", event.getId())) {
                    continue;
                }
                notificationRepository.save(NotificationMessage.builder()
                    .user(subscription.getUser())
                    .title("考录节点提醒：" + event.getNodeType())
                    .content(event.getTitle() + " 将在 " + event.getEventDate() + " 发生，请及时处理。")
                    .sourceType("exam_calendar")
                    .sourceId(event.getId())
                    .build());
            }
        }
    }

    private Map<String, Object> matchPost(CivilServicePost post, Map<String, Object> criteria) {
        int score = 40;
        List<String> reasons = new ArrayList<>();
        String education = str(criteria.get("education"));
        String degree = str(criteria.get("degree"));
        String major = str(criteria.get("major"));
        String region = str(criteria.get("region"));
        String household = str(criteria.get("household"));
        String politicalStatus = str(criteria.get("politicalStatus"));
        String jobCategory = str(criteria.get("jobCategory"));
        String unitType = str(criteria.get("unitType"));

        if (!blank(region) && like(post.getRegion(), region)) {
            score += 12;
            reasons.add("地区偏好匹配");
        } else if (!blank(region)) {
            return null;
        }
        if (!blank(education)) {
            if (unlimited(post.getEducationRequirement())) {
                // 不限条件允许通过，但不作为专项匹配加分。
            } else if (rankedRequirementMatches(post.getEducationRequirement(), education, EDUCATION_RANKS)) {
                score += 12;
                reasons.add("学历符合");
            } else {
                return null;
            }
        }
        if (!blank(degree)) {
            if (unlimited(post.getDegreeRequirement())) {
                // 不限条件允许通过，但不作为专项匹配加分。
            } else if (rankedRequirementMatches(post.getDegreeRequirement(), degree, DEGREE_RANKS)) {
                score += 8;
                reasons.add("学位符合");
            } else {
                return null;
            }
        }
        if (!blank(major)) {
            if (unlimited(post.getMajorRequirement())) {
                // 不限条件允许通过，但不作为专项匹配加分。
            } else if (requirementMatches(post.getMajorRequirement(), major)) {
                score += 14;
                reasons.add("专业条件匹配");
            } else {
                return null;
            }
        }
        if (!blank(household)) {
            if (unlimited(post.getHouseholdRequirement())) {
                // 不限条件允许通过，但不作为专项匹配加分。
            } else if (requirementMatches(post.getHouseholdRequirement(), household)) {
                score += 8;
                reasons.add("户籍/生源地符合");
            } else {
                return null;
            }
        }
        if (!blank(politicalStatus)) {
            if (unlimited(post.getPoliticalStatusRequirement())) {
                // 不限条件允许通过，但不作为专项匹配加分。
            } else if (requirementMatches(post.getPoliticalStatusRequirement(), politicalStatus)) {
                score += 8;
                reasons.add("政治面貌符合");
            } else {
                return null;
            }
        }
        if (!blank(jobCategory) && eq(post.getJobCategory(), jobCategory)) {
            score += 6;
            reasons.add("岗位类别匹配");
        }
        if (!blank(unitType) && eq(post.getUnitType(), unitType)) {
            score += 6;
            reasons.add("单位类型匹配");
        }

        return toPostMap(post, Math.min(score, 100), reasons);
    }

    private Map<String, Object> toPostMap(CivilServicePost post, Integer matchScore, List<String> reasons) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", post.getId());
        map.put("examType", post.getExamType());
        map.put("year", post.getYear());
        map.put("region", post.getRegion());
        map.put("jobName", post.getJobName());
        map.put("recruitingUnit", post.getRecruitingUnit());
        map.put("unitType", post.getUnitType());
        map.put("jobCategory", post.getJobCategory());
        map.put("recruitCount", post.getRecruitCount());
        map.put("educationRequirement", post.getEducationRequirement());
        map.put("degreeRequirement", post.getDegreeRequirement());
        map.put("majorRequirement", post.getMajorRequirement());
        map.put("householdRequirement", post.getHouseholdRequirement());
        map.put("politicalStatusRequirement", post.getPoliticalStatusRequirement());
        map.put("examSubjects", post.getExamSubjects());
        map.put("registrationStart", post.getRegistrationStart());
        map.put("registrationEnd", post.getRegistrationEnd());
        map.put("sourceUrl", post.getSourceUrl());
        map.put("remark", post.getRemark());
        map.put("active", post.getActive());
        map.put("matchScore", matchScore);
        map.put("matchReasons", reasons);
        return map;
    }

    private Map<String, Object> toScoreLineMap(InterviewScoreLine line) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", line.getId());
        map.put("region", line.getRegion());
        map.put("year", line.getYear());
        map.put("examType", line.getExamType());
        map.put("unitType", line.getUnitType());
        map.put("jobCategory", line.getJobCategory());
        map.put("jobName", line.getJobName());
        map.put("recruitingUnit", line.getRecruitingUnit());
        map.put("scoreLine", line.getScoreLine());
        map.put("interviewRatio", line.getInterviewRatio());
        map.put("recruitCount", line.getRecruitCount());
        map.put("interviewCount", line.getInterviewCount());
        map.put("dataNote", line.getDataNote());
        map.put("source", line.getSource());
        map.put("active", line.getActive());
        return map;
    }

    private Map<String, Object> toEventMap(ExamCalendarEvent event) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", event.getId());
        map.put("region", event.getRegion());
        map.put("examType", event.getExamType());
        map.put("year", event.getYear());
        map.put("nodeType", event.getNodeType());
        map.put("title", event.getTitle());
        map.put("eventDate", event.getEventDate());
        map.put("description", event.getDescription());
        map.put("sourceUrl", event.getSourceUrl());
        map.put("active", event.getActive());
        return map;
    }

    private Map<String, Object> toSubscriptionMap(ReminderSubscription subscription) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", subscription.getId());
        map.put("region", subscription.getRegion());
        map.put("examType", subscription.getExamType());
        map.put("examYear", subscription.getExamYear());
        map.put("eventId", subscription.getEventId());
        map.put("remindBeforeDays", subscription.getRemindBeforeDays());
        map.put("siteMessage", subscription.getSiteMessage());
        map.put("email", subscription.getEmail());
        map.put("sms", subscription.getSms());
        map.put("status", subscription.getStatus());
        map.put("createdAt", subscription.getCreatedAt());
        return map;
    }

    private Map<String, Object> toHistoryMap(JobMatchHistory history) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", history.getId());
        map.put("criteriaJson", history.getCriteriaJson());
        map.put("resultCount", history.getResultCount());
        map.put("createdAt", history.getCreatedAt());
        return map;
    }

    private Map<String, Object> toNotificationMap(NotificationMessage message) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", message.getId());
        map.put("title", message.getTitle());
        map.put("content", message.getContent());
        map.put("sourceType", message.getSourceType());
        map.put("sourceId", message.getSourceId());
        map.put("readFlag", message.getReadFlag());
        map.put("createdAt", message.getCreatedAt());
        return map;
    }

    private Map<String, Object> toRoomMap(MockInterviewRoom room) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", room.getId());
        map.put("title", room.getTitle());
        map.put("jobDirection", room.getJobDirection());
        map.put("scheduledAt", room.getScheduledAt());
        map.put("description", room.getDescription());
        map.put("inviteNote", room.getInviteNote());
        map.put("status", room.getStatus());
        map.put("ownerId", room.getOwner().getId());
        map.put("ownerName", room.getOwner().getName());
        map.put("participantCount", participantRepository.findByRoomId(room.getId()).size());
        return map;
    }

    private Map<String, Object> toFeedbackMap(InterviewFeedback feedback) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", feedback.getId());
        map.put("roomId", feedback.getRoom().getId());
        map.put("roomTitle", feedback.getRoom().getTitle());
        map.put("reviewerName", feedback.getReviewer().getName());
        map.put("score", feedback.getScore());
        map.put("expressionScore", feedback.getExpressionScore());
        map.put("logicScore", feedback.getLogicScore());
        map.put("etiquetteScore", feedback.getEtiquetteScore());
        map.put("strengths", feedback.getStrengths());
        map.put("problems", feedback.getProblems());
        map.put("suggestions", feedback.getSuggestions());
        map.put("attachmentNote", feedback.getAttachmentNote());
        map.put("createdAt", feedback.getCreatedAt());
        return map;
    }

    private Map<String, Object> toMessageMap(MockInterviewMessage message) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", message.getId());
        map.put("roomId", message.getRoom().getId());
        map.put("senderId", message.getSender().getId());
        map.put("senderName", message.getSender().getName());
        map.put("content", message.getContent());
        map.put("createdAt", message.getCreatedAt());
        return map;
    }

    private Map<String, Object> toAttachmentMap(MockInterviewAttachment attachment) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", attachment.getId());
        map.put("roomId", attachment.getRoom().getId());
        map.put("uploaderId", attachment.getUploader().getId());
        map.put("uploaderName", attachment.getUploader().getName());
        map.put("originalName", attachment.getOriginalName());
        map.put("contentType", attachment.getContentType());
        map.put("sizeBytes", attachment.getSizeBytes());
        map.put("note", attachment.getNote());
        map.put("createdAt", attachment.getCreatedAt());
        map.put("downloadUrl", "/api/kaogong/interviews/attachments/" + attachment.getId() + "/download");
        return map;
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

    private String toJson(Map<String, Object> data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private boolean requirementMatches(String requirement, String value) {
        if (blank(value) || unlimited(requirement)) return true;
        String req = requirement.trim();
        String val = value.trim();
        return req.contains(val) || val.contains(req);
    }

    private boolean rankedRequirementMatches(String requirement, String value, Map<String, Integer> ranks) {
        if (blank(value) || unlimited(requirement)) return true;
        Integer candidateRank = rankOf(value, ranks);
        if (candidateRank == null) {
            return requirementMatches(requirement, value);
        }

        String req = requirement.trim();
        List<Integer> requiredRanks = ranks.entrySet().stream()
            .filter(entry -> req.contains(entry.getKey()))
            .map(Map.Entry::getValue)
            .distinct()
            .sorted()
            .toList();
        if (requiredRanks.isEmpty()) {
            return requirementMatches(requirement, value);
        }

        if (req.contains("及以上") || req.contains("以上") || req.contains("及其以上")) {
            return candidateRank >= requiredRanks.get(0);
        }
        return requiredRanks.contains(candidateRank);
    }

    private Integer rankOf(String value, Map<String, Integer> ranks) {
        if (blank(value)) return null;
        String normalized = value.trim();
        return ranks.entrySet().stream()
            .filter(entry -> normalized.contains(entry.getKey()))
            .map(Map.Entry::getValue)
            .max(Integer::compareTo)
            .orElse(null);
    }

    private boolean unlimited(String requirement) {
        return blank(requirement) || requirement.contains("不限");
    }

    private boolean eq(String source, String filter) {
        return blank(filter) || Objects.equals(source, filter);
    }

    private boolean like(String source, String filter) {
        return blank(filter) || (!blank(source) && (source.contains(filter) || filter.contains(source)));
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private Specification<CivilServicePost> jobSpec(Map<String, String> filters, boolean activeOnly) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (activeOnly) predicates.add(builder.isTrue(root.get("active")));
            likePredicate(predicates, builder, root.get("region"), filters.get("region"));
            eqPredicate(predicates, builder, root.get("examType"), filters.get("examType"));
            eqPredicate(predicates, builder, root.get("jobCategory"), filters.get("jobCategory"));
            eqPredicate(predicates, builder, root.get("unitType"), filters.get("unitType"));
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<InterviewScoreLine> scoreLineSpec(Map<String, String> filters, boolean activeOnly) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (activeOnly) predicates.add(builder.isTrue(root.get("active")));
            likePredicate(predicates, builder, root.get("region"), filters.get("region"));
            eqPredicate(predicates, builder, root.get("year"), toInteger(filters.get("year")));
            eqPredicate(predicates, builder, root.get("examType"), filters.get("examType"));
            eqPredicate(predicates, builder, root.get("jobCategory"), filters.get("jobCategory"));
            eqPredicate(predicates, builder, root.get("unitType"), filters.get("unitType"));
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<ExamCalendarEvent> calendarSpec(Map<String, String> filters, boolean activeOnly) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (activeOnly) predicates.add(builder.isTrue(root.get("active")));
            likePredicate(predicates, builder, root.get("region"), filters.get("region"));
            eqPredicate(predicates, builder, root.get("examType"), filters.get("examType"));
            eqPredicate(predicates, builder, root.get("year"), toInteger(filters.get("year")));
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<MockInterviewRoom> roomSpec(Map<String, String> filters) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            likePredicate(predicates, builder, root.get("title"), filters.get("title"));
            likePredicate(predicates, builder, root.get("jobDirection"), filters.get("jobDirection"));
            eqPredicate(predicates, builder, root.get("status"), emptyToNull(filters.get("status")));

            LocalDateTime dateFrom = toDateTimeStart(filters.get("dateFrom"));
            LocalDateTime dateTo = toDateTimeEnd(filters.get("dateTo"));
            if (dateFrom != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("scheduledAt"), dateFrom));
            }
            if (dateTo != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("scheduledAt"), dateTo));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private <T> void eqPredicate(List<Predicate> predicates, jakarta.persistence.criteria.CriteriaBuilder builder,
                                 jakarta.persistence.criteria.Path<T> path, T value) {
        if (value != null && !String.valueOf(value).isBlank()) {
            predicates.add(builder.equal(path, value));
        }
    }

    private void likePredicate(List<Predicate> predicates, jakarta.persistence.criteria.CriteriaBuilder builder,
                               jakarta.persistence.criteria.Path<String> path, String value) {
        if (!blank(value)) {
            predicates.add(builder.like(path, "%" + value.trim() + "%"));
        }
    }

    private int pageNumber(Map<String, String> filters) {
        return Math.max(0, toInt(filters.get("page"), 0));
    }

    private int pageSize(Map<String, String> filters) {
        return Math.max(1, Math.min(100, toInt(filters.get("size"), 20)));
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String str(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private String eventGroupKey(Map<String, Object> event) {
        return str(event.get("region")) + "::" + str(event.get("examType")) + "::" + str(event.get("year"));
    }

    private String firstEventDate(Map<String, Object> group) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> events = (List<Map<String, Object>>) group.get("events");
        return events == null || events.isEmpty() ? "" : String.valueOf(events.get(0).get("eventDate"));
    }

    private int toInt(Object value, int fallback) {
        if (value == null || String.valueOf(value).isBlank()) return fallback;
        return Integer.parseInt(String.valueOf(value));
    }

    private Map<String, Object> page(List<Map<String, Object>> rows, Map<String, String> filters) {
        int page = Math.max(0, toInt(filters.get("page"), 0));
        int size = Math.max(1, Math.min(100, toInt(filters.get("size"), 20)));
        int total = rows.size();
        int from = Math.min(page * size, total);
        int to = Math.min(from + size, total);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", rows.subList(from, to));
        result.put("page", page);
        result.put("size", size);
        result.put("totalElements", total);
        result.put("totalPages", Math.max(1, (int) Math.ceil(total / (double) size)));
        return result;
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

    private Set<String> allowedExtensions() {
        if (allowedAttachmentExtensions == null || allowedAttachmentExtensions.isBlank()) {
            return new LinkedHashSet<>(DEFAULT_ATTACHMENT_EXTENSIONS);
        }
        Set<String> values = new LinkedHashSet<>();
        for (String item : allowedAttachmentExtensions.split(",")) {
            String value = item.trim().toLowerCase(Locale.ROOT);
            if (!value.isBlank()) {
                values.add(value.startsWith(".") ? value : "." + value);
            }
        }
        return values.isEmpty() ? new LinkedHashSet<>(DEFAULT_ATTACHMENT_EXTENSIONS) : values;
    }

    private void ensureRoomAccess(Long roomId, Long userId) {
        if (userId == null || !participantRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new BusinessException("No permission to access this room resource");
        }
    }

    private void emitRoomEvent(Long roomId, String type, Map<String, Object> data) {
        List<SseEmitter> emitters = roomEmitters.get(roomId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", type);
        payload.put("roomId", roomId);
        payload.put("createdAt", LocalDateTime.now().toString());
        payload.put("data", data);

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("room-update").data(payload));
            } catch (IOException | IllegalStateException e) {
                removeRoomEmitter(roomId, emitter);
                emitter.complete();
            }
        }
    }

    private void removeRoomEmitter(Long roomId, SseEmitter emitter) {
        List<SseEmitter> emitters = roomEmitters.get(roomId);
        if (emitters == null) {
            return;
        }
        emitters.remove(emitter);
        if (emitters.isEmpty()) {
            roomEmitters.remove(roomId);
        }
    }

    private Integer toInteger(Object value) {
        if (value == null || String.valueOf(value).isBlank()) return null;
        return Integer.parseInt(String.valueOf(value));
    }

    private LocalDate toDate(Object value) {
        if (value == null || String.valueOf(value).isBlank()) return null;
        return LocalDate.parse(String.valueOf(value));
    }

    private LocalDateTime toDateTimeStart(Object value) {
        if (value == null || String.valueOf(value).isBlank()) return null;
        return LocalDate.parse(String.valueOf(value)).atStartOfDay();
    }

    private LocalDateTime toDateTimeEnd(Object value) {
        if (value == null || String.valueOf(value).isBlank()) return null;
        return LocalDate.parse(String.valueOf(value)).atTime(23, 59, 59);
    }

    private Long toLong(Object value) {
        if (value == null || String.valueOf(value).isBlank()) return null;
        return Long.parseLong(String.valueOf(value));
    }

    private Object firstPresent(Object first, Object second) {
        return first == null || String.valueOf(first).isBlank() ? second : first;
    }

    private boolean toBool(Object value) {
        return value != null && Boolean.parseBoolean(String.valueOf(value));
    }

    private String sanitizeFileName(String name) {
        String value = name == null || name.isBlank() ? "attachment" : name.trim();
        value = value.replace("\\", "_").replace("/", "_").replace("..", "_");
        return value.length() > 120 ? value.substring(value.length() - 120) : value;
    }

    private String extensionOf(String name) {
        int index = name.lastIndexOf('.');
        if (index < 0 || index == name.length() - 1) return "";
        String ext = name.substring(index).toLowerCase(Locale.ROOT);
        return ext.length() > 12 ? "" : ext;
    }
}
