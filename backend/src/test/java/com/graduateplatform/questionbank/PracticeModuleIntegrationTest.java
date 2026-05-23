package com.graduateplatform.questionbank;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.common.security.JwtTokenProvider;
import com.graduateplatform.questionbank.entity.Question;
import com.graduateplatform.questionbank.entity.QuestionBank;
import com.graduateplatform.questionbank.repository.PracticeAnswerRepository;
import com.graduateplatform.questionbank.repository.PracticeSessionRepository;
import com.graduateplatform.questionbank.repository.QuestionBankRepository;
import com.graduateplatform.questionbank.repository.QuestionRepository;
import com.graduateplatform.questionbank.repository.WrongQuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PracticeModuleIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtTokenProvider tokenProvider;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired UserRepository userRepository;
    @Autowired QuestionBankRepository bankRepository;
    @Autowired QuestionRepository questionRepository;
    @Autowired PracticeSessionRepository sessionRepository;
    @Autowired PracticeAnswerRepository answerRepository;
    @Autowired WrongQuestionRepository wrongQuestionRepository;

    private User user;
    private String userToken;
    private QuestionBank bank;
    private Question q1;
    private Question q2;
    private Question q3;

    @BeforeEach
    void setUp() {
        wrongQuestionRepository.deleteAll();
        answerRepository.deleteAll();
        sessionRepository.deleteAll();
        questionRepository.deleteAll();
        bankRepository.deleteAll();
        userRepository.deleteAll();

        String suffix = String.valueOf(System.nanoTime());
        user = userRepository.save(User.builder()
            .name("Practice User").email("practice" + suffix + "@test.local")
            .password(passwordEncoder.encode("pw")).target("kaoyan").role("user").status("normal").build());
        userToken = tokenProvider.generateToken(user.getId(), "user");

        bank = bankRepository.save(QuestionBank.builder()
            .name("考研政治").target("kaoyan").subject("政治").difficulty("middle").build());

        q1 = questionRepository.save(Question.builder()
            .bank(bank).stem("1+1=?").optionsJson("[\"A.1\",\"B.2\",\"C.3\",\"D.4\"]")
            .answer("B").analysis("1+1=2").chapter("第1章").questionType("single")
            .difficulty("easy").year(2024).status("published").active(true).versionNo(1).build());

        q2 = questionRepository.save(Question.builder()
            .bank(bank).stem("地球是圆的？").optionsJson("[\"A.对\",\"B.错\"]")
            .answer("A").analysis("地球是圆的").chapter("第1章").questionType("single")
            .difficulty("easy").year(2024).status("published").active(true).versionNo(1).build());

        q3 = questionRepository.save(Question.builder()
            .bank(bank).stem("简述市场经济").optionsJson("[]").answer("市场经济是一种经济体系")
            .analysis("市场经济由供求关系调节").chapter("第2章").questionType("subjective")
            .difficulty("hard").year(2024).status("published").active(true).versionNo(1).build());
    }

    // ==================== Practice Session Flow ====================

    @Test
    void createSessionRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/practice/sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("bankId", bank.getId(), "mode", "chapter", "chapter", "第1章"))))
            .andExpect(status().isForbidden());
    }

    @Test
    void createSessionAndGetSessionRoundTrip() throws Exception {
        String createResp = mockMvc.perform(post("/api/practice/sessions")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("bankId", bank.getId(), "mode", "chapter", "chapter", "第1章"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.id").isNumber())
            .andExpect(jsonPath("$.data.questions.length()").value(2))
            .andExpect(jsonPath("$.data.questions[0].answer").doesNotExist())
            .andReturn().getResponse().getContentAsString();

        long sessionId = objectMapper.readTree(createResp).path("data").path("id").asLong();

        // Get session
        mockMvc.perform(get("/api/practice/sessions/" + sessionId)
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(sessionId))
            .andExpect(jsonPath("$.data.status").value("in_progress"))
            .andExpect(jsonPath("$.data.totalCount").value(2));
    }

    @Test
    void fullPracticeFlowCreateAnswerAndSubmit() throws Exception {
        // Use chapter mode to get predictable questions (q1, q2 — both in chapter 1)
        String createResp = mockMvc.perform(post("/api/practice/sessions")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("bankId", bank.getId(), "mode", "chapter", "chapter", "第1章"))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        JsonNode sessionNode = objectMapper.readTree(createResp).path("data");
        long sessionId = sessionNode.path("id").asLong();
        JsonNode questions = sessionNode.path("questions");

        // Find which question ID is which (order is preserved in chapter mode)
        long q1id = q1.getId();
        long q2id = q2.getId();

        // Save first answer (correct: q1 answer is "B")
        mockMvc.perform(put("/api/practice/sessions/" + sessionId + "/answers/" + q1id)
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("answer", "B"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));

        // Save second answer (wrong: q2 answer is "A", we answer "B")
        mockMvc.perform(put("/api/practice/sessions/" + sessionId + "/answers/" + q2id)
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("answer", "B"))))
            .andExpect(status().isOk());

        // Submit
        mockMvc.perform(post("/api/practice/sessions/" + sessionId + "/submit")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.correctCount").value(1))
            .andExpect(jsonPath("$.data.wrongCount").value(1))
            .andExpect(jsonPath("$.data.score").value(50))
            .andExpect(jsonPath("$.data.accuracy").value(50));
    }

    @Test
    void submitSessionWithAllCorrect() throws Exception {
        String createResp = mockMvc.perform(post("/api/practice/sessions")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("bankId", bank.getId(), "mode", "chapter", "chapter", "第1章"))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        long sessionId = objectMapper.readTree(createResp).path("data").path("id").asLong();
        JsonNode questions = objectMapper.readTree(createResp).path("data").path("questions");

        // Answer both correctly
        for (int i = 0; i < questions.size(); i++) {
            long qid = questions.get(i).path("id").asLong();
            String correctAnswer = qid == q1.getId() ? "B" : "A";
            mockMvc.perform(put("/api/practice/sessions/" + sessionId + "/answers/" + qid)
                    .header("Authorization", "Bearer " + userToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json(Map.of("answer", correctAnswer))))
                .andExpect(status().isOk());
        }

        // Submit
        mockMvc.perform(post("/api/practice/sessions/" + sessionId + "/submit")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.correctCount").value(2))
            .andExpect(jsonPath("$.data.wrongCount").value(0))
            .andExpect(jsonPath("$.data.accuracy").value(100));
    }

    // ==================== Wrong Questions ====================

    @Test
    void wrongQuestionsIncludeMistakesAfterSubmission() throws Exception {
        // Create and submit a session with wrong answers
        String createResp = mockMvc.perform(post("/api/practice/sessions")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("bankId", bank.getId(), "mode", "chapter", "chapter", "第1章"))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        long sessionId = objectMapper.readTree(createResp).path("data").path("id").asLong();
        JsonNode questions = objectMapper.readTree(createResp).path("data").path("questions");
        for (int i = 0; i < questions.size(); i++) {
            mockMvc.perform(put("/api/practice/sessions/" + sessionId + "/answers/" + questions.get(i).path("id").asLong())
                    .header("Authorization", "Bearer " + userToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json(Map.of("answer", "wrong"))))
                .andExpect(status().isOk());
        }

        mockMvc.perform(post("/api/practice/sessions/" + sessionId + "/submit")
                .header("Authorization", "Bearer " + userToken));

        // Verify wrong questions
        mockMvc.perform(get("/api/practice/wrong-questions")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    void wrongQuestionsFilterBySubject() throws Exception {
        // Submit a session with wrong answers first
        String createResp = mockMvc.perform(post("/api/practice/sessions")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("bankId", bank.getId(), "mode", "random"))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        long sessionId = objectMapper.readTree(createResp).path("data").path("id").asLong();
        JsonNode questions = objectMapper.readTree(createResp).path("data").path("questions");

        // Answer all wrong
        for (int i = 0; i < questions.size(); i++) {
            mockMvc.perform(put("/api/practice/sessions/" + sessionId + "/answers/" + questions.get(i).path("id").asLong())
                    .header("Authorization", "Bearer " + userToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json(Map.of("answer", "wrong"))))
                .andExpect(status().isOk());
        }
        mockMvc.perform(post("/api/practice/sessions/" + sessionId + "/submit")
                .header("Authorization", "Bearer " + userToken));

        // Filter by subject
        mockMvc.perform(get("/api/practice/wrong-questions?subject=政治")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(2));

        // Filter by non-existent subject
        mockMvc.perform(get("/api/practice/wrong-questions?subject=英语")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(0));
    }

    // ==================== Statistics ====================

    @Test
    void statisticsReturnAggregatesAfterSubmission() throws Exception {
        // Create and submit a session
        String createResp = mockMvc.perform(post("/api/practice/sessions")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("bankId", bank.getId(), "mode", "chapter", "chapter", "第1章"))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        long sessionId = objectMapper.readTree(createResp).path("data").path("id").asLong();
        JsonNode questions = objectMapper.readTree(createResp).path("data").path("questions");
        // Answer 1 correct, 1 wrong
        mockMvc.perform(put("/api/practice/sessions/" + sessionId + "/answers/" + questions.get(0).path("id").asLong())
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("answer", "B"))))
            .andExpect(status().isOk());
        mockMvc.perform(put("/api/practice/sessions/" + sessionId + "/answers/" + questions.get(1).path("id").asLong())
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("answer", "wrong"))))
            .andExpect(status().isOk());

        mockMvc.perform(post("/api/practice/sessions/" + sessionId + "/submit")
                .header("Authorization", "Bearer " + userToken));

        // Get statistics
        mockMvc.perform(get("/api/practice/statistics")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.practiceCount").value(1))
            .andExpect(jsonPath("$.data.averageAccuracy").value(50));
    }

    @Test
    void statisticsEmptyForNewUser() throws Exception {
        User newUser = userRepository.save(User.builder()
            .name("New User").email("new" + System.nanoTime() + "@test.local")
            .password(passwordEncoder.encode("pw")).target("kaoyan").role("user").status("normal").build());
        String newToken = tokenProvider.generateToken(newUser.getId(), "user");

        mockMvc.perform(get("/api/practice/statistics")
                .header("Authorization", "Bearer " + newToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.practiceCount").value(0))
            .andExpect(jsonPath("$.data.averageAccuracy").value(0));
    }

    // ==================== History ====================

    @Test
    void historyReturnsSubmittedSessions() throws Exception {
        // Create and submit a session
        String createResp = mockMvc.perform(post("/api/practice/sessions")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("bankId", bank.getId(), "mode", "chapter", "chapter", "第1章"))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        long sessionId = objectMapper.readTree(createResp).path("data").path("id").asLong();
        JsonNode questions = objectMapper.readTree(createResp).path("data").path("questions");
        for (int i = 0; i < questions.size(); i++) {
            mockMvc.perform(put("/api/practice/sessions/" + sessionId + "/answers/" + questions.get(i).path("id").asLong())
                    .header("Authorization", "Bearer " + userToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json(Map.of("answer", "wrong"))))
                .andExpect(status().isOk());
        }
        mockMvc.perform(post("/api/practice/sessions/" + sessionId + "/submit")
                .header("Authorization", "Bearer " + userToken));

        // Check history
        mockMvc.perform(get("/api/practice/history")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.items.length()").value(1))
            .andExpect(jsonPath("$.data.items[0].mode").value("chapter"))
            .andExpect(jsonPath("$.data.items[0].status").value("submitted"));

        // Filter by mode
        mockMvc.perform(get("/api/practice/history?mode=chapter")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.items.length()").value(1));

        mockMvc.perform(get("/api/practice/history?mode=mock")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.items.length()").value(0));
    }

    // ==================== Error Scenarios ====================

    @Test
    void saveAnswerToOtherUsersSessionIsRejected() throws Exception {
        String createResp = mockMvc.perform(post("/api/practice/sessions")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("bankId", bank.getId(), "mode", "chapter", "chapter", "第1章"))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        long sessionId = objectMapper.readTree(createResp).path("data").path("id").asLong();
        JsonNode questions = objectMapper.readTree(createResp).path("data").path("questions");
        long questionId = questions.get(0).path("id").asLong();

        // Another user tries to answer
        User other = userRepository.save(User.builder()
            .name("Other").email("other" + System.nanoTime() + "@test.local")
            .password(passwordEncoder.encode("pw")).target("kaoyan").role("user").status("normal").build());
        String otherToken = tokenProvider.generateToken(other.getId(), "user");

        mockMvc.perform(put("/api/practice/sessions/" + sessionId + "/answers/" + questionId)
                .header("Authorization", "Bearer " + otherToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("answer", "A"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void submitAlreadySubmittedSessionStillSucceeds() throws Exception {
        String createResp = mockMvc.perform(post("/api/practice/sessions")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("bankId", bank.getId(), "mode", "chapter", "chapter", "第1章"))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        long sessionId = objectMapper.readTree(createResp).path("data").path("id").asLong();
        JsonNode questions = objectMapper.readTree(createResp).path("data").path("questions");
        for (int i = 0; i < questions.size(); i++) {
            mockMvc.perform(put("/api/practice/sessions/" + sessionId + "/answers/" + questions.get(i).path("id").asLong())
                    .header("Authorization", "Bearer " + userToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json(Map.of("answer", "wrong"))))
                .andExpect(status().isOk());
        }

        // Submit twice
        mockMvc.perform(post("/api/practice/sessions/" + sessionId + "/submit")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk());

        mockMvc.perform(post("/api/practice/sessions/" + sessionId + "/submit")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk());
    }

    @Test
    void practiceRequiresAuthOnAllEndpoints() throws Exception {
        // GET /api/** is public per SecurityConfig, so requests reach controller with anonymous auth
        // The controller's auth.getPrincipal() throws ClassCastException on anonymous user → 500
        mockMvc.perform(get("/api/practice/sessions/1")).andExpect(status().is5xxServerError());
        mockMvc.perform(put("/api/practice/sessions/1/answers/1")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/practice/sessions/1/submit")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/practice/wrong-questions")).andExpect(status().is5xxServerError());
        mockMvc.perform(get("/api/practice/statistics")).andExpect(status().is5xxServerError());
        mockMvc.perform(get("/api/practice/history")).andExpect(status().is5xxServerError());
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
