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
import com.graduateplatform.community.repository.PostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CommunityCategoryAdminIntegrationTest {

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

    private String adminToken;
    private User author;

    @BeforeEach
    void setUp() {
        commentRepository.deleteAll();
        postRepository.deleteAll();
        categoryRepository.deleteAll();

        String suffix = String.valueOf(System.nanoTime());
        User admin = oldUser("category-admin-" + suffix, "admin");
        author = oldUser("category-author-" + suffix, "user");
        adminToken = tokenProvider.generateToken(admin.getId(), "admin");
    }

    @Test
    void adminCanCreateUpdateDisableAndPublicListOnlyShowsActiveSortedCategories() throws Exception {
        String createResponse = mockMvc.perform(post("/api/admin/post-categories")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "code", "alpha",
                    "name", "Alpha",
                    "description", "first",
                    "sortOrder", 20,
                    "active", true
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.code").value("alpha"))
            .andReturn()
            .getResponse()
            .getContentAsString();

        long alphaId = objectMapper.readTree(createResponse).path("data").path("id").asLong();

        mockMvc.perform(post("/api/admin/post-categories")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "code", "beta",
                    "name", "Beta",
                    "description", "second",
                    "sortOrder", 10,
                    "active", true
                ))))
            .andExpect(status().isOk());

        mockMvc.perform(put("/api/admin/post-categories/" + alphaId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "name", "Alpha Updated",
                    "description", "updated",
                    "sortOrder", 30,
                    "active", false
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("Alpha Updated"))
            .andExpect(jsonPath("$.data.active").value(false));

        mockMvc.perform(get("/api/post-categories"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].code").value("beta"));

        mockMvc.perform(get("/api/admin/post-categories")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(2))
            .andExpect(jsonPath("$.data[0].code").value("beta"))
            .andExpect(jsonPath("$.data[1].code").value("alpha"));
    }

    @Test
    void adminCanMergeCategoryPostsIntoTargetAndDisableSource() throws Exception {
        PostCategory source = categoryRepository.save(PostCategory.builder()
            .code("old")
            .name("Old")
            .sortOrder(1)
            .active(true)
            .build());
        PostCategory target = categoryRepository.save(PostCategory.builder()
            .code("new")
            .name("New")
            .sortOrder(2)
            .active(true)
            .build());
        Post post = postRepository.save(Post.builder()
            .title("Category merge target")
            .content("content")
            .category(source)
            .visibility("public")
            .anonymous(false)
            .contentFormat("markdown")
            .sourceFileName("merge.md")
            .author(author)
            .status("PUBLISHED")
            .build());

        mockMvc.perform(post("/api/admin/post-categories/" + source.getId() + "/merge")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("targetId", target.getId()))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.source.active").value(false))
            .andExpect(jsonPath("$.data.target.code").value("new"))
            .andExpect(jsonPath("$.data.movedPostCount").value(1));

        Post reloadedPost = postRepository.findById(post.getId()).orElseThrow();
        PostCategory reloadedSource = categoryRepository.findById(source.getId()).orElseThrow();
        assertEquals(target.getId(), reloadedPost.getCategory().getId());
        assertFalse(reloadedSource.getActive());
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

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
