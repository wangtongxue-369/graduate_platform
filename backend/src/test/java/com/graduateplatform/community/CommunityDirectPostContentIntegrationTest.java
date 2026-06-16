package com.graduateplatform.community;

import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.common.security.JwtTokenProvider;
import com.graduateplatform.community.entity.PostCategory;
import com.graduateplatform.community.repository.CommentRepository;
import com.graduateplatform.community.repository.PostCategoryRepository;
import com.graduateplatform.community.repository.PostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CommunityDirectPostContentIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

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

    private String authorToken;
    private PostCategory category;

    @BeforeEach
    void setUp() {
        commentRepository.deleteAll();
        postRepository.deleteAll();
        categoryRepository.deleteAll();

        String suffix = String.valueOf(System.nanoTime());
        User author = oldUser("direct-author-" + suffix, "user");
        category = categoryRepository.save(PostCategory.builder()
            .code("direct-" + suffix)
            .name("Direct")
            .description("direct input category")
            .active(true)
            .sortOrder(1)
            .build());
        authorToken = tokenProvider.generateToken(author.getId(), "user");
    }

    @Test
    void userCanCreatePostWithInlineMarkdownContentWithoutMarkdownFile() throws Exception {
        mockMvc.perform(multipart("/api/posts")
                .param("title", "Inline Markdown Title")
                .param("categoryCode", category.getCode())
                .param("visibility", "public")
                .param("status", "PENDING")
                .param("content", "# Inline Markdown Title\n\nThis post was written directly in the composer.")
                .header("Authorization", "Bearer " + authorToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.title").value("Inline Markdown Title"))
            .andExpect(jsonPath("$.data.content").value(org.hamcrest.Matchers.containsString("directly in the composer")))
            .andExpect(jsonPath("$.data.contentFormat").value("markdown"))
            .andExpect(jsonPath("$.data.sourceFileName").value("inline-content.md"));
    }

    @Test
    void emptyMarkdownFileShowsAClearValidationMessage() throws Exception {
        MockMultipartFile emptyMarkdown = new MockMultipartFile(
            "markdownFile",
            "empty.md",
            "text/markdown",
            new byte[0]
        );

        mockMvc.perform(multipart("/api/posts")
                .file(emptyMarkdown)
                .param("title", "Markdown Upload Title")
                .param("categoryCode", category.getCode())
                .param("visibility", "public")
                .param("status", "PENDING")
                .header("Authorization", "Bearer " + authorToken))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("你选择的 Markdown 文件是空文件，请确认内容后重新上传。"));
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
}
