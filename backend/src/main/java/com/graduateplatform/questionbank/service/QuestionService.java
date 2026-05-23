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
        return questionRepository.findByBankId(bankId).stream()
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
        Page<Question> questionPage = questionRepository.findByBankId(bankId, pageable);

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
            .optionsJson(nullable(body.get("optionsJson")))
            .answer(answer.trim())
            .analysis(nullable(body.get("analysis")))
            .chapter(nullable(body.get("chapter")))
            .questionType(nullable(body.get("questionType")))
            .knowledgePoint(nullable(body.get("knowledgePoint")))
            .difficulty(nullable(body.get("difficulty")))
            .year(body.get("year") != null ? ((Number) body.get("year")).intValue() : null)
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
        if (body.containsKey("optionsJson")) question.setOptionsJson(nullable(body.get("optionsJson")));
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
        if (body.containsKey("year")) question.setYear(((Number) body.get("year")).intValue());
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
                    .optionsJson(nullable(body.get("optionsJson")))
                    .answer(answer.trim())
                    .analysis(nullable(body.get("analysis")))
                    .chapter(nullable(body.get("chapter")))
                    .questionType(nullable(body.get("questionType")))
                    .knowledgePoint(nullable(body.get("knowledgePoint")))
                    .difficulty(nullable(body.get("difficulty")))
                    .year(body.get("year") != null ? ((Number) body.get("year")).intValue() : null)
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

    private String truncate(String s, int max) {
        return s != null && s.length() > max ? s.substring(0, max) + "..." : s;
    }
}
