package com.graduateplatform.job;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.common.security.JwtTokenProvider;
import com.graduateplatform.common.service.CosService;
import com.graduateplatform.job.entity.ApplicationRecord;
import com.graduateplatform.job.entity.CareerFair;
import com.graduateplatform.job.entity.JobPosting;
import com.graduateplatform.job.entity.ResumeProfile;
import com.graduateplatform.job.repository.*;
import com.qcloud.cos.model.COSObject;
import com.qcloud.cos.model.COSObjectInputStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayInputStream;
import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
    @MockBean CosService cosService;

    private User admin;
    private User user;
    private User otherUser;
    private String adminToken;
    private String userToken;
    private String otherToken;

    @BeforeEach
    void setUp() {
        reset(cosService);
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
    void jobPostingsCanReturnPagedResult() throws Exception {
        jobRepository.save(JobPosting.builder()
            .title("分页岗位 A").companyName("分页企业 A").city("上海").industry("互联网")
            .roleType("后端").active(true).build());
        jobRepository.save(JobPosting.builder()
            .title("分页岗位 B").companyName("分页企业 B").city("北京").industry("金融")
            .roleType("产品").active(true).build());

        mockMvc.perform(get("/api/job/postings?page=1&size=1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.page").value(1))
            .andExpect(jsonPath("$.data.size").value(1))
            .andExpect(jsonPath("$.data.totalItems").value(2))
            .andExpect(jsonPath("$.data.totalPages").value(2))
            .andExpect(jsonPath("$.data.items.length()").value(1));
    }

    @Test
    void adminJobPageCanFilterByKeywordAndActiveStatus() throws Exception {
        jobRepository.save(JobPosting.builder()
            .title("后台筛选岗位").companyName("筛选企业").city("上海").industry("互联网")
            .companyType("国企").roleType("后端").active(true).build());
        jobRepository.save(JobPosting.builder()
            .title("停用筛选岗位").companyName("筛选企业").city("上海").industry("互联网")
            .companyType("国企").roleType("后端").active(false).build());

        mockMvc.perform(get("/api/admin/employment/jobs?keyword=筛选&page=1&size=1&active=true")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.totalItems").value(1))
            .andExpect(jsonPath("$.data.items[0].title").value("后台筛选岗位"));
    }

    @Test
    void adminResumeSummaryIsReadOnlyAndDoesNotExposeCosLocation() throws Exception {
        user.setGrade("2026");
        userRepository.save(user);
        resumeRepository.save(ResumeProfile.builder()
            .user(user)
            .templateType("default")
            .resumeFileName("resume.pdf")
            .resumeFileSize(120L)
            .resumeFileType("application/pdf")
            .resumeCosKey("employment/resumes/" + user.getId() + "/resume.pdf")
            .resumeUploadedAt(LocalDateTime.now())
            .build());

        mockMvc.perform(get("/api/admin/employment/resumes"))
            .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/employment/resumes").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/employment/resumes").header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[?(@.userId == " + user.getId() + ")].name").value(hasItem("就业用户")))
            .andExpect(jsonPath("$.data[?(@.userId == " + user.getId() + ")].grade").value(hasItem("2026")))
            .andExpect(jsonPath("$.data[?(@.userId == " + user.getId() + ")].resumeFile.hasFile").value(hasItem(true)))
            .andExpect(jsonPath("$.data[?(@.userId == " + user.getId() + ")].resumeFile.fileName").value(hasItem("resume.pdf")))
            .andExpect(jsonPath("$.data[?(@.userId == " + user.getId() + ")].resumeFile.cosKey").doesNotExist())
            .andExpect(jsonPath("$.data[?(@.userId == " + user.getId() + ")].resumeFile.url").doesNotExist())
            .andExpect(jsonPath("$.data[?(@.userId == " + otherUser.getId() + ")].resumeFile.hasFile").value(hasItem(false)));
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
    void fairDetailReturnsEventAndApplicationStatus() throws Exception {
        CareerFair fair = fairRepository.save(CareerFair.builder()
            .title("详情状态招聘会").companyName("详情企业").city("上海").industry("互联网")
            .applyUrl("https://jobs.example.com/detail")
            .startTime(LocalDateTime.now().minusDays(2))
            .endTime(LocalDateTime.now().minusDays(2).plusHours(2))
            .applyDeadline(LocalDateTime.now().minusDays(1))
            .active(true).build());

        mockMvc.perform(get("/api/job/fairs/" + fair.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.statusLabel").value("已结束"))
            .andExpect(jsonPath("$.data.expired").value(true))
            .andExpect(jsonPath("$.data.applicationClosed").value(true))
            .andExpect(jsonPath("$.data.applyStatusLabel").value("网申已截止"));
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
    void duplicateCareerFairDisplayKeyCreateIsRejected() throws Exception {
        LocalDateTime startTime = LocalDateTime.now().plusDays(3).withNano(0);
        fairRepository.save(CareerFair.builder()
            .title("展示重复招聘会").companyName("展示企业").city("上海").industry("互联网")
            .location("学生中心").applyUrl("https://jobs.example.com/display")
            .startTime(startTime).active(true).build());

        mockMvc.perform(post("/api/admin/employment/fairs")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "title", "展示重复招聘会",
                    "companyName", "展示企业",
                    "city", "上海",
                    "industry", "互联网",
                    "location", "学生中心",
                    "applyUrl", "https://jobs.example.com/display",
                    "startTime", startTime.plusDays(2).toString(),
                    "active", true
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("相同标题、公司、地点和申请链接的招聘会已存在"));
    }

    @Test
    void invalidCareerFairTimeRangeIsRejected() throws Exception {
        LocalDateTime startTime = LocalDateTime.now().plusDays(3).withNano(0);

        mockMvc.perform(post("/api/admin/employment/fairs")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "title", "时间异常招聘会",
                    "companyName", "时间企业",
                    "startTime", startTime.toString(),
                    "endTime", startTime.minusHours(1).toString(),
                    "active", true
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("招聘会结束时间不能早于开始时间"));
    }

    @Test
    void invalidApplyUrlsAreRejectedForFairAndJob() throws Exception {
        mockMvc.perform(post("/api/admin/employment/fairs")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "title", "链接异常招聘会",
                    "companyName", "链接企业",
                    "applyUrl", "ftp://jobs.example.com/fair",
                    "active", true
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("招聘会申请链接必须是 http 或 https 地址"));

        mockMvc.perform(post("/api/admin/employment/jobs")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "title", "链接异常岗位",
                    "companyName", "链接企业",
                    "applyUrl", "mailto:hr@example.com",
                    "active", true
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("岗位申请链接必须是 http 或 https 地址"));
    }

    @Test
    void adminFairsCleansHistoricalDisplayDuplicates() throws Exception {
        fairRepository.save(CareerFair.builder()
            .title("历史重复招聘会").companyName("历史企业").city("上海").industry("互联网")
            .location("学生中心").applyUrl("https://jobs.example.com/history")
            .startTime(LocalDateTime.now().plusDays(5))
            .endTime(LocalDateTime.now().plusDays(5).plusHours(2))
            .active(true).build());
        fairRepository.save(CareerFair.builder()
            .title("历史重复招聘会").companyName("历史企业").city("上海").industry("互联网")
            .location("学生中心").applyUrl("https://jobs.example.com/history")
            .startTime(LocalDateTime.now().plusDays(2))
            .endTime(LocalDateTime.now().plusDays(2).plusHours(2))
            .active(true).build());

        mockMvc.perform(get("/api/admin/employment/fairs").header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].title").value("历史重复招聘会"));

        assertThat(fairRepository.findAll()).hasSize(1);
    }

    @Test
    void resumeUpsertAndApplicationOwnershipRoundTrip() throws Exception {
        mockMvc.perform(put("/api/job/resume")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.ofEntries(
                    Map.entry("templateType", "技术岗"),
                    Map.entry("targetRole", "Java 后端工程师"),
                    Map.entry("expectedCities", "上海,苏州"),
                    Map.entry("expectedIndustries", "互联网,金融科技"),
                    Map.entry("expectedSalary", "18k-25k"),
                    Map.entry("highestEducation", "本科"),
                    Map.entry("major", "计算机科学与技术"),
                    Map.entry("phone", "13800000000"),
                    Map.entry("email", "job@example.com"),
                    Map.entry("skillTags", "Java,Spring Boot,MySQL"),
                    Map.entry("projectKeywords", "就业平台,权限系统"),
                    Map.entry("internshipKeywords", "后端开发"),
                    Map.entry("certificates", "CET-6"),
                    Map.entry("portfolioUrl", "https://github.com/example/resume"),
                    Map.entry("skills", "Java,Spring Boot"),
                    Map.entry("projects", "就业平台"),
                    Map.entry("internships", "后端研发实习"),
                    Map.entry("education", "学生会技术部")
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.templateType").value("技术岗"))
            .andExpect(jsonPath("$.data.targetRole").value("Java 后端工程师"))
            .andExpect(jsonPath("$.data.educationLevel").value("本科"))
            .andExpect(jsonPath("$.data.highestEducation").value("本科"))
            .andExpect(jsonPath("$.data.phone").value("13800000000"))
            .andExpect(jsonPath("$.data.email").value("job@example.com"))
            .andExpect(jsonPath("$.data.skillTags").value("Java,Spring Boot,MySQL"));

        mockMvc.perform(get("/api/job/resume").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.highestEducation").value("本科"))
            .andExpect(jsonPath("$.data.phone").value("13800000000"))
            .andExpect(jsonPath("$.data.email").value("job@example.com"))
            .andExpect(jsonPath("$.data.skills").value("Java,Spring Boot"))
            .andExpect(jsonPath("$.data.projects").value("就业平台"))
            .andExpect(jsonPath("$.data.internships").value("后端研发实习"))
            .andExpect(jsonPath("$.data.education").value("学生会技术部"))
            .andExpect(jsonPath("$.data.expectedCities").value("上海,苏州"));

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

        mockMvc.perform(get("/api/job/applications").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data[0].companyName").value("未来科技"))
            .andExpect(jsonPath("$.data[0].resumeFile").doesNotExist());
    }

    @Test
    void applicationRecordSnapshotsLinkedJobAndKeepsHistoricalFields() throws Exception {
        JobPosting job = jobRepository.save(JobPosting.builder()
            .title("算法工程师")
            .companyName("智能科技")
            .city("上海")
            .industry("人工智能")
            .companyType("民企")
            .roleType("算法")
            .salaryRange("25k-35k")
            .educationRequirement("硕士")
            .majorKeywords("计算机科学,人工智能")
            .skillTags("Python,机器学习")
            .applyUrl("https://careers.example.com/ai")
            .active(true)
            .build());

        String createResponse = mockMvc.perform(post("/api/job/applications")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.ofEntries(
                    Map.entry("jobPostingId", job.getId()),
                    Map.entry("status", "FIRST_INTERVIEW"),
                    Map.entry("applicationChannel", "官网"),
                    Map.entry("contactName", "HR 张老师"),
                    Map.entry("contactInfo", "hr@example.com"),
                    Map.entry("interviewRound", "一面"),
                    Map.entry("interviewMethod", "线上"),
                    Map.entry("interviewLocation", "https://meeting.example.com/ai"),
                    Map.entry("expectedSalary", "30k"),
                    Map.entry("notes", "从岗位详情加入")
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.companyName").value("智能科技"))
            .andExpect(jsonPath("$.data.jobTitle").value("算法工程师"))
            .andExpect(jsonPath("$.data.city").value("上海"))
            .andExpect(jsonPath("$.data.industry").value("人工智能"))
            .andExpect(jsonPath("$.data.salaryRange").value("25k-35k"))
            .andExpect(jsonPath("$.data.applyUrl").value("https://careers.example.com/ai"))
            .andExpect(jsonPath("$.data.status").value("FIRST_INTERVIEW"))
            .andExpect(jsonPath("$.data.applicationChannel").value("官网"))
            .andReturn().getResponse().getContentAsString();
        long applicationId = objectMapper.readTree(createResponse).path("data").path("id").asLong();

        mockMvc.perform(put("/api/admin/employment/jobs/" + job.getId())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.ofEntries(
                    Map.entry("title", "算法平台工程师"),
                    Map.entry("companyName", "智能科技"),
                    Map.entry("city", "北京"),
                    Map.entry("industry", "平台研发"),
                    Map.entry("salaryRange", "35k-45k"),
                    Map.entry("applyUrl", "https://careers.example.com/platform"),
                    Map.entry("active", true)
                ))))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/job/applications").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].id").value(applicationId))
            .andExpect(jsonPath("$.data[0].jobTitle").value("算法工程师"))
            .andExpect(jsonPath("$.data[0].city").value("上海"))
            .andExpect(jsonPath("$.data[0].industry").value("人工智能"))
            .andExpect(jsonPath("$.data[0].salaryRange").value("25k-35k"))
            .andExpect(jsonPath("$.data[0].applyUrl").value("https://careers.example.com/ai"));

        mockMvc.perform(put("/api/job/applications/" + applicationId)
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "jobPostingId", job.getId(),
                    "status", "SECOND_INTERVIEW"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("SECOND_INTERVIEW"))
            .andExpect(jsonPath("$.data.jobTitle").value("算法工程师"))
            .andExpect(jsonPath("$.data.city").value("上海"))
            .andExpect(jsonPath("$.data.salaryRange").value("25k-35k"))
            .andExpect(jsonPath("$.data.applicationChannel").value("官网"))
            .andExpect(jsonPath("$.data.contactName").value("HR 张老师"))
            .andExpect(jsonPath("$.data.expectedSalary").value("30k"));

        JobPosting replacement = jobRepository.save(JobPosting.builder()
            .title("数据平台工程师")
            .companyName("数据科技")
            .city("杭州")
            .industry("数据平台")
            .salaryRange("22k-30k")
            .applyUrl("https://careers.example.com/data")
            .active(true)
            .build());

        mockMvc.perform(put("/api/job/applications/" + applicationId)
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "jobPostingId", replacement.getId(),
                    "status", "APPLIED"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.companyName").value("数据科技"))
            .andExpect(jsonPath("$.data.jobTitle").value("数据平台工程师"))
            .andExpect(jsonPath("$.data.city").value("杭州"))
            .andExpect(jsonPath("$.data.industry").value("数据平台"))
            .andExpect(jsonPath("$.data.salaryRange").value("22k-30k"))
            .andExpect(jsonPath("$.data.applyUrl").value("https://careers.example.com/data"));
    }

    @Test
    void resumeExportReturnsGeneratedWordAndPdfFiles() throws Exception {
        mockMvc.perform(get("/api/job/resume/export?format=docx"))
            .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/job/resume")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "templateType", "default",
                    "targetRole", "Java Developer",
                    "expectedCities", "Shanghai",
                    "baseInfo", "Test User\njob@test.local",
                    "projects", "Graduate platform resume export"
                ))))
            .andExpect(status().isOk());

        MvcResult word = mockMvc.perform(get("/api/job/resume/export?format=docx")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Type", containsString("application/vnd.openxmlformats-officedocument.wordprocessingml.document")))
            .andExpect(header().string("Content-Disposition", containsString("online-resume")))
            .andReturn();
        assertThat(word.getResponse().getContentAsByteArray()).startsWith(new byte[] { 'P', 'K' });

        MvcResult pdf = mockMvc.perform(get("/api/job/resume/export?format=pdf")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Type", containsString("application/pdf")))
            .andExpect(header().string("Content-Disposition", containsString(".pdf")))
            .andReturn();
        assertThat(new String(pdf.getResponse().getContentAsByteArray(), 0, 4)).isEqualTo("%PDF");

        mockMvc.perform(get("/api/job/resume/export?format=txt")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isBadRequest());
    }

    @Test
    void resumeFileUploadDownloadReplaceAndDeleteDoesNotExposeCosLocation() throws Exception {
        when(cosService.uploadFile(any(), anyLong(), anyString(), anyString()))
            .thenReturn("https://cos.example.com/private/resume.pdf");

        MockMultipartFile pdf = new MockMultipartFile(
            "file", "resume.pdf", "application/pdf", "PDF-CONTENT".getBytes());
        mockMvc.perform(multipart("/api/job/resume/file")
                .file(pdf)
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.resumeFile.hasFile").value(true))
            .andExpect(jsonPath("$.data.resumeFile.fileName").value("resume.pdf"))
            .andExpect(jsonPath("$.data.resumeFile.fileType").value("application/pdf"))
            .andExpect(jsonPath("$.data.resumeFile.cosKey").doesNotExist())
            .andExpect(jsonPath("$.data.resumeFile.url").doesNotExist())
            .andExpect(jsonPath("$.data.resumeCosKey").doesNotExist());

        ResumeProfile uploaded = resumeRepository.findByUserId(user.getId()).orElseThrow();
        assertThat(uploaded.getResumeCosKey()).startsWith("employment/resumes/" + user.getId() + "/");
        assertThat(uploaded.getResumeFileName()).isEqualTo("resume.pdf");
        String firstKey = uploaded.getResumeCosKey();

        COSObject cosObject = mock(COSObject.class);
        when(cosObject.getObjectContent()).thenReturn(
            new COSObjectInputStream(new ByteArrayInputStream("PDF-CONTENT".getBytes()), null));
        when(cosService.getObject(firstKey)).thenReturn(cosObject);

        MvcResult download = mockMvc.perform(get("/api/job/resume/file/download")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Disposition", containsString("resume.pdf")))
            .andReturn();
        assertThat(download.getResponse().getContentAsByteArray()).isEqualTo("PDF-CONTENT".getBytes());

        MockMultipartFile docx = new MockMultipartFile(
            "file",
            "resume-v2.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "DOCX".getBytes());
        mockMvc.perform(multipart("/api/job/resume/file")
                .file(docx)
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.resumeFile.fileName").value("resume-v2.docx"));

        ResumeProfile replaced = resumeRepository.findByUserId(user.getId()).orElseThrow();
        assertThat(replaced.getResumeCosKey()).isNotEqualTo(firstKey);
        verify(cosService).deleteFile(firstKey);
        String secondKey = replaced.getResumeCosKey();

        mockMvc.perform(delete("/api/job/resume/file")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.resumeFile.hasFile").value(false));

        ResumeProfile deleted = resumeRepository.findByUserId(user.getId()).orElseThrow();
        assertThat(deleted.getResumeCosKey()).isNull();
        verify(cosService).deleteFile(secondKey);
    }

    @Test
    void resumeFileValidationRejectsUnsupportedAndOversizedFilesWithoutReplacingExisting() throws Exception {
        resumeRepository.save(ResumeProfile.builder()
            .user(user)
            .templateType("default")
            .resumeFileName("existing.pdf")
            .resumeFileSize(12L)
            .resumeFileType("application/pdf")
            .resumeCosKey("employment/resumes/" + user.getId() + "/existing.pdf")
            .resumeUploadedAt(LocalDateTime.now())
            .build());

        MockMultipartFile txt = new MockMultipartFile("file", "resume.txt", "text/plain", "TEXT".getBytes());
        mockMvc.perform(multipart("/api/job/resume/file")
                .file(txt)
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("简历附件仅支持 PDF、DOC、DOCX 格式"));

        byte[] tooLarge = new byte[10 * 1024 * 1024 + 1];
        MockMultipartFile largePdf = new MockMultipartFile("file", "large.pdf", "application/pdf", tooLarge);
        mockMvc.perform(multipart("/api/job/resume/file")
                .file(largePdf)
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("简历附件不能超过10MB"));

        ResumeProfile afterRejectedUploads = resumeRepository.findByUserId(user.getId()).orElseThrow();
        assertThat(afterRejectedUploads.getResumeCosKey()).isEqualTo("employment/resumes/" + user.getId() + "/existing.pdf");
        verify(cosService, never()).uploadFile(any(), anyLong(), anyString(), anyString());
    }

    @Test
    void resumeFileDeleteClearsMetadataEvenWhenCosCleanupFails() throws Exception {
        ResumeProfile resume = resumeRepository.save(ResumeProfile.builder()
            .user(user)
            .templateType("default")
            .resumeFileName("existing.pdf")
            .resumeFileSize(12L)
            .resumeFileType("application/pdf")
            .resumeCosKey("employment/resumes/" + user.getId() + "/existing.pdf")
            .resumeUploadedAt(LocalDateTime.now())
            .build());
        String oldKey = resume.getResumeCosKey();
        doAnswer(invocation -> {
            assertThat(resumeRepository.findByUserId(user.getId()).orElseThrow().getResumeCosKey()).isNull();
            throw new RuntimeException("COS cleanup failed");
        }).when(cosService).deleteFile(oldKey);

        mockMvc.perform(delete("/api/job/resume/file")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.resumeFile.hasFile").value(false));

        assertThat(resumeRepository.findByUserId(user.getId()).orElseThrow().getResumeCosKey()).isNull();
    }

    @Test
    void resumeFileEndpointsRequireAuthentication() throws Exception {
        MockMultipartFile pdf = new MockMultipartFile("file", "resume.pdf", "application/pdf", "PDF".getBytes());

        mockMvc.perform(multipart("/api/job/resume/file").file(pdf))
            .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/job/resume/file/download"))
            .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/job/resume/file"))
            .andExpect(status().isForbidden());
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
    void recommendationsUseHybridContentAlgorithmWithoutExternalService() throws Exception {
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
            .andExpect(jsonPath("$.data[0].matchScore").isNumber())
            .andExpect(jsonPath("$.data[0].matchReasons").value(hasItem("求职偏好匹配")));
    }

    @Test
    void recommendationsDefaultToAllActiveJobsWithoutPreferences() throws Exception {
        jobRepository.save(JobPosting.builder()
            .title("默认展示岗位 A").companyName("默认企业 A").city("上海").industry("互联网")
            .roleType("后端").active(true).build());
        jobRepository.save(JobPosting.builder()
            .title("默认展示岗位 B").companyName("默认企业 B").city("苏州").industry("智能制造")
            .roleType("质量工程").active(true).build());

        mockMvc.perform(get("/api/job/recommendations").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].matchScore").isNumber())
            .andExpect(jsonPath("$.data[1].matchScore").isNumber())
            .andExpect(jsonPath("$.data[0].matchReasons").value(hasItem("近期发布岗位")));

        mockMvc.perform(get("/api/job/recommendations")
                .param("city", "上海")
                .header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].title").value("默认展示岗位 A"))
            .andExpect(jsonPath("$.data[1]").doesNotExist());
    }

    @Test
    void recommendationsUseStructuredResumeAsSoftRankingSignal() throws Exception {
        jobRepository.save(JobPosting.builder()
            .title("Java 后端工程师").companyName("未来科技").city("上海").industry("互联网")
            .roleType("后端").salaryRange("18k-25k").educationRequirement("本科")
            .majorKeywords("计算机科学,软件工程").skillTags("Java,Spring Boot,MySQL,权限系统")
            .description("负责校园招聘产品后端服务。").active(true).build());
        jobRepository.save(JobPosting.builder()
            .title("财务专员").companyName("财务公司").city("北京").industry("金融")
            .roleType("财务").salaryRange("10k-12k").educationRequirement("本科")
            .majorKeywords("会计学").skillTags("Excel,报表").active(true).build());

        mockMvc.perform(put("/api/job/resume")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.ofEntries(
                    Map.entry("targetRole", "Java 后端工程师"),
                    Map.entry("expectedCities", "上海"),
                    Map.entry("expectedIndustries", "互联网"),
                    Map.entry("expectedSalary", "18k-25k"),
                    Map.entry("educationLevel", "本科"),
                    Map.entry("major", "计算机科学"),
                    Map.entry("skillTags", "Java,Spring Boot,MySQL"),
                    Map.entry("projectKeywords", "权限系统,接口开发"),
                    Map.entry("internshipKeywords", "后端开发")
                ))))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/job/recommendations").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].title").value("Java 后端工程师"))
            .andExpect(jsonPath("$.data[0].matchScore").isNumber())
            .andExpect(jsonPath("$.data[0].matchReasons").value(hasItem("简历与岗位画像相似")))
            .andExpect(jsonPath("$.data[0].matchReasons").value(hasItem("岗位文本相关度高")));
    }

    @Test
    void companyTypeParticipatesInRecommendations() throws Exception {
        jobRepository.save(JobPosting.builder()
            .title("国企管培生").companyName("城市建设集团").companyType("国企")
            .majorKeywords("土木工程").skillTags("项目管理").active(true).build());
        jobRepository.save(JobPosting.builder()
            .title("民企运营").companyName("成长科技").companyType("民企")
            .majorKeywords("市场营销").skillTags("运营").active(true).build());

        mockMvc.perform(put("/api/job/preferences")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("companyTypes", "国企", "active", true))))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/job/recommendations").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].title").value("国企管培生"))
            .andExpect(jsonPath("$.data[0].matchScore").isNumber())
            .andExpect(jsonPath("$.data[0].matchReasons").value(hasItem("求职偏好匹配")));
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
            .andExpect(jsonPath("$.data.createdCount").value(1))
            .andExpect(jsonPath("$.data.skippedDuplicateCount").value(0));

        mockMvc.perform(post("/api/admin/employment/notifications/trigger")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("relatedType", "JOB", "relatedId", jobNode.path("id").asLong()))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.createdCount").value(0))
            .andExpect(jsonPath("$.data.skippedDuplicateCount").value(1));

        String notifications = mockMvc.perform(get("/api/job/notifications").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.unreadCount").value(1))
            .andExpect(jsonPath("$.data.items[0].readFlag").value(false))
            .andExpect(jsonPath("$.data.items[0].targetUrl").value("/job/postings/" + jobNode.path("id").asLong()))
            .andReturn().getResponse().getContentAsString();
        long notificationId = objectMapper.readTree(notifications).path("data").path("items").get(0).path("id").asLong();

        mockMvc.perform(put("/api/job/notifications/" + notificationId + "/read").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.readFlag").value(true));

        mockMvc.perform(delete("/api/job/notifications/" + notificationId).header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.deleted").value(true))
            .andExpect(jsonPath("$.data.id").value(notificationId));

        mockMvc.perform(get("/api/job/notifications").header("Authorization", "Bearer " + userToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.unreadCount").value(0))
            .andExpect(jsonPath("$.data.totalItems").value(0));

        assertThat(notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())).isEmpty();
    }

    @Test
    void deletingReferencedJobDeactivatesInsteadOfHardDeleting() throws Exception {
        JobPosting job = jobRepository.save(JobPosting.builder()
            .title("被引用岗位").companyName("引用企业").city("上海").industry("互联网")
            .roleType("后端").active(true).build());
        applicationRepository.save(ApplicationRecord.builder()
            .user(user)
            .companyName("引用企业")
            .jobTitle("被引用岗位")
            .jobPosting(job)
            .status("APPLIED")
            .build());

        mockMvc.perform(delete("/api/admin/employment/jobs/" + job.getId()).header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.deleted").value(false))
            .andExpect(jsonPath("$.data.deactivated").value(true));

        assertThat(jobRepository.findById(job.getId())).isPresent();
        assertThat(jobRepository.findById(job.getId()).orElseThrow().getActive()).isFalse();
        assertThat(applicationRepository.existsByJobPostingId(job.getId())).isTrue();
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
