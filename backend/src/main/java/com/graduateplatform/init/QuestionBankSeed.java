package com.graduateplatform.init;

import com.graduateplatform.questionbank.entity.Question;
import com.graduateplatform.questionbank.entity.QuestionBank;
import com.graduateplatform.questionbank.repository.QuestionBankRepository;

import java.util.List;

/**
 * 题库种子数据。
 *
 * <p>由 {@link DataInitializer#initQuestionBanks()} 在数据库为空时一次性写入。
 * 每个题库 30 道题左右，覆盖单选/多选/判断/主观题型，便于前端联调与测试用户体验。
 *
 * <p>线上既有数据库不会被覆盖（DataInitializer 在 bankRepository.count() > 0 时直接返回）；
 * 如需补到既有库，使用 {@code seed_question_banks.sql} 幂等脚本。
 */
public final class QuestionBankSeed {

    private QuestionBankSeed() {}

    /**
     * 一道种子题。chapter / questionType / knowledgePoint 与 builder 中的默认值正交，
     * 字段为 null 时回退到 builder 默认。
     */
    public record SeedQuestion(
        String stem,
        String optionsJson, // 主观题留空字符串，service/builder 会回退为 "[]"
        String answer,
        String analysis,
        String chapter,
        String questionType, // single / multiple / judge / subjective，null 默认 single
        String knowledgePoint,
        String difficulty    // 单题级，null 跟随题库默认
    ) {}

    public record SeedBank(
        String name,
        String target,
        String subject,
        String description,
        String difficulty, // 题库默认难度
        List<SeedQuestion> questions
    ) {}

    /**
     * 把所有种子题库写入仓库。空库时调用，不做去重——重复调用会插入重复行。
     */
    public static void seedAll(QuestionBankRepository bankRepository) {
        for (SeedBank seed : ALL_BANKS) {
            QuestionBank bank = QuestionBank.builder()
                .name(seed.name()).target(seed.target()).subject(seed.subject())
                .description(seed.description()).difficulty(seed.difficulty())
                .status("active").active(true)
                .build();

            for (SeedQuestion q : seed.questions()) {
                bank.getQuestions().add(Question.builder()
                    .stem(q.stem())
                    .optionsJson(q.optionsJson() == null || q.optionsJson().isBlank() ? "[]" : q.optionsJson())
                    .answer(q.answer())
                    .analysis(q.analysis())
                    .chapter(q.chapter())
                    .questionType(q.questionType() == null ? "single" : q.questionType())
                    .knowledgePoint(q.knowledgePoint())
                    .difficulty(q.difficulty() == null ? seed.difficulty() : q.difficulty())
                    .year(2024)
                    .status("published")
                    .bank(bank)
                    .active(true)
                    .versionNo(1)
                    .build());
            }
            bankRepository.save(bank);
        }
    }

    // ==================== 数据 ====================

    public static final List<SeedBank> ALL_BANKS = List.of(
        QuestionBankSeedKaoyanZhengzhi.BANK,
        QuestionBankSeedKaoyanYingyu.BANK,
        QuestionBankSeedKaogongXingce.BANK,
        QuestionBankSeedKaogongShenlun.BANK,
        QuestionBankSeedKaoyanShuxue.BANK,
        QuestionBankSeedKaoyanZhuanyeke.BANK
    );
}
