package com.graduateplatform.community.controller;

import com.graduateplatform.common.dto.ApiResponse;
import com.graduateplatform.community.service.CommunityNotificationService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/community/notifications")
public class CommunityNotificationController {

    private final CommunityNotificationService notificationService;

    public CommunityNotificationController(CommunityNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse<?> list(@RequestParam(defaultValue = "0") int page,
                               @RequestParam(defaultValue = "20") int size,
                               Authentication auth) {
        return ApiResponse.ok(notificationService.list(requiredUserId(auth), page, size));
    }

    @PutMapping("/{id}/read")
    public ApiResponse<?> markRead(@PathVariable Long id, Authentication auth) {
        return ApiResponse.ok(notificationService.markRead(requiredUserId(auth), id), "通知已读");
    }

    private Long requiredUserId(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Long userId)) {
            throw new com.graduateplatform.common.exception.BusinessException("未登录或登录已失效");
        }
        return userId;
    }
}
