package com.graduateplatform.kaoyan.controller;

import com.graduateplatform.common.dto.ApiResponse;
import com.graduateplatform.common.exception.UnauthorizedException;
import com.graduateplatform.common.security.JwtTokenProvider;
import com.graduateplatform.kaoyan.entity.MentorProfile;
import com.graduateplatform.kaoyan.service.MentorService;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/kaoyan/mentors")
public class MentorController {

    private final MentorService mentorService;
    private final JwtTokenProvider jwtTokenProvider;

    public MentorController(MentorService mentorService, JwtTokenProvider jwtTokenProvider) {
        this.mentorService = mentorService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping
    public ApiResponse<MentorProfile> saveProfile(@RequestBody Map<String, Object> body, Authentication auth) {
        return ApiResponse.ok(mentorService.createOrUpdateProfile(requiredUserId(auth), body));
    }

    @GetMapping("/me")
    public ApiResponse<?> getMyProfile(Authentication auth) {
        Long userId = requiredUserId(auth);
        Object profile = mentorService.getMyProfile(userId);
        if (profile == null) {
            return ApiResponse.fail("暂无入驻信息");
        }
        return ApiResponse.ok(profile);
    }

    @GetMapping("/{id}")
    public ApiResponse<?> getMentorDetail(@PathVariable Long id) {
        return ApiResponse.ok(mentorService.getMentorDetail(id));
    }

    @GetMapping("/page")
    public ApiResponse<?> listMentorsPage(@RequestParam Map<String, String> filters) {
        return ApiResponse.ok(mentorService.listMentorsPage(filters));
    }

    @DeleteMapping("/me")
    public ApiResponse<?> deactivateProfile(Authentication auth) {
        mentorService.deactivateProfile(requiredUserId(auth));
        return ApiResponse.ok(null, "已注销入驻");
    }

    @PostMapping("/counseling/sessions")
    public ApiResponse<?> createSession(@RequestBody Map<String, Object> body, Authentication auth) {
        Long mentorId = Long.parseLong(String.valueOf(body.get("mentorId")));
        String subject = body.containsKey("subject") ? String.valueOf(body.get("subject")) : null;
        return ApiResponse.ok(mentorService.createSession(requiredUserId(auth), mentorId, subject));
    }

    @GetMapping("/counseling/sessions/sent")
    public ApiResponse<?> listSentSessions(@RequestParam Map<String, String> filters, Authentication auth) {
        return ApiResponse.ok(mentorService.listSentSessions(requiredUserId(auth), filters));
    }

    @GetMapping("/counseling/sessions/received")
    public ApiResponse<?> listReceivedSessions(@RequestParam Map<String, String> filters, Authentication auth) {
        return ApiResponse.ok(mentorService.listReceivedSessions(requiredUserId(auth), filters));
    }

    @GetMapping("/counseling/sessions/{id}/messages")
    public ApiResponse<?> getSessionMessages(@PathVariable Long id, Authentication auth) {
        return ApiResponse.ok(mentorService.getSessionMessages(id, requiredUserId(auth)));
    }

    @PostMapping("/counseling/sessions/{id}/messages")
    public ApiResponse<?> sendMessage(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        return ApiResponse.ok(mentorService.sendMessage(id, requiredUserId(auth), String.valueOf(body.get("content"))));
    }

    @PutMapping("/counseling/sessions/{id}/messages/read")
    public ApiResponse<?> markAsRead(@PathVariable Long id, Authentication auth) {
        mentorService.markMessagesAsRead(id, requiredUserId(auth));
        return ApiResponse.ok(null);
    }

    @GetMapping("/counseling/unread-count")
    public ApiResponse<?> getUnreadCount(Authentication auth) {
        return ApiResponse.ok(Map.of("count", mentorService.getUnreadCount(requiredUserId(auth))));
    }

    @GetMapping(value = "/counseling/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter counselingStream(@RequestParam String token) {
        if (!jwtTokenProvider.validateToken(token)) {
            throw new UnauthorizedException("登录状态已失效，请重新登录");
        }
        return mentorService.subscribeCounseling(jwtTokenProvider.getUserId(token));
    }

    private Long requiredUserId(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            throw new UnauthorizedException("用户未登录");
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof Long userId) {
            return userId;
        }
        try {
            return Long.parseLong(principal.toString());
        } catch (NumberFormatException e) {
            throw new UnauthorizedException("用户标识无效");
        }
    }
}
