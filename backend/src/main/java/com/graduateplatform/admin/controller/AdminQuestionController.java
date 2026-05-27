package com.graduateplatform.admin.controller;

import com.graduateplatform.admin.service.AdminQuestionBankService;
import com.graduateplatform.common.dto.ApiResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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

    @PutMapping("/{id}/status")
    public ApiResponse<?> toggleQuestionStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String status = (String) body.get("status");
        if (status == null || (!"published".equals(status) && !"disabled".equals(status))) {
            return ApiResponse.fail("状态值无效，仅支持 published/disabled");
        }
        return ApiResponse.ok(service.toggleQuestionStatus(id, status),
            "published".equals(status) ? "题目已启用" : "题目已停用");
    }

    @GetMapping("/{id}/snapshots")
    public ApiResponse<?> getSnapshots(@PathVariable Long id) {
        return ApiResponse.ok(service.getSnapshots(id));
    }

    @PutMapping("/batch")
    public ApiResponse<?> batchUpdateQuestions(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Integer> rawIds = (List<Integer>) body.get("ids");
        if (rawIds == null || rawIds.isEmpty()) {
            return ApiResponse.fail("题目 ID 列表不能为空");
        }
        List<Long> ids = rawIds.stream().map(Long::valueOf).toList();

        @SuppressWarnings("unchecked")
        Map<String, Object> updates = (Map<String, Object>) body.get("updates");
        if (updates == null || updates.isEmpty()) {
            return ApiResponse.fail("更新字段不能为空");
        }

        return ApiResponse.ok(service.batchUpdateQuestions(ids, updates), "批量更新完成");
    }
}
