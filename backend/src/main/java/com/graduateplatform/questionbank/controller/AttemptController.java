package com.graduateplatform.questionbank.controller;

import com.graduateplatform.common.dto.ApiResponse;
import com.graduateplatform.common.exception.UnauthorizedException;
import com.graduateplatform.questionbank.service.AttemptService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attempts")
public class AttemptController {

    private final AttemptService attemptService;

    public AttemptController(AttemptService attemptService) {
        this.attemptService = attemptService;
    }

    @GetMapping
    public ApiResponse<?> list(Authentication auth) {
        return ApiResponse.ok(attemptService.getAttempts(requiredUserId(auth)));
    }

    private Long requiredUserId(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Long userId)) {
            throw new UnauthorizedException("请先登录");
        }
        return userId;
    }
}
