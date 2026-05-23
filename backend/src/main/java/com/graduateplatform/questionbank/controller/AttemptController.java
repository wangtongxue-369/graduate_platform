package com.graduateplatform.questionbank.controller;

import com.graduateplatform.common.dto.ApiResponse;
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
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(attemptService.getAttempts(userId));
    }
}
