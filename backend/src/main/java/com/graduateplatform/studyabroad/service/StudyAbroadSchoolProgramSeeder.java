package com.graduateplatform.studyabroad.service;

import com.graduateplatform.studyabroad.entity.StudyAbroadSchoolProgram;
import com.graduateplatform.studyabroad.repository.StudyAbroadSchoolProgramRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class StudyAbroadSchoolProgramSeeder implements CommandLineRunner {

    private final StudyAbroadSchoolProgramRepository repository;

    public StudyAbroadSchoolProgramSeeder(StudyAbroadSchoolProgramRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        if (repository.count() > 0) return;
        repository.saveAll(seedItems());
    }

    private List<StudyAbroadSchoolProgram> seedItems() {
        String sourceNote = "演示数据，用于课程项目功能展示；正式使用时应由管理员按院校官网和官方政策定期更新。";
        LocalDate updatedAt = LocalDate.of(2026, 6, 1);
        return List.of(
            item("UK", "University College London", "Computer Science MSc", "Master", "计算机与数据",
                "QS 2026: Top 10", "THE: Top 30", "USNews: Top 20", "约 GBP 35k-45k/年", "1 年",
                "常见为 10 月至次年 4 月滚动/分轮", "本科相关专业，成绩单、语言成绩、PS、推荐信，部分项目看重编程和数学背景。",
                "英国学生签证通常需要 CAS、资金证明、语言证明和肺结核检测等材料。", "毕业生签证路径通常允许毕业后在英停留求职，具体以官方政策为准。",
                true, "与本校计算机学院有交换/暑研合作记录", "竞争激烈,学费高,住宿紧张", "热门项目申请量大，建议准备保底项目。", sourceNote, updatedAt),
            item("US", "Carnegie Mellon University", "MS in Information Systems Management", "Master", "计算机与数据",
                "QS 2026: Top 60", "THE: Top 30", "USNews: Top 30", "约 USD 55k-75k/年", "1-2 年",
                "常见为 12 月至次年 1 月", "建议有编程、数据分析或产品技术背景，需成绩单、语言、文书、推荐信，部分申请人提交 GRE/GMAT。",
                "美国 F-1 签证通常需要 I-20、SEVIS 缴费、资金证明和面签。", "STEM 项目通常可申请 OPT 延期，具体以项目 CIP 和官方规则为准。",
                false, "暂无本校合作标记", "就业压力,成本高,竞争激烈", "适合技术与管理交叉背景，需评估预算和就业目标。", sourceNote, updatedAt),
            item("Canada", "University of Toronto", "Master of Information", "Master", "信息管理",
                "QS 2026: Top 30", "THE: Top 30", "USNews: Top 20", "约 CAD 45k-65k/年", "2 年",
                "常见为 1 月前后", "强调学术成绩、信息技术/管理相关经历、语言成绩和个人陈述。",
                "加拿大学签通常需要录取通知、资金证明、PAL/TAL 等要求，按省份和政策更新确认。", "毕业后工签政策与项目长度、学校资质有关，应以 IRCC 最新规则为准。",
                true, "与本校有暑期交流项目记录", "周期长,材料复杂", "适合希望兼顾移民和就业路径的学生，但政策变化需持续关注。", sourceNote, updatedAt),
            item("Australia", "University of Melbourne", "Master of Information Systems", "Master", "信息管理",
                "QS 2026: Top 20", "THE: Top 40", "USNews: Top 40", "约 AUD 48k-58k/年", "2 年",
                "常见为 10 月/4 月左右", "本科成绩、语言成绩、课程匹配度，跨专业申请需关注先修课要求。",
                "澳大利亚学生签证通常需要 CoE、GTE/GS 材料、资金证明和保险。", "毕业后工作签证与学历层级、地区和政策相关，以官方说明为准。",
                false, "暂无本校合作标记", "学费高,签证材料多", "项目职业导向较强，但生活成本需要提前测算。", sourceNote, updatedAt),
            item("Hong Kong", "The University of Hong Kong", "MSc Computer Science", "Master", "计算机与数据",
                "QS 2026: Top 20", "THE: Top 40", "USNews: Top 50", "约 HKD 220k-320k/项目", "1 年",
                "常见为 12 月至次年 4 月分轮", "本科相关专业、语言成绩、成绩单、推荐信，热门方向重视项目和实习。",
                "香港学生签注通常由学校协助办理，需录取文件、身份材料和资金证明。", "毕业生通常可关注 IANG 等留港就业安排，具体以入境处政策为准。",
                true, "与本校有联合讲座和校友推荐资源", "轮次紧,热门方向竞争大", "适合希望离内地近、求职节奏快的学生。", sourceNote, updatedAt),
            item("Singapore", "National University of Singapore", "MSc Artificial Intelligence", "Master", "计算机与数据",
                "QS 2026: Top 10", "THE: Top 20", "USNews: Top 30", "约 SGD 55k-75k/项目", "1 年",
                "常见为 1 月至 3 月", "要求较强数学、编程和 AI/数据项目背景，语言成绩和推荐信重要。",
                "新加坡学生准证通常在录取后按学校指引办理。", "新加坡科技岗位集中，但竞争强，需提前准备实习和项目展示。",
                false, "暂无本校合作标记", "门槛高,项目密集,就业竞争", "适合背景扎实、目标明确的学生。", sourceNote, updatedAt),
            item("Germany", "Technical University of Munich", "Data Engineering and Analytics MSc", "Master", "计算机与数据",
                "QS 2026: Top 30", "THE: Top 40", "USNews: Top 80", "多数公立项目学费较低，需确认注册费/州学费", "2 年",
                "常见为 5 月前后", "重视课程匹配、数学和计算机基础，部分项目需要德语或特定课程学分。",
                "德国学生签证通常需要录取、资金证明和保险，审核周期需预留。", "毕业后通常有找工作居留路径，德语能力会影响就业范围。",
                false, "暂无本校合作标记", "课程匹配严格,审核慢", "低学费吸引力强，但先修课匹配和语言规划很关键。", sourceNote, updatedAt),
            item("Netherlands", "Delft University of Technology", "MSc Computer Science", "Master", "计算机与数据",
                "QS 2026: Top 50", "THE: Top 80", "USNews: Top 200", "约 EUR 20k-25k/年", "2 年",
                "常见为 1 月至 4 月", "本科相关专业、语言成绩、课程匹配和动机信，部分方向竞争较强。",
                "荷兰学生居留通常由学校发起流程，需资金证明和保险。", "毕业后可关注 orientation year，英语岗位较多但仍建议学习当地语言。",
                true, "与本校有欧洲交换学期合作记录", "生活成本高,住房紧张", "技术氛围强，住房和预算需提前规划。", sourceNote, updatedAt)
        );
    }

    private StudyAbroadSchoolProgram item(String country,
                                          String schoolName,
                                          String programName,
                                          String degree,
                                          String subjectArea,
                                          String qsRank,
                                          String theRank,
                                          String usNewsRank,
                                          String tuitionRange,
                                          String durationText,
                                          String deadlineText,
                                          String requirements,
                                          String visaPolicy,
                                          String employmentPolicy,
                                          boolean partnerProgram,
                                          String partnerNote,
                                          String riskTags,
                                          String riskSummary,
                                          String sourceNote,
                                          LocalDate policyUpdatedAt) {
        return StudyAbroadSchoolProgram.builder()
            .country(country)
            .schoolName(schoolName)
            .programName(programName)
            .degree(degree)
            .subjectArea(subjectArea)
            .qsRank(qsRank)
            .theRank(theRank)
            .usNewsRank(usNewsRank)
            .tuitionRange(tuitionRange)
            .durationText(durationText)
            .deadlineText(deadlineText)
            .applicationRequirements(requirements)
            .visaPolicy(visaPolicy)
            .employmentPolicy(employmentPolicy)
            .partnerProgram(partnerProgram)
            .partnerNote(partnerNote)
            .riskTags(riskTags)
            .riskSummary(riskSummary)
            .sourceNote(sourceNote)
            .policyUpdatedAt(policyUpdatedAt)
            .build();
    }
}
