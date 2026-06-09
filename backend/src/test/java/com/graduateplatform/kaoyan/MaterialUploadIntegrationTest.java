package com.graduateplatform.kaoyan;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.common.security.JwtTokenProvider;
import com.graduateplatform.common.service.CosService;
import com.graduateplatform.kaoyan.entity.ResourceMaterial;
import com.graduateplatform.kaoyan.repository.ResourceMaterialRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MaterialUploadIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtTokenProvider tokenProvider;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired UserRepository userRepository;
    @Autowired ResourceMaterialRepository materialRepository;

    @MockBean CosService cosService;

    private String userToken;

    @BeforeEach
    void setUp() {
        materialRepository.deleteAll();
        String suffix = String.valueOf(System.nanoTime());
        User user = userRepository.save(User.builder()
            .name("测试用户").email("user" + suffix + "@test.local")
            .password(passwordEncoder.encode("pw")).target("kaoyan").role("user").status("normal").build());
        userToken = tokenProvider.generateToken(user.getId(), "user");
    }

    @Test
    void uploadsMaterialWithSingleFile_andPersistsMetadata() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
            "files", "notes.txt", "text/plain", "hello world".getBytes()
        );

        MvcResult result = mockMvc.perform(
            multipart("/api/kaoyan/materials")
                .file(file)
                .param("title", "高数笔记")
                .param("description", "极限与连续")
                .param("school", "北京大学")
                .param("major", "数学")
                .param("subject", "数学一")
                .param("year", "2025")
                .param("materialType", "笔记")
                .header("Authorization", "Bearer " + userToken)
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.title").value("高数笔记"))
            .andExpect(jsonPath("$.data.status").value("PENDING"))
            .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        Long materialId = body.path("data").path("id").asLong();
        assertThat(materialId).isPositive();

        ResourceMaterial saved = materialRepository.findById(materialId).orElseThrow();
        assertThat(saved.getUploaderId()).isPositive();
        assertThat(saved.getStatus().name()).isEqualTo("PENDING");
        assertThat(saved.getActive()).isTrue();

        JsonNode attachments = body.path("data").path("attachments");
        assertThat(attachments.isArray()).isTrue();
        assertThat(attachments.size()).isEqualTo(1);
        assertThat(attachments.get(0).path("originalName").asText()).isEqualTo("notes.txt");
        assertThat(attachments.get(0).path("fileSize").asLong()).isEqualTo(11L);

        verify(cosService, times(1)).uploadFile(any(), anyLong(), anyString(), anyString());
    }

    @Test
    void rejectsUploadWithNoFiles_andCreatesNoMaterialRow() throws Exception {
        long before = materialRepository.count();

        mockMvc.perform(
            multipart("/api/kaoyan/materials")
                .param("title", "空资料")
                .header("Authorization", "Bearer " + userToken)
        )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("文件")));

        assertThat(materialRepository.count()).isEqualTo(before);
        verify(cosService, never()).uploadFile(any(), anyLong(), anyString(), anyString());
    }

    @Test
    void rejectsFileExceeding10Mb_andCreatesNoMaterialRow() throws Exception {
        long before = materialRepository.count();

        byte[] big = new byte[10 * 1024 * 1024 + 1];
        MockMultipartFile file = new MockMultipartFile(
            "files", "big.pdf", "application/pdf", big
        );

        mockMvc.perform(
            multipart("/api/kaoyan/materials")
                .file(file)
                .param("title", "超大文件")
                .header("Authorization", "Bearer " + userToken)
        )
            .andExpect(status().isBadRequest());

        assertThat(materialRepository.count())
            .as("Oversize upload must not create an orphan PENDING material row")
            .isEqualTo(before);
        verify(cosService, never()).uploadFile(any(), anyLong(), anyString(), anyString());
    }

    @Test
    void requiresAuthentication() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
            "files", "notes.txt", "text/plain", "x".getBytes()
        );

        mockMvc.perform(
            multipart("/api/kaoyan/materials")
                .file(file)
                .param("title", "未登录")
        )
            .andExpect(status().isForbidden());
    }
}
