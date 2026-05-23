package com.graduateplatform.admin.controller;

import com.graduateplatform.admin.service.AdminQuestionBankService;
import com.graduateplatform.common.dto.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/questions")
@PreAuthorize("hasRole('ADMIN')")
public class AdminQuestionController {

    private final AdminQuestionBankService service;

    public AdminQuestionController(AdminQuestionBankService service) {
        this.service = service;
    }

    @PutMapping("/{id}")
    public ApiResponse<?> updateQuestion(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(service.updateQuestion(id, body), "题目更新成功");
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> deleteQuestion(@PathVariable Long id) {
        service.deleteQuestion(id);
        return ApiResponse.ok(null, "题目删除成功");
    }

    @GetMapping("/{id}/snapshots")
    public ApiResponse<?> getSnapshots(@PathVariable Long id) {
        return ApiResponse.ok(service.getSnapshots(id));
    }
}
