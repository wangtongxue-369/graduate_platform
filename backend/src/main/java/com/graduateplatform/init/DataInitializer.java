package com.graduateplatform.init;


import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.community.entity.PostCategory;
import com.graduateplatform.community.repository.PostCategoryRepository;
import com.graduateplatform.job.entity.CareerFair;
import com.graduateplatform.job.entity.JobPosting;
import com.graduateplatform.job.repository.CareerFairRepository;
import com.graduateplatform.job.repository.JobPostingRepository;
import com.graduateplatform.kaogong.entity.CivilServicePost;
import com.graduateplatform.kaogong.entity.ExamCalendarEvent;
import com.graduateplatform.kaogong.entity.InterviewScoreLine;
import com.graduateplatform.kaogong.repository.CivilServicePostRepository;
import com.graduateplatform.kaogong.repository.ExamCalendarEventRepository;
import com.graduateplatform.kaogong.repository.InterviewScoreLineRepository;
import com.graduateplatform.questionbank.entity.Question;
import com.graduateplatform.questionbank.entity.QuestionBank;
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
    private final CivilServicePostRepository civilServicePostRepository;
    private final InterviewScoreLineRepository scoreLineRepository;
    private final ExamCalendarEventRepository calendarEventRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(PostCategoryRepository categoryRepository, UserRepository userRepository,
                           QuestionBankRepository bankRepository,
                           CareerFairRepository careerFairRepository,
                           JobPostingRepository jobPostingRepository,
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
                .name("Employment Test User").email("job@graduate.local").phone("13800138001")
                .password(passwordEncoder.encode("job1234"))
                .school("Graduate University").major("Computer Science").grade("2024")
                .target("job").role("user").status("normal").build());
            jobUser.setCreatedAt(thirtyDaysAgo);
            userRepository.save(jobUser);
        }
    }

    private void initQuestionBanks() {
        if (bankRepository.count() > 0) return;

        createBank("考研政治题库", "kaoyan", "政治", "涵盖马原、毛中特、史纲、思修", "middle",
            new String[][]{
                {"马克思主义哲学认为，世界的统一性在于它的", "[\"A.客观实在性\",\"B.物质性\",\"C.可知性\",\"D.矛盾性\"]", "B", "辩证唯物主义认为世界统一于物质。"},
                {"商品的二因素是", "[\"A.使用价值和价值\",\"B.具体劳动和抽象劳动\",\"C.私人劳动和社会劳动\",\"D.简单劳动和复杂劳动\"]", "A", "商品是使用价值和价值的统一体。"},
                {"毛泽东思想活的灵魂是", "[\"A.武装斗争\",\"B.实事求是\",\"C.群众路线\",\"D.独立自主\"]", "B", "实事求是、群众路线、独立自主是毛泽东思想活的灵魂。"},
                {"五四运动发生在哪一年", "[\"A.1917年\",\"B.1918年\",\"C.1919年\",\"D.1920年\"]", "C", "五四运动发生于1919年5月4日。"},
                {"社会主义初级阶段的基本经济制度是", "[\"A.公有制为主体\",\"B.多种所有制经济共同发展\",\"C.公有制为主体、多种所有制经济共同发展\",\"D.按劳分配为主体\"]", "C", "公有制为主体、多种所有制经济共同发展是我国基本经济制度。"},
            });

        createBank("考研英语题库", "kaoyan", "英语", "词汇、阅读、翻译与写作", "middle",
            new String[][]{
                {"The professor ___ the lecture with a summary.", "[\"A.concluded\",\"B.included\",\"C.excluded\",\"D.secluded\"]", "A", "conclude 意为\"结束，总结\"，符合句意。"},
                {"She is ___ student in her class.", "[\"A.the most diligent\",\"B.more diligent\",\"C.most diligent\",\"D.diligent\"]", "A", "表示三者以上比较用最高级，且形容词最高级前加the。"},
                {"I look forward to ___ from you.", "[\"A.hear\",\"B.hearing\",\"C.heard\",\"D.be heard\"]", "B", "look forward to + 动名词(doing)。"},
                {"Not until yesterday ___ the truth.", "[\"A.did he know\",\"B.he knew\",\"C.he did know\",\"D.knew he\"]", "A", "Not until放句首，主句用部分倒装。"},
                {"The meeting ___ next Monday has been cancelled.", "[\"A.held\",\"B.being held\",\"C.to be held\",\"D.having held\"]", "C", "不定式作定语表示将来。"},
            });

        createBank("行测题库", "kaogong", "行测", "言语理解、数量关系、判断推理", "middle",
            new String[][]{
                {"从下列选项中选出最合适的一项填入问号处：2, 4, 8, 16, ?", "[\"A.24\",\"B.28\",\"C.32\",\"D.36\"]", "C", "等比数列，公比为2。"},
                {"甲、乙两人从相距36千米的两地相向而行，甲的速度为4km/h，乙的速度为5km/h，几小时后两人相遇？", "[\"A.3小时\",\"B.3.5小时\",\"C.4小时\",\"D.4.5小时\"]", "C", "相遇时间=总路程/(速度和)=36/(4+5)=4小时。"},
                {"以下哪项不属于行政诉讼的受案范围？", "[\"A.对罚款不服\",\"B.对行政拘留不服\",\"C.对国防外交等国家行为不服\",\"D.对吊销许可证不服\"]", "C", "国防、外交等国家行为不属于行政诉讼受案范围。"},
                {"某商品进价100元，按150元出售，利润率为多少？", "[\"A.30%\",\"B.40%\",\"C.50%\",\"D.60%\"]", "C", "利润率=(售价-进价)/进价=(150-100)/100=50%。"},
                {"下列词语中，没有错别字的一项是", "[\"A.不径而走\",\"B.一愁莫展\",\"C.再接再励\",\"D.脍炙人口\"]", "D", "A应为\"不胫而走\"，B应为\"一筹莫展\"，C应为\"再接再厉\"。"},
            });

        createBank("申论题库", "kaogong", "申论", "归纳概括、提出对策、综合分析", "hard",
            new String[][]{
                {"申论考试中，归纳概括题的核心要求是", "[\"A.全面、准确、简明\",\"B.生动、形象、具体\",\"C.华丽、优美、动人\",\"D.复杂、深奥、晦涩\"]", "A", "归纳概括题强调全面、准确、简明。"},
                {"公文写作中，请示的结束语正确的是", "[\"A.妥否，请批示\",\"B.多谢合作\",\"C.祝工作顺利\",\"D.以上通知，请遵守\"]", "A", "请示的规范结束语为\"妥否，请批示\"或\"请批复\"。"},
                {"提出对策题在作答时，措施应具备", "[\"A.针对性、可行性、操作性\",\"B.理论性、抽象性、理想性\",\"C.随意性、主观性、模糊性\",\"D.复杂性、难懂性、空泛性\"]", "A", "对策题要求措施具有针对性、可行性和可操作性。"},
                {"综合分析题中，分析原因的常见维度不包括", "[\"A.思想观念层面\",\"B.制度机制层面\",\"C.经济社会发展层面\",\"D.个人好恶层面\"]", "D", "综合分析应从客观维度分析原因，个人好恶不够客观。"},
                {"申论文章的论证方法中，类比论证属于", "[\"A.事实论证\",\"B.道理论证\",\"C.比喻论证\",\"D.对比论证\"]", "C", "类比论证是比喻论证的一种形式。"},
            });
    }


    private void initEmploymentData() {
        updateLegacyEmploymentSeedData();

        java.time.LocalDateTime fairStart = java.time.LocalDateTime.now().plusDays(7).withHour(14).withMinute(0).withSecond(0).withNano(0);
        boolean hasInternetFair = careerFairRepository.existsByTitleAndCompanyName("Internet Campus Career Fair", "Future Tech")
            || careerFairRepository.existsByTitleAndCompanyName("互联网校园招聘宣讲会", "未来科技");
        if (!hasInternetFair) {
            careerFairRepository.save(CareerFair.builder()
                .title("互联网校园招聘宣讲会")
                .companyName("未来科技")
                .city("上海")
                .industry("互联网")
                .targetRoles("后端,前端,产品")
                .location("学生中心 A101")
                .startTime(fairStart)
                .endTime(fairStart.plusHours(2))
                .applyDeadline(fairStart.plusDays(3))
                .applyUrl("https://jobs.example.com/future-tech")
                .description("面向应届毕业生介绍校园招聘岗位、培养计划和线上申请流程。")
                .active(true)
                .build());
        }

        boolean hasManufacturingFair = careerFairRepository.existsByTitleAndCompanyName("Smart Manufacturing Fair", "Harbor Equipment Group")
            || careerFairRepository.existsByTitleAndCompanyName("智能制造专场招聘会", "港湾装备集团");
        if (!hasManufacturingFair) {
            careerFairRepository.save(CareerFair.builder()
                .title("智能制造专场招聘会")
                .companyName("港湾装备集团")
                .city("苏州")
                .industry("智能制造")
                .targetRoles("质量工程,嵌入式,供应链")
                .location("就业指导中心 2 楼")
                .startTime(fairStart.plusDays(3))
                .endTime(fairStart.plusDays(3).plusHours(3))
                .applyDeadline(fairStart.plusDays(6))
                .applyUrl("https://jobs.example.com/manufacturing")
                .description("联合多部门发布智能制造岗位，说明招聘流程、岗位要求和网申安排。")
                .active(true)
                .build());
        }

        boolean hasBackendJob = jobPostingRepository.existsByTitleAndCompanyName("Java Backend Engineer", "Future Tech")
            || jobPostingRepository.existsByTitleAndCompanyName("Java 后端工程师", "未来科技");
        if (!hasBackendJob) {
            jobPostingRepository.save(JobPosting.builder()
                .title("Java 后端工程师")
                .companyName("未来科技")
                .city("上海")
                .industry("互联网")
                .roleType("后端")
                .salaryRange("18k-25k")
                .educationRequirement("本科及以上")
                .majorKeywords("计算机科学,软件工程,信息系统")
                .skillTags("Java,Spring Boot,MySQL,Redis")
                .description("参与校园招聘产品的后端服务建设，负责接口开发、数据处理与系统稳定性优化。")
                .applyUrl("https://jobs.example.com/java-backend")
                .active(true)
                .build());
        }

        boolean hasOperationsJob = jobPostingRepository.existsByTitleAndCompanyName("Product Operations Trainee", "Harbor Equipment Group")
            || jobPostingRepository.existsByTitleAndCompanyName("产品运营管培生", "港湾装备集团");
        if (!hasOperationsJob) {
            jobPostingRepository.save(JobPosting.builder()
                .title("产品运营管培生")
                .companyName("港湾装备集团")
                .city("苏州")
                .industry("智能制造")
                .roleType("产品运营")
                .salaryRange("10k-15k")
                .educationRequirement("本科及以上")
                .majorKeywords("管理学,自动化,计算机科学")
                .skillTags("数据分析,沟通协调,项目管理")
                .description("负责产品运营数据分析、流程协同和项目跟进，参与制造业校招生管培培养计划。")
                .applyUrl("https://jobs.example.com/product-operation")
                .active(true)
                .build());
        }
    }

    private void updateLegacyEmploymentSeedData() {
        for (CareerFair fair : careerFairRepository.findByTitleAndCompanyName("Internet Campus Career Fair", "Future Tech")) {
            fair.setTitle("互联网校园招聘宣讲会");
            fair.setCompanyName("未来科技");
            fair.setCity("上海");
            fair.setIndustry("互联网");
            fair.setTargetRoles("后端,前端,产品");
            fair.setLocation("学生中心 A101");
            fair.setApplyUrl("https://jobs.example.com/future-tech");
            fair.setDescription("面向应届毕业生介绍校园招聘岗位、培养计划和线上申请流程。");
            careerFairRepository.save(fair);
        }

        for (CareerFair fair : careerFairRepository.findByTitleAndCompanyName("Smart Manufacturing Fair", "Harbor Equipment Group")) {
            fair.setTitle("智能制造专场招聘会");
            fair.setCompanyName("港湾装备集团");
            fair.setCity("苏州");
            fair.setIndustry("智能制造");
            fair.setTargetRoles("质量工程,嵌入式,供应链");
            fair.setLocation("就业指导中心 2 楼");
            fair.setApplyUrl("https://jobs.example.com/manufacturing");
            fair.setDescription("联合多部门发布智能制造岗位，说明招聘流程、岗位要求和网申安排。");
            careerFairRepository.save(fair);
        }

        for (JobPosting job : jobPostingRepository.findByTitleAndCompanyName("Java Backend Engineer", "Future Tech")) {
            job.setTitle("Java 后端工程师");
            job.setCompanyName("未来科技");
            job.setCity("上海");
            job.setIndustry("互联网");
            job.setRoleType("后端");
            job.setSalaryRange("18k-25k");
            job.setEducationRequirement("本科及以上");
            job.setMajorKeywords("计算机科学,软件工程,信息系统");
            job.setSkillTags("Java,Spring Boot,MySQL,Redis");
            job.setDescription("参与校园招聘产品的后端服务建设，负责接口开发、数据处理与系统稳定性优化。");
            job.setApplyUrl("https://jobs.example.com/java-backend");
            jobPostingRepository.save(job);
        }

        for (JobPosting job : jobPostingRepository.findByTitleAndCompanyName("Product Operations Trainee", "Harbor Equipment Group")) {
            job.setTitle("产品运营管培生");
            job.setCompanyName("港湾装备集团");
            job.setCity("苏州");
            job.setIndustry("智能制造");
            job.setRoleType("产品运营");
            job.setSalaryRange("10k-15k");
            job.setEducationRequirement("本科及以上");
            job.setMajorKeywords("管理学,自动化,计算机科学");
            job.setSkillTags("数据分析,沟通协调,项目管理");
            job.setDescription("负责产品运营数据分析、流程协同和项目跟进，参与制造业校招生管培培养计划。");
            job.setApplyUrl("https://jobs.example.com/product-operation");
            jobPostingRepository.save(job);
        }
    }

    private void createBank(String name, String target, String subject, String desc, String difficulty, String[][] questions) {
        QuestionBank bank = QuestionBank.builder()
            .name(name).target(target).subject(subject).description(desc).difficulty(difficulty)
            .build();

        for (int i = 0; i < questions.length; i++) {
            String[] q = questions[i];
            bank.getQuestions().add(Question.builder()
                .stem(q[0]).optionsJson(q[1]).answer(q[2]).analysis(q[3])
                .chapter("第" + (i + 1) + "章")
                .questionType("single")
                .knowledgePoint(subject + "知识点" + (i + 1))
                .difficulty(difficulty)
                .year(2024)
                .status("published")
                .bank(bank)
                .active(true)
                .build());
        }

        bankRepository.save(bank);
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
