package com.graduateplatform.community.service;

import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.community.dto.CreateCommentRequest;
import com.graduateplatform.community.dto.UpdateCommentRequest;
import com.graduateplatform.community.entity.Comment;
import com.graduateplatform.community.entity.CommentReport;
import com.graduateplatform.community.entity.Post;
import com.graduateplatform.community.repository.CommentReportRepository;
import com.graduateplatform.community.repository.CommentRepository;
import com.graduateplatform.community.repository.PostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class CommentService {

    private static final List<String> VISIBLE_COMMENT_STATUSES = List.of("PUBLISHED", "DELETED");
    private static final List<String> EDITABLE_COMMENT_STATUSES = List.of("PUBLISHED");

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentReportRepository commentReportRepository;
    private final CommunityModerationService moderationService;
    private final CommunityNotificationService notificationService;

    public CommentService(CommentRepository commentRepository,
                          PostRepository postRepository,
                          UserRepository userRepository,
                          CommentReportRepository commentReportRepository,
                          CommunityModerationService moderationService,
                          CommunityNotificationService notificationService) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.commentReportRepository = commentReportRepository;
        this.moderationService = moderationService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getComments(Long postId, Long viewerUserId, boolean admin) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new BusinessException("帖子不存在"));
        ensureCanView(post, viewerUserId, admin);

        List<Comment> comments = commentRepository.findByPostIdAndStatusInOrderByCreatedAtAsc(postId, VISIBLE_COMMENT_STATUSES);
        List<Map<String, Object>> tree = pruneDeletedLeafComments(buildCommentTree(comments));
        populateReplyCounts(tree);
        return tree;
    }

    @Transactional
    public Map<String, Object> createComment(Long postId, CreateCommentRequest req, Long currentUserId) {
        Post post = requirePublishedPost(postId);
        User author = requireUser(currentUserId);
        ensureCanComment(author);

        String normalizedContent = normalizeCommentContent(req.getContent());
        Comment parentComment = resolveParentComment(postId, req.getParentId());
        Comment replyToComment = resolveReplyToComment(postId, req.getReplyToId());

        if (parentComment != null && parentComment.getParentComment() != null) {
            if (replyToComment == null) {
                replyToComment = parentComment;
            }
            parentComment = findRootComment(parentComment);
        }

        replyToComment = normalizeReplyTarget(parentComment, replyToComment);
        var sensitiveWord = moderationService.findSensitiveWord(normalizedContent);
        String status = sensitiveWord.isPresent() ? "HIDDEN" : "PUBLISHED";

        Comment comment = commentRepository.save(Comment.builder()
            .content(normalizedContent)
            .post(post)
            .author(author)
            .parentComment(parentComment)
            .replyToComment(replyToComment)
            .status(status)
            .build());

        sensitiveWord.ifPresent(word -> notificationService.create(
            author,
            "评论已隐藏待复核",
            "你在帖子《" + post.getTitle() + "》下的评论因命中敏感词已被隐藏。原因："
                + moderationService.sensitiveReason(word),
            "COMMENT",
            comment.getId()
        ));

        return toMap(comment);
    }

    @Transactional
    public Map<String, Object> updateComment(Long postId, Long commentId, UpdateCommentRequest req, Long currentUserId) {
        Comment comment = requireManageableComment(postId, commentId);
        if (!currentUserId.equals(comment.getAuthor().getId())) {
            throw new BusinessException("无权编辑该评论");
        }

        comment.setContent(normalizeCommentContent(req.getContent()));
        commentRepository.save(comment);
        return toMap(comment);
    }

    @Transactional
    public Map<String, Object> deleteComment(Long postId, Long commentId, Long currentUserId, boolean admin) {
        Comment comment = requireViewableComment(postId, commentId);
        boolean canDelete = admin || currentUserId.equals(comment.getAuthor().getId());
        if (!canDelete) {
            throw new BusinessException("无权删除该评论");
        }
        if ("DELETED".equals(comment.getStatus())) {
            return toMap(comment);
        }

        comment.setStatus("DELETED");
        comment.setContent("该评论已被作者删除");
        commentRepository.save(comment);
        return toMap(comment);
    }

    @Transactional
    public Map<String, Object> reportComment(Long postId, Long commentId, Long currentUserId, String reason) {
        Comment comment = requireManageableComment(postId, commentId);
        Post post = comment.getPost();
        User reporter = requireUser(currentUserId);

        ensureCanInteract(post, reporter);
        if (currentUserId.equals(comment.getAuthor().getId())) {
            throw new BusinessException("不能举报自己的评论");
        }
        if (commentReportRepository.existsByCommentIdAndReporterId(commentId, currentUserId)) {
            throw new BusinessException("你已举报过该评论，请勿重复提交");
        }

        CommentReport report = commentReportRepository.save(CommentReport.builder()
            .comment(comment)
            .reporter(reporter)
            .reason(reason.trim())
            .status("PENDING")
            .build());

        long pendingCount = commentReportRepository.countByCommentIdAndStatus(commentId, "PENDING");
        comment.setReportCount((int) pendingCount);
        if (pendingCount >= CommunityModerationService.COMMENT_REPORT_ESCALATION_THRESHOLD
            && "PUBLISHED".equals(comment.getStatus())) {
            comment.setStatus("HIDDEN");
            notificationService.create(
                comment.getAuthor(),
                "评论已自动隐藏",
                "你在帖子《" + comment.getPost().getTitle() + "》下的评论因多次举报已被系统自动隐藏，等待管理员复核。",
                "COMMENT",
                comment.getId()
            );
        }
        commentRepository.save(comment);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("reportId", report.getId());
        result.put("status", report.getStatus());
        result.put("reportCount", comment.getReportCount());
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCommentReports(String status, int page, int size) {
        var pageable = org.springframework.data.domain.PageRequest.of(
            page,
            size,
            org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")
        );

        var reportPage = (status != null && !status.isBlank())
            ? commentReportRepository.findByStatusOrderByCreatedAtDesc(status.toUpperCase(), pageable)
            : commentReportRepository.findAllByOrderByCreatedAtDesc(pageable);

        List<Map<String, Object>> content = reportPage.getContent().stream()
            .map(this::toCommentReportMap)
            .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", content);
        result.put("totalPages", reportPage.getTotalPages());
        result.put("totalElements", reportPage.getTotalElements());
        return result;
    }

    @Transactional
    public Map<String, Object> reviewCommentReport(Long reportId, Long adminUserId, String action, String note) {
        CommentReport report = commentReportRepository.findById(reportId)
            .orElseThrow(() -> new BusinessException("评论举报记录不存在"));
        User admin = requireUser(adminUserId);

        if (!"admin".equals(admin.getRole())) {
            throw new BusinessException("仅管理员可处理评论举报");
        }
        if (!"PENDING".equals(report.getStatus())) {
            throw new BusinessException("该评论举报已处理");
        }

        String normalizedAction = action == null ? "" : action.trim().toUpperCase();
        if (!Set.of("RESOLVE", "REJECT").contains(normalizedAction)) {
            throw new BusinessException("无效操作，支持: RESOLVE, REJECT");
        }

        Comment comment = report.getComment();
        if ("RESOLVE".equals(normalizedAction)) {
            report.setStatus("RESOLVED");
            if (!"DELETED".equals(comment.getStatus())) {
                comment.setStatus("HIDDEN");
                notificationService.create(
                    comment.getAuthor(),
                    "评论举报处理成立",
                    "你在帖子《" + comment.getPost().getTitle() + "》下的评论已被隐藏。处理说明："
                        + (note == null || note.isBlank() ? "管理员审核通过举报" : note.trim()),
                    "COMMENT",
                    comment.getId()
                );
                commentRepository.save(comment);
            }
        } else {
            report.setStatus("REJECTED");
        }

        report.setReviewer(admin);
        report.setReviewNote(note);
        report.setReviewedAt(LocalDateTime.now());
        commentReportRepository.save(report);

        long pendingCount = commentReportRepository.countByCommentIdAndStatus(comment.getId(), "PENDING");
        comment.setReportCount((int) pendingCount);
        commentRepository.save(comment);

        return toCommentReportMap(report);
    }

    private Post requirePublishedPost(Long postId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new BusinessException("帖子不存在"));
        if (!"PUBLISHED".equals(post.getStatus())) {
            throw new BusinessException("当前帖子不可评论");
        }
        return post;
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("用户不存在"));
    }

    private Comment requireManageableComment(Long postId, Long commentId) {
        return commentRepository.findByIdAndPostIdAndStatusIn(commentId, postId, EDITABLE_COMMENT_STATUSES)
            .orElseThrow(() -> new BusinessException("评论不存在或不可操作"));
    }

    private Comment requireViewableComment(Long postId, Long commentId) {
        return commentRepository.findByIdAndPostIdAndStatusIn(commentId, postId, VISIBLE_COMMENT_STATUSES)
            .orElseThrow(() -> new BusinessException("评论不存在"));
    }

    private Comment resolveParentComment(Long postId, Long parentId) {
        if (parentId == null) {
            return null;
        }
        return commentRepository.findByIdAndPostIdAndStatusIn(parentId, postId, EDITABLE_COMMENT_STATUSES)
            .orElseThrow(() -> new BusinessException("回复的评论不存在或不属于当前帖子"));
    }

    private Comment resolveReplyToComment(Long postId, Long replyToId) {
        if (replyToId == null) {
            return null;
        }
        return commentRepository.findByIdAndPostIdAndStatusIn(replyToId, postId, EDITABLE_COMMENT_STATUSES)
            .orElseThrow(() -> new BusinessException("Reply target comment does not exist in the current post"));
    }

    private Comment normalizeReplyTarget(Comment parentComment, Comment replyToComment) {
        if (replyToComment == null) {
            return null;
        }
        if (parentComment == null) {
            throw new BusinessException("replyToId requires parentId");
        }

        Comment parentRoot = findRootComment(parentComment);
        Comment replyRoot = findRootComment(replyToComment);
        if (!parentRoot.getId().equals(replyRoot.getId())) {
            throw new BusinessException("Reply target comment is outside the current thread");
        }

        if (replyToComment.getId().equals(parentRoot.getId())) {
            return null;
        }
        return replyToComment;
    }

    private Comment findRootComment(Comment comment) {
        Comment current = comment;
        while (current.getParentComment() != null) {
            current = current.getParentComment();
        }
        return current;
    }

    private String normalizeCommentContent(String content) {
        String normalizedContent = content == null ? "" : content.trim();
        if (normalizedContent.isEmpty()) {
            throw new BusinessException("评论内容不能为空");
        }
        if (normalizedContent.length() > 300) {
            throw new BusinessException("评论内容不能超过 300 字");
        }
        return normalizedContent;
    }

    private List<Map<String, Object>> buildCommentTree(List<Comment> comments) {
        Map<Long, Map<String, Object>> byId = new LinkedHashMap<>();
        List<Map<String, Object>> roots = new ArrayList<>();

        for (Comment comment : comments) {
            byId.put(comment.getId(), toMap(comment));
        }

        for (Comment comment : comments) {
            Map<String, Object> current = byId.get(comment.getId());
            Long parentId = comment.getParentComment() != null ? comment.getParentComment().getId() : null;
            if (parentId != null && byId.containsKey(parentId)) {
                getReplies(byId.get(parentId)).add(current);
            } else {
                roots.add(current);
            }
        }

        return roots;
    }

    private Map<String, Object> toMap(Comment comment) {
        Map<String, Object> map = new LinkedHashMap<>();
        boolean deleted = "DELETED".equals(comment.getStatus());
        map.put("id", comment.getId());
        map.put("content", comment.getContent());
        map.put("authorId", deleted ? null : comment.getAuthor().getId());
        map.put("authorName", deleted ? "" : comment.getAuthor().getName());
        map.put("parentId", comment.getParentComment() != null ? comment.getParentComment().getId() : null);
        map.put("replyToId", comment.getReplyToComment() != null ? comment.getReplyToComment().getId() : null);
        map.put(
            "replyToAuthorId",
            comment.getReplyToComment() != null && !"DELETED".equals(comment.getReplyToComment().getStatus())
                ? comment.getReplyToComment().getAuthor().getId()
                : null
        );
        map.put(
            "replyToAuthorName",
            comment.getReplyToComment() == null
                ? ""
                : ("DELETED".equals(comment.getReplyToComment().getStatus())
                    ? "\u8bc4\u8bba\u5df2\u5220\u9664"
                    : comment.getReplyToComment().getAuthor().getName())
        );
        map.put("status", comment.getStatus());
        map.put("reportCount", comment.getReportCount());
        map.put("editable", "PUBLISHED".equals(comment.getStatus()));
        map.put("deleted", deleted);
        map.put("hidden", "HIDDEN".equals(comment.getStatus()));
        map.put("createdAt", comment.getCreatedAt().toString());
        map.put("updatedAt", comment.getUpdatedAt() != null ? comment.getUpdatedAt().toString() : null);
        map.put("replyCount", 0);
        map.put("replies", new ArrayList<Map<String, Object>>());
        return map;
    }

    private Map<String, Object> toCommentReportMap(CommentReport report) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", report.getId());
        map.put("type", "COMMENT");
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
        map.put("comment", Map.of(
            "id", report.getComment().getId(),
            "content", report.getComment().getContent(),
            "status", report.getComment().getStatus(),
            "authorId", report.getComment().getAuthor().getId(),
            "authorName", report.getComment().getAuthor().getName(),
            "postId", report.getComment().getPost().getId(),
            "postTitle", report.getComment().getPost().getTitle()
        ));
        return map;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getReplies(Map<String, Object> commentMap) {
        return (List<Map<String, Object>>) commentMap.get("replies");
    }

    private void populateReplyCounts(List<Map<String, Object>> comments) {
        for (Map<String, Object> comment : comments) {
            populateReplyCount(comment);
        }
    }

    private int populateReplyCount(Map<String, Object> comment) {
        int totalReplies = 0;
        for (Map<String, Object> reply : getReplies(comment)) {
            totalReplies += populateReplyCount(reply);
            if (!Boolean.TRUE.equals(reply.get("deleted"))) {
                totalReplies += 1;
            }
        }
        comment.put("replyCount", totalReplies);
        return totalReplies;
    }

    private List<Map<String, Object>> pruneDeletedLeafComments(List<Map<String, Object>> comments) {
        List<Map<String, Object>> pruned = new ArrayList<>();

        for (Map<String, Object> comment : comments) {
            List<Map<String, Object>> nextReplies = pruneDeletedLeafComments(getReplies(comment));
            comment.put("replies", nextReplies);

            if (Boolean.TRUE.equals(comment.get("deleted")) && nextReplies.isEmpty()) {
                continue;
            }
            pruned.add(comment);
        }

        return pruned;
    }

    private void ensureCanView(Post post, Long viewerUserId, boolean admin) {
        boolean published = "PUBLISHED".equals(post.getStatus());
        boolean membersOnly = "members".equalsIgnoreCase(post.getVisibility());
        boolean isAuthor = viewerUserId != null && viewerUserId.equals(post.getAuthor().getId());

        if (published) {
            if (membersOnly && viewerUserId == null && !admin) {
                throw new BusinessException("该帖子仅注册用户可见");
            }
            return;
        }

        if (!admin && !isAuthor) {
            throw new BusinessException("无权查看该帖子评论");
        }
    }

    private void ensureCanComment(User user) {
        String status = user.getStatus();
        if ("banned".equals(status)) {
            throw new BusinessException("账号已被封禁，无法评论");
        }
        if ("muted".equals(status)) {
            throw new BusinessException("您已被禁言，无法评论");
        }
        if ("temporary_locked".equals(status) && isCurrentlyLocked(user)) {
            throw new BusinessException("账号已被临时锁定，请稍后再试");
        }
    }

    private void ensureCanInteract(Post post, User user) {
        if (!"PUBLISHED".equals(post.getStatus())) {
            throw new BusinessException("该帖子当前不可互动");
        }
        String status = user.getStatus();
        if ("banned".equals(status)) {
            throw new BusinessException("账号已被封禁，无法执行该操作");
        }
        if ("temporary_locked".equals(status) && isCurrentlyLocked(user)) {
            throw new BusinessException("账号已被临时锁定，请稍后再试");
        }
    }

    private boolean isCurrentlyLocked(User user) {
        if (user.getLockedUntil() == null) {
            return false;
        }
        return user.getLockedUntil().isAfter(LocalDateTime.now());
    }
}
