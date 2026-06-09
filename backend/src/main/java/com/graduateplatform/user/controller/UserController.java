package com.graduateplatform.user.controller;

import com.graduateplatform.common.dto.ApiResponse;
import com.graduateplatform.common.exception.UnauthorizedException;
import com.graduateplatform.user.dto.UpdateMyPostRequest;
import com.graduateplatform.user.dto.UpdateProfileRequest;
import com.graduateplatform.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me/profile")
    public ApiResponse<?> profile(Authentication auth) {
        return ApiResponse.ok(userService.getProfile(requiredUserId(auth)));
    }

    @GetMapping("/me/dashboard")
    public ApiResponse<?> dashboard(Authentication auth) {
        return ApiResponse.ok(userService.getDashboard(requiredUserId(auth)));
    }

    @PutMapping("/me/profile")
    public ApiResponse<?> updateProfile(@Valid @RequestBody UpdateProfileRequest req, Authentication auth) {
        return ApiResponse.ok(userService.updateProfile(requiredUserId(auth), req), "资料已更新");
    }

    @GetMapping("/me/posts")
    public ApiResponse<?> myPosts(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        Authentication auth
    ) {
        return ApiResponse.ok(userService.getMyPosts(requiredUserId(auth), page, size));
    }

    @GetMapping("/me/posts/{postId}")
    public ApiResponse<?> myPostDetail(@PathVariable Long postId, Authentication auth) {
        return ApiResponse.ok(userService.getMyPost(requiredUserId(auth), postId));
    }

    @GetMapping("/me/comments")
    public ApiResponse<?> myComments(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        Authentication auth
    ) {
        return ApiResponse.ok(userService.getMyComments(requiredUserId(auth), page, size));
    }

    @GetMapping("/me/attempts")
    public ApiResponse<?> myAttempts(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) Boolean correct,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String dateFrom,
        @RequestParam(required = false) String dateTo,
        Authentication auth
    ) {
        return ApiResponse.ok(userService.getMyAttempts(
            requiredUserId(auth), page, size, correct, keyword, dateFrom, dateTo
        ));
    }

    @PutMapping("/me/posts/{postId}")
    public ApiResponse<?> updateMyPost(@PathVariable Long postId,
                                       @Valid @RequestBody UpdateMyPostRequest req,
                                       Authentication auth) {
        return ApiResponse.ok(userService.updateMyPost(requiredUserId(auth), postId, req), "帖子已更新");
    }

    @DeleteMapping("/me/posts/{postId}")
    public ApiResponse<?> deleteMyPost(@PathVariable Long postId, Authentication auth) {
        userService.deleteMyPost(requiredUserId(auth), postId);
        return ApiResponse.ok(null, "帖子已删除");
    }

    @DeleteMapping("/me/comments/{commentId}")
    public ApiResponse<?> deleteMyComment(@PathVariable Long commentId, Authentication auth) {
        userService.deleteMyComment(requiredUserId(auth), commentId);
        return ApiResponse.ok(null, "评论已删除");
    }

    private Long requiredUserId(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Long userId)) {
            throw new UnauthorizedException("请先登录");
        }
        return userId;
    }
}
