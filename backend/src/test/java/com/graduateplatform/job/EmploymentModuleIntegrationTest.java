package com.graduateplatform.job;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.common.security.JwtTokenProvider;
import com.graduateplatform.job.entity.CareerFair;
import com.graduateplatform.job.entity.JobPosting;
import com.graduateplatform.job.repository.*;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EmploymentModuleIntegrationTest {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JwtTokenProvider tokenProvider;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired UserRepository userRepository;
    @Autowired CareerFairRepository fairRepository;
    @Autowired JobPostingRepository jobRepository;
    @Autowired ResumeProfileRepository resumeRepository;
    @Autowired ApplicationRecordRepository applicationRepository;
    @Autowired JobSubscriptionPreferenceRepository preferenceRepository;
    @Autowired EmploymentNotificationRepository notificationRepository;

    private User admin;
    private User user;
    private User otherUser;
    private String adminToken;
    private String userToken;
    private String otherToken;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        applicationRepository.deleteAll();
        resumeRepository.deleteAll();
        preferenceRepository.deleteAll();
        fairRepository.deleteAll();
        jobRepository.deleteAll();

        String suffix = String.valueOf(System.nanoTime());
        admin = userRepository.save(User.builder()
            .name("测试管理员").email("admin" + suffix + "@test.local")
            .password(passwordEncoder.encode("pw")).target("job").role("admin").status("normal").build());
        user = userRepository.save(User.builder()
            .name("就业用户").email("job" + suffix + "@test.local")
            .password(passwordEncoder.encode("pw")).target("job").role("user").status("normal")
            .major("计算机科学").build());
        otherUser = userRepository.save(User.builder()
            .name("其他用户").email("other" + suffix + "@test.local")
            .password(passwordEncoder.encode("pw")).target("job").role("user").status("normal")
            .major("金融学").build());
        adminToken = tokenProvider.generateToken(admin.getId(), "admin");
        userToken = tokenProvider.generateToken(user.getId(), "user");
        otherToken = tokenProvider.generateToken(otherUser.getId(), "user");
    }

    @Test
    void adminEmploymentEndpointsAreNotPublicAndRejectNormalUsers() throws Exception {
        mockMvc.perform(get("/api/admin/employment/fairs"))
            .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/employment/fairs").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/employment/fairs").header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void privateEmploymentGetsRequireAuthenticationButPublicBrowseWorks() throws Exception {
        fairRepository.save(CareerFair.builder()
            .title("公开招聘会").companyName("公开企业").city("上海").industry("互联网")
            .startTime(LocalDateTime.now().plusDays(1)).active(true).build());
        jobRepository.save(JobPosting.builder()
            .title("公开岗位").companyName("公开企业").city("上海").industry("互联网")
            .roleType("后端").majorKeywords("计算机科学").skillTags("Java").active(true).build());

        mockMvc.perform(get("/api/job/fairs"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].title").value("公开招聘会"));
        mockMvc.perform(get("/api/job/postings"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].title").value("公开岗位"));
        mockMvc.perform(get("/api/job/resume")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/job/applications")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/job/recommendations")).andExpect(status().isForbidden());
    }

    @Test
    void fairPageFiltersExpiredByDefaultAndCanIncludeExpiredWithStatus() throws Exception {
        fairRepository.save(CareerFair.builder()
            .title("已过期招聘会").companyName("过期企业").city("上海").industry("互联网")
            .startTime(LocalDateTime.now().minusDays(5))
            .endTime(LocalDateTime.now().minusDays(5).plusHours(2))
            .applyDeadline(LocalDateTime.now().minusDays(2))
            .active(true).build());
        fairRepository.save(CareerFair.builder()
            .title("可申请招聘会").companyName("有效企业").city("上海").industry("互联网")
            .location("学生中心").applyUrl("https://jobs.example.com/valid")
            .startTime(LocalDateTime.now().plusDays(2))
            .endTime(LocalDateTime.now().plusDays(2).plusHours(2))
            .applyDeadline(LocalDateTime.now().plusDays(5))
            .active(true).build());
        fairRepository.save(CareerFair.builder()
            .title("可申请招聘会").companyName("有效企业").city("上海").industry("互联网")
            .location("学生中心").applyUrl("https://jobs.example.com/valid")
            .startTime(LocalDateTime.now().plusDays(4))
            .endTime(LocalDateTime.now().plusDays(4).plusHours(2))
            .applyDeadline(LocalDateTime.now().plusDays(7))
            .active(true).build());

        mockMvc.perform(get("/api/job/fairs?page=1&size=6"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalItems").value(1))
            .andExpect(jsonPath("$.data.items[0].title").value("可申请招聘会"))
            .andExpect(jsonPath("$.data.items[0].expired").value(false))
            .andExpect(jsonPath("$.data.items[0].statusLabel").value("未开始"));

        mockMvc.perform(get("/api/job/fairs?page=1&size=6&includeExpired=true"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalItems").value(2))
            .andExpect(jsonPath("$.data.items[0].title").value("可申请招聘会"))
            .andExpect(jsonPath("$.data.items[1].title").value("已过期招聘会"))
            .andExpect(jsonPath("$.data.items[1].expired").value(true))
            .andExpect(jsonPath("$.data.items[1].statusLabel").value("已结束"))
            .andExpect(jsonPath("$.data.items[1].applicationClosed").value(true))
            .andExpect(jsonPath("$.data.items[1].applyStatusLabel").value("网申已截止"));
    }

    @Test
    void fairStatusUsesCurrentEventTimeAndApplyDeadlineSeparately() throws Exception {
        fairRepository.save(CareerFair.builder()
            .title("正在进行招聘会").companyName("实时企业").city("上海").industry("互联网")
            .startTime(LocalDateTime.now().minusMinutes(30))
            .endTime(LocalDateTime.now().plusMinutes(30))
            .applyDeadline(LocalDateTime.now().plusDays(1))
            .active(true).build());

        mockMvc.perform(get("/api/job/fairs?page=1&size=6"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.items[0].title").value("正在进行招聘会"))
            .andExpect(jsonPath("$.data.items[0].expired").value(false))
            .andExpect(jsonPath("$.data.items[0].statusLabel").value("进行中"))
            .andExpect(jsonPath("$.data.items[0].applicationClosed").value(false))
            .andExpect(jsonPath("$.data.items[0].applyStatusLabel").value("可网申"));
    }

    @Test
    void duplicateCareerFairCreateIsRejected() throws Exception {
        LocalDateTime startTime = LocalDateTime.now().plusDays(3).withNano(0);
        fairRepository.save(CareerFair.builder()
            .title("重复招聘会").companyName("重复企业").city("上海").industry("互联网")
            .startTime(startTime).active(true).build());

        mockMvc.perform(post("/api/admin/employment/fairs")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "title", "重复招聘会",
                    "companyName", "重复企业",
                    "city", "上海",
                    "industry", "互联网",
                    "startTime", startTime.toString(),
                    "active", true
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("相同标题、公司和开始时间的招聘会已存在"));
    }

    @Test
    void resumeUpsertAndApplicationOwnershipRoundTrip() throws Exception {
        mockMvc.perform(put("/api/job/resume")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("templateType", "技术岗", "skills", "Java,Spring Boot", "projects", "就业平台"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.templateType").value("技术岗"));

        mockMvc.perform(get("/api/job/resume").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.skills").value("Java,Spring Boot"));

        String createResponse = mockMvc.perform(post("/api/job/applications")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("companyName", "未来科技", "jobTitle", "Java 后端", "status", "APPLIED"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("APPLIED"))
            .andReturn().getResponse().getContentAsString();
        long applicationId = objectMapper.readTree(createResponse).path("data").path("id").asLong();

        mockMvc.perform(put("/api/job/applications/" + applicationId)
                .header("Authorization", "Bearer " + otherToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("companyName", "未来科技", "jobTitle", "Java 后端", "status", "INTERVIEW"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(put("/api/job/applications/" + applicationId)
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("companyName", "未来科技", "jobTitle", "Java 后端", "status", "INTERVIEW"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("INTERVIEW"));
    }

    @Test
    void createApplicationWithMissingJobPostingReturnsClearMessage() throws Exception {
        mockMvc.perform(post("/api/job/applications")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "companyName", "缺失企业",
                    "jobTitle", "缺失岗位",
                    "jobPostingId", 999999,
                    "status", "APPLIED"
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("岗位不存在"));
    }

    @Test
    void recommendationsUseRuleMatchingWithoutExternalService() throws Exception {
        jobRepository.save(JobPosting.builder()
            .title("Java 后端工程师").companyName("未来科技").city("上海").industry("互联网")
            .roleType("后端").majorKeywords("计算机科学,软件工程").skillTags("Java,Spring Boot")
            .description("规则匹配岗位").active(true).build());
        jobRepository.save(JobPosting.builder()
            .title("财务专员").companyName("财务公司").city("北京").industry("金融学")
            .roleType("金融学").majorKeywords("会计学").skillTags("表格处理").active(true).build());

        mockMvc.perform(put("/api/job/preferences")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("cities", "上海", "industries", "互联网", "roleTypes", "后端", "active", true))))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/job/recommendations").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].title").value("Java 后端工程师"))
            .andExpect(jsonPath("$.data[0].matchScore").value(80));
    }

    @Test
    void adminCrudAndMatchedStationNotificationFlow() throws Exception {
        mockMvc.perform(put("/api/job/preferences")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("cities", "上海", "industries", "互联网", "roleTypes", "后端", "active", true))))
            .andExpect(status().isOk());

        String createJob = mockMvc.perform(post("/api/admin/employment/jobs")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "title", "Java 后端工程师", "companyName", "未来科技", "city", "上海",
                    "industry", "互联网", "roleType", "后端", "majorKeywords", "计算机科学", "skillTags", "Java", "active", true
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.title").value("Java 后端工程师"))
            .andReturn().getResponse().getContentAsString();
        JsonNode jobNode = objectMapper.readTree(createJob).path("data");

        mockMvc.perform(post("/api/admin/employment/notifications/trigger")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("relatedType", "JOB", "relatedId", jobNode.path("id").asLong()))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.createdCount").value(1));

        String notifications = mockMvc.perform(get("/api/job/notifications").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].readFlag").value(false))
            .andReturn().getResponse().getContentAsString();
        long notificationId = objectMapper.readTree(notifications).path("data").get(0).path("id").asLong();

        mockMvc.perform(put("/api/job/notifications/" + notificationId + "/read").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.readFlag").value(true));

        assertThat(notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())).hasSize(1);
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
