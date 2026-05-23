package com.graduateplatform.questionbank.service;

import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.questionbank.dto.CreatePracticeSessionRequest;
import com.graduateplatform.questionbank.dto.SavePracticeAnswerRequest;
import com.graduateplatform.questionbank.entity.PracticeAnswer;
import com.graduateplatform.questionbank.entity.PracticeSession;
import com.graduateplatform.questionbank.entity.Question;
import com.graduateplatform.questionbank.entity.QuestionBank;
import com.graduateplatform.questionbank.entity.WrongQuestion;
import com.graduateplatform.questionbank.repository.PracticeAnswerRepository;
import com.graduateplatform.questionbank.repository.PracticeSessionRepository;
import com.graduateplatform.questionbank.repository.QuestionBankRepository;
import com.graduateplatform.questionbank.repository.QuestionRepository;
import com.graduateplatform.questionbank.repository.WrongQuestionRepository;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class PracticeService {

    private static final Set<String> VALID_MODES = Set.of("chapter", "random", "mock");
    private static final Set<String> SUBJECTIVE_TYPES = Set.of("subjective", "essay", "short_answer");

    private final UserRepository userRepository;
    private final QuestionBankRepository bankRepository;
    private final QuestionRepository questionRepository;
    private final PracticeSessionRepository sessionRepository;
    private final PracticeAnswerRepository answerRepository;
    private final WrongQuestionRepository wrongQuestionRepository;

    public PracticeService(UserRepository userRepository,
                           QuestionBankRepository bankRepository,
                           QuestionRepository questionRepository,
                           PracticeSessionRepository sessionRepository,
                           PracticeAnswerRepository answerRepository,
                           WrongQuestionRepository wrongQuestionRepository) {
        this.userRepository = userRepository;
        this.bankRepository = bankRepository;
        this.questionRepository = questionRepository;
        this.sessionRepository = sessionRepository;
        this.answerRepository = answerRepository;
        this.wrongQuestionRepository = wrongQuestionRepository;
    }

    @Transactional
    public Map<String, Object> createSession(Long userId, CreatePracticeSessionRequest req) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("用户不存在"));
        QuestionBank bank = bankRepository.findById(req.getBankId())
            .orElseThrow(() -> new BusinessException("题库不存在"));

        String mode = normalize(req.getMode());
        if (!VALID_MODES.contains(mode)) {
            throw new BusinessException("练习模式仅支持章节、随机或模拟");
        }

        List<Question> questions = new ArrayList<>(questionRepository.findPracticeCandidates(
            bank.getId(),
            normalize(req.getChapter()),
            normalize(req.getQuestionType()),
            normalize(req.getDifficulty()),
            req.getYear()
        ));
        if (questions.isEmpty()) {
            throw new BusinessException("当前条件下暂无可练习题目");
        }
        if ("random".equals(mode) || "mock".equals(mode)) {
            Collections.shuffle(questions);
        }
        int limit = resolveLimit(req.getLimit(), mode, questions.size());
        questions = questions.stream().limit(limit).toList();

        PracticeSession session = PracticeSession.builder()
            .user(user)
            .bank(bank)
            .mode(mode)
            .status("in_progress")
            .startedAt(LocalDateTime.now())
            .totalCount(questions.size())
            .correctCount(0)
            .wrongCount(0)
            .durationSeconds(0)
            .answers(new ArrayList<>())
            .build();

        // 冗余筛选条件到会话，便于独立统计
        session.setTarget(bank.getTarget());
        session.setSubject(bank.getSubject());
        session.setChapter(normalize(req.getChapter()));
        session.setQuestionType(normalize(req.getQuestionType()));
        session.setDifficulty(normalize(req.getDifficulty()));
        session.setYear(req.getYear());

        for (int i = 0; i < questions.size(); i++) {
            Question q = questions.get(i);
            session.getAnswers().add(PracticeAnswer.builder()
                .session(session)
                .question(q)
                .orderNo(i + 1)
                .reviewStatus("pending")
                // 题目快照：创建时固定，历史回放不依赖 Question 主表
                .snapshotStem(q.getStem())
                .snapshotOptionsJson(q.getOptionsJson())
                .snapshotAnswer(q.getAnswer())
                .snapshotAnalysis(q.getAnalysis())
                .snapshotQuestionType(q.getQuestionType())
                .snapshotKnowledgePoint(q.getKnowledgePoint())
                .snapshotDifficulty(q.getDifficulty())
                .snapshotYear(q.getYear())
                .snapshotVersionNo(q.getVersionNo())
                .build());
        }

        return toSessionMap(sessionRepository.save(session), false);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSession(Long userId, Long sessionId) {
        PracticeSession session = loadOwnedSession(userId, sessionId);
        return toSessionMap(session, "submitted".equals(session.getStatus()));
    }

    @Transactional
    public Map<String, Object> saveAnswer(Long userId, Long sessionId, Long questionId, SavePracticeAnswerRequest req) {
        PracticeSession session = loadOwnedSession(userId, sessionId);
        if (!"in_progress".equals(session.getStatus())) {
            throw new BusinessException("已交卷的练习不能修改答案");
        }
        PracticeAnswer answer = session.getAnswers().stream()
            .filter(item -> item.getQuestion() != null && questionId.equals(item.getQuestion().getId()))
            .findFirst()
            .orElseThrow(() -> new BusinessException("题目不属于当前练习"));
        answer.setAnswer(normalize(req.getAnswer()));
        answer.setReviewStatus("pending");
        answerRepository.save(answer);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("sessionId", session.getId());
        result.put("questionId", questionId);
        result.put("answer", answer.getAnswer());
        result.put("answeredCount", countAnswered(session));
        return result;
    }

    @Transactional
    public Map<String, Object> submitSession(Long userId, Long sessionId) {
        try {
            return doSubmitSession(userId, sessionId);
        } catch (ObjectOptimisticLockingFailureException e) {
            // 乐观锁冲突（子类）：重试一次
            return doSubmitSession(userId, sessionId);
        } catch (OptimisticLockingFailureException e) {
            // 乐观锁冲突（父类）：重试一次
            return doSubmitSession(userId, sessionId);
        }
    }

    private Map<String, Object> doSubmitSession(Long userId, Long sessionId) {
        PracticeSession session = loadOwnedSession(userId, sessionId);
        if ("submitted".equals(session.getStatus())) {
            return toResultMap(session);
        }

        int objectiveCount = 0;
        int correctCount = 0;
        int wrongCount = 0;
        int answeredCount = 0;
        int subjectiveCount = 0;
        List<Map<String, Object>> wrongQuestions = new ArrayList<>();

        for (PracticeAnswer answer : session.getAnswers()) {
            Question question = answer.getQuestion();
            if (normalize(answer.getAnswer()) != null) {
                answeredCount++;
            }

            if (question != null && isSubjective(question)) {
                subjectiveCount++;
                answer.setCorrect(null);
                answer.setReviewStatus("saved_only");
                continue;
            }

            objectiveCount++;
            String questionAnswer = answer.getSnapshotAnswer() != null ? answer.getSnapshotAnswer() : (question != null ? question.getAnswer() : "");
            boolean correct = normalizeAnswer(questionAnswer).equals(normalizeAnswer(answer.getAnswer()));
            answer.setCorrect(correct);
            answer.setReviewStatus("auto_scored");
            if (correct) {
                correctCount++;
            } else {
                wrongCount++;
                if (question != null) {
                    upsertWrongQuestion(session.getUser(), question, answer.getAnswer());
                    wrongQuestions.add(toWrongQuestionMap(question, answer.getAnswer()));
                }
            }
        }

        LocalDateTime submittedAt = LocalDateTime.now();
        int durationSeconds = Math.max(1, (int) java.time.Duration.between(session.getStartedAt(), submittedAt).toSeconds());
        Integer accuracy = objectiveCount == 0 ? null : Math.round((correctCount * 100f) / objectiveCount);

        session.setStatus("submitted");
        session.setSubmittedAt(submittedAt);
        session.setTotalCount(session.getAnswers().size());
        session.setAnsweredCount(answeredCount);
        session.setCorrectCount(correctCount);
        session.setWrongCount(wrongCount);
        session.setSubjectiveCount(subjectiveCount);
        session.setDurationSeconds(durationSeconds);
        session.setAccuracy(accuracy);
        session.setScore(accuracy);
        sessionRepository.save(session);

        Map<String, Object> result = toResultMap(session);
        result.put("wrongQuestions", wrongQuestions);
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getWrongQuestions(Long userId, String target, String subject,
                                                       String chapter, Integer minWrongCount) {
        return wrongQuestionRepository.findReviewList(
            userId,
            normalize(target),
            normalize(subject),
            normalize(chapter),
            minWrongCount
        ).stream().map(this::toWrongQuestionReviewMap).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStatistics(Long userId, String granularity) {
        String group = normalize(granularity);
        if (group == null) group = "day";
        if (!Set.of("day", "week", "month").contains(group)) {
            throw new BusinessException("统计粒度仅支持 day、week、month");
        }
        String finalGroup = group;

        List<PracticeSession> sessions = sessionRepository.findByUserIdAndStatusOrderBySubmittedAtDesc(userId, "submitted")
            .stream()
            .filter(session -> session.getSubmittedAt() != null)
            .toList();

        int practiceCount = sessions.size();
        int totalDuration = sessions.stream()
            .map(PracticeSession::getDurationSeconds)
            .filter(value -> value != null)
            .mapToInt(Integer::intValue)
            .sum();
        int accuracySum = sessions.stream()
            .map(PracticeSession::getAccuracy)
            .filter(value -> value != null)
            .mapToInt(Integer::intValue)
            .sum();
        long accuracyCount = sessions.stream().filter(session -> session.getAccuracy() != null).count();
        int averageAccuracy = accuracyCount == 0 ? 0 : Math.round(accuracySum / (float) accuracyCount);

        Map<String, List<PracticeSession>> grouped = sessions.stream()
            .collect(Collectors.groupingBy(session -> groupKey(session.getSubmittedAt(), finalGroup), TreeMap::new, Collectors.toList()));
        List<Map<String, Object>> trend = grouped.entrySet().stream().map(entry -> {
            List<PracticeSession> items = entry.getValue();
            int itemAccuracy = average(items.stream()
                .map(PracticeSession::getAccuracy)
                .filter(value -> value != null)
                .toList());
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("period", entry.getKey());
            map.put("practiceCount", items.size());
            map.put("averageAccuracy", itemAccuracy);
            map.put("totalDurationSeconds", items.stream()
                .map(PracticeSession::getDurationSeconds)
                .filter(value -> value != null)
                .mapToInt(Integer::intValue)
                .sum());
            return map;
        }).toList();

        Map<String, Integer> wrongKnowledgePoints = new LinkedHashMap<>();
        for (WrongQuestion wrong : wrongQuestionRepository.findByUserId(userId)) {
            Question question = wrong.getQuestion();
            String key = normalize(question != null ? question.getKnowledgePoint() : null);
            if (key == null) {
                key = question != null ? question.getStem() : "未分类知识点";
            }
            wrongKnowledgePoints.merge(key, wrong.getWrongCount() != null ? wrong.getWrongCount() : 1, Integer::sum);
        }
        List<Map<String, Object>> frequentWrongKnowledgePoints = wrongKnowledgePoints.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue(Comparator.reverseOrder()))
            .limit(10)
            .map(entry -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("knowledgePoint", entry.getKey());
                map.put("wrongCount", entry.getValue());
                return map;
            })
            .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("granularity", group);
        result.put("practiceCount", practiceCount);
        result.put("averageAccuracy", averageAccuracy);
        result.put("totalDurationSeconds", totalDuration);
        result.put("trend", trend);
        result.put("frequentWrongKnowledgePoints", frequentWrongKnowledgePoints);
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getHistory(Long userId, String mode, String target, String subject,
                                           LocalDateTime dateFrom, LocalDateTime dateTo, int page, int size) {
        // 处理分页
        int offset = Math.max(0, page - 1) * size;

        List<PracticeSession> allSessions = sessionRepository.findByUserIdAndStatusOrderBySubmittedAtDesc(userId, "submitted")
            .stream()
            .filter(s -> s.getSubmittedAt() != null)
            .filter(s -> normalize(mode) == null || normalize(mode).equals(s.getMode()))
            .filter(s -> normalize(target) == null || normalize(target).equals(s.getTarget()))
            .filter(s -> normalize(subject) == null || normalize(subject).equals(s.getSubject()))
            .filter(s -> dateFrom == null || !s.getSubmittedAt().toLocalDate().isBefore(dateFrom.toLocalDate()))
            .filter(s -> dateTo == null || !s.getSubmittedAt().toLocalDate().isAfter(dateTo.toLocalDate()))
            .toList();

        int total = allSessions.size();
        List<Map<String, Object>> items = allSessions.stream()
            .skip(offset)
            .limit(size)
            .map(session -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", session.getId());
                map.put("bankId", session.getBank() != null ? session.getBank().getId() : null);
                map.put("bankName", session.getBank() != null ? session.getBank().getName() : null);
                map.put("mode", session.getMode());
                map.put("status", session.getStatus());
                map.put("totalCount", session.getTotalCount());
                map.put("correctCount", session.getCorrectCount());
                map.put("wrongCount", session.getWrongCount());
                map.put("accuracy", session.getAccuracy());
                map.put("score", session.getScore());
                map.put("durationSeconds", session.getDurationSeconds());
                map.put("target", session.getTarget());
                map.put("subject", session.getSubject());
                map.put("startedAt", session.getStartedAt() != null ? session.getStartedAt().toString() : null);
                map.put("submittedAt", session.getSubmittedAt() != null ? session.getSubmittedAt().toString() : null);
                return map;
            })
            .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("total", total);
        result.put("page", page);
        result.put("size", size);
        result.put("totalPages", (int) Math.ceil((double) total / size));
        return result;
    }

    private PracticeSession loadOwnedSession(Long userId, Long sessionId) {
        PracticeSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new BusinessException("练习记录不存在"));
        if (session.getUser() == null || !userId.equals(session.getUser().getId())) {
            throw new BusinessException("无权访问该练习记录");
        }
        return session;
    }

    private void upsertWrongQuestion(User user, Question question, String answer) {
        // 使用悲观写锁防止并发创建竞态
        WrongQuestion wrongQuestion = wrongQuestionRepository
            .findByUserIdAndQuestionIdWithLock(user.getId(), question.getId())
            .orElseGet(() -> WrongQuestion.builder()
                .user(user)
                .question(question)
                .wrongCount(0)
                .snapshotStem(question.getStem())
                .snapshotTarget(question.getBank() != null ? question.getBank().getTarget() : null)
                .snapshotSubject(question.getBank() != null ? question.getBank().getSubject() : null)
                .snapshotChapter(question.getChapter())
                .snapshotKnowledgePoint(question.getKnowledgePoint())
                .snapshotQuestionType(question.getQuestionType())
                .build());
        wrongQuestion.setWrongCount((wrongQuestion.getWrongCount() == null ? 0 : wrongQuestion.getWrongCount()) + 1);
        wrongQuestion.setLastAnswer(normalize(answer));
        wrongQuestion.setLastWrongAt(LocalDateTime.now());
        wrongQuestionRepository.save(wrongQuestion);
    }

    private Map<String, Object> toSessionMap(PracticeSession session, boolean includeAnswers) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", session.getId());
        map.put("bankId", session.getBank() != null ? session.getBank().getId() : null);
        map.put("bankName", session.getBank() != null ? session.getBank().getName() : null);
        map.put("mode", session.getMode());
        map.put("status", session.getStatus());
        map.put("startedAt", session.getStartedAt() != null ? session.getStartedAt().toString() : null);
        map.put("submittedAt", session.getSubmittedAt() != null ? session.getSubmittedAt().toString() : null);
        map.put("totalCount", session.getTotalCount());
        map.put("answeredCount", countAnswered(session));
        map.put("questions", session.getAnswers().stream()
            .sorted(Comparator.comparing(answer -> answer.getOrderNo() != null ? answer.getOrderNo() : 0))
            .map(answer -> toPracticeQuestionMap(answer, includeAnswers))
            .toList());
        if ("submitted".equals(session.getStatus())) {
            map.put("result", toResultMap(session));
        }
        return map;
    }

    private Map<String, Object> toPracticeQuestionMap(PracticeAnswer answer, boolean includeAnswers) {
        Question question = answer.getQuestion();
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", question.getId());
        // 优先使用快照字段，保证历史回放一致性
        map.put("stem", answer.getSnapshotStem() != null ? answer.getSnapshotStem() : question.getStem());
        map.put("options", answer.getSnapshotOptionsJson() != null ? answer.getSnapshotOptionsJson() : question.getOptionsJson());
        map.put("analysis", includeAnswers
            ? (answer.getSnapshotAnalysis() != null ? answer.getSnapshotAnalysis() : question.getAnalysis())
            : null);
        map.put("chapter", question.getChapter());
        map.put("difficulty", answer.getSnapshotDifficulty() != null ? answer.getSnapshotDifficulty() : question.getDifficulty());
        map.put("questionType", answer.getSnapshotQuestionType() != null ? answer.getSnapshotQuestionType() : question.getQuestionType());
        map.put("knowledgePoint", answer.getSnapshotKnowledgePoint() != null ? answer.getSnapshotKnowledgePoint() : question.getKnowledgePoint());
        map.put("year", answer.getSnapshotYear() != null ? answer.getSnapshotYear() : question.getYear());
        map.put("userAnswer", answer.getAnswer());
        map.put("correct", includeAnswers ? answer.getCorrect() : null);
        if (includeAnswers) {
            map.put("answer", answer.getSnapshotAnswer() != null ? answer.getSnapshotAnswer() : question.getAnswer());
        }
        return map;
    }

    private Map<String, Object> toResultMap(PracticeSession session) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("sessionId", session.getId());
        map.put("totalCount", session.getTotalCount());
        map.put("correctCount", session.getCorrectCount());
        map.put("wrongCount", session.getWrongCount());
        map.put("durationSeconds", session.getDurationSeconds());
        map.put("score", session.getScore());
        map.put("accuracy", session.getAccuracy());
        map.put("startedAt", session.getStartedAt() != null ? session.getStartedAt().toString() : null);
        map.put("submittedAt", session.getSubmittedAt() != null ? session.getSubmittedAt().toString() : null);
        map.put("wrongQuestions", session.getAnswers().stream()
            .filter(answer -> Boolean.FALSE.equals(answer.getCorrect()))
            .map(answer -> toWrongQuestionMap(answer.getQuestion(), answer.getAnswer()))
            .toList());
        return map;
    }

    private Map<String, Object> toWrongQuestionMap(Question question, String selected) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", question.getId());
        map.put("stem", question.getStem());
        map.put("answer", question.getAnswer());
        map.put("selected", selected);
        map.put("analysis", question.getAnalysis());
        map.put("chapter", question.getChapter());
        map.put("knowledgePoint", question.getKnowledgePoint());
        return map;
    }

    private Map<String, Object> toWrongQuestionReviewMap(WrongQuestion wrong) {
        Question question = wrong.getQuestion();
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", wrong.getId());
        map.put("questionId", question != null ? question.getId() : null);
        map.put("stem", wrong.getSnapshotStem() != null ? wrong.getSnapshotStem() : (question != null ? question.getStem() : null));
        map.put("target", wrong.getSnapshotTarget() != null ? wrong.getSnapshotTarget() : (question != null && question.getBank() != null ? question.getBank().getTarget() : null));
        map.put("subject", wrong.getSnapshotSubject() != null ? wrong.getSnapshotSubject() : (question != null && question.getBank() != null ? question.getBank().getSubject() : null));
        map.put("chapter", wrong.getSnapshotChapter() != null ? wrong.getSnapshotChapter() : (question != null ? question.getChapter() : null));
        map.put("knowledgePoint", wrong.getSnapshotKnowledgePoint() != null ? wrong.getSnapshotKnowledgePoint() : (question != null ? question.getKnowledgePoint() : null));
        map.put("wrongCount", wrong.getWrongCount());
        map.put("lastAnswer", wrong.getLastAnswer());
        map.put("lastWrongAt", wrong.getLastWrongAt() != null ? wrong.getLastWrongAt().toString() : null);
        return map;
    }

    private boolean isSubjective(Question question) {
        String type = normalize(question.getQuestionType());
        return type != null && SUBJECTIVE_TYPES.contains(type);
    }

    private int countAnswered(PracticeSession session) {
        return (int) session.getAnswers().stream()
            .filter(answer -> normalize(answer.getAnswer()) != null)
            .count();
    }

    private int resolveLimit(Integer requested, String mode, int total) {
        int fallback = "mock".equals(mode) ? 20 : total;
        int limit = requested == null || requested <= 0 ? fallback : requested;
        return Math.min(limit, total);
    }

    private int average(List<Integer> values) {
        if (values.isEmpty()) {
            return 0;
        }
        return Math.round(values.stream().mapToInt(Integer::intValue).sum() / (float) values.size());
    }

    private String groupKey(LocalDateTime time, String granularity) {
        if ("month".equals(granularity)) {
            return String.format("%04d-%02d", time.getYear(), time.getMonthValue());
        }
        if ("week".equals(granularity)) {
            int week = time.get(WeekFields.of(Locale.CHINA).weekOfWeekBasedYear());
            return String.format("%04d-W%02d", time.getYear(), week);
        }
        return time.toLocalDate().toString();
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeAnswer(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            return "";
        }
        List<String> chars = normalized.toUpperCase(Locale.ROOT).chars()
            .mapToObj(code -> String.valueOf((char) code))
            .filter(ch -> ch.matches("[A-Z0-9\\u4e00-\\u9fa5]"))
            .sorted()
            .toList();
        return String.join("", chars);
    }
}
