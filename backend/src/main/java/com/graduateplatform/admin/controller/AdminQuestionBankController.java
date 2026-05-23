package com.graduateplatform.admin.controller;

import com.graduateplatform.admin.service.AdminQuestionBankService;
import com.graduateplatform.common.dto.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/question-banks")
@PreAuthorize("hasRole('ADMIN')")
public class AdminQuestionBankController {

    private final AdminQuestionBankService service;

    public AdminQuestionBankController(AdminQuestionBankService service) {
        this.service = service;
    }

    // ==================== 题库 ====================

    @GetMapping
    public ApiResponse<?> getBanks(@RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(service.getBanks(page, size));
    }

    @PostMapping
    public ApiResponse<?> createBank(@RequestBody Map<String, Object> body) {
        return ApiResponse.ok(service.createBank(body), "题库创建成功");
    }

    @PutMapping("/{id}")
    public ApiResponse<?> updateBank(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(service.updateBank(id, body), "题库更新成功");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> deleteBank(@PathVariable Long id) {
        service.deleteBank(id);
        return ApiResponse.ok(null, "题库删除成功");
    }

    // ==================== 题目 ====================

    @GetMapping("/{bankId}/questions")
    public ApiResponse<?> getQuestions(@PathVariable Long bankId,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(service.getQuestions(bankId, page, size));
    }

    @PostMapping("/{bankId}/questions")
    public ApiResponse<?> createQuestion(@PathVariable Long bankId, @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(service.createQuestion(bankId, body), "题目创建成功");
    }

    @PostMapping("/{bankId}/questions/batch")
    public ApiResponse<?> batchCreateQuestions(@PathVariable Long bankId, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> questions = (List<Map<String, Object>>) body.get("questions");
        if (questions == null || questions.isEmpty()) {
            return ApiResponse.fail("questions 数组不能为空");
        }
        return ApiResponse.ok(service.batchCreateQuestions(bankId, questions), "批量导入完成");
    }
}
