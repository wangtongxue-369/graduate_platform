package com.graduateplatform.init;


import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.community.entity.PostCategory;
import com.graduateplatform.community.repository.PostCategoryRepository;
import com.graduateplatform.job.entity.CareerFair;
import com.graduateplatform.job.entity.JobPosting;
import com.graduateplatform.job.repository.ApplicationRecordRepository;
import com.graduateplatform.job.repository.CareerFairRepository;
import com.graduateplatform.job.repository.JobPostingRepository;
import com.graduateplatform.kaogong.entity.CivilServicePost;
import com.graduateplatform.kaogong.entity.ExamCalendarEvent;
import com.graduateplatform.kaogong.entity.InterviewScoreLine;
import com.graduateplatform.kaogong.repository.CivilServicePostRepository;
import com.graduateplatform.kaogong.repository.ExamCalendarEventRepository;
import com.graduateplatform.kaogong.repository.InterviewScoreLineRepository;
import com.graduateplatform.questionbank.repository.QuestionBankRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final PostCategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final QuestionBankRepository bankRepository;
    private final CareerFairRepository careerFairRepository;
    private final JobPostingRepository jobPostingRepository;
    private final ApplicationRecordRepository applicationRecordRepository;
    private final CivilServicePostRepository civilServicePostRepository;
    private final InterviewScoreLineRepository scoreLineRepository;
    private final ExamCalendarEventRepository calendarEventRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(PostCategoryRepository categoryRepository, UserRepository userRepository,
                           QuestionBankRepository bankRepository,
                           CareerFairRepository careerFairRepository,
                           JobPostingRepository jobPostingRepository,
                           ApplicationRecordRepository applicationRecordRepository,
                           CivilServicePostRepository civilServicePostRepository,
                           InterviewScoreLineRepository scoreLineRepository,
                           ExamCalendarEventRepository calendarEventRepository,
                           PasswordEncoder passwordEncoder) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.bankRepository = bankRepository;
        this.civilServicePostRepository = civilServicePostRepository;
        this.scoreLineRepository = scoreLineRepository;
        this.calendarEventRepository = calendarEventRepository;
        this.careerFairRepository = careerFairRepository;
        this.jobPostingRepository = jobPostingRepository;
        this.applicationRecordRepository = applicationRecordRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        initCategories();
        initUsers();
        initQuestionBanks();
        initEmploymentData();
        initKaoGongData();
    }

    private void initCategories() {
        if (categoryRepository.count() > 0) return;

        String[][] data = {
            {"kaoyan", "考研", "考研相关讨论与资料"},
            {"kaogong", "考公考编", "公务员及事业单位考试"},
            {"job", "就业", "校招与求职信息"},
            {"liuxue", "留学", "留学申请与经验"},
            {"experience", "经验分享", "各类备考与求职经验"},
            {"resource", "资料互助", "学习资料共享与下载"},
        };

        for (int i = 0; i < data.length; i++) {
            categoryRepository.save(PostCategory.builder()
                .code(data[i][0]).name(data[i][1]).description(data[i][2])
                .sortOrder(i).active(true).build());
        }
    }

    private void initUsers() {
        java.time.LocalDateTime thirtyDaysAgo = java.time.LocalDateTime.now().minusDays(30);

        if (!userRepository.existsByEmail("admin@graduate.local")) {
            User admin = userRepository.save(User.builder()
                .name("Admin").email("admin@graduate.local")
                .password(passwordEncoder.encode("admin123"))
                .target("kaoyan").role("admin").status("normal").build());
            admin.setCreatedAt(thirtyDaysAgo);
            userRepository.save(admin);
        }

        if (!userRepository.existsByEmail("test@graduate.local")) {
            User testUser = userRepository.save(User.builder()
                .name("Test User").email("test@graduate.local").phone("13800138000")
                .password(passwordEncoder.encode("test1234"))
                .school("Graduate University").major("Computer Science").grade("2023")
                .target("kaoyan").role("user").status("normal").build());
            testUser.setCreatedAt(thirtyDaysAgo);
            userRepository.save(testUser);
        }

        if (!userRepository.existsByEmail("job@graduate.local")) {
            User jobUser = userRepository.save(User.builder()
                .name("就业测试用户").email("job@graduate.local").phone("13800138001")
                .password(passwordEncoder.encode("job1234"))
                .school("测试大学").major("计算机科学").grade("2024")
                .target("job").role("user").status("normal").build());
            jobUser.setCreatedAt(thirtyDaysAgo);
            userRepository.save(jobUser);
        }
        userRepository.findByEmail("job@graduate.local").ifPresent(jobUser -> {
            boolean changed = false;
            if ("Employment Test User".equals(jobUser.getName())) {
                jobUser.setName("就业测试用户");
                changed = true;
            }
            if ("Graduate University".equals(jobUser.getSchool())) {
                jobUser.setSchool("测试大学");
                changed = true;
            }
            if ("Computer Science".equals(jobUser.getMajor())) {
                jobUser.setMajor("计算机科学");
                changed = true;
            }
            if (changed) {
                userRepository.save(jobUser);
            }
        });
    }

    private void initQuestionBanks() {
        if (bankRepository.count() > 0) return;
        // 题目数据较多（6 个题库 × ~30 题），按 bank 拆到 QuestionBankSeed* 类，
        // 与 createBank 的"5 道入门示例"相比丰富了模式覆盖（多选/判断/主观）。
        QuestionBankSeed.seedAll(bankRepository);
    }


    private void initEmploymentData() {
        updateLegacyEmploymentSeedData();
        cleanupDuplicateCareerFairs();
        cleanupLegacyDemoJobPostings();

        java.time.LocalDateTime fairStart = java.time.LocalDateTime.now().plusDays(3).withHour(15).withMinute(0).withSecond(0).withNano(0);
        boolean hasTencentFair = careerFairRepository.existsByTitleAndCompanyName("腾讯2026应届生招聘宣讲会", "腾讯");
        if (!hasTencentFair) {
            careerFairRepository.save(CareerFair.builder()
                .title("腾讯2026应届生招聘宣讲会")
                .companyName("腾讯")
                .city("线上")
                .industry("互联网")
                .targetRoles("技术研发,产品,设计,市场,职能")
                .location("腾讯校招官网")
                .startTime(fairStart)
                .endTime(fairStart.plusHours(1).plusMinutes(30))
                .applyDeadline(fairStart.plusDays(2).withHour(23).withMinute(59))
                .applyUrl("https://join.qq.com/index.html")
                .description("腾讯校招官网发布的2026应届生招聘入口，可查看校招岗位、招聘流程并在线投递。")
                .active(true)
                .build());
        }

        boolean hasTelecomFair = careerFairRepository.existsByTitleAndCompanyName("中国电信2026校园招聘宣讲会", "中国电信");
        if (!hasTelecomFair) {
            careerFairRepository.save(CareerFair.builder()
                .title("中国电信2026校园招聘宣讲会")
                .companyName("中国电信")
                .city("线上")
                .industry("通信运营商")
                .targetRoles("云网技术,软件研发,数据分析,市场运营")
                .location("中国电信招聘官网")
                .startTime(fairStart.plusDays(1))
                .endTime(fairStart.plusDays(1).plusHours(1))
                .applyDeadline(fairStart.plusDays(3).withHour(18).withMinute(0))
                .applyUrl("https://job.chinatelecom.com.cn/wt/TELE/web/index")
                .description("中国电信官方招聘平台，提供校园招聘岗位、宣讲问答、招聘进度和在线投递入口。")
                .active(true)
                .build());
        }

        java.time.LocalDateTime aiFairStart = java.time.LocalDateTime.now().plusDays(5).withHour(14).withMinute(0).withSecond(0).withNano(0);
        boolean hasCcbFair = careerFairRepository.existsByTitleAndCompanyName("中国建设银行2026校园招聘宣讲会", "中国建设银行");
        if (!hasCcbFair) {
            careerFairRepository.save(CareerFair.builder()
                .title("中国建设银行2026校园招聘宣讲会")
                .companyName("中国建设银行")
                .city("线上")
                .industry("金融")
                .targetRoles("金融科技,柜面服务,客户经理,管理培训生")
                .location("中国建设银行招聘官网")
                .startTime(aiFairStart)
                .endTime(aiFairStart.plusHours(2))
                .applyDeadline(aiFairStart.plusDays(3).withHour(23).withMinute(59))
                .applyUrl("https://job1.ccb.com/cn/job/plan_index.html?planType=XY")
                .description("中国建设银行官方校园招聘首页，提供校招公告、校园宣讲会、岗位计划和在线申请入口。")
                .active(true)
                .build());
        }

        java.time.LocalDateTime fintechFairStart = java.time.LocalDateTime.now().plusDays(9).withHour(10).withMinute(0).withSecond(0).withNano(0);
        boolean hasPingAnFair = careerFairRepository.existsByTitleAndCompanyName("中国平安2026校园招聘宣讲会", "中国平安");
        if (!hasPingAnFair) {
            careerFairRepository.save(CareerFair.builder()
                .title("中国平安2026校园招聘宣讲会")
                .companyName("中国平安")
                .city("线上")
                .industry("金融科技")
                .targetRoles("科技研发,产品运营,数据分析,金融业务")
                .location("中国平安校园招聘官网")
                .startTime(fintechFairStart)
                .endTime(fintechFairStart.plusHours(2))
                .applyDeadline(fintechFairStart.plusDays(3).withHour(18).withMinute(0))
                .applyUrl("https://campus.pingan.com/")
                .description("中国平安校园招聘官网，提供校园招聘宣讲会、岗位搜索、投递进度和在线申请入口。")
                .active(true)
                .build());
        }

        java.time.LocalDateTime donghaiFairStart = java.time.LocalDateTime.now().plusDays(14).withHour(15).withMinute(0).withSecond(0).withNano(0);
        boolean hasLenovoFair = careerFairRepository.existsByTitleAndCompanyName("联想2026校园招聘宣讲会", "联想");
        if (!hasLenovoFair) {
            careerFairRepository.save(CareerFair.builder()
                .title("联想2026校园招聘宣讲会")
                .companyName("联想")
                .city("线上")
                .industry("智能终端与企业科技")
                .targetRoles("软件研发,硬件研发,供应链,产品经理")
                .location("联想校园招聘官网")
                .startTime(donghaiFairStart)
                .endTime(donghaiFairStart.plusHours(2).plusMinutes(30))
                .applyDeadline(donghaiFairStart.plusDays(3).withHour(20).withMinute(0))
                .applyUrl("https://talent.lenovo.com.cn/campus")
                .description("联想校园招聘官网，提供中国校园招聘项目、岗位信息、招聘流程和在线投递入口。")
                .active(true)
                .build());
        }

        boolean hasBackendJob = jobPostingRepository.existsByTitleAndCompanyName("软件开发-后台开发方向", "腾讯");
        if (!hasBackendJob) {
            jobPostingRepository.save(JobPosting.builder()
                .title("软件开发-后台开发方向")
                .companyName("腾讯")
                .city("深圳/北京/上海/广州/成都/武汉/杭州")
                .industry("互联网")
                .companyType("民企")
                .roleType("后端")
                .salaryRange("面议")
                .educationRequirement("本科及以上")
                .majorKeywords("计算机科学,软件工程,信息系统")
                .skillTags("Java,C++,Go,分布式系统,数据库")
                .description("腾讯校招软件开发后台方向，面向服务端研发、分布式系统、业务后台和基础架构等岗位，可在腾讯校招官网完成岗位投递。")
                .applyUrl("https://join.qq.com/post.html?query=2_75%2Cp_2")
                .active(true)
                .build());
        }

        boolean hasOperationsJob = jobPostingRepository.existsByTitleAndCompanyName("产品运营校招生", "字节跳动");
        if (!hasOperationsJob) {
            jobPostingRepository.save(JobPosting.builder()
                .title("产品运营校招生")
                .companyName("字节跳动")
                .city("北京/上海/深圳/杭州")
                .industry("互联网")
                .companyType("民企")
                .roleType("产品运营")
                .salaryRange("面议")
                .educationRequirement("本科及以上")
                .majorKeywords("管理学,新闻传播,计算机科学,数据科学")
                .skillTags("数据分析,用户运营,内容运营,项目管理")
                .description("字节跳动校园招聘产品运营方向，覆盖内容、用户、商业化和增长运营等场景，可在字节跳动校招职位页搜索并投递。")
                .applyUrl("https://jobs.bytedance.com/campus/m/position")
                .active(true)
                .build());
        }

        boolean hasFrontendJob = jobPostingRepository.existsByTitleAndCompanyName("前端开发工程师", "阿里巴巴");
        if (!hasFrontendJob) {
            jobPostingRepository.save(JobPosting.builder()
                .title("前端开发工程师")
                .companyName("阿里巴巴")
                .city("杭州/北京/上海/深圳")
                .industry("互联网")
                .companyType("民企")
                .roleType("前端")
                .salaryRange("面议")
                .educationRequirement("本科及以上")
                .majorKeywords("计算机科学,软件工程,数字媒体技术")
                .skillTags("Vue,React,JavaScript,TypeScript")
                .description("阿里巴巴校园招聘研发类前端方向，参与业务平台、用户产品和技术中台的 Web 端研发，可在阿里巴巴校招官网投递。")
                .applyUrl("https://campus-talent.alibaba.com/")
                .active(true)
                .build());
        }

        boolean hasDataAnalystJob = jobPostingRepository.existsByTitleAndCompanyName("商业分析师", "美团");
        if (!hasDataAnalystJob) {
            jobPostingRepository.save(JobPosting.builder()
                .title("商业分析师")
                .companyName("美团")
                .city("北京/上海/深圳/成都")
                .industry("本地生活服务")
                .companyType("民企")
                .roleType("数据分析")
                .salaryRange("面议")
                .educationRequirement("本科及以上")
                .majorKeywords("统计学,数据科学,计算机科学,经济学")
                .skillTags("SQL,Python,Excel,商业分析")
                .description("美团校园招聘商业分析方向，围绕本地生活业务进行指标建设、数据洞察和经营分析，可通过美团校园招聘官网投递。")
                .applyUrl("https://campus.meituan.com/")
                .active(true)
                .build());
        }

        boolean hasTestDevelopmentJob = jobPostingRepository.existsByTitleAndCompanyName("软件测试开发工程师", "华为");
        if (!hasTestDevelopmentJob) {
            jobPostingRepository.save(JobPosting.builder()
                .title("软件测试开发工程师")
                .companyName("华为")
                .city("深圳/上海/杭州/南京/西安")
                .industry("通信与智能终端")
                .companyType("民企")
                .roleType("测试开发")
                .salaryRange("面议")
                .educationRequirement("本科及以上")
                .majorKeywords("计算机科学,软件工程,通信工程,电子信息")
                .skillTags("Python,自动化测试,接口测试,Linux,质量工程")
                .description("华为校园招聘软件测试开发方向，参与产品质量工程、自动化测试和工程效率建设，可在华为校园招聘职位列表投递。")
                .applyUrl("https://career.huawei.com/reccampportal/portal5/campus-recruitment.html?jobTypes=0")
                .active(true)
                .build());
        }

        boolean hasSecurityJob = jobPostingRepository.existsByTitleAndCompanyName("安全工程师（漏洞方向）", "奇安信");
        if (!hasSecurityJob) {
            jobPostingRepository.save(JobPosting.builder()
                .title("安全工程师（漏洞方向）")
                .companyName("奇安信")
                .city("北京/成都/南京/厦门")
                .industry("网络安全")
                .companyType("民企")
                .roleType("安全")
                .salaryRange("面议")
                .educationRequirement("本科及以上")
                .majorKeywords("网络空间安全,信息安全,计算机科学")
                .skillTags("渗透测试,漏洞分析,Linux,Python,Web安全")
                .description("奇安信校园招聘安全工程师漏洞方向，跟踪最新安全技术并参与漏洞研究、安全验证和攻防实践，可在奇安信校招职位页投递。")
                .applyUrl("https://www.qianxin.com/campus/internJobSearch")
                .active(true)
                .build());
        }

        boolean hasProductAssistantJob = jobPostingRepository.existsByTitleAndCompanyName("产品经理", "京东");
        if (!hasProductAssistantJob) {
            jobPostingRepository.save(JobPosting.builder()
                .title("产品经理")
                .companyName("京东")
                .city("北京/上海/深圳")
                .industry("电商与供应链科技")
                .companyType("民企")
                .roleType("产品")
                .salaryRange("面议")
                .educationRequirement("本科及以上")
                .majorKeywords("管理学,工业工程,计算机科学,电子商务")
                .skillTags("需求分析,Axure,数据分析,项目协同")
                .description("京东校园招聘产品方向，参与零售、物流、科技等业务产品规划和需求落地，可在京东招聘官网选择校园招聘投递。")
                .applyUrl("https://zhaopin.jd.com/")
                .active(true)
                .build());
        }
        cleanupDuplicateSeedJobPostings();
        cleanupDuplicateCareerFairs();
    }

    private void updateLegacyEmploymentSeedData() {
        java.time.LocalDateTime baseFairStart = java.time.LocalDateTime.now().plusDays(3).withHour(15).withMinute(0).withSecond(0).withNano(0);
        for (CareerFair fair : careerFairRepository.findByTitleAndCompanyName("Internet Campus Career Fair", "Future Tech")) {
            applyRealCareerFairSeed(fair,
                "腾讯2026应届生招聘宣讲会", "腾讯", "线上", "互联网",
                "技术研发,产品,设计,市场,职能", "腾讯校招官网",
                baseFairStart, baseFairStart.plusHours(1).plusMinutes(30), baseFairStart.plusDays(2).withHour(23).withMinute(59),
                "https://join.qq.com/index.html",
                "腾讯校招官网发布的2026应届生招聘入口，可查看校招岗位、招聘流程并在线投递。");
        }
        for (CareerFair fair : careerFairRepository.findByTitleAndCompanyName("互联网校园招聘宣讲会", "未来科技")) {
            applyRealCareerFairSeed(fair,
                "腾讯2026应届生招聘宣讲会", "腾讯", "线上", "互联网",
                "技术研发,产品,设计,市场,职能", "腾讯校招官网",
                baseFairStart, baseFairStart.plusHours(1).plusMinutes(30), baseFairStart.plusDays(2).withHour(23).withMinute(59),
                "https://join.qq.com/index.html",
                "腾讯校招官网发布的2026应届生招聘入口，可查看校招岗位、招聘流程并在线投递。");
        }
        for (CareerFair fair : careerFairRepository.findByTitleAndCompanyName("杜邦（中国）研发管理有限公司宣讲会", "杜邦（中国）研发管理有限公司")) {
            applyRealCareerFairSeed(fair,
                "腾讯2026应届生招聘宣讲会", "腾讯", "线上", "互联网",
                "技术研发,产品,设计,市场,职能", "腾讯校招官网",
                baseFairStart, baseFairStart.plusHours(1).plusMinutes(30), baseFairStart.plusDays(2).withHour(23).withMinute(59),
                "https://join.qq.com/index.html",
                "腾讯校招官网发布的2026应届生招聘入口，可查看校招岗位、招聘流程并在线投递。");
        }

        for (CareerFair fair : careerFairRepository.findByTitleAndCompanyName("Smart Manufacturing Fair", "Harbor Equipment Group")) {
            applyRealCareerFairSeed(fair,
                "中国电信2026校园招聘宣讲会", "中国电信", "线上", "通信运营商",
                "云网技术,软件研发,数据分析,市场运营", "中国电信招聘官网",
                baseFairStart.plusDays(1), baseFairStart.plusDays(1).plusHours(1), baseFairStart.plusDays(3).withHour(18).withMinute(0),
                "https://job.chinatelecom.com.cn/wt/TELE/web/index",
                "中国电信官方招聘平台，提供校园招聘岗位、宣讲问答、招聘进度和在线投递入口。");
        }
        for (CareerFair fair : careerFairRepository.findByTitleAndCompanyName("智能制造专场招聘会", "港湾装备集团")) {
            applyRealCareerFairSeed(fair,
                "中国电信2026校园招聘宣讲会", "中国电信", "线上", "通信运营商",
                "云网技术,软件研发,数据分析,市场运营", "中国电信招聘官网",
                baseFairStart.plusDays(1), baseFairStart.plusDays(1).plusHours(1), baseFairStart.plusDays(3).withHour(18).withMinute(0),
                "https://job.chinatelecom.com.cn/wt/TELE/web/index",
                "中国电信官方招聘平台，提供校园招聘岗位、宣讲问答、招聘进度和在线投递入口。");
        }
        for (CareerFair fair : careerFairRepository.findByTitleAndCompanyName("晓禾教育科技（武汉）有限公司宣讲会", "晓禾教育科技（武汉）有限公司")) {
            applyRealCareerFairSeed(fair,
                "中国电信2026校园招聘宣讲会", "中国电信", "线上", "通信运营商",
                "云网技术,软件研发,数据分析,市场运营", "中国电信招聘官网",
                baseFairStart.plusDays(1), baseFairStart.plusDays(1).plusHours(1), baseFairStart.plusDays(3).withHour(18).withMinute(0),
                "https://job.chinatelecom.com.cn/wt/TELE/web/index",
                "中国电信官方招聘平台，提供校园招聘岗位、宣讲问答、招聘进度和在线投递入口。");
        }

        for (CareerFair fair : careerFairRepository.findByTitleAndCompanyName("人工智能算法专场宣讲会", "星河智能科技")) {
            java.time.LocalDateTime start = java.time.LocalDateTime.now().plusDays(5).withHour(14).withMinute(0).withSecond(0).withNano(0);
            applyRealCareerFairSeed(fair,
                "中国建设银行2026校园招聘宣讲会", "中国建设银行", "线上", "金融",
                "金融科技,柜面服务,客户经理,管理培训生", "中国建设银行招聘官网",
                start, start.plusHours(2), start.plusDays(3).withHour(23).withMinute(59),
                "https://job1.ccb.com/cn/job/plan_index.html?planType=XY",
                "中国建设银行官方校园招聘首页，提供校招公告、校园宣讲会、岗位计划和在线申请入口。");
        }
        for (CareerFair fair : careerFairRepository.findByTitleAndCompanyName("捷迈（上海）医疗国际贸易有限公司宣讲会", "捷迈（上海）医疗国际贸易有限公司")) {
            java.time.LocalDateTime start = java.time.LocalDateTime.now().plusDays(5).withHour(14).withMinute(0).withSecond(0).withNano(0);
            applyRealCareerFairSeed(fair,
                "中国建设银行2026校园招聘宣讲会", "中国建设银行", "线上", "金融",
                "金融科技,柜面服务,客户经理,管理培训生", "中国建设银行招聘官网",
                start, start.plusHours(2), start.plusDays(3).withHour(23).withMinute(59),
                "https://job1.ccb.com/cn/job/plan_index.html?planType=XY",
                "中国建设银行官方校园招聘首页，提供校招公告、校园宣讲会、岗位计划和在线申请入口。");
        }

        for (CareerFair fair : careerFairRepository.findByTitleAndCompanyName("金融科技校招宣讲会", "海通数科")) {
            java.time.LocalDateTime start = java.time.LocalDateTime.now().plusDays(9).withHour(10).withMinute(0).withSecond(0).withNano(0);
            applyRealCareerFairSeed(fair,
                "中国平安2026校园招聘宣讲会", "中国平安", "线上", "金融科技",
                "科技研发,产品运营,数据分析,金融业务", "中国平安校园招聘官网",
                start, start.plusHours(2), start.plusDays(3).withHour(18).withMinute(0),
                "https://campus.pingan.com/",
                "中国平安校园招聘官网，提供校园招聘宣讲会、岗位搜索、投递进度和在线申请入口。");
        }
        for (CareerFair fair : careerFairRepository.findByTitleAndCompanyName("汇智（北京）能源有限公司宣讲会", "汇智（北京）能源有限公司")) {
            java.time.LocalDateTime start = java.time.LocalDateTime.now().plusDays(9).withHour(10).withMinute(0).withSecond(0).withNano(0);
            applyRealCareerFairSeed(fair,
                "中国平安2026校园招聘宣讲会", "中国平安", "线上", "金融科技",
                "科技研发,产品运营,数据分析,金融业务", "中国平安校园招聘官网",
                start, start.plusHours(2), start.plusDays(3).withHour(18).withMinute(0),
                "https://campus.pingan.com/",
                "中国平安校园招聘官网，提供校园招聘宣讲会、岗位搜索、投递进度和在线申请入口。");
        }

        for (CareerFair fair : careerFairRepository.findByTitleAndCompanyName("智能制造管培生招聘会", "东海精工集团")) {
            java.time.LocalDateTime start = java.time.LocalDateTime.now().plusDays(14).withHour(15).withMinute(0).withSecond(0).withNano(0);
            applyRealCareerFairSeed(fair,
                "联想2026校园招聘宣讲会", "联想", "线上", "智能终端与企业科技",
                "软件研发,硬件研发,供应链,产品经理", "联想校园招聘官网",
                start, start.plusHours(2).plusMinutes(30), start.plusDays(3).withHour(20).withMinute(0),
                "https://talent.lenovo.com.cn/campus",
                "联想校园招聘官网，提供中国校园招聘项目、岗位信息、招聘流程和在线投递入口。");
        }
        for (CareerFair fair : careerFairRepository.findByTitleAndCompanyName("道恩集团有限公司宣讲会", "道恩集团有限公司")) {
            java.time.LocalDateTime start = java.time.LocalDateTime.now().plusDays(14).withHour(15).withMinute(0).withSecond(0).withNano(0);
            applyRealCareerFairSeed(fair,
                "联想2026校园招聘宣讲会", "联想", "线上", "智能终端与企业科技",
                "软件研发,硬件研发,供应链,产品经理", "联想校园招聘官网",
                start, start.plusHours(2).plusMinutes(30), start.plusDays(3).withHour(20).withMinute(0),
                "https://talent.lenovo.com.cn/campus",
                "联想校园招聘官网，提供中国校园招聘项目、岗位信息、招聘流程和在线投递入口。");
        }

    }

    private void cleanupLegacyDemoJobPostings() {
        String[][] legacyDemoJobs = {
            {"Java Backend Engineer", "Future Tech"},
            {"Java 后端工程师", "未来科技"},
            {"Product Operations Trainee", "Harbor Equipment Group"},
            {"产品运营管培生", "港湾装备集团"},
            {"前端开发工程师", "未来科技"},
            {"数据分析师", "海通数科"},
            {"测试开发工程师", "星河智能科技"},
            {"网络安全工程师", "云盾安全"},
            {"产品经理助理", "港湾装备集团"},
        };

        for (String[] key : legacyDemoJobs) {
            jobPostingRepository.findByTitleAndCompanyName(key[0], key[1])
                .forEach(this::removeJobPostingFromRecommendations);
        }
        jobPostingRepository.flush();
    }

    private void cleanupDuplicateSeedJobPostings() {
        String[][] seedJobs = {
            {"软件开发-后台开发方向", "腾讯"},
            {"产品运营校招生", "字节跳动"},
            {"前端开发工程师", "阿里巴巴"},
            {"商业分析师", "美团"},
            {"软件测试开发工程师", "华为"},
            {"安全工程师（漏洞方向）", "奇安信"},
            {"产品经理", "京东"},
        };

        for (String[] key : seedJobs) {
            cleanupDuplicateJobPostings(key[0], key[1]);
        }
        jobPostingRepository.flush();
    }

    private void cleanupDuplicateJobPostings(String title, String companyName) {
        java.util.List<JobPosting> jobs = jobPostingRepository.findByTitleAndCompanyName(title, companyName);
        if (jobs.size() <= 1) return;

        JobPosting keeper = jobs.stream()
            .sorted(jobPostingKeepComparator())
            .findFirst()
            .orElse(null);
        if (keeper == null) return;

        jobs.stream()
            .filter(job -> !java.util.Objects.equals(job.getId(), keeper.getId()))
            .forEach(this::removeJobPostingFromRecommendations);
    }

    private java.util.Comparator<JobPosting> jobPostingKeepComparator() {
        return java.util.Comparator
            .comparingInt((JobPosting job) -> applicationRecordRepository.existsByJobPostingId(job.getId()) ? 0 : 1)
            .thenComparingInt(job -> Boolean.TRUE.equals(job.getActive()) ? 0 : 1)
            .thenComparing(JobPosting::getCreatedAt, java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder()));
    }

    private void removeJobPostingFromRecommendations(JobPosting job) {
        if (job.getId() != null && applicationRecordRepository.existsByJobPostingId(job.getId())) {
            if (Boolean.TRUE.equals(job.getActive())) {
                job.setActive(false);
                jobPostingRepository.save(job);
            }
            return;
        }
        jobPostingRepository.delete(job);
    }

    private void applyRealCareerFairSeed(CareerFair fair,
                                         String title,
                                         String companyName,
                                         String city,
                                         String industry,
                                         String targetRoles,
                                         String location,
                                         java.time.LocalDateTime startTime,
                                         java.time.LocalDateTime endTime,
                                         java.time.LocalDateTime applyDeadline,
                                         String applyUrl,
                                         String description) {
        fair.setTitle(title);
        fair.setCompanyName(companyName);
        fair.setCity(city);
        fair.setIndustry(industry);
        fair.setTargetRoles(targetRoles);
        fair.setLocation(location);
        fair.setStartTime(startTime);
        fair.setEndTime(endTime);
        fair.setApplyDeadline(applyDeadline);
        fair.setApplyUrl(applyUrl);
        fair.setDescription(description);
        careerFairRepository.save(fair);
    }

    private void cleanupDuplicateCareerFairs() {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.util.List<CareerFair> fairs = careerFairRepository.findAll();
        java.util.Set<Long> duplicateIds = new java.util.HashSet<>();
        collectDuplicateCareerFairIds(fairs, this::careerFairDisplayKey, now, duplicateIds);
        collectDuplicateCareerFairIds(fairs, this::careerFairBusinessKey, now, duplicateIds);
        if (!duplicateIds.isEmpty()) {
            careerFairRepository.deleteAllById(duplicateIds);
            careerFairRepository.flush();
        }
        careerFairRepository.findAll().forEach(fair -> {
            String businessKey = careerFairBusinessKey(fair);
            if (!java.util.Objects.equals(fair.getBusinessKey(), businessKey)) {
                fair.setBusinessKey(businessKey);
                careerFairRepository.save(fair);
            }
        });
    }

    private void collectDuplicateCareerFairIds(java.util.List<CareerFair> fairs,
                                               java.util.function.Function<CareerFair, String> keyFunction,
                                               java.time.LocalDateTime now,
                                               java.util.Set<Long> duplicateIds) {
        java.util.Map<String, java.util.List<CareerFair>> grouped = new java.util.LinkedHashMap<>();
        for (CareerFair fair : fairs) {
            if (fair.getId() == null) continue;
            grouped.computeIfAbsent(keyFunction.apply(fair), key -> new java.util.ArrayList<>()).add(fair);
        }
        grouped.values().stream()
            .filter(group -> group.size() > 1)
            .forEach(group -> {
                java.util.List<CareerFair> sorted = group.stream()
                    .sorted(careerFairComparator(now))
                    .toList();
                sorted.stream().skip(1).map(CareerFair::getId).forEach(duplicateIds::add);
            });
    }

    private java.util.Comparator<CareerFair> careerFairComparator(java.time.LocalDateTime now) {
        return java.util.Comparator
            .comparingInt((CareerFair fair) -> careerFairStatusRank(fair, now))
            .thenComparing(fair -> careerFairSortTime(fair, now), java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder()))
            .thenComparing(CareerFair::getCreatedAt, java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder()));
    }

    private int careerFairStatusRank(CareerFair fair, java.time.LocalDateTime now) {
        if (fair.getStartTime() != null && fair.getEndTime() != null
            && !fair.getStartTime().isAfter(now) && !fair.getEndTime().isBefore(now)) {
            return 0;
        }
        if (fair.getStartTime() != null && fair.getStartTime().isAfter(now)) {
            return 1;
        }
        if (fair.getEndTime() != null && fair.getEndTime().isBefore(now)) {
            return 2;
        }
        return 3;
    }

    private java.time.LocalDateTime careerFairSortTime(CareerFair fair, java.time.LocalDateTime now) {
        if (fair.getStartTime() != null && fair.getStartTime().isAfter(now)) {
            return fair.getStartTime();
        }
        if (fair.getStartTime() != null && fair.getEndTime() != null
            && !fair.getStartTime().isAfter(now) && !fair.getEndTime().isBefore(now)) {
            return fair.getEndTime();
        }
        return fair.getEndTime() != null ? fair.getEndTime() : fair.getStartTime();
    }

    private String careerFairDisplayKey(CareerFair fair) {
        return normalizeEmploymentKey(fair.getTitle()) + "|" +
            normalizeEmploymentKey(fair.getCompanyName()) + "|" +
            normalizeEmploymentKey(fair.getLocation()) + "|" +
            normalizeEmploymentKey(fair.getApplyUrl());
    }

    private String careerFairBusinessKey(CareerFair fair) {
        return normalizeEmploymentKey(fair.getTitle()) + "|" +
            normalizeEmploymentKey(fair.getCompanyName()) + "|" +
            (fair.getStartTime() == null ? "" : fair.getStartTime().toString());
    }

    private String normalizeEmploymentKey(String value) {
        return value == null ? "" : value.trim().toLowerCase(java.util.Locale.ROOT);
    }

    private void initKaoGongData() {
        initCivilServicePosts();
        initScoreLines();
        initCalendarEvents();
    }

    private void initCivilServicePosts() {
        long count = civilServicePostRepository.count();
        if (count > 0) {
            return;
        }

        java.time.LocalDate start = java.time.LocalDate.now().plusDays(10);
        civilServicePostRepository.save(CivilServicePost.builder()
            .examType("国家公务员考试").year(2027).region("北京")
            .jobName("综合管理岗").recruitingUnit("国家税务总局北京市税务局")
            .unitType("中央机关直属机构").jobCategory("综合管理").recruitCount(3)
            .educationRequirement("本科及以上").degreeRequirement("学士及以上")
            .majorRequirement("计算机科学, 软件工程, 信息管理")
            .householdRequirement("不限").politicalStatusRequirement("不限")
            .examSubjects("行测, 申论").registrationStart(start).registrationEnd(start.plusDays(8))
            .sourceUrl("https://example.edu/kaogong/jobs/1")
            .remark("示例数据，用于岗位匹配功能联调。")
            .build());

        civilServicePostRepository.save(CivilServicePost.builder()
            .examType("上海市公务员考试").year(2027).region("上海")
            .jobName("信息化建设岗").recruitingUnit("上海市某区政务服务中心")
            .unitType("地方机关").jobCategory("行政执法").recruitCount(2)
            .educationRequirement("本科及以上").degreeRequirement("学士及以上")
            .majorRequirement("计算机, 电子信息, 数据科学")
            .householdRequirement("上海生源优先").politicalStatusRequirement("不限")
            .examSubjects("行测, 申论, 专业科目").registrationStart(start.plusDays(20)).registrationEnd(start.plusDays(28))
            .sourceUrl("https://example.edu/kaogong/jobs/2")
            .remark("示例数据，可替换为正式招录公告数据。")
            .build());

        civilServicePostRepository.save(CivilServicePost.builder()
            .examType("事业单位考试").year(2027).region("江苏")
            .jobName("网络安全技术岗").recruitingUnit("江苏省某事业单位")
            .unitType("事业单位").jobCategory("专业技术").recruitCount(1)
            .educationRequirement("本科及以上").degreeRequirement("不限")
            .majorRequirement("网络空间安全, 计算机科学")
            .householdRequirement("不限").politicalStatusRequirement("中共党员")
            .examSubjects("职业能力倾向测验, 综合应用能力").registrationStart(start.plusDays(32)).registrationEnd(start.plusDays(40))
            .sourceUrl("https://example.edu/kaogong/jobs/3")
            .remark("示例数据，覆盖政治面貌匹配场景。")
            .build());
    }

    private void initScoreLines() {
        long count = scoreLineRepository.count();
        if (count > 0) {
            return;
        }

        scoreLineRepository.save(InterviewScoreLine.builder()
            .region("北京").year(2026).examType("国家公务员考试")
            .unitType("中央机关直属机构").jobCategory("综合管理")
            .jobName("综合管理岗").recruitingUnit("国家税务总局北京市税务局")
            .scoreLine(new java.math.BigDecimal("128.60")).interviewRatio("3:1")
            .recruitCount(3).interviewCount(9)
            .dataNote("示例进面分数线，正式使用时以公告为准。")
            .source("平台维护示例数据")
            .build());

        scoreLineRepository.save(InterviewScoreLine.builder()
            .region("上海").year(2026).examType("上海市公务员考试")
            .unitType("地方机关").jobCategory("行政执法")
            .jobName("信息化建设岗").recruitingUnit("上海市某区政务服务中心")
            .scoreLine(new java.math.BigDecimal("134.20")).interviewRatio("3:1")
            .recruitCount(2).interviewCount(6)
            .dataNote("示例数据，用于筛选与列表展示。")
            .source("平台维护示例数据")
            .build());

        scoreLineRepository.save(InterviewScoreLine.builder()
            .region("江苏").year(2025).examType("事业单位考试")
            .unitType("事业单位").jobCategory("专业技术")
            .jobName("网络安全技术岗").recruitingUnit("江苏省某事业单位")
            .scoreLine(new java.math.BigDecimal("72.50")).interviewRatio("5:1")
            .recruitCount(1).interviewCount(5)
            .dataNote("事业单位分数线口径可能与公务员考试不同。")
            .source("平台维护示例数据")
            .build());
    }

    private void initCalendarEvents() {
        long count = calendarEventRepository.count();
        if (count > 0 && count <= 18) {
            calendarEventRepository.deleteAll();
        } else if (count > 0) {
            return;
        }

        java.time.LocalDate base = java.time.LocalDate.now().plusDays(7);
        String[] nodes = {"公告发布", "报名开始", "报名截止", "资格审查", "缴费截止", "准考证打印", "笔试", "成绩公布", "面试"};
        for (int i = 0; i < nodes.length; i++) {
            calendarEventRepository.save(ExamCalendarEvent.builder()
                .region("北京")
                .examType("国家公务员考试")
                .year(2027)
                .nodeType(nodes[i])
                .title("2027 国家公务员考试北京考区：" + nodes[i])
                .eventDate(base.plusDays(i * 5L))
                .description("示例考试节点，后续可由管理员维护正式时间。")
                .sourceUrl("https://example.edu/kaogong/calendar")
                .build());
        }

        for (int i = 0; i < nodes.length; i++) {
            calendarEventRepository.save(ExamCalendarEvent.builder()
                .region("上海")
                .examType("上海市公务员考试")
                .year(2027)
                .nodeType(nodes[i])
                .title("2027 上海市公务员考试：" + nodes[i])
                .eventDate(base.plusDays(3 + i * 6L))
                .description("示例考试节点，用于日历订阅功能联调。")
                .sourceUrl("https://example.edu/kaogong/calendar/shanghai")
                .build());
        }
    }
}
