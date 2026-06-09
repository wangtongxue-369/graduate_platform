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
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PracticeServiceTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final QuestionBankRepository bankRepository = mock(QuestionBankRepository.class);
    private final QuestionRepository questionRepository = mock(QuestionRepository.class);
    private final PracticeSessionRepository sessionRepository = mock(PracticeSessionRepository.class);
    private final PracticeAnswerRepository answerRepository = mock(PracticeAnswerRepository.class);
    private final WrongQuestionRepository wrongQuestionRepository = mock(WrongQuestionRepository.class);
    private final PlatformTransactionManager transactionManager = mock(PlatformTransactionManager.class);
    private final PracticeService practiceService = new PracticeService(
        userRepository,
        bankRepository,
        questionRepository,
        sessionRepository,
        answerRepository,
        wrongQuestionRepository,
        transactionManager
    );

    @Test
    void createSessionSelectsQuestionsAndDoesNotExposeAnswers() {
        User user = user(1L);
        QuestionBank bank = bank(10L);
        Question question = objectiveQuestion(100L, bank, "A");
        CreatePracticeSessionRequest request = new CreatePracticeSessionRequest();
        request.setBankId(bank.getId());
        request.setMode("chapter");
        request.setChapter("第1章");

        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(bankRepository.findById(bank.getId())).thenReturn(Optional.of(bank));
        when(questionRepository.findPracticeCandidates(bank.getId(), "第1章", null, null, null))
            .thenReturn(List.of(question));
        when(sessionRepository.save(any(PracticeSession.class))).thenAnswer(invocation -> {
            PracticeSession session = invocation.getArgument(0);
            session.setId(55L);
            session.getAnswers().forEach(answer -> {
                answer.setId(answer.getQuestion().getId());
                answer.setSession(session);
            });
            return session;
        });

        Map<String, Object> response = practiceService.createSession(user.getId(), request);

        assertThat(response).containsEntry("id", 55L);
        List<?> questions = (List<?>) response.get("questions");
        assertThat(questions).hasSize(1);
        Map<?, ?> payload = (Map<?, ?>) questions.get(0);
        assertThat(payload.get("id")).isEqualTo(100L);
        assertThat(payload.containsKey("answer")).isFalse();
    }

    @Test
    void saveAnswerRejectsSessionsOwnedByAnotherUser() {
        PracticeSession session = PracticeSession.builder()
            .id(9L)
            .user(user(2L))
            .status("in_progress")
            .answers(new ArrayList<>())
            .build();

        when(sessionRepository.findById(9L)).thenReturn(Optional.of(session));

        SavePracticeAnswerRequest request = new SavePracticeAnswerRequest();
        request.setAnswer("A");

        assertThatThrownBy(() -> practiceService.saveAnswer(1L, 9L, 100L, request))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("无权访问");
        verify(answerRepository, never()).save(any());
    }

    @Test
    void submitSessionScoresObjectiveAnswersAndCreatesWrongQuestion() {
        User user = user(1L);
        QuestionBank bank = bank(10L);
        Question right = objectiveQuestion(101L, bank, "A");
        Question wrong = objectiveQuestion(102L, bank, "C");
        Question subjective = subjectiveQuestion(103L, bank);
        PracticeSession session = PracticeSession.builder()
            .id(20L)
            .user(user)
            .bank(bank)
            .mode("mock")
            .status("in_progress")
            .startedAt(LocalDateTime.now().minusMinutes(5))
            .answers(new ArrayList<>())
            .build();
        session.getAnswers().add(answer(session, right, "a", 1));
        session.getAnswers().add(answer(session, wrong, "B", 2));
        session.getAnswers().add(answer(session, subjective, "主观作答", 3));

        when(sessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(wrongQuestionRepository.findByUserIdAndQuestionId(user.getId(), wrong.getId()))
            .thenReturn(Optional.empty());
        when(wrongQuestionRepository.save(any(WrongQuestion.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(sessionRepository.save(any(PracticeSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> result = practiceService.submitSession(user.getId(), session.getId());

        assertThat(result).containsEntry("correctCount", 1);
        assertThat(result).containsEntry("wrongCount", 1);
        assertThat(result).containsEntry("score", 50);
        assertThat(result).containsEntry("accuracy", 50);
        assertThat(session.getStatus()).isEqualTo("submitted");
        assertThat(session.getAnswers()).extracting(PracticeAnswer::getCorrect)
            .containsExactly(Boolean.TRUE, Boolean.FALSE, null);
        verify(wrongQuestionRepository).save(any(WrongQuestion.class));
    }

    // Bug #7: 错题题目失去 bank 关联时，必须抛干净的 BusinessException(400)
    // 而不是让 session.setTarget(bank.getTarget()) 在下一行 NPE 500。
    @Test
    void wrongRetryWithOrphanedQuestionThrowsBusinessException() {
        User user = user(1L);
        Question orphan = objectiveQuestion(200L, null, "A"); // 无 bank
        WrongQuestion wq = WrongQuestion.builder().id(1L).user(user).question(orphan).wrongCount(1).build();

        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(wrongQuestionRepository.findById(1L)).thenReturn(Optional.of(wq));

        CreatePracticeSessionRequest req = new CreatePracticeSessionRequest();
        req.setMode("wrong_retry");
        req.setWrongQuestionIds(List.of(1L));

        assertThatThrownBy(() -> practiceService.createSession(user.getId(), req))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("题库已不存在");
    }

    // Bug #9: 错题重练应尊重 req.getLimit()，与标准模式一致。
    @Test
    void wrongRetryRespectsRequestLimit() {
        User user = user(1L);
        QuestionBank bank = bank(10L);
        WrongQuestion w1 = WrongQuestion.builder().id(1L).user(user).question(objectiveQuestion(101L, bank, "A")).build();
        WrongQuestion w2 = WrongQuestion.builder().id(2L).user(user).question(objectiveQuestion(102L, bank, "B")).build();
        WrongQuestion w3 = WrongQuestion.builder().id(3L).user(user).question(objectiveQuestion(103L, bank, "C")).build();

        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(wrongQuestionRepository.findById(1L)).thenReturn(Optional.of(w1));
        when(wrongQuestionRepository.findById(2L)).thenReturn(Optional.of(w2));
        when(wrongQuestionRepository.findById(3L)).thenReturn(Optional.of(w3));
        when(sessionRepository.save(any(PracticeSession.class))).thenAnswer(invocation -> {
            PracticeSession s = invocation.getArgument(0);
            s.setId(99L);
            return s;
        });

        CreatePracticeSessionRequest req = new CreatePracticeSessionRequest();
        req.setMode("wrong_retry");
        req.setWrongQuestionIds(List.of(1L, 2L, 3L));
        req.setLimit(2);

        Map<String, Object> resp = practiceService.createSession(user.getId(), req);
        List<?> questions = (List<?>) resp.get("questions");
        assertThat(questions).hasSize(2);
    }

    @Test
    void getStatisticsAggregatesSubmittedSessionsAndWrongKnowledgePoints() {
        PracticeSession first = PracticeSession.builder()
            .id(1L)
            .submittedAt(LocalDateTime.of(2026, 5, 1, 10, 0))
            .accuracy(80)
            .durationSeconds(120)
            .build();
        PracticeSession second = PracticeSession.builder()
            .id(2L)
            .submittedAt(LocalDateTime.of(2026, 5, 1, 11, 0))
            .accuracy(60)
            .durationSeconds(180)
            .build();
        WrongQuestion wrong = WrongQuestion.builder()
            .question(objectiveQuestion(200L, bank(10L), "A"))
            .wrongCount(3)
            .build();

        when(sessionRepository.findByUserIdAndStatusOrderBySubmittedAtDesc(1L, "submitted"))
            .thenReturn(List.of(first, second));
        when(wrongQuestionRepository.findByUserId(1L)).thenReturn(List.of(wrong));

        Map<String, Object> stats = practiceService.getStatistics(1L, "day");

        assertThat(stats).containsEntry("practiceCount", 2);
        assertThat(stats).containsEntry("averageAccuracy", 70);
        assertThat(stats).containsEntry("totalDurationSeconds", 300);
        List<?> trend = (List<?>) stats.get("trend");
        assertThat(trend).hasSize(1);
        List<?> knowledgePoints = (List<?>) stats.get("frequentWrongKnowledgePoints");
        assertThat(knowledgePoints).hasSize(1);
    }

    private User user(Long id) {
        return User.builder()
            .id(id)
            .name("测试用户")
            .email("test" + id + "@local")
            .password("encoded")
            .target("kaoyan")
            .role("user")
            .status("normal")
            .build();
    }

    private QuestionBank bank(Long id) {
        return QuestionBank.builder()
            .id(id)
            .name("题库")
            .target("kaoyan")
            .subject("政治")
            .difficulty("middle")
            .build();
    }

    private Question objectiveQuestion(Long id, QuestionBank bank, String answer) {
        return Question.builder()
            .id(id)
            .bank(bank)
            .stem("题干" + id)
            .optionsJson("[\"A.选项A\",\"B.选项B\",\"C.选项C\",\"D.选项D\"]")
            .answer(answer)
            .analysis("解析")
            .chapter("第1章")
            .difficulty("middle")
            .questionType("single")
            .knowledgePoint("知识点")
            .year(2024)
            .status("published")
            .active(true)
            .build();
    }

    private Question subjectiveQuestion(Long id, QuestionBank bank) {
        Question question = objectiveQuestion(id, bank, "");
        question.setQuestionType("subjective");
        question.setOptionsJson("[]");
        return question;
    }

    private PracticeAnswer answer(PracticeSession session, Question question, String value, int orderNo) {
        return PracticeAnswer.builder()
            .session(session)
            .question(question)
            .answer(value)
            .orderNo(orderNo)
            .reviewStatus("pending")
            .build();
    }
}
