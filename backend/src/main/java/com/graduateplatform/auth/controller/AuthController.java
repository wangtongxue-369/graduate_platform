package com.graduateplatform.auth.controller;

import com.graduateplatform.auth.dto.LoginRequest;
import com.graduateplatform.auth.dto.RegisterRequest;
import com.graduateplatform.auth.dto.ResetPasswordRequest;
import com.graduateplatform.auth.service.AuthService;
import com.graduateplatform.auth.service.VerificationCodeService;
import com.graduateplatform.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final VerificationCodeService codeService;

    public AuthController(AuthService authService, VerificationCodeService codeService) {
        this.authService = authService;
        this.codeService = codeService;
    }

    @PostMapping("/send-code")
    public ApiResponse<?> sendCode(@RequestBody Map<String, String> body) {
        String target = body.get("target");
        String type = body.get("type"); // phone / email / studentId
        if (target == null || target.isBlank() || type == null || type.isBlank()) {
            return ApiResponse.fail("Missing required parameters");
        }
        codeService.sendCode(target, type);
        return ApiResponse.ok(null, "Verification code sent, valid for 5 minutes");
    }

    @PostMapping("/register")
    public ApiResponse<?> register(@Valid @RequestBody RegisterRequest req) {
        String verifyTarget = resolveVerifyTarget(req);
        if (verifyTarget != null) {
            codeService.verifyAndConsume(verifyTarget, req.getAccountType(), req.getVerifyCode());
        }
        return ApiResponse.ok(authService.register(req), "Register success");
    }

    @PostMapping("/login")
    public ApiResponse<?> login(@Valid @RequestBody LoginRequest req) {
        return ApiResponse.ok(authService.login(req), "Login success");
    }

    @PostMapping("/reset-password")
    public ApiResponse<?> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ApiResponse.ok(null, "Password has been reset");
    }

    @GetMapping("/me")
    public ApiResponse<?> me(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(authService.getMe(userId));
    }

    @PostMapping("/logout")
    public ApiResponse<?> logout(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        authService.logout(userId);
        return ApiResponse.ok(null, "Logged out");
    }

    private String resolveVerifyTarget(RegisterRequest req) {
        String type = req.getAccountType();
        if ("phone".equals(type)) return req.getPhone();
        if ("email".equals(type)) return req.getEmail();
        if ("studentId".equals(type)) return req.getStudentId();
        return null;
    }
}
