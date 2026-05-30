package com.graduateplatform.user.service;

import com.graduateplatform.user.dto.UpdateProfileRequest;
import com.graduateplatform.user.dto.UpdateMyPostRequest;
import com.graduateplatform.questionbank.entity.Attempt;
import com.graduateplatform.community.entity.Comment;
import com.graduateplatform.community.entity.Post;
import com.graduateplatform.community.entity.PostCategory;
import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.questionbank.repository.AttemptRepository;
import com.graduateplatform.community.repository.CommentRepository;
import com.graduateplatform.community.repository.PostCategoryRepository;
import com.graduateplatform.community.repository.PostRepository;
import com.graduateplatform.common.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class UserService {

    private static final Set<String> VALID_TARGETS = Set.of("kaoyan", "kaogong", "job", "liuxue");

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostCategoryRepository postCategoryRepository;
    private final CommentRepository commentRepository;
    private final AttemptRepository attemptRepository;

    public UserService(UserRepository userRepository, PostRepository postRepository,
                       PostCategoryRepository postCategoryRepository,
                       CommentRepository commentRepository, AttemptRepository attemptRepository) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.postCategoryRepository = postCategoryRepository;
        this.commentRepository = commentRepository;
        this.attemptRepository = attemptRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getProfile(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("用户不存在"));
        return toProfileMap(user);
    }

    @Transactional
    public Map<String, Object> updateProfile(Long userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("用户不存在"));

        String target = normalize(req.getTarget());
        if (target != null && !VALID_TARGETS.contains(target)) {
            throw new BusinessException("目标方向无效");
        }

        user.setName(req.getName().trim());
        user.setSchool(normalize(req.getSchool()));
        user.setMajor(normalize(req.getMajor()));
        user.setGrade(normalize(req.getGrade()));
        user.setTarget(target != null ? target : user.getTarget());
        user.setIntentRegion(normalize(req.getIntentRegion()));
        userRepository.save(user);

        return toProfileMap(user);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboard(Long userId) {
        userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("用户不存在"));

        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("postCount", postRepository.countByAuthorId(userId));
        dashboard.put("commentCount", commentRepository.countByAuthorId(userId));
        dashboard.put("attemptCount", attemptRepository.countByUserId(userId));
        dashboard.put("checkinCount", 0); // future
        return dashboard;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMyPosts(Long userId, int page, int size) {
        userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("用户不存在"));
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Post> postPage = postRepository.findByAuthorIdOrderByCreatedAtDesc(userId, pageable);

        List<Map<String, Object>> content = postPage.getContent().stream()
            .map(this::toMyPostMap)
            .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", content);
        result.put("totalPages", postPage.getTotalPages());
        result.put("totalElements", postPage.getTotalElements());
        result.put("number", postPage.getNumber());
        result.put("size", postPage.getSize());
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMyPost(Long userId, Long postId) {
        userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("用户不存在"));
        Post post = postRepository.findByIdAndAuthorId(postId, userId)
            .orElseThrow(() -> new BusinessException("帖子不存在或无权查看"));
        return toMyPostMap(post);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMyComments(Long userId, int page, int size) {
        userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("用户不存在"));
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Comment> commentPage = commentRepository.findByAuthorIdOrderByCreatedAtDesc(userId, pageable);

        List<Map<String, Object>> content = commentPage.getContent().stream().map(comment -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", comment.getId());
            map.put("content", comment.getContent());
            map.put("status", comment.getStatus());
            map.put("postId", comment.getPost() != null ? comment.getPost().getId() : null);
            map.put("postTitle", comment.getPost() != null ? comment.getPost().getTitle() : null);
            map.put("createdAt", comment.getCreatedAt() != null ? comment.getCreatedAt().toString() : null);
            return map;
        }).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", content);
        result.put("totalPages", commentPage.getTotalPages());
        result.put("totalElements", commentPage.getTotalElements());
        result.put("number", commentPage.getNumber());
        result.put("size", commentPage.getSize());
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMyAttempts(Long userId, int page, int size,
                                             Boolean correct, String keyword,
                                             String dateFrom, String dateTo) {
        userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("用户不存在"));
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        String normalizedKeyword = normalize(keyword);
        LocalDateTime fromTime = parseDateStart(dateFrom);
        LocalDateTime toTime = parseDateEnd(dateTo);
        if (fromTime != null && toTime != null && fromTime.isAfter(toTime)) {
            throw new BusinessException("开始日期不能晚于结束日期");
        }
        Page<Attempt> attemptPage = attemptRepository.findByUserWithFilters(
            userId, correct, normalizedKeyword, fromTime, toTime, pageable
        );

        List<Map<String, Object>> content = attemptPage.getContent().stream().map(attempt -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", attempt.getId());
            map.put("questionId", attempt.getQuestion() != null ? attempt.getQuestion().getId() : null);
            map.put("questionStem", attempt.getQuestion() != null ? attempt.getQuestion().getStem() : null);
            map.put("answer", attempt.getAnswer());
            map.put("correct", attempt.getCorrect());
            map.put("createdAt", attempt.getCreatedAt() != null ? attempt.getCreatedAt().toString() : null);
            return map;
        }).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", content);
        result.put("totalPages", attemptPage.getTotalPages());
        result.put("totalElements", attemptPage.getTotalElements());
        result.put("number", attemptPage.getNumber());
        result.put("size", attemptPage.getSize());
        return result;
    }

    @Transactional
    public Map<String, Object> updateMyPost(Long userId, Long postId, UpdateMyPostRequest req) {
        Post post = postRepository.findByIdAndAuthorId(postId, userId)
            .orElseThrow(() -> new BusinessException("帖子不存在或无权修改"));

        PostCategory category = postCategoryRepository.findByCode(req.getCategoryCode())
            .orElseThrow(() -> new BusinessException("分类不存在"));

        post.setTitle(req.getTitle().trim());
        post.setContent(req.getContent().trim());
        post.setCategory(category);
        post.setTags(normalizeTags(req.getTags()));
        post.setVisibility(normalizeVisibility(req.getVisibility()));
        post.setAnonymous(Boolean.TRUE.equals(req.getAnonymous()));
        postRepository.save(post);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", post.getId());
        result.put("title", post.getTitle());
        result.put("status", post.getStatus());
        result.put("category", post.getCategory().getName());
        result.put("updatedAt", post.getUpdatedAt() != null ? post.getUpdatedAt().toString() : null);
        return result;
    }

    @Transactional
    public void deleteMyPost(Long userId, Long postId) {
        Post post = postRepository.findByIdAndAuthorId(postId, userId)
            .orElseThrow(() -> new BusinessException("帖子不存在或无权删除"));
        postRepository.delete(post);
    }

    @Transactional
    public void deleteMyComment(Long userId, Long commentId) {
        Comment comment = commentRepository.findByIdAndAuthorId(commentId, userId)
            .orElseThrow(() -> new BusinessException("评论不存在或无权删除"));
        commentRepository.delete(comment);
    }

    private Map<String, Object> toProfileMap(User user) {
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("name", user.getName());
        profile.put("email", user.getEmail());
        profile.put("phone", user.getPhone());
        profile.put("studentId", user.getStudentId());
        profile.put("target", user.getTarget());
        profile.put("school", user.getSchool());
        profile.put("major", user.getMajor());
        profile.put("grade", user.getGrade());
        profile.put("intentRegion", user.getIntentRegion());
        profile.put("role", user.getRole());
        profile.put("status", user.getStatus());

        Map<String, Object> security = new LinkedHashMap<>();
        security.put("lastLoginAt", user.getLastLoginAt() != null ? user.getLastLoginAt().toString() : null);
        security.put("lastDevice", user.getLastLoginDevice());
        security.put("lastLocation", user.getLastLoginIp());
        security.put("lastIp", user.getLastLoginIp());
        profile.put("security", security);

        profile.put("lastLoginAt", user.getLastLoginAt() != null ? user.getLastLoginAt().toString() : null);
        profile.put("lastLoginIp", user.getLastLoginIp());
        profile.put("lastLoginDevice", user.getLastLoginDevice());
        profile.put("lastDevice", user.getLastLoginDevice());
        profile.put("lastLocation", user.getLastLoginIp());
        profile.put("lastIp", user.getLastLoginIp());
        return profile;
    }

    private Map<String, Object> toMyPostMap(Post post) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", post.getId());
        map.put("title", post.getTitle());
        map.put("content", post.getContent());
        map.put("status", post.getStatus());
        map.put("category", post.getCategory() != null ? post.getCategory().getName() : null);
        map.put("categoryCode", post.getCategory() != null ? post.getCategory().getCode() : null);
        map.put("tags", post.getTags());
        map.put("visibility", post.getVisibility());
        map.put("anonymous", post.getAnonymous());
        map.put("viewCount", post.getViewCount());
        map.put("commentCount", post.getCommentCount());
        map.put("likeCount", post.getLikeCount());
        map.put("favoriteCount", post.getFavoriteCount());
        map.put("hasAttachment", post.getHasAttachment());
        map.put("attachmentNote", post.getAttachmentNote());
        map.put("contentFormat", post.getContentFormat());
        map.put("sourceFileName", post.getSourceFileName());
        map.put("createdAt", post.getCreatedAt() != null ? post.getCreatedAt().toString() : null);
        map.put("updatedAt", post.getUpdatedAt() != null ? post.getUpdatedAt().toString() : null);
        return map;
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeTags(String tags) {
        String normalized = normalize(tags);
        if (normalized == null) {
            return null;
        }
        String[] parts = normalized.split(",");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            String t = part == null ? "" : part.trim();
            if (t.isEmpty()) continue;
            if (sb.length() > 0) sb.append(",");
            sb.append(t);
        }
        return sb.length() == 0 ? null : sb.toString();
    }

    private String normalizeVisibility(String visibility) {
        String normalized = normalize(visibility);
        if (normalized == null) return "public";
        if (!"public".equals(normalized) && !"members".equals(normalized)) {
            throw new BusinessException("可见范围仅支持 public 或 members");
        }
        return normalized;
    }

    private LocalDateTime parseDateStart(String dateText) {
        String normalized = normalize(dateText);
        if (normalized == null) return null;
        return LocalDate.parse(normalized).atStartOfDay();
    }

    private LocalDateTime parseDateEnd(String dateText) {
        String normalized = normalize(dateText);
        if (normalized == null) return null;
        return LocalDate.parse(normalized).atTime(23, 59, 59);
    }
}

