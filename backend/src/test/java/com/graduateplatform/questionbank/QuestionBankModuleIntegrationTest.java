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

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
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

        // Verify soft-deleted: row retained but marked inactive (history-preserving)
        QuestionBank softDeleted = bankRepository.findById(bankId).orElseThrow();
        assertThat(softDeleted.getActive()).isFalse();
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

    // Bug #1: 题库 disable→enable 必须可逆——重新启用后题目应自动恢复练习候选，
    // 旧实现级联停用题目，启用题库时未回滚，导致 questionCount=0 且公共列表隐藏。
    @Test
    void disablingBankHidesQuestionsAndReEnablingRestoresThem() throws Exception {
        QuestionBank bank = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));
        questionRepository.save(Question.builder()
            .bank(bank).stem("Q1").optionsJson("[]").answer("A").chapter("第1章").questionType("single")
            .difficulty("easy").status("published").active(true).versionNo(1).build());

        // 题库启用时：公共列表可见，且至少一道候选
        mockMvc.perform(get("/api/question-banks?target=kaoyan"))
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].questionCount").value(1));

        // 停用题库
        mockMvc.perform(put("/api/admin/question-banks/" + bank.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("status", "inactive"))))
            .andExpect(status().isOk());

        // 公共列表不再返回该题库
        mockMvc.perform(get("/api/question-banks?target=kaoyan"))
            .andExpect(jsonPath("$.data.length()").value(0));

        // 重新启用题库
        mockMvc.perform(put("/api/admin/question-banks/" + bank.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("status", "active"))))
            .andExpect(status().isOk());

        // 题目自动恢复——无须逐题重新发布
        mockMvc.perform(get("/api/question-banks?target=kaoyan"))
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].questionCount").value(1));
    }

    // Bug #1 后置不变量：题库停用不应改写题目自身的 active；这样启用题库时无须级联恢复。
    @Test
    void togglingBankStatusDoesNotMutateQuestionActiveFlag() throws Exception {
        QuestionBank bank = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));
        Question q = questionRepository.save(Question.builder()
            .bank(bank).stem("Q1").optionsJson("[]").answer("A").chapter("第1章").questionType("single")
            .difficulty("easy").status("published").active(true).versionNo(1).build());

        mockMvc.perform(put("/api/admin/question-banks/" + bank.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("status", "inactive"))))
            .andExpect(status().isOk());

        Question reloaded = questionRepository.findById(q.getId()).orElseThrow();
        assertThat(reloaded.getActive()).isTrue();
        assertThat(reloaded.getStatus()).isEqualTo("published");
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

    // Bug 1: 前端编辑表单始终携带 year 键，留空时为 null；旧实现 ((Number) null).intValue() 抛 NPE → 500
    @Test
    void updateQuestionWithExplicitNullYearSucceeds() throws Exception {
        QuestionBank bank = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));
        Question q = questionRepository.save(Question.builder()
            .bank(bank).stem("Q").optionsJson("[]").answer("A").chapter("第1章").questionType("single")
            .difficulty("easy").year(2024).status("published").active(true).versionNo(1).build());

        Map<String, Object> body = new HashMap<>();
        body.put("stem", "Q-updated");
        body.put("year", null); // 显式 null（Map.of 不允许 null，故用 HashMap）

        mockMvc.perform(put("/api/admin/questions/" + q.getId())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(body)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.stem").value("Q-updated"));

        Question reloaded = questionRepository.findById(q.getId()).orElseThrow();
        assertThat(reloaded.getYear()).isNull();
    }

    // Bug 2: 主观题等无选项题目，optionsJson 留空旧实现存 null 违反 NOT NULL → 500；现回退为 "[]"
    @Test
    void createSubjectiveQuestionWithoutOptionsSucceeds() throws Exception {
        QuestionBank bank = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));

        String resp = mockMvc.perform(post("/api/admin/question-banks/" + bank.getId() + "/questions")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "stem", "简述市场经济的特征",
                    "answer", "见解析",
                    "optionsJson", "",
                    "questionType", "subjective",
                    "difficulty", "hard"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.questionType").value("subjective"))
            .andReturn().getResponse().getContentAsString();

        long qid = objectMapper.readTree(resp).path("data").path("id").asLong();
        Question saved = questionRepository.findById(qid).orElseThrow();
        assertThat(saved.getOptionsJson()).isEqualTo("[]");
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

    // ==================== File import (CSV) — Bug #6 ====================

    // 旧实现按 BufferedReader.readLine() + 手写 parseCsvLine 切字段，
    // 题干带换行或选项带 "" 转义时会切碎/字段错位。换 commons-csv 后必须能正确解析。
    @Test
    void csvImportHandlesMultiLineFieldsAndEscapedQuotes() throws Exception {
        QuestionBank bank = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));

        // 第 2 行的 stem 跨两行；第 3 行的 stem 含 "" 转义的双引号；选项里也带逗号。
        String csv = "stem,optionsJson,answer,chapter,questionType,difficulty\n"
            + "\"多行题干第一段\n第二段\",\"[\"\"A.对\"\",\"\"B.错\"\"]\",A,第1章,single,easy\n"
            + "\"含\"\"双引号\"\"的题干\",\"[\"\"A,有逗号\"\",\"\"B.无\"\"]\",A,第1章,single,easy\n";

        org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile(
            "file", "questions.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/admin/question-banks/" + bank.getId() + "/questions/import")
                .file(file)
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.created").value(2))
            .andExpect(jsonPath("$.data.failed").value(0));

        List<Question> saved = questionRepository.findByBankId(bank.getId());
        assertThat(saved).hasSize(2);
        assertThat(saved).anyMatch(q -> q.getStem().equals("多行题干第一段\n第二段"));
        assertThat(saved).anyMatch(q -> q.getStem().equals("含\"双引号\"的题干"));
    }

    // ==================== Batch update guards (Bug #4 + #5) ====================

    @Test
    void batchUpdateRejectsUnknownStatusValue() throws Exception {
        QuestionBank bank = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));
        Question q = questionRepository.save(Question.builder()
            .bank(bank).stem("Q").optionsJson("[]").answer("A").chapter("第1章").questionType("single")
            .difficulty("easy").status("published").active(true).versionNo(1).build());

        mockMvc.perform(put("/api/admin/questions/batch")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("ids", List.of(q.getId()), "updates", Map.of("status", "archived")))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("状态值无效，仅支持 published/disabled"));

        // 题目状态未被改写
        Question reloaded = questionRepository.findById(q.getId()).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo("published");
        assertThat(reloaded.getActive()).isTrue();
    }

    @Test
    void batchUpdateRejectsBlankDifficulty() throws Exception {
        QuestionBank bank = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));
        Question q = questionRepository.save(Question.builder()
            .bank(bank).stem("Q").optionsJson("[]").answer("A").chapter("第1章").questionType("single")
            .difficulty("middle").status("published").active(true).versionNo(1).build());

        Map<String, Object> updates = new HashMap<>();
        updates.put("difficulty", "");
        mockMvc.perform(put("/api/admin/questions/batch")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("ids", List.of(q.getId()), "updates", updates))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("批量更新 difficulty 不能为空"));

        // 难度未被静默清空
        assertThat(questionRepository.findById(q.getId()).orElseThrow().getDifficulty()).isEqualTo("middle");
    }

    @Test
    void batchUpdateAcceptsValidStatusAndUpdatesAllSelected() throws Exception {
        QuestionBank bank = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));
        Question q1 = questionRepository.save(Question.builder()
            .bank(bank).stem("Q1").optionsJson("[]").answer("A").chapter("第1章").questionType("single")
            .difficulty("easy").status("published").active(true).versionNo(1).build());
        Question q2 = questionRepository.save(Question.builder()
            .bank(bank).stem("Q2").optionsJson("[]").answer("A").chapter("第1章").questionType("single")
            .difficulty("easy").status("published").active(true).versionNo(1).build());

        mockMvc.perform(put("/api/admin/questions/batch")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("ids", List.of(q1.getId(), q2.getId()),
                                     "updates", Map.of("status", "disabled")))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.updated").value(2))
            .andExpect(jsonPath("$.data.failed").value(0));

        // 批量"停用"只翻转 status，不再连带翻转 active；active 仅由删除维护，
        // 这样"停用→启用"循环不会把已软删题目误复活，也与单条 toggleQuestionStatus 口径一致。
        Question r1 = questionRepository.findById(q1.getId()).orElseThrow();
        Question r2 = questionRepository.findById(q2.getId()).orElseThrow();
        assertThat(r1.getStatus()).isEqualTo("disabled");
        assertThat(r2.getStatus()).isEqualTo("disabled");
        assertThat(r1.getActive()).isTrue();
        assertThat(r2.getActive()).isTrue();
    }

    // Bug：管理员题目治理列表里软删（active=false）的题目仍然出现，
    // 导致点"删除"后题目"没消失"，看起来按钮无效。
    @Test
    void adminQuestionListExcludesSoftDeletedQuestions() throws Exception {
        QuestionBank bank = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));
        Question keep = questionRepository.save(Question.builder()
            .bank(bank).stem("保留题").optionsJson("[]").answer("A").chapter("第1章").questionType("single")
            .difficulty("easy").status("published").active(true).versionNo(1).build());
        Question toDelete = questionRepository.save(Question.builder()
            .bank(bank).stem("即将删除").optionsJson("[]").answer("A").chapter("第1章").questionType("single")
            .difficulty("easy").status("published").active(true).versionNo(1).build());

        // 删除前：两条都在
        mockMvc.perform(get("/api/admin/question-banks/" + bank.getId() + "/questions")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content.length()").value(2));

        mockMvc.perform(delete("/api/admin/questions/" + toDelete.getId())
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk());

        // 删除后：列表只剩保留题
        mockMvc.perform(get("/api/admin/question-banks/" + bank.getId() + "/questions")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content.length()").value(1))
            .andExpect(jsonPath("$.data.content[0].id").value(keep.getId()));

        // 实体仍然在库里（软删保留历史），只是 active=false
        Question reloaded = questionRepository.findById(toDelete.getId()).orElseThrow();
        assertThat(reloaded.getActive()).isFalse();
    }

    // Bug：单条"停用→启用"会把 active 翻回 true，已被删除的题目因此"复活"，
    // 现在单条状态切换只翻转 status，active 完全由 deleteQuestion 维护。
    @Test
    void toggleQuestionStatusDoesNotResurrectSoftDeletedQuestion() throws Exception {
        QuestionBank bank = bankRepository.save(bank("考研政治", "kaoyan", "政治", "middle"));
        Question q = questionRepository.save(Question.builder()
            .bank(bank).stem("Q").optionsJson("[]").answer("A").chapter("第1章").questionType("single")
            .difficulty("easy").status("published").active(true).versionNo(1).build());

        // 软删
        mockMvc.perform(delete("/api/admin/questions/" + q.getId())
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk());
        assertThat(questionRepository.findById(q.getId()).orElseThrow().getActive()).isFalse();

        // 再"启用"也不应让 active 复活——active 与 status 解耦
        mockMvc.perform(put("/api/admin/questions/" + q.getId() + "/status")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("status", "published"))))
            .andExpect(status().isOk());

        Question reloaded = questionRepository.findById(q.getId()).orElseThrow();
        assertThat(reloaded.getActive()).isFalse();
        assertThat(reloaded.getStatus()).isEqualTo("published");
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
