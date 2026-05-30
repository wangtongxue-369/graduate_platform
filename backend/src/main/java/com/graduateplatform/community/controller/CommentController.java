package com.graduateplatform.community.controller;

import com.graduateplatform.common.dto.ApiResponse;
import com.graduateplatform.community.dto.CreateCommentRequest;
import com.graduateplatform.community.dto.ReportCommentRequest;
import com.graduateplatform.community.dto.UpdateCommentRequest;
import com.graduateplatform.community.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/{postId}/comments")
    public ApiResponse<?> list(@PathVariable Long postId, Authentication auth) {
        return ApiResponse.ok(commentService.getComments(postId, getCurrentUserId(auth), isAdmin(auth)));
    }

    @PostMapping("/{postId}/comments")
    public ApiResponse<?> create(@PathVariable Long postId, @Valid @RequestBody CreateCommentRequest req, Authentication auth) {
        Long currentUserId = getCurrentUserId(auth);
        if (currentUserId == null) {
            return ApiResponse.fail("未登录或登录已失效");
        }
        return ApiResponse.ok(commentService.createComment(postId, req, currentUserId), "评论成功");
    }

    @PutMapping("/{postId}/comments/{commentId}")
    public ApiResponse<?> update(@PathVariable Long postId,
                                 @PathVariable Long commentId,
                                 @Valid @RequestBody UpdateCommentRequest req,
                                 Authentication auth) {
        Long currentUserId = getCurrentUserId(auth);
        if (currentUserId == null) {
            return ApiResponse.fail("未登录或登录已失效");
        }
        return ApiResponse.ok(commentService.updateComment(postId, commentId, req, currentUserId), "评论已更新");
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    public ApiResponse<?> delete(@PathVariable Long postId,
                                 @PathVariable Long commentId,
                                 Authentication auth) {
        Long currentUserId = getCurrentUserId(auth);
        if (currentUserId == null) {
            return ApiResponse.fail("未登录或登录已失效");
        }
        return ApiResponse.ok(commentService.deleteComment(postId, commentId, currentUserId, isAdmin(auth)), "评论已删除");
    }

    @PostMapping("/{postId}/comments/{commentId}/report")
    public ApiResponse<?> report(@PathVariable Long postId,
                                 @PathVariable Long commentId,
                                 @Valid @RequestBody ReportCommentRequest req,
                                 Authentication auth) {
        Long currentUserId = getCurrentUserId(auth);
        if (currentUserId == null) {
            return ApiResponse.fail("未登录或登录已失效");
        }
        return ApiResponse.ok(commentService.reportComment(postId, commentId, currentUserId, req.getReason()), "评论举报已提交");
    }

    private Long getCurrentUserId(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return null;
        }
        Object principal = auth.getPrincipal();
        return principal instanceof Long ? (Long) principal : null;
    }

    private boolean isAdmin(Authentication auth) {
        if (auth == null || auth.getAuthorities() == null) {
            return false;
        }
        for (GrantedAuthority authority : auth.getAuthorities()) {
            if ("ROLE_ADMIN".equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }
}
