package com.graduateplatform.admin.service;

import com.graduateplatform.questionbank.dto.BankResponse;
import com.graduateplatform.questionbank.dto.PagedResult;
import com.graduateplatform.questionbank.dto.QuestionResponse;
import com.graduateplatform.questionbank.dto.SnapshotResponse;
import com.graduateplatform.questionbank.service.QuestionBankService;
import com.graduateplatform.questionbank.service.QuestionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class AdminQuestionBankService {

    private final QuestionBankService questionBankService;
    private final QuestionService questionService;

    public AdminQuestionBankService(QuestionBankService questionBankService,
                                    QuestionService questionService) {
        this.questionBankService = questionBankService;
        this.questionService = questionService;
    }

    // ==================== 题库管理 ====================

    @Transactional(readOnly = true)
    public PagedResult<BankResponse> getBanks(int page, int size) {
        return questionBankService.getBanksPaged(page, size);
    }

    @Transactional
    public BankResponse createBank(Map<String, Object> body) {
        return questionBankService.createBank(
            str(body.get("name")),
            str(body.get("target")),
            str(body.get("subject")),
            str(body.get("difficulty")),
            str(body.get("description"))
        );
    }

    @Transactional
    public BankResponse updateBank(Long id, Map<String, Object> body) {
        return questionBankService.updateBank(
            id,
            str(body.get("name")),      // null = not provided, "" triggers validation
            str(body.get("target")),
            str(body.get("subject")),
            str(body.get("difficulty")),
            str(body.get("description"))
        );
    }

    @Transactional
    public void deleteBank(Long id) {
        questionBankService.deleteBank(id);
    }

    // ==================== 题目管理 ====================

    @Transactional(readOnly = true)
    public PagedResult<QuestionResponse> getQuestions(Long bankId, int page, int size) {
        return questionService.getQuestionsPaged(bankId, page, size);
    }

    @Transactional
    public QuestionResponse createQuestion(Long bankId, Map<String, Object> body) {
        return questionService.createQuestion(bankId, body);
    }

    @Transactional
    public QuestionResponse updateQuestion(Long id, Map<String, Object> body) {
        return questionService.updateQuestion(id, body);
    }

    @Transactional
    public void deleteQuestion(Long id) {
        questionService.deleteQuestion(id);
    }

    // ==================== 批量导入 ====================

    @Transactional
    public Map<String, Object> batchCreateQuestions(Long bankId, List<Map<String, Object>> questions) {
        return questionService.batchCreateQuestions(bankId, questions);
    }

    // ==================== 版本快照 ====================

    @Transactional(readOnly = true)
    public List<SnapshotResponse> getSnapshots(Long questionId) {
        return questionService.getSnapshots(questionId);
    }

    // ==================== 辅助 ====================

    private String str(Object value) {
        if (value == null) return null;
        return value.toString();
    }
}
