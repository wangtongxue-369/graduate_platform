package com.graduateplatform.community.service;

import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.common.service.CosService;
import com.graduateplatform.community.constant.PostConstraints;
import com.graduateplatform.community.dto.CreatePostRequest;
import com.graduateplatform.community.entity.Post;
import com.graduateplatform.community.entity.PostAttachment;
import com.graduateplatform.community.entity.PostCategory;
import com.graduateplatform.community.entity.PostInteraction;
import com.graduateplatform.community.entity.PostReport;
import com.graduateplatform.community.repository.CommentRepository;
import com.graduateplatform.community.repository.PostAttachmentRepository;
import com.graduateplatform.community.repository.PostCategoryRepository;
import com.graduateplatform.community.repository.PostInteractionRepository;
import com.graduateplatform.community.repository.PostReportRepository;
import com.graduateplatform.community.repository.PostRepository;
import com.qcloud.cos.model.COSObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class PostService {

    private static final int MAX_ATTACHMENT_COUNT = 6;
    private static final long MAX_ATTACHMENT_SIZE = 20L * 1024 * 1024; // 20MB
    private static final Set<String> ALLOWED_ATTACHMENT_EXTENSIONS = Set.of(
        "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt",
        "png", "jpg", "jpeg", "gif", "webp", "zip", "rar", "7z"
    );

    private final PostRepository postRepository;
    private final PostAttachmentRepository postAttachmentRepository;
    private final PostCategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final PostInteractionRepository interactionRepository;
    private final PostReportRepository reportRepository;
    private final CosService cosService;
    private final CommunityModerationService moderationService;
    private final CommunityNotificationService notificationService;

    public PostService(PostRepository postRepository,
                       PostAttachmentRepository postAttachmentRepository,
                       PostCategoryRepository categoryRepository,
                       UserRepository userRepository,
                       CommentRepository commentRepository,
                       PostInteractionRepository interactionRepository,
                       PostReportRepository reportRepository,
                       CosService cosService,
                       CommunityModerationService moderationService,
                       CommunityNotificationService notificationService) {
        this.postRepository = postRepository;
        this.postAttachmentRepository = postAttachmentRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.interactionRepository = interactionRepository;
        this.reportRepository = reportRepository;
        this.cosService = cosService;
        this.moderationService = moderationService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPosts(String category, String keyword, String sort,
                                        String tag, Boolean hasAttachment, int page, int size,
                                        boolean includeMembers) {
        Long categoryId = null;
        if (category != null && !category.isEmpty()) {
            categoryId = categoryRepository.findByCode(category)
                .map(PostCategory::getId)
                .orElse(null);
        }

        String normalizedSort = sort == null ? "latest" : sort.trim().toLowerCase();
        Page<Post> postPage;
        if ("hot".equals(normalizedSort)) {
            Pageable pageable = PageRequest.of(page, size);
            postPage = postRepository.findPublishedPostsByHotScore(
                includeMembers, categoryId, keyword, tag, hasAttachment, pageable
            );
        } else {
            Sort sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
            Pageable pageable = PageRequest.of(page, size, sortObj);
            postPage = postRepository.findPublishedPosts(
                includeMembers, categoryId, keyword, tag, hasAttachment, pageable
            );
        }

        List<Map<String, Object>> content = postPage.getContent()
            .stream()
            .map(post -> toPostMap(post, null, false))
            .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("content", content);
        result.put("totalPages", postPage.getTotalPages());
        result.put("totalElements", postPage.getTotalElements());
        result.put("number", postPage.getNumber());
        result.put("size", postPage.getSize());
        return result;
    }

    @Transactional
    public Map<String, Object> getPostDetail(Long id, Long viewerUserId, boolean admin) {
        Post post = postRepository.findById(id)
            .orElseThrow(() -> new BusinessException("帖子不存在"));
        ensureCanView(post, viewerUserId, admin);
        if ("PUBLISHED".equals(post.getStatus())) {
            post.setViewCount(post.getViewCount() + 1);
            postRepository.save(post);
        }
        return toPostMap(post, viewerUserId, true);
    }

    @Transactional
    public Map<String, Object> createPost(CreatePostRequest req, Long currentUserId) {
        PostCategory category = categoryRepository.findByCode(req.getCategoryCode())
            .orElseThrow(() -> new BusinessException("分类不存在"));

        User author = userRepository.findById(currentUserId)
            .orElseThrow(() -> new BusinessException("用户不存在"));

        List<MultipartFile> attachments = normalizeAttachments(req.getAttachments());
        boolean hasRealAttachments = !attachments.isEmpty();
        boolean requestedAttachment = Boolean.TRUE.equals(req.getHasAttachment()) || hasRealAttachments;
        if (requestedAttachment && !hasRealAttachments) {
            throw new BusinessException("含附件帖子至少上传一个附件");
        }

        ensureCanPost(author, requestedAttachment);
        ContentSource contentSource = resolveContentSource(req);
        String content = contentSource.content();
        String sourceFileName = contentSource.sourceFileName();
        String title = resolvePostTitle(req.getTitle(), sourceFileName, content);

        String status = req.getStatus();
        String reviewReason = null;
        var sensitiveWord = moderationService.findSensitiveWord(
            title,
            content,
            req.getAttachmentNote(),
            req.getTags() == null ? null : String.join(",", req.getTags())
        );
        if ("DRAFT".equals(status)) {
            // keep as draft
        } else if (sensitiveWord.isPresent()) {
            status = "PENDING";
            reviewReason = moderationService.sensitiveReason(sensitiveWord.get());
        } else if (requestedAttachment) {
            status = "PENDING";
            reviewReason = "含附件内容需管理员审核";
        } else if (author.getCreatedAt().isAfter(LocalDateTime.now().minusDays(7))) {
            status = "PENDING";
            reviewReason = "新注册账号发帖需管理员审核";
        } else {
            status = "PUBLISHED";
        }

        Post post = Post.builder()
            .title(title)
            .content(content)
            .category(category)
            .tags(req.getTags() != null ? String.join(",", req.getTags()) : null)
            .visibility(req.getVisibility() != null ? req.getVisibility() : "public")
            .anonymous(Boolean.TRUE.equals(req.getAnonymous()))
            .hasAttachment(requestedAttachment)
            .attachmentNote(requestedAttachment ? req.getAttachmentNote() : null)
            .contentFormat("markdown")
            .sourceFileName(sourceFileName)
            .author(author)
            .status(status)
            .reviewReason(reviewReason)
            .build();

        post = postRepository.save(post);
        if ("PENDING".equals(post.getStatus()) && reviewReason != null) {
            notificationService.create(
                author,
                "帖子已进入审核",
                "你的帖子《" + post.getTitle() + "》已进入审核。原因：" + reviewReason,
                "POST",
                post.getId()
            );
        }

        if (requestedAttachment) {
            savePostAttachments(post, attachments);
            post = postRepository.findById(post.getId())
                .orElseThrow(() -> new BusinessException("帖子不存在"));
        }

        return toPostMap(post, currentUserId, true);
    }

    @Transactional
    public Map<String, Object> toggleLike(Long postId, Long currentUserId) {
        return toggleInteraction(postId, currentUserId, "LIKE");
    }

    @Transactional
    public Map<String, Object> toggleFavorite(Long postId, Long currentUserId) {
        return toggleInteraction(postId, currentUserId, "FAVORITE");
    }

    @Transactional
    public Map<String, Object> reportPost(Long postId, Long currentUserId, String reason) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new BusinessException("帖子不存在"));
        User reporter = userRepository.findById(currentUserId)
            .orElseThrow(() -> new BusinessException("用户不存在"));

        ensureCanInteract(post, reporter);
        if (currentUserId.equals(post.getAuthor().getId())) {
            throw new BusinessException("不能举报自己发布的帖子");
        }

        if (reportRepository.existsByPostIdAndReporterId(postId, currentUserId)) {
            throw new BusinessException("你已举报过该帖子，请勿重复提交");
        }

        PostReport report = PostReport.builder()
            .post(post)
            .reporter(reporter)
            .reason(reason.trim())
            .status("PENDING")
            .build();
        report = reportRepository.save(report);

        long pendingReports = reportRepository.countByPostIdAndStatus(postId, "PENDING");
        post.setReportCount((int) pendingReports);
        if (pendingReports >= CommunityModerationService.POST_REPORT_ESCALATION_THRESHOLD
            && "PUBLISHED".equals(post.getStatus())) {
            String reviewReason = "收到多次举报，系统已自动下架并等待管理员复核";
            post.setStatus("OFFLINE");
            post.setReviewReason(reviewReason);
            post.setReviewedAt(LocalDateTime.now());
            notificationService.create(
                post.getAuthor(),
                "帖子已自动下架",
                "你的帖子《" + post.getTitle() + "》因多次举报已被系统自动下架。原因：" + reviewReason,
                "POST",
                post.getId()
            );
        }
        postRepository.save(post);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("reportId", report.getId());
        result.put("status", report.getStatus());
        result.put("reportCount", post.getReportCount());
        result.put("postStatus", post.getStatus());
        return result;
    }

    @Transactional
    public Object[] getPostAttachmentDownloadStream(Long postId, Long attachmentId, Long viewerUserId, boolean admin) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new BusinessException("帖子不存在"));
        ensureCanView(post, viewerUserId, admin);

        PostAttachment attachment = postAttachmentRepository.findByIdAndPostId(attachmentId, postId)
            .orElseThrow(() -> new BusinessException("附件不存在"));

        attachment.setDownloadCount(attachment.getDownloadCount() + 1);
        postAttachmentRepository.save(attachment);

        COSObject cosObject = cosService.getObject(attachment.getCosKey());
        return new Object[]{cosObject.getObjectContent(), cosObject.getObjectMetadata(), attachment.getOriginalName()};
    }

    private Map<String, Object> toggleInteraction(Long postId, Long currentUserId, String type) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new BusinessException("帖子不存在"));
        User user = userRepository.findById(currentUserId)
            .orElseThrow(() -> new BusinessException("用户不存在"));

        ensureCanInteract(post, user);

        boolean active;
        var existing = interactionRepository.findByPostIdAndUserIdAndType(postId, currentUserId, type);
        if (existing.isPresent()) {
            interactionRepository.delete(existing.get());
            active = false;
        } else {
            interactionRepository.save(PostInteraction.builder()
                .post(post)
                .user(user)
                .type(type)
                .build());
            active = true;
        }

        long likeCount = interactionRepository.countByPostIdAndType(postId, "LIKE");
        long favoriteCount = interactionRepository.countByPostIdAndType(postId, "FAVORITE");
        post.setLikeCount((int) likeCount);
        post.setFavoriteCount((int) favoriteCount);
        postRepository.save(post);

        Map<String, Object> result = new LinkedHashMap<>();
        if ("LIKE".equals(type)) {
            result.put("liked", active);
            result.put("likeCount", post.getLikeCount());
        } else {
            result.put("favorited", active);
            result.put("favoriteCount", post.getFavoriteCount());
        }
        return result;
    }

    private Map<String, Object> toPostMap(Post post, Long viewerUserId, boolean includeAttachments) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", post.getId());
        map.put("title", post.getTitle());
        map.put("content", post.getContent());
        map.put("category", Map.of(
            "id", post.getCategory().getId(),
            "code", post.getCategory().getCode(),
            "name", post.getCategory().getName()
        ));
        map.put("tags", post.getTags());
        map.put("visibility", post.getVisibility());
        map.put("anonymous", post.getAnonymous());
        map.put("hasAttachment", post.getHasAttachment());
        map.put("attachmentNote", post.getAttachmentNote());
        map.put("attachmentCount", post.getAttachmentCount());
        if (includeAttachments) {
            map.put("attachments", post.getAttachments().stream().map(this::toAttachmentMap).toList());
        }
        map.put("contentFormat", post.getContentFormat() != null ? post.getContentFormat() : "plain");
        map.put("sourceFileName", post.getSourceFileName());
        map.put("authorId", post.getAnonymous() ? null : post.getAuthor().getId());
        map.put("status", post.getStatus());
        map.put("reviewReason", post.getReviewReason());
        map.put("reviewedById", post.getReviewedById());
        map.put("reviewedAt", post.getReviewedAt() != null ? post.getReviewedAt().toString() : null);
        map.put("viewCount", post.getViewCount());
        map.put("commentCount", commentRepository.countByPostIdAndStatusIn(post.getId(), List.of("PUBLISHED")));
        map.put("likeCount", post.getLikeCount());
        map.put("favoriteCount", post.getFavoriteCount());
        map.put("reportCount", post.getReportCount());
        map.put("createdAt", post.getCreatedAt().toString());
        map.put("updatedAt", post.getUpdatedAt().toString());

        if (viewerUserId != null) {
            boolean liked = interactionRepository
                .findByPostIdAndUserIdAndType(post.getId(), viewerUserId, "LIKE")
                .isPresent();
            boolean favorited = interactionRepository
                .findByPostIdAndUserIdAndType(post.getId(), viewerUserId, "FAVORITE")
                .isPresent();
            map.put("liked", liked);
            map.put("favorited", favorited);
        }

        return map;
    }

    private Map<String, Object> toAttachmentMap(PostAttachment attachment) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", attachment.getId());
        map.put("originalName", attachment.getOriginalName());
        map.put("fileSize", attachment.getFileSize());
        map.put("fileType", attachment.getFileType());
        map.put("downloadCount", attachment.getDownloadCount());
        map.put("createdAt", attachment.getCreatedAt() != null ? attachment.getCreatedAt().toString() : null);
        return map;
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
            throw new BusinessException("无权查看该帖子");
        }
    }

    private void ensureCanPost(User author, boolean hasAttachment) {
        String status = author.getStatus();
        if ("banned".equals(status)) {
            throw new BusinessException("账号已被封禁，无法发布");
        }
        if ("muted".equals(status)) {
            throw new BusinessException("您已被禁言，无法发布");
        }
        if ("temporary_locked".equals(status) && isCurrentlyLocked(author)) {
            throw new BusinessException("账号已被临时锁定，请稍后再试");
        }
        if ("upload_limited".equals(status) && hasAttachment) {
            throw new BusinessException("账号当前限制上传，无法发布含附件内容");
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

    private ContentSource resolveContentSource(CreatePostRequest req) {
        String inlineContent = req.getContent() == null ? "" : req.getContent();
        if (!inlineContent.isBlank()) {
            String sourceFileName = req.getMarkdownFile() != null && !req.getMarkdownFile().isEmpty()
                ? normalizeSourceFileName(req.getMarkdownFile().getOriginalFilename())
                : "inline-content.md";
            return new ContentSource(normalizePostContent(inlineContent, "正文"), sourceFileName);
        }

        MultipartFile markdownFile = req.getMarkdownFile();
        return new ContentSource(
            extractMarkdownContent(markdownFile),
            normalizeSourceFileName(markdownFile.getOriginalFilename())
        );
    }

    private String extractMarkdownContent(MultipartFile markdownFile) {
        if (markdownFile == null) {
            throw new BusinessException("请上传 markdown 文件");
        }
        if (markdownFile.isEmpty()) {
            throw new BusinessException("你选择的 Markdown 文件是空文件，请确认内容后重新上传。");
        }

        String sourceFileName = normalizeSourceFileName(markdownFile.getOriginalFilename());
        String lowerFileName = sourceFileName.toLowerCase();
        if (!lowerFileName.endsWith(".md") && !lowerFileName.endsWith(".markdown")) {
            throw new BusinessException("仅支持 .md 或 .markdown 文件");
        }

        String content;
        try {
            content = new String(markdownFile.getBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new BusinessException("读取 markdown 文件失败");
        }

        content = normalizePostContent(content, "Markdown 正文");
        if (content.length() < PostConstraints.CONTENT_MIN || content.length() > PostConstraints.CONTENT_MAX) {
            throw new BusinessException(
                "Markdown 正文长度需在 "
                    + PostConstraints.CONTENT_MIN
                    + " 到 "
                    + PostConstraints.CONTENT_MAX
                    + " 之间"
            );
        }
        return content;
    }

    private String normalizePostContent(String content, String label) {
        content = content.replace("\r\n", "\n").trim();
        if (content.length() < PostConstraints.CONTENT_MIN || content.length() > PostConstraints.CONTENT_MAX) {
            throw new BusinessException(
                label + "长度需在 "
                    + PostConstraints.CONTENT_MIN
                    + " 到 "
                    + PostConstraints.CONTENT_MAX
                    + " 之间"
            );
        }
        return content;
    }

    private record ContentSource(String content, String sourceFileName) {}

    private List<MultipartFile> normalizeAttachments(List<MultipartFile> attachments) {
        if (attachments == null || attachments.isEmpty()) {
            return List.of();
        }
        List<MultipartFile> filtered = attachments.stream()
            .filter(file -> file != null && !file.isEmpty())
            .toList();
        if (filtered.size() > MAX_ATTACHMENT_COUNT) {
            throw new BusinessException("单帖最多上传 " + MAX_ATTACHMENT_COUNT + " 个附件");
        }
        return filtered;
    }

    private void savePostAttachments(Post post, List<MultipartFile> attachments) {
        Set<String> currentHashes = new HashSet<>();
        for (MultipartFile file : attachments) {
            String originalName = normalizeSourceFileName(file.getOriginalFilename());
            validateAttachmentFile(file, originalName);

            byte[] bytes = readFileBytes(file);
            String hash = sha256Hex(bytes);
            if (!currentHashes.add(hash) || postAttachmentRepository.existsByPostIdAndFileHash(post.getId(), hash)) {
                throw new BusinessException("检测到重复附件: " + originalName);
            }

            String extension = getFileExtension(originalName);
            String cosKey = "community/posts/" + post.getId() + "/" + UUID.randomUUID() + "." + extension;
            String contentType = (file.getContentType() == null || file.getContentType().isBlank())
                ? "application/octet-stream"
                : file.getContentType();

            cosService.uploadFile(new ByteArrayInputStream(bytes), bytes.length, cosKey, contentType);

            postAttachmentRepository.save(PostAttachment.builder()
                .post(post)
                .originalName(originalName)
                .fileSize(file.getSize())
                .fileType(contentType)
                .cosKey(cosKey)
                .fileHash(hash)
                .downloadCount(0)
                .build());
        }
    }

    private void validateAttachmentFile(MultipartFile file, String originalName) {
        if (file.getSize() <= 0) {
            throw new BusinessException("附件不能为空文件: " + originalName);
        }
        if (file.getSize() > MAX_ATTACHMENT_SIZE) {
            throw new BusinessException("附件超过 20MB 限制: " + originalName);
        }
        String extension = getFileExtension(originalName);
        if (!ALLOWED_ATTACHMENT_EXTENSIONS.contains(extension)) {
            throw new BusinessException("不支持的附件格式: ." + extension);
        }
    }

    private String getFileExtension(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot >= fileName.length() - 1) {
            throw new BusinessException("附件必须包含扩展名: " + fileName);
        }
        return fileName.substring(dot + 1).toLowerCase();
    }

    private byte[] readFileBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new BusinessException("附件读取失败: " + file.getOriginalFilename());
        }
    }

    private String sha256Hex(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            StringBuilder builder = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                builder.append(String.format("%02x", b));
            }
            return builder.toString();
        } catch (Exception e) {
            throw new BusinessException("附件哈希计算失败");
        }
    }

    private String normalizeSourceFileName(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "post.md";
        }
        String normalized = originalFilename.replace("\\", "/").trim();
        int lastSlash = normalized.lastIndexOf('/');
        return lastSlash >= 0 ? normalized.substring(lastSlash + 1) : normalized;
    }

    private String resolvePostTitle(String inputTitle, String sourceFileName, String content) {
        String normalizedTitle = inputTitle == null ? "" : inputTitle.trim();
        if (normalizedTitle.isEmpty()) {
            normalizedTitle = extractTitleFromMarkdown(content);
        }
        if (normalizedTitle.isEmpty()) {
            normalizedTitle = sourceFileName.replaceFirst("\\.[^.]+$", "");
        }
        if (normalizedTitle.length() < 6 || normalizedTitle.length() > 60) {
            throw new BusinessException("标题长度需在 6 到 60 个字符之间");
        }
        return normalizedTitle;
    }

    private String extractTitleFromMarkdown(String content) {
        for (String line : content.split("\n")) {
            String trimmedLine = line.trim();
            if (trimmedLine.startsWith("#")) {
                String title = trimmedLine.replaceFirst("^#{1,6}\\s*", "").trim();
                if (!title.isEmpty()) {
                    return title;
                }
            }
        }
        return "";
    }
}
