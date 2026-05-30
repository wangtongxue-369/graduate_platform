package com.graduateplatform.community;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.community.entity.Comment;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CommunityHotSortIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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

    private User author;
    private Post highEngagementPost;
    private Post highViewPost;
    private Post reportedPost;

    @BeforeEach
    void setUp() {
        commentRepository.deleteAll();
        postRepository.deleteAll();
        categoryRepository.deleteAll();

        String suffix = String.valueOf(System.nanoTime());
        author = userRepository.save(User.builder()
            .name("HotSort-" + suffix)
            .email("hotsort-" + suffix + "@test.local")
            .password(passwordEncoder.encode("pw"))
            .target("job")
            .role("user")
            .status("normal")
            .build());

        PostCategory category = categoryRepository.save(PostCategory.builder()
            .code("hot-sort-" + suffix)
            .name("Hot Sort")
            .description("test category")
            .build());

        highEngagementPost = postRepository.save(Post.builder()
            .title("High engagement")
            .content("A")
            .category(category)
            .visibility("public")
            .anonymous(false)
            .contentFormat("markdown")
            .sourceFileName("a.md")
            .author(author)
            .status("PUBLISHED")
            .viewCount(120)
            .likeCount(20)
            .favoriteCount(10)
            .reportCount(0)
            .build());

        highViewPost = postRepository.save(Post.builder()
            .title("High views")
            .content("B")
            .category(category)
            .visibility("public")
            .anonymous(false)
            .contentFormat("markdown")
            .sourceFileName("b.md")
            .author(author)
            .status("PUBLISHED")
            .viewCount(500)
            .likeCount(0)
            .favoriteCount(0)
            .reportCount(0)
            .build());

        reportedPost = postRepository.save(Post.builder()
            .title("Reported")
            .content("C")
            .category(category)
            .visibility("public")
            .anonymous(false)
            .contentFormat("markdown")
            .sourceFileName("c.md")
            .author(author)
            .status("PUBLISHED")
            .viewCount(400)
            .likeCount(5)
            .favoriteCount(0)
            .reportCount(10)
            .build());

        for (int i = 0; i < 5; i++) {
            commentRepository.save(Comment.builder()
                .content("engagement comment " + i)
                .post(highEngagementPost)
                .author(author)
                .status("PUBLISHED")
                .build());
        }

        commentRepository.save(Comment.builder()
            .content("reported comment")
            .post(reportedPost)
            .author(author)
            .status("PUBLISHED")
            .build());
    }

    @Test
    void hotSortUsesCompositeScoreInsteadOfViewCountOnly() throws Exception {
        String response = mockMvc.perform(get("/api/posts")
                .param("sort", "hot")
                .param("page", "0")
                .param("size", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andReturn()
            .getResponse()
            .getContentAsString();

        JsonNode content = objectMapper.readTree(response).path("data").path("content");
        assertEquals(3, content.size());
        assertEquals(highEngagementPost.getId().longValue(), content.get(0).path("id").asLong());
        assertEquals(highViewPost.getId().longValue(), content.get(1).path("id").asLong());
        assertEquals(reportedPost.getId().longValue(), content.get(2).path("id").asLong());
    }
}

