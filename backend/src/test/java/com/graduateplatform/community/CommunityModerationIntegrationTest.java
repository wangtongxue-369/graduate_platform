package com.graduateplatform.community;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.common.security.JwtTokenProvider;
import com.graduateplatform.community.entity.Post;
import com.graduateplatform.community.entity.PostCategory;
import com.graduateplatform.community.repository.CommentRepository;
import com.graduateplatform.community.repository.PostCategoryRepository;
import com.graduateplatform.community.repository.PostReportRepository;
import com.graduateplatform.community.repository.PostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CommunityModerationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostCategoryRepository categoryRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PostReportRepository postReportRepository;

    private User author;
    private User admin;
    private PostCategory category;
    private String authorToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        postReportRepository.deleteAll();
        commentRepository.deleteAll();
        postRepository.deleteAll();
        categoryRepository.deleteAll();

        String suffix = String.valueOf(System.nanoTime());
        author = oldUser("moderation-author-" + suffix, "user");
        admin = oldUser("moderation-admin-" + suffix, "admin");

        category = categoryRepository.save(PostCategory.builder()
            .code("moderation-" + suffix)
            .name("Moderation")
            .description("moderation category")
            .build());

        authorToken = tokenProvider.generateToken(author.getId(), "user");
        adminToken = tokenProvider.generateToken(admin.getId(), "admin");
    }

    @Test
    void sensitivePostGoesToReviewAndCreatesFeedback() throws Exception {
        String response = mockMvc.perform(multipart("/api/posts")
                .file(markdown("post.md", "# Sensitive\n\n这里包含违规词，需要审核。"))
                .param("title", "普通社区标题")
                .param("categoryCode", category.getCode())
                .param("visibility", "public")
                .param("status", "PENDING")
                .header("Authorization", "Bearer " + authorToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("PENDING"))
            .andExpect(jsonPath("$.data.reviewReason").value(org.hamcrest.Matchers.containsString("敏感词")))
            .andReturn()
            .getResponse()
            .getContentAsString();

        long postId = objectMapper.readTree(response).path("data").path("id").asLong();
        mockMvc.perform(get("/api/community/notifications")
                .header("Authorization", "Bearer " + authorToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content[0].relatedType").value("POST"))
            .andExpect(jsonPath("$.data.content[0].relatedId").value((int) postId))
            .andExpect(jsonPath("$.data.content[0].content").value(org.hamcrest.Matchers.containsString("敏感词")));
    }

    @Test
    void sensitiveCommentIsHiddenAndCreatesFeedback() throws Exception {
        Post post = publishedPost("Comment moderation");

        mockMvc.perform(post("/api/posts/" + post.getId() + "/comments")
                .header("Authorization", "Bearer " + authorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("content", "这条评论包含违规词"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("HIDDEN"))
            .andExpect(jsonPath("$.data.hidden").value(true));

        mockMvc.perform(get("/api/posts/" + post.getId() + "/comments"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(0));

        mockMvc.perform(get("/api/community/notifications")
                .header("Authorization", "Bearer " + authorToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content[0].relatedType").value("COMMENT"))
            .andExpect(jsonPath("$.data.content[0].content").value(org.hamcrest.Matchers.containsString("敏感词")));
    }

    @Test
    void repeatedPostReportsAutomaticallyOfflinePostAndNotifyAuthor() throws Exception {
        Post post = publishedPost("Reported post");
        List<User> reporters = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            reporters.add(oldUser("reporter-" + i + "-" + System.nanoTime(), "user"));
        }

        for (User reporter : reporters) {
            mockMvc.perform(post("/api/posts/" + post.getId() + "/report")
                    .header("Authorization", "Bearer " + tokenProvider.generateToken(reporter.getId(), "user"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json(Map.of("reason", "内容疑似违规"))))
                .andExpect(status().isOk());
        }

        mockMvc.perform(get("/api/posts/" + post.getId()))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));

        Post reloaded = postRepository.findById(post.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("OFFLINE", reloaded.getStatus());

        mockMvc.perform(get("/api/community/notifications")
                .header("Authorization", "Bearer " + authorToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content[0].relatedType").value("POST"))
            .andExpect(jsonPath("$.data.content[0].content").value(org.hamcrest.Matchers.containsString("多次举报")));
    }

    @Test
    void adminPostReviewCreatesAuthorFeedback() throws Exception {
        Post post = postRepository.save(Post.builder()
            .title("Pending review")
            .content("Review me")
            .category(category)
            .visibility("public")
            .anonymous(false)
            .contentFormat("markdown")
            .sourceFileName("review.md")
            .author(author)
            .status("PENDING")
            .build());

        mockMvc.perform(put("/api/admin/posts/" + post.getId() + "/review")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("action", "APPROVE", "reason", ""))))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/community/notifications")
                .header("Authorization", "Bearer " + authorToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content[0].relatedType").value("POST"))
            .andExpect(jsonPath("$.data.content[0].relatedId").value(post.getId().intValue()))
            .andExpect(jsonPath("$.data.content[0].title").value(org.hamcrest.Matchers.containsString("已通过")));
    }

    private User oldUser(String name, String role) {
        User user = userRepository.save(User.builder()
            .name(name)
            .email(name + "@test.local")
            .password(passwordEncoder.encode("pw"))
            .target("job")
            .role(role)
            .status("normal")
            .build());
        user.setCreatedAt(LocalDateTime.now().minusDays(30));
        return userRepository.save(user);
    }

    private Post publishedPost(String title) {
        return postRepository.save(Post.builder()
            .title(title)
            .content("Published content")
            .category(category)
            .visibility("public")
            .anonymous(false)
            .contentFormat("markdown")
            .sourceFileName("published.md")
            .author(author)
            .status("PUBLISHED")
            .build());
    }

    private MockMultipartFile markdown(String name, String content) {
        return new MockMultipartFile("markdownFile", name, "text/markdown", content.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
