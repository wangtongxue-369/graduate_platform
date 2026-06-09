package com.graduateplatform.questionbank.controller;

import com.graduateplatform.common.dto.ApiResponse;
import com.graduateplatform.common.exception.UnauthorizedException;
import com.graduateplatform.questionbank.dto.SubmitAttemptRequest;
import com.graduateplatform.questionbank.service.AttemptService;
import com.graduateplatform.questionbank.service.QuestionService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class QuestionController {

    private final QuestionService questionService;
    private final AttemptService attemptService;

    public QuestionController(QuestionService questionService, AttemptService attemptService) {
        this.questionService = questionService;
        this.attemptService = attemptService;
    }

    @GetMapping("/question-banks/{bankId}/questions")
    public ApiResponse<?> listQuestions(@PathVariable Long bankId) {
        return ApiResponse.ok(questionService.getQuestions(bankId));
    }

    @PostMapping("/questions/{id}/attempt")
    public ApiResponse<?> submitAttempt(@PathVariable Long id,
                                        @Valid @RequestBody SubmitAttemptRequest req,
                                        Authentication auth) {
        return ApiResponse.ok(attemptService.submit(id, requiredUserId(auth), req), "答题记录已保存");
    }

    private Long requiredUserId(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Long userId)) {
            throw new UnauthorizedException("请先登录");
        }
        return userId;
    }
}
