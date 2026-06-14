package com.graduateplatform.community;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.common.security.JwtTokenProvider;
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
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CommunityCommentIntegrationTest {

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

    private User author;
    private User replier;
    private Post post;
    private Post anotherPost;
    private String authorToken;
    private String replierToken;

    @BeforeEach
    void setUp() {
        commentRepository.deleteAll();
        postRepository.deleteAll();
        categoryRepository.deleteAll();

        String suffix = String.valueOf(System.nanoTime());

        author = userRepository.save(User.builder()
            .name("Author-" + suffix)
            .email("author-" + suffix + "@test.local")
            .password(passwordEncoder.encode("pw"))
            .target("job")
            .role("user")
            .status("normal")
            .build());

        replier = userRepository.save(User.builder()
            .name("Replier-" + suffix)
            .email("replier-" + suffix + "@test.local")
            .password(passwordEncoder.encode("pw"))
            .target("job")
            .role("user")
            .status("normal")
            .build());

        PostCategory category = categoryRepository.save(PostCategory.builder()
            .code("community-" + suffix)
            .name("Community")
            .description("test category")
            .build());

        post = postRepository.save(Post.builder()
            .title("Nested comment post")
            .content("# Title\n\nMain content")
            .category(category)
            .visibility("public")
            .anonymous(false)
            .contentFormat("markdown")
            .sourceFileName("post.md")
            .author(author)
            .status("PUBLISHED")
            .build());

        anotherPost = postRepository.save(Post.builder()
            .title("Another post")
            .content("Another content")
            .category(category)
            .visibility("public")
            .anonymous(false)
            .contentFormat("markdown")
            .sourceFileName("another.md")
            .author(author)
            .status("PUBLISHED")
            .build());

        authorToken = tokenProvider.generateToken(author.getId(), "user");
        replierToken = tokenProvider.generateToken(replier.getId(), "user");
    }

    @Test
    void replyingToReplyStaysInSecondLevelAndPreservesReplyTarget() throws Exception {
        String rootResponse = mockMvc.perform(post("/api/posts/" + post.getId() + "/comments")
                .header("Authorization", "Bearer " + authorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("content", "Root comment"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.content").value("Root comment"))
            .andExpect(jsonPath("$.data.replyCount").value(0))
            .andExpect(jsonPath("$.data.replies.length()").value(0))
            .andReturn()
            .getResponse()
            .getContentAsString();

        long rootId = objectMapper.readTree(rootResponse).path("data").path("id").asLong();

        String replyResponse = mockMvc.perform(post("/api/posts/" + post.getId() + "/comments")
                .header("Authorization", "Bearer " + replierToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "content", "Reply comment",
                    "parentId", rootId
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.parentId").value(rootId))
            .andExpect(jsonPath("$.data.authorName").value(replier.getName()))
            .andReturn()
            .getResponse()
            .getContentAsString();

        long replyId = objectMapper.readTree(replyResponse).path("data").path("id").asLong();

        mockMvc.perform(post("/api/posts/" + post.getId() + "/comments")
                .header("Authorization", "Bearer " + authorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "content", "Nested reply",
                    "parentId", replyId
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.parentId").value(rootId))
            .andExpect(jsonPath("$.data.replyToId").value(replyId))
            .andExpect(jsonPath("$.data.replyToAuthorName").value(replier.getName()));

        mockMvc.perform(post("/api/posts/" + post.getId() + "/comments")
                .header("Authorization", "Bearer " + authorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("content", "Second root comment"))))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/posts/" + post.getId() + "/comments"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(2))
            .andExpect(jsonPath("$.data[0].content").value("Root comment"))
            .andExpect(jsonPath("$.data[0].replyCount").value(2))
            .andExpect(jsonPath("$.data[0].replies.length()").value(2))
            .andExpect(jsonPath("$.data[0].replies[0].content").value("Reply comment"))
            .andExpect(jsonPath("$.data[0].replies[0].replyCount").value(0))
            .andExpect(jsonPath("$.data[0].replies[1].content").value("Nested reply"))
            .andExpect(jsonPath("$.data[0].replies[1].replyToId").value(replyId))
            .andExpect(jsonPath("$.data[0].replies[1].replyToAuthorName").value(replier.getName()))
            .andExpect(jsonPath("$.data[0].replies[1].replies.length()").value(0))
            .andExpect(jsonPath("$.data[1].content").value("Second root comment"));
    }

    @Test
    void replyingToCommentFromAnotherPostIsRejected() throws Exception {
        Comment foreignComment = commentRepository.save(Comment.builder()
            .content("Foreign comment")
            .post(anotherPost)
            .author(author)
            .status("PUBLISHED")
            .build());

        mockMvc.perform(post("/api/posts/" + post.getId() + "/comments")
                .header("Authorization", "Bearer " + replierToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "content", "Invalid reply",
                    "parentId", foreignComment.getId()
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("回复的评论不存在或不属于当前帖子"));
    }

    @Test
    void deletingLeafCommentRemovesItFromPublicThreadAndCount() throws Exception {
        String rootResponse = mockMvc.perform(post("/api/posts/" + post.getId() + "/comments")
                .header("Authorization", "Bearer " + authorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("content", "Leaf comment"))))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

        long rootId = objectMapper.readTree(rootResponse).path("data").path("id").asLong();

        mockMvc.perform(delete("/api/posts/" + post.getId() + "/comments/" + rootId)
                .header("Authorization", "Bearer " + authorToken))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/posts/" + post.getId() + "/comments"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(0));

        mockMvc.perform(get("/api/posts/" + post.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.commentCount").value(0));
    }

    @Test
    void deletingCommentWithRepliesKeepsPlaceholderAndPreservesReplies() throws Exception {
        String rootResponse = mockMvc.perform(post("/api/posts/" + post.getId() + "/comments")
                .header("Authorization", "Bearer " + authorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("content", "Parent comment"))))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

        long rootId = objectMapper.readTree(rootResponse).path("data").path("id").asLong();

        mockMvc.perform(post("/api/posts/" + post.getId() + "/comments")
                .header("Authorization", "Bearer " + replierToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "content", "Child reply",
                    "parentId", rootId
                ))))
            .andExpect(status().isOk());

        mockMvc.perform(delete("/api/posts/" + post.getId() + "/comments/" + rootId)
                .header("Authorization", "Bearer " + authorToken))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/posts/" + post.getId() + "/comments"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].content").value("该评论已被作者删除"))
            .andExpect(jsonPath("$.data[0].deleted").value(true))
            .andExpect(jsonPath("$.data[0].authorId").value(org.hamcrest.Matchers.nullValue()))
            .andExpect(jsonPath("$.data[0].authorName").value(""))
            .andExpect(jsonPath("$.data[0].replyCount").value(1))
            .andExpect(jsonPath("$.data[0].replies.length()").value(1))
            .andExpect(jsonPath("$.data[0].replies[0].content").value("Child reply"));

        mockMvc.perform(get("/api/posts/" + post.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.commentCount").value(1));
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
