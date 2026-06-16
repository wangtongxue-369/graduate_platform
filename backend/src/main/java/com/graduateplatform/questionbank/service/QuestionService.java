package com.graduateplatform.questionbank.service;

import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.questionbank.dto.PagedResult;
import com.graduateplatform.questionbank.dto.QuestionResponse;
import com.graduateplatform.questionbank.dto.SnapshotResponse;
import com.graduateplatform.questionbank.entity.Question;
import com.graduateplatform.questionbank.entity.QuestionBank;
import com.graduateplatform.questionbank.entity.QuestionSnapshot;
import com.graduateplatform.questionbank.repository.QuestionBankRepository;
import com.graduateplatform.questionbank.repository.QuestionRepository;
import com.graduateplatform.questionbank.repository.QuestionSnapshotRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class QuestionService {

    // 与单条 /status 接口、批量更新接口共用的字段白名单，避免下次新加入口又漏校验。
    private static final java.util.Set<String> ALLOWED_STATUSES = java.util.Set.of("published", "disabled");
    private static final java.util.Set<String> ALLOWED_DIFFICULTIES = java.util.Set.of("easy", "middle", "hard");

    private final QuestionRepository questionRepository;
    private final QuestionBankRepository bankRepository;
    private final QuestionSnapshotRepository snapshotRepository;

    public QuestionService(QuestionRepository questionRepository,
                           QuestionBankRepository bankRepository,
                           QuestionSnapshotRepository snapshotRepository) {
        this.questionRepository = questionRepository;
        this.bankRepository = bankRepository;
        this.snapshotRepository = snapshotRepository;
    }

    // ==================== 公共接口 ====================

    @Transactional(readOnly = true)
    public List<QuestionResponse> getQuestions(Long bankId) {
        bankRepository.findById(bankId)
            .orElseThrow(() -> new BusinessException("题库不存在"));
        // 软删除（active=false）的题目不返回给公共预览接口，
        // 否则管理员删掉的题目仍对学生可见，与管理员列表口径一致。
        return questionRepository.findByBankIdAndActiveTrue(bankId).stream()
            .map(QuestionResponse::from)
            .toList();
    }

    // ==================== 管理端接口 ====================

    @Transactional(readOnly = true)
    public PagedResult<QuestionResponse> getQuestionsPaged(Long bankId, int page, int size) {
        if (!bankRepository.existsById(bankId)) {
            throw new BusinessException("题库不存在");
        }

        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "id"));
        // 软删除（active=false）的题目不再回到管理员治理列表，否则"删除"按钮看起来无效。
        Page<Question> questionPage = questionRepository.findByBankIdAndActiveTrue(bankId, pageable);

        List<QuestionResponse> content = questionPage.getContent().stream()
            .map(QuestionResponse::from)
            .toList();

        return new PagedResult<>(content, questionPage.getTotalPages(), questionPage.getTotalElements());
    }

    @Transactional
    @CacheEvict(value = "questionBank:options", allEntries = true)
    public QuestionResponse createQuestion(Long bankId, Map<String, Object> body) {
        QuestionBank bank = bankRepository.findById(bankId)
            .orElseThrow(() -> new BusinessException("题库不存在"));

        String stem = (String) body.get("stem");
        if (stem == null || stem.isBlank()) {
            throw new BusinessException("题干不能为空");
        }
        String answer = (String) body.get("answer");
        if (answer == null || answer.isBlank()) {
            throw new BusinessException("答案不能为空");
        }

        Question question = Question.builder()
            .bank(bank)
            .stem(stem.trim())
            .optionsJson(optionsOrDefault(body.get("optionsJson")))
            .answer(answer.trim())
            .analysis(nullable(body.get("analysis")))
            .chapter(nullable(body.get("chapter")))
            .questionType(nullable(body.get("questionType")))
            .knowledgePoint(nullable(body.get("knowledgePoint")))
            .difficulty(nullable(body.get("difficulty")))
            .year(toInteger(body.get("year")))
            .status("published")
            .active(true)
            .versionNo(1)
            .build();

        question = questionRepository.save(question);
        return QuestionResponse.from(question);
    }

    @Transactional
    @CacheEvict(value = "questionBank:options", allEntries = true)
    public QuestionResponse updateQuestion(Long id, Map<String, Object> body) {
        Question question = questionRepository.findById(id)
            .orElseThrow(() -> new BusinessException("题目不存在"));

        // Save snapshot of current state before modifying
        saveSnapshot(question);

        if (body.containsKey("stem")) {
            String stem = (String) body.get("stem");
            if (stem == null || stem.isBlank()) {
                throw new BusinessException("题干不能为空");
            }
            question.setStem(stem.trim());
        }
        if (body.containsKey("optionsJson")) question.setOptionsJson(optionsOrDefault(body.get("optionsJson")));
        if (body.containsKey("answer")) {
            String answer = (String) body.get("answer");
            if (answer == null || answer.isBlank()) {
                throw new BusinessException("答案不能为空");
            }
            question.setAnswer(answer.trim());
        }
        if (body.containsKey("analysis")) question.setAnalysis(nullable(body.get("analysis")));
        if (body.containsKey("chapter")) question.setChapter(nullable(body.get("chapter")));
        if (body.containsKey("questionType")) question.setQuestionType(nullable(body.get("questionType")));
        if (body.containsKey("knowledgePoint")) question.setKnowledgePoint(nullable(body.get("knowledgePoint")));
        if (body.containsKey("difficulty")) question.setDifficulty(nullable(body.get("difficulty")));
        if (body.containsKey("year")) question.setYear(toInteger(body.get("year")));
        if (body.containsKey("status")) question.setStatus(nullable(body.get("status")));

        // Bump version number
        question.setVersionNo(question.getVersionNo() == null ? 1 : question.getVersionNo() + 1);

        questionRepository.save(question);
        return QuestionResponse.from(question);
    }

    @Transactional
    @CacheEvict(value = "questionBank:options", allEntries = true)
    public void deleteQuestion(Long id) {
        Question question = questionRepository.findById(id)
            .orElseThrow(() -> new BusinessException("题目不存在"));
        question.setActive(false);
        question.setStatus("disabled");
        questionRepository.save(question);
    }

    @Transactional
    @CacheEvict(value = "questionBank:options", allEntries = true)
    public QuestionResponse toggleQuestionStatus(Long id, String status) {
        if (!ALLOWED_STATUSES.contains(status)) {
            throw new BusinessException("状态值无效，仅支持 published/disabled");
        }
        Question question = questionRepository.findById(id)
            .orElseThrow(() -> new BusinessException("题目不存在"));

        // "停用"只翻转 status，不再连带翻转 active；
        // active=false 专门表示"已软删除"，由 deleteQuestion 维护，避免两个动作语义混叠：
        // 旧实现里 disable→enable 会把 active 还原为 true，已被软删的题目也会因此"复活"。
        question.setStatus(status);
        questionRepository.save(question);
        return QuestionResponse.from(question);
    }

    @Transactional
    @CacheEvict(value = "questionBank:options", allEntries = true)
    public Map<String, Object> batchCreateQuestions(Long bankId, List<Map<String, Object>> questions) {
        QuestionBank bank = bankRepository.findById(bankId)
            .orElseThrow(() -> new BusinessException("题库不存在"));

        int created = 0;
        List<Map<String, String>> errors = new ArrayList<>();

        for (int i = 0; i < questions.size(); i++) {
            Map<String, Object> body = questions.get(i);
            try {
                String stem = (String) body.get("stem");
                String answer = (String) body.get("answer");
                if (stem == null || stem.isBlank()) {
                    throw new BusinessException("题干不能为空");
                }
                if (answer == null || answer.isBlank()) {
                    throw new BusinessException("答案不能为空");
                }

                Question question = Question.builder()
                    .bank(bank)
                    .stem(stem.trim())
                    .optionsJson(optionsOrDefault(body.get("optionsJson")))
                    .answer(answer.trim())
                    .analysis(nullable(body.get("analysis")))
                    .chapter(nullable(body.get("chapter")))
                    .questionType(nullable(body.get("questionType")))
                    .knowledgePoint(nullable(body.get("knowledgePoint")))
                    .difficulty(nullable(body.get("difficulty")))
                    .year(toInteger(body.get("year")))
                    .status("published")
                    .active(true)
                    .versionNo(1)
                    .build();

                questionRepository.save(question);
                created++;
            } catch (Exception e) {
                Map<String, String> err = new LinkedHashMap<>();
                err.put("index", String.valueOf(i));
                err.put("stem", body != null ? truncate((String) body.get("stem"), 50) : "?");
                err.put("error", e.getMessage());
                errors.add(err);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("created", created);
        result.put("failed", errors.size());
        result.put("total", questions.size());
        result.put("errors", errors);
        return result;
    }

    // ==================== 批量操作 ====================

    @Transactional
    @CacheEvict(value = "questionBank:options", allEntries = true)
    public Map<String, Object> batchUpdateQuestions(List<Long> ids, Map<String, Object> updates) {
        // 整批前校验 updates，避免每条题目重复抛同样错误填满 errors，
        // 也防止"留空 = 静默清空"的危险行为（前端选了字段但忘选值时）。
        String validatedStatus = null;
        if (updates.containsKey("status")) {
            String status = updates.get("status") == null ? null : updates.get("status").toString();
            if (status == null || status.isBlank()) {
                throw new BusinessException("批量更新 status 不能为空");
            }
            if (!ALLOWED_STATUSES.contains(status)) {
                throw new BusinessException("状态值无效，仅支持 published/disabled");
            }
            validatedStatus = status;
        }
        String validatedDifficulty = null;
        if (updates.containsKey("difficulty")) {
            String diff = updates.get("difficulty") == null ? null : updates.get("difficulty").toString();
            if (diff == null || diff.isBlank()) {
                throw new BusinessException("批量更新 difficulty 不能为空");
            }
            if (!ALLOWED_DIFFICULTIES.contains(diff)) {
                throw new BusinessException("难度值无效，仅支持 easy/middle/hard");
            }
            validatedDifficulty = diff;
        }
        String validatedChapter = null;
        if (updates.containsKey("chapter")) {
            String chapter = updates.get("chapter") == null ? null : updates.get("chapter").toString().trim();
            if (chapter == null || chapter.isEmpty()) {
                throw new BusinessException("批量更新 chapter 不能为空");
            }
            validatedChapter = chapter;
        }
        QuestionBank validatedBank = null;
        if (updates.containsKey("bankId")) {
            Object raw = updates.get("bankId");
            if (!(raw instanceof Number bankIdNum)) {
                throw new BusinessException("bankId 必须为数字");
            }
            validatedBank = bankRepository.findById(bankIdNum.longValue())
                .orElseThrow(() -> new BusinessException("目标题库不存在: id=" + bankIdNum.longValue()));
        }

        int updated = 0;
        List<Map<String, String>> errors = new ArrayList<>();

        for (int i = 0; i < ids.size(); i++) {
            Long id = ids.get(i);
            try {
                Question question = questionRepository.findById(id)
                    .orElseThrow(() -> new BusinessException("题目不存在: id=" + id));

                // Save snapshot before batch update
                saveSnapshot(question);

                if (validatedStatus != null) {
                    // 与单条 toggleQuestionStatus 保持一致：status 与 active 解耦，
                    // 避免批量"启用"把软删题目误复活。
                    question.setStatus(validatedStatus);
                }
                if (validatedChapter != null) {
                    question.setChapter(validatedChapter);
                }
                if (validatedDifficulty != null) {
                    question.setDifficulty(validatedDifficulty);
                }
                if (validatedBank != null) {
                    question.setBank(validatedBank);
                }

                question.setVersionNo(question.getVersionNo() == null ? 1 : question.getVersionNo() + 1);
                questionRepository.save(question);
                updated++;
            } catch (Exception e) {
                Map<String, String> err = new LinkedHashMap<>();
                err.put("id", String.valueOf(id));
                err.put("error", e.getMessage());
                errors.add(err);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("updated", updated);
        result.put("failed", errors.size());
        result.put("total", ids.size());
        result.put("errors", errors);
        return result;
    }

    // ==================== 版本快照 ====================

    @Transactional(readOnly = true)
    public List<SnapshotResponse> getSnapshots(Long questionId) {
        return snapshotRepository.findByQuestionIdOrderByVersionNoDesc(questionId)
            .stream()
            .map(SnapshotResponse::from)
            .toList();
    }

    void saveSnapshot(Question q) {
        QuestionSnapshot snapshot = QuestionSnapshot.builder()
            .questionId(q.getId())
            .bankId(q.getBank() != null ? q.getBank().getId() : null)
            .stem(q.getStem())
            .optionsJson(q.getOptionsJson())
            .answer(q.getAnswer())
            .analysis(q.getAnalysis())
            .chapter(q.getChapter())
            .questionType(q.getQuestionType())
            .knowledgePoint(q.getKnowledgePoint())
            .difficulty(q.getDifficulty())
            .year(q.getYear())
            .versionNo(q.getVersionNo() == null ? 1 : q.getVersionNo())
            .build();
        snapshotRepository.save(snapshot);
    }

    // ==================== 辅助 ====================

    private String nullable(Object value) {
        if (value == null || (value instanceof String s && s.isBlank())) {
            return null;
        }
        return value.toString().trim();
    }

    /** 选项为空时回退为空 JSON 数组，避免主观题等无选项题目违反 NOT NULL 约束。 */
    private String optionsOrDefault(Object value) {
        String options = nullable(value);
        return options == null ? "[]" : options;
    }

    /** 年份可空：缺省或显式 null 都返回 null，避免对 null 调用 intValue() 抛 NPE。 */
    private Integer toInteger(Object value) {
        return value instanceof Number n ? n.intValue() : null;
    }

    private String truncate(String s, int max) {
        return s != null && s.length() > max ? s.substring(0, max) + "..." : s;
    }
}
