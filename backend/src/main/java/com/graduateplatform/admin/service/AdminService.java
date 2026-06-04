package com.graduateplatform.admin.service;

import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.community.entity.Post;
import com.graduateplatform.community.entity.PostReport;
import com.graduateplatform.community.repository.CommentRepository;
import com.graduateplatform.community.repository.PostReportRepository;
import com.graduateplatform.community.repository.PostRepository;
import com.graduateplatform.community.service.CommunityNotificationService;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class AdminService {

    private final PostRepository postRepository;
    private final PostReportRepository reportRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final CommunityNotificationService notificationService;

    public AdminService(PostRepository postRepository,
                        PostReportRepository reportRepository,
                        UserRepository userRepository,
                        CommentRepository commentRepository,
                        CommunityNotificationService notificationService) {
        this.postRepository = postRepository;
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.notificationService = notificationService;
    }

    // ==================== 内容审核 ====================

    @Transactional(readOnly = true)
    public Map<String, Object> getPendingPosts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Post> postPage = postRepository.findByStatusOrderByCreatedAtDesc("PENDING", pageable);

        List<Map<String, Object>> content = postPage.getContent().stream().map(this::toPostDetail).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", content);
        result.put("totalPages", postPage.getTotalPages());
        result.put("totalElements", postPage.getTotalElements());
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getReviewList(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Post> postPage;
        if (status != null && !status.isEmpty()) {
            postPage = postRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase(), pageable);
        } else {
            postPage = postRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        List<Map<String, Object>> content = postPage.getContent().stream().map(this::toPostDetail).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", content);
        result.put("totalPages", postPage.getTotalPages());
        result.put("totalElements", postPage.getTotalElements());
        return result;
    }

    @Transactional
    public Map<String, Object> reviewPost(Long postId, Long adminUserId, String action, String reason) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new BusinessException("帖子不存在"));

        String validActions = "APPROVE,REJECT,OFFLINE";
        if (!Arrays.asList("APPROVE", "REJECT", "OFFLINE").contains(action.toUpperCase())) {
            throw new BusinessException("无效操作，支持: " + validActions);
        }

        String normalizedAction = action.toUpperCase();
        switch (normalizedAction) {
            case "APPROVE":
                if (!"PENDING".equals(post.getStatus())) {
                    throw new BusinessException("只能审核待审核状态的帖子");
                }
                post.setStatus("PUBLISHED");
                break;
            case "REJECT":
                if (!"PENDING".equals(post.getStatus())) {
                    throw new BusinessException("只能驳回待审核状态的帖子");
                }
                if (reason == null || reason.isBlank()) {
                    throw new BusinessException("驳回时请填写原因");
                }
                post.setStatus("REJECTED");
                break;
            case "OFFLINE":
                if (!"PUBLISHED".equals(post.getStatus())) {
                    throw new BusinessException("只能下架已发布的帖子");
                }
                if (reason == null || reason.isBlank()) {
                    throw new BusinessException("下架时请填写原因");
                }
                post.setStatus("OFFLINE");
                break;
        }

        post.setReviewReason(reason);
        post.setReviewedById(adminUserId);
        post.setReviewedAt(LocalDateTime.now());

        postRepository.save(post);
        notifyPostReviewResult(post, normalizedAction, reason);
        return toPostDetail(post);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getReports(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PostReport> reportPage;
        if (status != null && !status.isBlank()) {
            reportPage = reportRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase(), pageable);
        } else {
            reportPage = reportRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        List<Map<String, Object>> content = reportPage.getContent().stream()
            .map(this::toReportDetail)
            .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", content);
        result.put("totalPages", reportPage.getTotalPages());
        result.put("totalElements", reportPage.getTotalElements());
        return result;
    }

    @Transactional
    public Map<String, Object> reviewReport(Long reportId, Long adminUserId, String action, String note) {
        PostReport report = reportRepository.findById(reportId)
            .orElseThrow(() -> new BusinessException("举报记录不存在"));
        User admin = userRepository.findById(adminUserId)
            .orElseThrow(() -> new BusinessException("管理员不存在"));

        if (!"admin".equals(admin.getRole())) {
            throw new BusinessException("仅管理员可处理举报");
        }
        if (!"PENDING".equals(report.getStatus())) {
            throw new BusinessException("该举报已处理");
        }

        String normalized = action == null ? "" : action.trim().toUpperCase();
        if (!Set.of("RESOLVE", "REJECT").contains(normalized)) {
            throw new BusinessException("无效操作，支持: RESOLVE, REJECT");
        }

        Post post = report.getPost();
        if ("RESOLVE".equals(normalized)) {
            report.setStatus("RESOLVED");
            if ("PUBLISHED".equals(post.getStatus())) {
                post.setStatus("OFFLINE");
                post.setReviewReason("举报成立自动下架: " + (note == null ? "" : note.trim()));
                post.setReviewedById(adminUserId);
                post.setReviewedAt(LocalDateTime.now());
                notificationService.create(
                    post.getAuthor(),
                    "帖子举报处理成立",
                    "你的帖子《" + post.getTitle() + "》因举报成立已被下架。处理说明："
                        + (note == null || note.isBlank() ? "管理员审核通过举报" : note.trim()),
                    "POST",
                    post.getId()
                );
            }
        } else {
            report.setStatus("REJECTED");
        }

        report.setReviewer(admin);
        report.setReviewNote(note);
        report.setReviewedAt(LocalDateTime.now());
        reportRepository.save(report);

        long pendingCount = reportRepository.countByPostIdAndStatus(post.getId(), "PENDING");
        post.setReportCount((int) pendingCount);
        postRepository.save(post);

        return toReportDetail(report);
    }

    // ==================== 用户管理 ====================

    @Transactional(readOnly = true)
    public Map<String, Object> getUsers(String target, String status, int page, int size) {
        List<User> allUsers = userRepository.findAll();
        List<User> filtered = new ArrayList<>(allUsers);

        if (target != null && !target.isEmpty()) {
            filtered.removeIf(u -> !target.equals(u.getTarget()));
        }
        if (status != null && !status.isEmpty()) {
            filtered.removeIf(u -> !status.equalsIgnoreCase(u.getStatus()));
        }

        int total = filtered.size();
        int start = page * size;
        int end = Math.min(start + size, total);
        List<User> paged = start < total ? filtered.subList(start, end) : List.of();

        List<Map<String, Object>> content = paged.stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("name", u.getName());
            m.put("email", u.getEmail());
            m.put("phone", u.getPhone());
            m.put("target", u.getTarget());
            m.put("school", u.getSchool());
            m.put("role", u.getRole());
            m.put("status", u.getStatus());
            m.put("createdAt", u.getCreatedAt().toString());
            return m;
        }).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", content);
        result.put("totalPages", (int) Math.ceil((double) total / size));
        result.put("totalElements", (long) total);
        return result;
    }

    @Transactional
    public Map<String, Object> updateUserStatus(Long userId, String newStatus, String reason) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("用户不存在"));

        if ("admin".equals(user.getRole())) {
            throw new BusinessException("不能修改管理员状态");
        }

        Set<String> validStatuses = Set.of("normal", "muted", "upload_limited", "temporary_locked", "banned");
        if (!validStatuses.contains(newStatus)) {
            throw new BusinessException("无效状态，支持: " + String.join(", ", validStatuses));
        }

        user.setStatus(newStatus);
        if ("temporary_locked".equals(newStatus)) {
            user.setLockedUntil(java.time.LocalDateTime.now().plusHours(24));
        }
        if ("normal".equals(newStatus)) {
            user.setLoginFailCount(0);
            user.setLockedUntil(null);
        }
        userRepository.save(user);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", user.getId());
        m.put("name", user.getName());
        m.put("status", user.getStatus());
        m.put("reason", reason);
        return m;
    }

    // ==================== 统计 ====================

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboard() {
        long totalUsers = userRepository.count();
        long pendingPosts = postRepository.findByStatusOrderByCreatedAtDesc("PENDING", PageRequest.of(0, 1)).getTotalElements();
        long pendingReports = reportRepository.countByStatus("PENDING");

        Map<String, Object> dash = new LinkedHashMap<>();
        dash.put("totalUsers", totalUsers);
        dash.put("pendingPosts", pendingPosts);
        dash.put("pendingReports", pendingReports);
        return dash;
    }

    // ==================== 辅助 ====================

    private Map<String, Object> toPostDetail(Post post) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", post.getId());
        map.put("title", post.getTitle());
        map.put("content", post.getContent());
        map.put("category", Map.of("code", post.getCategory().getCode(), "name", post.getCategory().getName()));
        map.put("tags", post.getTags());
        map.put("visibility", post.getVisibility());
        map.put("anonymous", post.getAnonymous());
        map.put("hasAttachment", post.getHasAttachment());
        map.put("authorId", post.getAuthor().getId());
        map.put("authorName", post.getAuthor().getName());
        map.put("status", post.getStatus());
        map.put("reviewReason", post.getReviewReason());
        map.put("reviewedById", post.getReviewedById());
        map.put("reviewedAt", post.getReviewedAt() != null ? post.getReviewedAt().toString() : null);
        map.put("viewCount", post.getViewCount());
        map.put("commentCount", post.getCommentCount());
        map.put("reportCount", post.getReportCount());
        map.put("createdAt", post.getCreatedAt().toString());
        return map;
    }

    private Map<String, Object> toReportDetail(PostReport report) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", report.getId());
        map.put("reason", report.getReason());
        map.put("status", report.getStatus());
        map.put("reviewNote", report.getReviewNote());
        map.put("createdAt", report.getCreatedAt() != null ? report.getCreatedAt().toString() : null);
        map.put("reviewedAt", report.getReviewedAt() != null ? report.getReviewedAt().toString() : null);
        map.put("reviewer", report.getReviewer() != null ? report.getReviewer().getName() : null);
        map.put("reporter", Map.of(
            "id", report.getReporter().getId(),
            "name", report.getReporter().getName()
        ));
        map.put("post", Map.of(
            "id", report.getPost().getId(),
            "title", report.getPost().getTitle(),
            "status", report.getPost().getStatus(),
            "authorId", report.getPost().getAuthor().getId(),
            "authorName", report.getPost().getAuthor().getName()
        ));
        return map;
    }

    private void notifyPostReviewResult(Post post, String action, String reason) {
        String title;
        String content;
        String cleanReason = reason == null || reason.isBlank() ? "无" : reason.trim();
        switch (action) {
            case "APPROVE":
                title = "帖子审核已通过";
                content = "你的帖子《" + post.getTitle() + "》已通过审核并公开展示。";
                break;
            case "REJECT":
                title = "帖子审核未通过";
                content = "你的帖子《" + post.getTitle() + "》未通过审核。原因：" + cleanReason;
                break;
            case "OFFLINE":
                title = "帖子已下架";
                content = "你的帖子《" + post.getTitle() + "》已被管理员下架。原因：" + cleanReason;
                break;
            default:
                return;
        }
        notificationService.create(post.getAuthor(), title, content, "POST", post.getId());
    }
}
