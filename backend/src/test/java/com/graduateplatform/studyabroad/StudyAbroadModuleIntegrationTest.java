package com.graduateplatform.studyabroad;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.common.security.JwtTokenProvider;
import com.graduateplatform.common.service.CosService;
import com.graduateplatform.init.DataInitializer;
import com.graduateplatform.studyabroad.repository.StudyAbroadApplicationRepository;
import com.graduateplatform.studyabroad.repository.StudyAbroadExperienceRepository;
import com.graduateplatform.studyabroad.repository.StudyAbroadMaterialAttachmentRepository;
import com.graduateplatform.studyabroad.repository.StudyAbroadMaterialRepository;
import com.graduateplatform.studyabroad.repository.StudyAbroadTimelineRepository;
import com.qcloud.cos.model.COSObject;
import com.qcloud.cos.model.ObjectMetadata;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StudyAbroadModuleIntegrationTest {
    @MockBean DataInitializer dataInitializer;
    @MockBean CosService cosService;

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtTokenProvider tokenProvider;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired UserRepository userRepository;
    @Autowired StudyAbroadApplicationRepository applicationRepository;
    @Autowired StudyAbroadTimelineRepository timelineRepository;
    @Autowired StudyAbroadMaterialRepository materialRepository;
    @Autowired StudyAbroadExperienceRepository experienceRepository;
    @Autowired StudyAbroadMaterialAttachmentRepository materialAttachmentRepository;

    private String userToken;
    private String otherToken;

    @BeforeEach
    void setUp() {
        materialAttachmentRepository.deleteAll();
        experienceRepository.deleteAll();
        materialRepository.deleteAll();
        timelineRepository.deleteAll();
        applicationRepository.deleteAll();

        String suffix = String.valueOf(System.nanoTime());
        User user = userRepository.save(User.builder()
            .name("Study Abroad User").email("liuxue" + suffix + "@test.local")
            .password(passwordEncoder.encode("pw")).target("liuxue").role("user").status("normal").build());
        User other = userRepository.save(User.builder()
            .name("Other Study Abroad User").email("liuxue-other" + suffix + "@test.local")
            .password(passwordEncoder.encode("pw")).target("liuxue").role("user").status("normal").build());
        userToken = tokenProvider.generateToken(user.getId(), "user");
        otherToken = tokenProvider.generateToken(other.getId(), "user");

        when(cosService.uploadFile(any(), anyLong(), anyString(), anyString()))
            .thenReturn("https://cos.test/studyabroad/mock-file");
    }

    @Test
    void applicationTimelineAndMaterialRoundTripWithOwnershipChecks() throws Exception {
        String applicationResponse = mockMvc.perform(post("/api/studyabroad/applications")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "country", "UK",
                    "school", "University College London",
                    "program", "Computer Science MSc",
                    "degree", "Master",
                    "intake", "2027 Fall",
                    "applicationRound", "Round 1",
                    "deadline", "2026-10-15",
                    "status", "preparing",
                    "priority", "dream",
                    "note", "Prepare application package"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.school").value("University College London"))
            .andReturn().getResponse().getContentAsString();
        long applicationId = objectMapper.readTree(applicationResponse).path("data").path("id").asLong();

        String timelineResponse = mockMvc.perform(post("/api/studyabroad/timeline")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "applicationId", applicationId,
                    "title", "Submit online application",
                    "country", "UK",
                    "school", "University College London",
                    "phase", "Submission",
                    "dueDate", "2026-10-10",
                    "status", "todo",
                    "note", "Upload final documents"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.applicationSchool").value("University College London"))
            .andReturn().getResponse().getContentAsString();
        long timelineId = objectMapper.readTree(timelineResponse).path("data").path("id").asLong();

        mockMvc.perform(post("/api/studyabroad/materials")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "applicationId", applicationId,
                    "title", "Personal Statement",
                    "country", "UK",
                    "stage", "Documents",
                    "category", "Writing",
                    "deadline", "2026-08-10",
                    "completed", false,
                    "note", "Second draft"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.applicationProgram").value("Computer Science MSc"));

        mockMvc.perform(get("/api/studyabroad/timeline").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].applicationId").value(applicationId));

        mockMvc.perform(put("/api/studyabroad/timeline/" + timelineId)
                .header("Authorization", "Bearer " + otherToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "title", "Other update",
                    "country", "UK",
                    "school", "University College London",
                    "phase", "Submission",
                    "dueDate", "2026-10-11",
                    "status", "doing",
                    "note", "Should fail"
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(delete("/api/studyabroad/applications/" + applicationId)
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/studyabroad/timeline").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isEmpty());

        mockMvc.perform(get("/api/studyabroad/materials").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void experienceCreateSearchAndOwnershipDeleteFlow() throws Exception {
        String createResponse = mockMvc.perform(post("/api/studyabroad/experiences")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "title", "UK PS writing notes",
                    "country", "UK",
                    "topic", "Writing",
                    "authorName", "Study Abroad User",
                    "readTime", "6 min",
                    "summary", "Connect course fit with project experience.",
                    "content", "A clear PS should explain program fit, project evidence, and future plan.",
                    "tags", "PS,course fit,documents"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.tags[0]").value("PS"))
            .andReturn().getResponse().getContentAsString();
        long experienceId = objectMapper.readTree(createResponse).path("data").path("id").asLong();

        mockMvc.perform(get("/api/studyabroad/experiences")
                .param("country", "UK")
                .param("topic", "Writing")
                .param("keyword", "PS"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].title").value("UK PS writing notes"));

        mockMvc.perform(get("/api/studyabroad/experiences/page")
                .param("country", "UK")
                .param("topic", "Writing")
                .param("keyword", "PS")
                .param("page", "0")
                .param("size", "6"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content[0].title").value("UK PS writing notes"))
            .andExpect(jsonPath("$.data.totalElements").value(1));

        mockMvc.perform(put("/api/studyabroad/experiences/" + experienceId)
                .header("Authorization", "Bearer " + otherToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "title", "Other edit",
                    "country", "UK",
                    "topic", "Writing",
                    "authorName", "Other",
                    "readTime", "3 min",
                    "summary", "Should not edit.",
                    "content", "Should not edit.",
                    "tags", "blocked"
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(put("/api/studyabroad/experiences/" + experienceId)
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "title", "Updated UK PS writing notes",
                    "country", "UK",
                    "topic", "Writing",
                    "authorName", "Study Abroad User",
                    "readTime", "7 min",
                    "summary", "Updated summary.",
                    "content", "Updated content.",
                    "tags", "PS,updated"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.title").value("Updated UK PS writing notes"))
            .andExpect(jsonPath("$.data.tags[1]").value("updated"));

        mockMvc.perform(delete("/api/studyabroad/experiences/" + experienceId)
                .header("Authorization", "Bearer " + otherToken))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(delete("/api/studyabroad/experiences/" + experienceId)
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk());
    }

    @Test
    void materialAttachmentUploadDownloadDeleteFlowWithOwnershipChecks() throws Exception {
        String applicationResponse = mockMvc.perform(post("/api/studyabroad/applications")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "country", "UK",
                    "school", "University of Edinburgh",
                    "program", "Data Science MSc",
                    "degree", "Master",
                    "intake", "2027 Fall",
                    "applicationRound", "Round 1",
                    "deadline", "2026-10-20",
                    "status", "preparing",
                    "priority", "match",
                    "note", "Prepare documents"
                ))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();
        long applicationId = objectMapper.readTree(applicationResponse).path("data").path("id").asLong();

        String materialResponse = mockMvc.perform(post("/api/studyabroad/materials")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "applicationId", applicationId,
                    "title", "CV",
                    "country", "UK",
                    "stage", "Documents",
                    "category", "Resume",
                    "deadline", "2026-08-20",
                    "completed", false,
                    "note", "One-page academic CV"
                ))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();
        long materialId = objectMapper.readTree(materialResponse).path("data").path("id").asLong();

        MockMultipartFile file = new MockMultipartFile(
            "files",
            "cv.pdf",
            "application/pdf",
            "mock cv content".getBytes(StandardCharsets.UTF_8)
        );
        String uploadResponse = mockMvc.perform(multipart("/api/studyabroad/materials/" + materialId + "/attachments")
                .file(file)
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.attachments[0].originalName").value("cv.pdf"))
            .andReturn().getResponse().getContentAsString();
        long attachmentId = objectMapper.readTree(uploadResponse)
            .path("data").path("attachments").path(0).path("id").asLong();

        mockMvc.perform(get("/api/studyabroad/materials/" + materialId + "/attachments/" + attachmentId + "/download")
                .header("Authorization", "Bearer " + otherToken))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));

        when(cosService.getObject(anyString())).thenReturn(cosObject("downloaded cv content", "application/pdf"));

        mockMvc.perform(get("/api/studyabroad/materials/" + materialId + "/attachments/" + attachmentId + "/download")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Type", "application/pdf"))
            .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("cv.pdf")));

        mockMvc.perform(delete("/api/studyabroad/materials/" + materialId + "/attachments/" + attachmentId)
                .header("Authorization", "Bearer " + otherToken))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(delete("/api/studyabroad/materials/" + materialId + "/attachments/" + attachmentId)
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/studyabroad/materials/" + materialId + "/attachments/" + attachmentId + "/download")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    private COSObject cosObject(String content, String contentType) {
        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentType(contentType);
        metadata.setContentLength(bytes.length);

        COSObject object = new COSObject();
        object.setObjectMetadata(metadata);
        object.setObjectContent(new ByteArrayInputStream(bytes));
        return object;
    }
}
