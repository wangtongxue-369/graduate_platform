package com.graduateplatform.init;

import com.graduateplatform.init.QuestionBankSeed.SeedBank;
import com.graduateplatform.init.QuestionBankSeed.SeedQuestion;

import java.util.List;

/** 考研英语 — 词汇、语法、阅读、翻译与写作，30 题。 */
final class QuestionBankSeedKaoyanYingyu {
    private QuestionBankSeedKaoyanYingyu() {}

    static final SeedBank BANK = new SeedBank(
        "考研英语题库", "kaoyan", "英语",
        "词汇、语法、完形、阅读理解、翻译与写作，30 题",
        "middle",
        List.of(
            // ===== 词汇 =====
            new SeedQuestion(
                "The professor ___ the lecture with a summary.",
                "[\"A.concluded\",\"B.included\",\"C.excluded\",\"D.secluded\"]",
                "A", "conclude 意为\"结束，总结\"，符合句意。",
                "词汇", "single", "动词辨析", null),
            new SeedQuestion(
                "Her decision to leave the company was ___ ; nobody saw it coming.",
                "[\"A.abrupt\",\"B.gradual\",\"C.expected\",\"D.predictable\"]",
                "A", "abrupt 意为\"突然的，意外的\"，与下文 nobody saw it coming 一致。",
                "词汇", "single", "形容词辨析", null),
            new SeedQuestion(
                "The new policy will ___ economic growth in the region.",
                "[\"A.stimulate\",\"B.suppress\",\"C.simulate\",\"D.stipulate\"]",
                "A", "stimulate 意为\"刺激，促进\"，搭配 economic growth 合理。",
                "词汇", "single", "动词辨析", null),
            new SeedQuestion(
                "His arguments are ___ ; you cannot find any logical flaw.",
                "[\"A.coherent\",\"B.consistent\",\"C.cohesive\",\"D.compatible\"]",
                "A", "coherent 强调论证连贯严密，符合\"无逻辑漏洞\"的语境。",
                "词汇", "single", "近义辨析", null),
            new SeedQuestion(
                "下列单词中，意思与 \"reluctant\" 最接近的是",
                "[\"A.eager\",\"B.unwilling\",\"C.confident\",\"D.passionate\"]",
                "B", "reluctant = unwilling，意为\"不情愿的\"。",
                "词汇", "single", "同义词", null),

            // ===== 语法 =====
            new SeedQuestion(
                "She is ___ student in her class.",
                "[\"A.the most diligent\",\"B.more diligent\",\"C.most diligent\",\"D.diligent\"]",
                "A", "三者以上比较用最高级，且形容词最高级前加 the。",
                "语法", "single", "比较级与最高级", null),
            new SeedQuestion(
                "I look forward to ___ from you.",
                "[\"A.hear\",\"B.hearing\",\"C.heard\",\"D.be heard\"]",
                "B", "look forward to 中 to 是介词，后接动名词。",
                "语法", "single", "非谓语动词", null),
            new SeedQuestion(
                "Not until yesterday ___ the truth.",
                "[\"A.did he know\",\"B.he knew\",\"C.he did know\",\"D.knew he\"]",
                "A", "Not until 引导的状语放句首时，主句用部分倒装。",
                "语法", "single", "倒装", null),
            new SeedQuestion(
                "The meeting ___ next Monday has been cancelled.",
                "[\"A.held\",\"B.being held\",\"C.to be held\",\"D.having held\"]",
                "C", "动作未发生且为将来，用不定式作定语。",
                "语法", "single", "非谓语动词", null),
            new SeedQuestion(
                "If I ___ you, I would accept the offer.",
                "[\"A.am\",\"B.was\",\"C.were\",\"D.had been\"]",
                "C", "与现在事实相反的虚拟条件句，be 动词统一用 were。",
                "语法", "single", "虚拟语气", null),
            new SeedQuestion(
                "The book ___ I borrowed from the library is very interesting.",
                "[\"A.who\",\"B.which\",\"C.whose\",\"D.what\"]",
                "B", "先行词为物，关系代词在从句中作宾语，用 which 或 that。",
                "语法", "single", "定语从句", null),

            // ===== 阅读理解（精简题型示例） =====
            new SeedQuestion(
                "在阅读理解中，作者态度题（attitude）通常需要关注",
                "[\"A.文章首尾段的评价词\",\"B.使用的形容词与副词\",\"C.例证的褒贬倾向\",\"D.以上都是\"]",
                "D", "态度题需综合首尾观点句、修饰词色彩及例证倾向判断。",
                "阅读理解", "single", "态度题技巧", null),
            new SeedQuestion(
                "主旨题答题时，最不可靠的依据是",
                "[\"A.首段中心句\",\"B.尾段总结\",\"C.单个段落细节\",\"D.全文反复出现的关键词\"]",
                "C", "单个段落细节往往是局部信息，不能代表全文主旨。",
                "阅读理解", "single", "主旨题技巧", null),
            new SeedQuestion(
                "下列属于推理题（inference）常见错误选项特征的有",
                "[\"A.过度推理\",\"B.原文复现\",\"C.偷换概念\",\"D.超出文章范围\"]",
                "ACD", "推理题错误选项常表现为过度推理、偷换概念、超出文章范围；原文复现往往是细节题套路。",
                "阅读理解", "multiple", "推理题陷阱", null),

            // ===== 完形填空 =====
            new SeedQuestion(
                "完形填空通常考查",
                "[\"A.词义辨析\",\"B.语法结构\",\"C.逻辑衔接\",\"D.以上都是\"]",
                "D", "完形从词、句、篇三个层面综合考查。",
                "完形填空", "single", "考查内容", null),

            // ===== 翻译 =====
            new SeedQuestion(
                "英汉翻译时，遇到长难句的常用拆分方法不包括",
                "[\"A.按从句拆分\",\"B.按介词短语拆分\",\"C.按分词结构拆分\",\"D.按字母顺序拆分\"]",
                "D", "字母顺序与句意结构无关，不是拆句依据。",
                "翻译", "single", "翻译技巧", null),
            new SeedQuestion(
                "下列翻译技巧中，常用于英译汉的有",
                "[\"A.增译\",\"B.减译\",\"C.转换词性\",\"D.调整语序\"]",
                "ABCD", "四项均为常用英译汉技巧。",
                "翻译", "multiple", "翻译技巧", null),

            // ===== 写作 =====
            new SeedQuestion(
                "考研英语小作文（应用文）通常字数要求是",
                "[\"A.50-80词\",\"B.约100词\",\"C.约160-200词\",\"D.250词以上\"]",
                "B", "考研英语小作文一般要求100词左右。",
                "写作", "single", "写作要求", null),
            new SeedQuestion(
                "大作文（图画作文）的常见结构是",
                "[\"A.描述图画→分析含义→总结/呼吁\",\"B.提出问题→列举事实→引用名人\",\"C.讲故事→引出对话→抒情结尾\",\"D.以上都不是\"]",
                "A", "图画作文的经典三段式：描述、分析、总结。",
                "写作", "single", "写作结构", null),
            new SeedQuestion(
                "写作中使用从句和分词结构能让文章更加丰富多变。",
                "[\"A.正确\",\"B.错误\"]",
                "A", "句式多变是评分细则中的重要维度。",
                "写作", "judge", "句式多样性", null),

            // ===== 综合 =====
            new SeedQuestion(
                "考研英语真题与模拟题相比，更适合精读练习的原因是",
                "[\"A.出题思路稳定\",\"B.设问严谨\",\"C.干扰项设置精巧\",\"D.以上都是\"]",
                "D", "真题在出题思路、设问、干扰项三方面都更接近考试。",
                "应试技巧", "single", "复习策略", null),
            new SeedQuestion(
                "做完一篇阅读后，应做的复盘工作不包括",
                "[\"A.整理生词与长难句\",\"B.总结错题原因\",\"C.立刻开始下一篇\",\"D.归纳同义替换\"]",
                "C", "复盘是真正提升的环节，跳过会让做题效益最大降低。",
                "应试技巧", "single", "复习策略", null),
            new SeedQuestion(
                "请用不超过 100 词写一份给外国朋友的邮件，介绍中国春节最特别的一项习俗。",
                "",
                "Open with greetings; describe one custom (e.g., 团圆饭/红包/贴春联) with cultural meaning; close with invitation. Use proper letter format.",
                "评分关注：格式 (称呼+落款) / 内容 (习俗具体描述+文化含义) / 语言 (词汇句式得体)。",
                "写作", "subjective", "应用文写作", "hard"),
            new SeedQuestion(
                "请将以下句子翻译成中文：The rapid development of artificial intelligence has profoundly transformed the way we work and live.",
                "",
                "人工智能的飞速发展已深刻改变了我们的工作和生活方式。",
                "翻译关键：rapid development—飞速发展；profoundly transform—深刻改变；the way we work and live—工作和生活方式。",
                "翻译", "subjective", "英译汉", "hard"),

            // ===== 词汇拓展 =====
            new SeedQuestion(
                "下列单词与 \"significant\" 含义最接近的是",
                "[\"A.trivial\",\"B.crucial\",\"C.casual\",\"D.lateral\"]",
                "B", "significant 意为\"重要的\"，与 crucial 同义。",
                "词汇", "single", "同义词", null),
            new SeedQuestion(
                "动词短语 \"give in\" 的意思是",
                "[\"A.分发\",\"B.让步\",\"C.放弃\",\"D.参与\"]",
                "B", "give in 意为\"屈服，让步\"。\"放弃\"应为 give up。",
                "词汇", "single", "动词短语", null),
            new SeedQuestion(
                "前缀 \"sub-\" 通常表示",
                "[\"A.超过\",\"B.之下、次于\",\"C.重新\",\"D.反对\"]",
                "B", "sub- 表示\"在……之下，次于\"，如 submarine（潜艇）、subordinate（下级）。",
                "词汇", "single", "构词法", null),
            new SeedQuestion(
                "下列词形变化正确的是",
                "[\"A.success - succeed - successful\",\"B.success - succeed - successive\",\"C.success - succeed - succeeding\",\"D.success - succeed - succeedful\"]",
                "A", "success（名词）→ succeed（动词）→ successful（形容词）。",
                "词汇", "single", "构词法", null),

            // ===== 语法补充 =====
            new SeedQuestion(
                "All the workers ___ working in the factory have to follow the safety rules.",
                "[\"A.who\",\"B.which\",\"C.whom\",\"D.whose\"]",
                "A", "先行词为人且作主语，关系代词用 who。",
                "语法", "single", "定语从句", null),
            new SeedQuestion(
                "情态动词 must 表示推测时通常表达",
                "[\"A.强烈的肯定\",\"B.弱可能性\",\"C.被动义务\",\"D.过去时态\"]",
                "A", "must 表推测时表强烈肯定，意为\"一定\"。",
                "语法", "single", "情态动词", null)
        )
    );
}
