package com.graduateplatform.questionbank;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.common.security.JwtTokenProvider;
import com.graduateplatform.questionbank.entity.Question;
import com.graduateplatform.questionbank.entity.QuestionBank;
import com.graduateplatform.questionbank.repository.QuestionBankRepository;
import com.graduateplatform.questionbank.repository.QuestionRepository;
import com.graduateplatform.questionbank.repository.QuestionSnapshotRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class QuestionBankModuleIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtTokenProvider tokenProvider;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired UserRepository userRepository;
    @Autowired QuestionBankRepository bankRepository;
    @Autowired QuestionRepository questionRepository;
    @Autowired QuestionSnapshotRepository snapshotRepository;

    private User admin;
    private User normalUser;
    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() {
        snapshotRepository.deleteAll();
        questionRepository.deleteAll();
        bankRepository.deleteAll();
        userRepository.deleteAll();

        String suffix = String.valueOf(System.nanoTime());
        admin = userRepository.save(User.builder()
            .name("Admin").email("admin-qb" + suffix + "@test.local")
            .password(passwordEncoder.encode("pw")).target("kaoyan").role("admin").status("normal").build());
        normalUser = userRepository.save(User.builder()
            .name("Normal").email("user-qb" + suffix + "@test.local")
            .password(passwordEncoder.encode("pw")).target("kaoyan").role("user").status("normal").build());
        adminToken = tokenProvider.generateToken(admin.getId(), "admin");
        userToken = tokenProvider.generateToken(normalUser.getId(), "user");
    }

    // ==================== Public API ====================

    @Test
    void publicBankListAndOptionsAreOpen() throws Exception {
        QuestionBank b1 = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));
        QuestionBank b2 = bankRepository.save(bank("考研英语", "kaoyan", "英语", "hard"));
        QuestionBank b3 = bankRepository.save(bank("公务员行测", "kaogong", "行测", "easy"));
        // Each bank needs at least one question to appear in listing
        for (QuestionBank b : List.of(b1, b2, b3)) {
            questionRepository.save(Question.builder()
                .bank(b).stem("题").optionsJson("[]").answer("A").chapter("第1章").questionType("single")
                .difficulty("easy").status("published").active(true).versionNo(1).build());
        }

        mockMvc.perform(get("/api/question-banks"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(3));

        mockMvc.perform(get("/api/question-banks?target=kaoyan"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(2));

        mockMvc.perform(get("/api/question-banks/options"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.targets.length()").value(2))
            .andExpect(jsonPath("$.data.subjects.length()").value(3))
            .andExpect(jsonPath("$.data.difficulties.length()").value(3));
    }

    @Test
    void publicBankListRespectsAllFilters() throws Exception {
        QuestionBank bank = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));
        questionRepository.save(Question.builder()
            .bank(bank).stem("题").optionsJson("[]").answer("A").chapter("第1章").questionType("single")
            .difficulty("middle").status("published").active(true).versionNo(1).build());

        mockMvc.perform(get("/api/question-banks?target=kaoyan&subject=政治&difficulty=middle"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].name").value("考研政治"));

        mockMvc.perform(get("/api/question-banks?target=kaogong"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void bankQuestionCountReflectsActivePublishedQuestionsOnly() throws Exception {
        QuestionBank bank = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));

        // Active published question
        questionRepository.save(Question.builder()
            .bank(bank).stem("Q1").answer("A").chapter("第1章").questionType("single")
            .optionsJson("[]").difficulty("easy").status("published").active(true).versionNo(1).build());
        // Inactive question (should not count)
        questionRepository.save(Question.builder()
            .bank(bank).stem("Q2").answer("B").chapter("第1章").questionType("single")
            .optionsJson("[]").difficulty("easy").status("disabled").active(false).versionNo(1).build());

        mockMvc.perform(get("/api/question-banks?target=kaoyan"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].questionCount").value(1));
    }

    // ==================== Admin Authorization ====================

    @Test
    void adminEndpointsRejectAnonymousAndNonAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/question-banks"))
            .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/question-banks").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/question-banks").header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    // ==================== Admin Bank CRUD ====================

    @Test
    void adminCreatesUpdatesAndDeletesBank() throws Exception {
        // Create
        String createResp = mockMvc.perform(post("/api/admin/question-banks")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "name", "新题库", "target", "kaoyan", "subject", "数学", "difficulty", "hard"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").value("新题库"))
            .andReturn().getResponse().getContentAsString();
        long bankId = objectMapper.readTree(createResp).path("data").path("id").asLong();

        // Update
        mockMvc.perform(put("/api/admin/question-banks/" + bankId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("name", "更新后的题库", "difficulty", "easy"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("更新后的题库"))
            .andExpect(jsonPath("$.data.difficulty").value("easy"));

        // Delete
        mockMvc.perform(delete("/api/admin/question-banks/" + bankId)
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));

        // Verify deleted
        assertThat(bankRepository.findById(bankId)).isEmpty();
    }

    @Test
    void adminCreateBankRequiresName() throws Exception {
        mockMvc.perform(post("/api/admin/question-banks")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("target", "kaoyan"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("题库名称不能为空"));
    }

    @Test
    void adminDeleteNonExistentBankReturnsError() throws Exception {
        mockMvc.perform(delete("/api/admin/question-banks/99999")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));
    }

    // ==================== Admin Question CRUD ====================

    @Test
    void adminCreatesUpdatesAndDeletesQuestion() throws Exception {
        QuestionBank bank = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));
        long bankId = bank.getId();

        // Create question
        String createQ = mockMvc.perform(post("/api/admin/question-banks/" + bankId + "/questions")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "stem", "1+1=?",
                    "optionsJson", "[\"A.1\",\"B.2\",\"C.3\",\"D.4\"]",
                    "answer", "B",
                    "chapter", "第1章",
                    "questionType", "single",
                    "difficulty", "easy"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.stem").value("1+1=?"))
            .andExpect(jsonPath("$.data.versionNo").value(1))
            .andReturn().getResponse().getContentAsString();
        long questionId = objectMapper.readTree(createQ).path("data").path("id").asLong();

        // Update question
        mockMvc.perform(put("/api/admin/questions/" + questionId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("stem", "1+2=?", "answer", "C"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.stem").value("1+2=?"))
            .andExpect(jsonPath("$.data.versionNo").value(2));

        // Get snapshots (should have one from before the update)
        mockMvc.perform(get("/api/admin/questions/" + questionId + "/snapshots")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].stem").value("1+1=?"));

        // Delete question
        mockMvc.perform(delete("/api/admin/questions/" + questionId)
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));

        // Verify soft-deleted
        Question deleted = questionRepository.findById(questionId).orElseThrow();
        assertThat(deleted.getActive()).isFalse();
        assertThat(deleted.getStatus()).isEqualTo("disabled");
    }

    @Test
    void adminCreateQuestionValidatesRequiredFields() throws Exception {
        QuestionBank bank = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));

        mockMvc.perform(post("/api/admin/question-banks/" + bank.getId() + "/questions")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("stem", ""))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(post("/api/admin/question-banks/99999/questions")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("stem", "Q", "answer", "A"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));
    }

    // ==================== Batch Import ====================

    @Test
    void batchImportCreatesMultipleQuestionsWithPartialFailure() throws Exception {
        QuestionBank bank = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));
        long bankId = bank.getId();

        List<Map<String, Object>> questions = List.of(
            Map.of("stem", "正确题1", "answer", "A", "optionsJson", "[]", "chapter", "第1章", "questionType", "single", "difficulty", "easy"),
            Map.of("stem", "正确题2", "answer", "B", "optionsJson", "[]", "chapter", "第1章", "questionType", "single", "difficulty", "easy"),
            Map.of("stem", "", "answer", "C", "optionsJson", "[]", "chapter", "第1章", "questionType", "single", "difficulty", "easy"),
            Map.of("answer", "D", "optionsJson", "[]", "chapter", "第1章") // missing stem
        );

        String resp = mockMvc.perform(post("/api/admin/question-banks/" + bankId + "/questions/batch")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("questions", questions))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.created").value(2))
            .andExpect(jsonPath("$.data.failed").value(2))
            .andExpect(jsonPath("$.data.total").value(4))
            .andReturn().getResponse().getContentAsString();

        JsonNode errors = objectMapper.readTree(resp).path("data").path("errors");
        assertThat(errors).hasSize(2);
    }

    @Test
    void batchImportRejectsEmptyArray() throws Exception {
        QuestionBank bank = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));

        mockMvc.perform(post("/api/admin/question-banks/" + bank.getId() + "/questions/batch")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("questions", List.of()))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("questions 数组不能为空"));
    }

    // ==================== Version Snapshots ====================

    @Test
    void multipleUpdatesCreateSnapshotHistory() throws Exception {
        QuestionBank bank = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));

        String createQ = mockMvc.perform(post("/api/admin/question-banks/" + bank.getId() + "/questions")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("stem", "v1", "answer", "A", "optionsJson", "[]", "chapter", "第1章", "questionType", "single", "difficulty", "easy"))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();
        long qid = objectMapper.readTree(createQ).path("data").path("id").asLong();

        // Update twice
        mockMvc.perform(put("/api/admin/questions/" + qid)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("stem", "v2")))).andExpect(status().isOk());

        mockMvc.perform(put("/api/admin/questions/" + qid)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("stem", "v3")))).andExpect(status().isOk());

        // Verify snapshots: 2 snapshots (v1, v2), current is v3
        mockMvc.perform(get("/api/admin/questions/" + qid + "/snapshots")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(2))
            .andExpect(jsonPath("$.data[0].stem").value("v2")) // most recent snapshot first
            .andExpect(jsonPath("$.data[1].stem").value("v1"));
    }

    // ==================== Question listing under bank ====================

    @Test
    void adminQuestionListIsPaginated() throws Exception {
        QuestionBank bank = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));
        for (int i = 0; i < 5; i++) {
            questionRepository.save(Question.builder()
                .bank(bank).stem("Q" + i).answer("A").optionsJson("[]").chapter("第1章").questionType("single")
                .difficulty("easy").status("published").active(true).versionNo(1).build());
        }

        mockMvc.perform(get("/api/admin/question-banks/" + bank.getId() + "/questions?page=0&size=3")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content.length()").value(3))
            .andExpect(jsonPath("$.data.totalElements").value(5))
            .andExpect(jsonPath("$.data.totalPages").value(2));
    }

    private QuestionBank bank(String name, String target, String subject, String difficulty) {
        return QuestionBank.builder()
            .name(name).target(target).subject(subject).difficulty(difficulty)
            .build();
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
