-- 题库练习模块 — 种子题库与题目，幂等可重复执行。
-- 
-- 行为说明：
--   1) 同名题库已存在时 → 跳过 INSERT bank，但 @bank_id 仍指向已有那一行；
--   2) 同 (bank_id, stem) 题目已存在时 → 跳过 INSERT question；
--   3) 题库不存在时 → 新建题库，再补该库下所有题目。
-- 
-- 用途：
--   线上数据库已有 "考研政治题库" 等 4 个旧库（各 5 题）时，跑本脚本会：
--     - 旧库自动复用，仅补 25 道新题；
--     - 新增 "考研数学题库" 与 "计算机专业课题库"；
--   在干净数据库上跑则全 6 库 × ~30 题完整建立。
-- 
-- 由 QuestionBankSeedDumpSqlTest 自动从 Java 种子数据生成，请勿手工修改本文件。
SET NAMES utf8mb4;

-- ==================== 题库：考研政治题库 ====================
INSERT INTO question_banks (name, target, subject, description, difficulty, status, active)
SELECT '考研政治题库', 'kaoyan', '政治', '涵盖马原、毛中特、史纲、思修，30 题（单选/多选/判断/主观）', 'middle', 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM question_banks WHERE name = '考研政治题库');

SET @bank_id := (SELECT id FROM question_banks WHERE name = '考研政治题库' LIMIT 1);

INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '马克思主义哲学认为，世界的统一性在于它的', '["A.客观实在性","B.物质性","C.可知性","D.矛盾性"]', 'B', '辩证唯物主义认为世界统一于物质。', '马克思主义基本原理', 'single', '唯物论', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '马克思主义哲学认为，世界的统一性在于它的');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '商品的二因素是', '["A.使用价值和价值","B.具体劳动和抽象劳动","C.私人劳动和社会劳动","D.简单劳动和复杂劳动"]', 'A', '商品是使用价值和价值的统一体。', '马克思主义基本原理', 'single', '政治经济学', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '商品的二因素是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列选项中，属于辩证唯物主义认识论基本观点的是', '["A.认识是主体对客体的能动反映","B.实践是认识的基础","C.认识具有反复性和无限性","D.以上都是"]', 'D', '三个观点均为辩证唯物主义认识论核心。', '马克思主义基本原理', 'single', '认识论', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列选项中，属于辩证唯物主义认识论基本观点的是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '矛盾的普遍性和特殊性的关系是', '["A.整体与部分的关系","B.共性与个性的关系","C.原因与结果的关系","D.主要与次要的关系"]', 'B', '矛盾的普遍性即共性，特殊性即个性。', '马克思主义基本原理', 'single', '辩证法', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '矛盾的普遍性和特殊性的关系是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列关于社会基本矛盾的说法正确的有', '["A.生产力与生产关系的矛盾","B.经济基础与上层建筑的矛盾","C.人民内部矛盾","D.敌我矛盾"]', 'AB', '社会基本矛盾指生产力与生产关系、经济基础与上层建筑之间的矛盾。', '马克思主义基本原理', 'multiple', '历史唯物主义', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列关于社会基本矛盾的说法正确的有');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '实践是检验真理的唯一标准。', '["A.正确","B.错误"]', 'A', '实践是检验真理的唯一标准是马克思主义认识论的基本观点。', '马克思主义基本原理', 'judge', '认识论', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '实践是检验真理的唯一标准。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '毛泽东思想活的灵魂是', '["A.武装斗争","B.实事求是","C.群众路线","D.独立自主"]', 'B', '实事求是、群众路线、独立自主是毛泽东思想活的灵魂，其中实事求是是核心。', '毛泽东思想', 'single', '毛泽东思想', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '毛泽东思想活的灵魂是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '新民主主义革命的三大法宝是', '["A.统一战线、武装斗争、党的建设","B.解放思想、实事求是、与时俱进","C.自力更生、艰苦奋斗、开拓创新","D.土地革命、武装斗争、根据地建设"]', 'A', '1939年毛泽东在《〈共产党人〉发刊词》中明确提出三大法宝。', '毛泽东思想', 'single', '新民主主义革命', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '新民主主义革命的三大法宝是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '我国社会主义初级阶段的基本经济制度是', '["A.公有制为主体","B.多种所有制经济共同发展","C.公有制为主体、多种所有制经济共同发展","D.按劳分配为主体"]', 'C', '公有制为主体、多种所有制经济共同发展是我国基本经济制度。', '中国特色社会主义', 'single', '基本经济制度', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '我国社会主义初级阶段的基本经济制度是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '习近平新时代中国特色社会主义思想的核心内容是', '["A.八个明确","B.十四个坚持","C.八个明确和十四个坚持","D.五位一体"]', 'C', '新时代中国特色社会主义思想的核心是"八个明确"和"十四个坚持"。', '中国特色社会主义', 'single', '新时代思想', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '习近平新时代中国特色社会主义思想的核心内容是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '"四个全面"战略布局包括', '["A.全面建成社会主义现代化强国","B.全面深化改革","C.全面依法治国","D.全面从严治党"]', 'ABCD', '"四个全面"为：全面建成社会主义现代化强国、全面深化改革、全面依法治国、全面从严治党。', '中国特色社会主义', 'multiple', '四个全面', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '"四个全面"战略布局包括');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '中国共产党的根本宗旨是全心全意为人民服务。', '["A.正确","B.错误"]', 'A', '全心全意为人民服务是党的根本宗旨。', '中国特色社会主义', 'judge', '党的建设', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '中国共产党的根本宗旨是全心全意为人民服务。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '五四运动发生在哪一年', '["A.1917年","B.1918年","C.1919年","D.1920年"]', 'C', '五四运动发生于1919年5月4日。', '中国近现代史', 'single', '新民主主义革命开端', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '五四运动发生在哪一年');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '中国共产党第一次全国代表大会召开的时间和地点是', '["A.1921年7月，上海","B.1921年7月，北京","C.1922年1月，广州","D.1923年6月，武汉"]', 'A', '中共一大于1921年7月23日在上海召开，后转移到嘉兴南湖。', '中国近现代史', 'single', '中共建党', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '中国共产党第一次全国代表大会召开的时间和地点是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '确立毛泽东在党中央和红军领导地位的会议是', '["A.八七会议","B.古田会议","C.遵义会议","D.七届二中全会"]', 'C', '1935年遵义会议确立了毛泽东在党中央和红军的领导地位。', '中国近现代史', 'single', '长征', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '确立毛泽东在党中央和红军领导地位的会议是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '中华人民共和国成立的标志是', '["A.1949年9月第一届全国政协会议召开","B.1949年10月1日开国大典","C.1954年第一届全国人大召开","D.1956年三大改造完成"]', 'B', '1949年10月1日开国大典标志着中华人民共和国成立。', '中国近现代史', 'single', '新中国成立', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '中华人民共和国成立的标志是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '改革开放是党的哪次会议确定的', '["A.十一届三中全会","B.十二大","C.十三大","D.十四大"]', 'A', '1978年12月党的十一届三中全会作出改革开放的历史性决策。', '中国近现代史', 'single', '改革开放', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '改革开放是党的哪次会议确定的');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列属于改革开放后取得的重大成就的有', '["A.设立经济特区","B.加入世界贸易组织","C.脱贫攻坚战取得全面胜利","D.建立全面小康社会"]', 'ABCD', '四项均为改革开放以来的重大成就。', '中国近现代史', 'multiple', '改革开放成就', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列属于改革开放后取得的重大成就的有');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '社会主义核心价值观个人层面的内容是', '["A.富强、民主、文明、和谐","B.自由、平等、公正、法治","C.爱国、敬业、诚信、友善","D.以上都是"]', 'C', '社会主义核心价值观分国家、社会、个人三个层面，个人层面为爱国、敬业、诚信、友善。', '思想道德修养', 'single', '核心价值观', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '社会主义核心价值观个人层面的内容是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '我国宪法规定，国家的一切权力属于', '["A.中国共产党","B.全国人民代表大会","C.人民","D.政府"]', 'C', '宪法第二条规定：中华人民共和国的一切权力属于人民。', '法律基础', 'single', '宪法', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '我国宪法规定，国家的一切权力属于');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '民法典自哪一年正式实施', '["A.2019年1月1日","B.2020年1月1日","C.2021年1月1日","D.2022年1月1日"]', 'C', '《中华人民共和国民法典》自2021年1月1日起施行。', '法律基础', 'single', '民法典', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '民法典自哪一年正式实施');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '公民在法律面前一律平等，是我国', '["A.立法的基本原则","B.司法的基本原则","C.守法的基本原则","D.以上都是"]', 'D', '法律面前人人平等是立法、执法、司法、守法各环节的基本原则。', '法律基础', 'single', '法治原则', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '公民在法律面前一律平等，是我国');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列属于公民基本义务的有', '["A.依法纳税","B.维护国家统一","C.遵守宪法和法律","D.保卫祖国"]', 'ABCD', '宪法第二章规定的公民基本义务包括以上各项。', '法律基础', 'multiple', '公民义务', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列属于公民基本义务的有');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '公民有受教育的权利和义务。', '["A.正确","B.错误"]', 'A', '宪法规定中华人民共和国公民有受教育的权利和义务。', '法律基础', 'judge', '公民权利', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '公民有受教育的权利和义务。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '理想信念是人的精神世界的核心。', '["A.正确","B.错误"]', 'A', '理想信念是人精神世界的核心，是人生的灯塔。', '思想道德修养', 'judge', '理想信念', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '理想信念是人的精神世界的核心。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '中国共产党第二十次全国代表大会召开于', '["A.2021年","B.2022年","C.2023年","D.2024年"]', 'B', '党的二十大于2022年10月在北京召开。', '时政热点', 'single', '二十大', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '中国共产党第二十次全国代表大会召开于');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '我国脱贫攻坚战在哪一年取得全面胜利', '["A.2018年","B.2019年","C.2020年","D.2021年"]', 'C', '2020年底我国如期完成脱贫攻坚目标任务，2021年宣告全面胜利。', '时政热点', 'single', '脱贫攻坚', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '我国脱贫攻坚战在哪一年取得全面胜利');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '中国式现代化的本质要求包括坚持中国共产党领导。', '["A.正确","B.错误"]', 'A', '二十大报告明确中国式现代化的本质要求第一条即为坚持中国共产党领导。', '时政热点', 'judge', '中国式现代化', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '中国式现代化的本质要求包括坚持中国共产党领导。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '请简述新民主主义革命三大法宝的内容及其相互关系。', '[]', '三大法宝即统一战线、武装斗争、党的建设。统一战线是党的政治优势，武装斗争是革命主要形式，党的建设是革命胜利的关键；三者相互联系、紧密配合。', '三大法宝是统一战线、武装斗争、党的建设；统一战线和武装斗争是中国革命的两大基本武器，党的建设是掌握武器的战士，三者相互依存、缺一不可。', '毛泽东思想', 'subjective', '三大法宝', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '请简述新民主主义革命三大法宝的内容及其相互关系。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '请阐述社会主义核心价值观的主要内容及现实意义。', '[]', '国家层面：富强、民主、文明、和谐；社会层面：自由、平等、公正、法治；个人层面：爱国、敬业、诚信、友善。是凝聚共识、引领风尚、塑造时代精神的精神力量。', '社会主义核心价值观从国家、社会、个人三个层面凝练，是中国特色社会主义的内在精神和生命之魂，对培育时代新人、推进现代化具有重大现实意义。', '思想道德修养', 'subjective', '核心价值观', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '请阐述社会主义核心价值观的主要内容及现实意义。');

-- ==================== 题库：考研英语题库 ====================
INSERT INTO question_banks (name, target, subject, description, difficulty, status, active)
SELECT '考研英语题库', 'kaoyan', '英语', '词汇、语法、完形、阅读理解、翻译与写作，30 题', 'middle', 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM question_banks WHERE name = '考研英语题库');

SET @bank_id := (SELECT id FROM question_banks WHERE name = '考研英语题库' LIMIT 1);

INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'The professor ___ the lecture with a summary.', '["A.concluded","B.included","C.excluded","D.secluded"]', 'A', 'conclude 意为"结束，总结"，符合句意。', '词汇', 'single', '动词辨析', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'The professor ___ the lecture with a summary.');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'Her decision to leave the company was ___ ; nobody saw it coming.', '["A.abrupt","B.gradual","C.expected","D.predictable"]', 'A', 'abrupt 意为"突然的，意外的"，与下文 nobody saw it coming 一致。', '词汇', 'single', '形容词辨析', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'Her decision to leave the company was ___ ; nobody saw it coming.');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'The new policy will ___ economic growth in the region.', '["A.stimulate","B.suppress","C.simulate","D.stipulate"]', 'A', 'stimulate 意为"刺激，促进"，搭配 economic growth 合理。', '词汇', 'single', '动词辨析', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'The new policy will ___ economic growth in the region.');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'His arguments are ___ ; you cannot find any logical flaw.', '["A.coherent","B.consistent","C.cohesive","D.compatible"]', 'A', 'coherent 强调论证连贯严密，符合"无逻辑漏洞"的语境。', '词汇', 'single', '近义辨析', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'His arguments are ___ ; you cannot find any logical flaw.');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列单词中，意思与 "reluctant" 最接近的是', '["A.eager","B.unwilling","C.confident","D.passionate"]', 'B', 'reluctant = unwilling，意为"不情愿的"。', '词汇', 'single', '同义词', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列单词中，意思与 "reluctant" 最接近的是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'She is ___ student in her class.', '["A.the most diligent","B.more diligent","C.most diligent","D.diligent"]', 'A', '三者以上比较用最高级，且形容词最高级前加 the。', '语法', 'single', '比较级与最高级', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'She is ___ student in her class.');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'I look forward to ___ from you.', '["A.hear","B.hearing","C.heard","D.be heard"]', 'B', 'look forward to 中 to 是介词，后接动名词。', '语法', 'single', '非谓语动词', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'I look forward to ___ from you.');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'Not until yesterday ___ the truth.', '["A.did he know","B.he knew","C.he did know","D.knew he"]', 'A', 'Not until 引导的状语放句首时，主句用部分倒装。', '语法', 'single', '倒装', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'Not until yesterday ___ the truth.');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'The meeting ___ next Monday has been cancelled.', '["A.held","B.being held","C.to be held","D.having held"]', 'C', '动作未发生且为将来，用不定式作定语。', '语法', 'single', '非谓语动词', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'The meeting ___ next Monday has been cancelled.');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'If I ___ you, I would accept the offer.', '["A.am","B.was","C.were","D.had been"]', 'C', '与现在事实相反的虚拟条件句，be 动词统一用 were。', '语法', 'single', '虚拟语气', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'If I ___ you, I would accept the offer.');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'The book ___ I borrowed from the library is very interesting.', '["A.who","B.which","C.whose","D.what"]', 'B', '先行词为物，关系代词在从句中作宾语，用 which 或 that。', '语法', 'single', '定语从句', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'The book ___ I borrowed from the library is very interesting.');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '在阅读理解中，作者态度题（attitude）通常需要关注', '["A.文章首尾段的评价词","B.使用的形容词与副词","C.例证的褒贬倾向","D.以上都是"]', 'D', '态度题需综合首尾观点句、修饰词色彩及例证倾向判断。', '阅读理解', 'single', '态度题技巧', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '在阅读理解中，作者态度题（attitude）通常需要关注');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '主旨题答题时，最不可靠的依据是', '["A.首段中心句","B.尾段总结","C.单个段落细节","D.全文反复出现的关键词"]', 'C', '单个段落细节往往是局部信息，不能代表全文主旨。', '阅读理解', 'single', '主旨题技巧', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '主旨题答题时，最不可靠的依据是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列属于推理题（inference）常见错误选项特征的有', '["A.过度推理","B.原文复现","C.偷换概念","D.超出文章范围"]', 'ACD', '推理题错误选项常表现为过度推理、偷换概念、超出文章范围；原文复现往往是细节题套路。', '阅读理解', 'multiple', '推理题陷阱', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列属于推理题（inference）常见错误选项特征的有');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '完形填空通常考查', '["A.词义辨析","B.语法结构","C.逻辑衔接","D.以上都是"]', 'D', '完形从词、句、篇三个层面综合考查。', '完形填空', 'single', '考查内容', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '完形填空通常考查');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '英汉翻译时，遇到长难句的常用拆分方法不包括', '["A.按从句拆分","B.按介词短语拆分","C.按分词结构拆分","D.按字母顺序拆分"]', 'D', '字母顺序与句意结构无关，不是拆句依据。', '翻译', 'single', '翻译技巧', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '英汉翻译时，遇到长难句的常用拆分方法不包括');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列翻译技巧中，常用于英译汉的有', '["A.增译","B.减译","C.转换词性","D.调整语序"]', 'ABCD', '四项均为常用英译汉技巧。', '翻译', 'multiple', '翻译技巧', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列翻译技巧中，常用于英译汉的有');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '考研英语小作文（应用文）通常字数要求是', '["A.50-80词","B.约100词","C.约160-200词","D.250词以上"]', 'B', '考研英语小作文一般要求100词左右。', '写作', 'single', '写作要求', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '考研英语小作文（应用文）通常字数要求是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '大作文（图画作文）的常见结构是', '["A.描述图画→分析含义→总结/呼吁","B.提出问题→列举事实→引用名人","C.讲故事→引出对话→抒情结尾","D.以上都不是"]', 'A', '图画作文的经典三段式：描述、分析、总结。', '写作', 'single', '写作结构', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '大作文（图画作文）的常见结构是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '写作中使用从句和分词结构能让文章更加丰富多变。', '["A.正确","B.错误"]', 'A', '句式多变是评分细则中的重要维度。', '写作', 'judge', '句式多样性', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '写作中使用从句和分词结构能让文章更加丰富多变。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '考研英语真题与模拟题相比，更适合精读练习的原因是', '["A.出题思路稳定","B.设问严谨","C.干扰项设置精巧","D.以上都是"]', 'D', '真题在出题思路、设问、干扰项三方面都更接近考试。', '应试技巧', 'single', '复习策略', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '考研英语真题与模拟题相比，更适合精读练习的原因是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '做完一篇阅读后，应做的复盘工作不包括', '["A.整理生词与长难句","B.总结错题原因","C.立刻开始下一篇","D.归纳同义替换"]', 'C', '复盘是真正提升的环节，跳过会让做题效益最大降低。', '应试技巧', 'single', '复习策略', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '做完一篇阅读后，应做的复盘工作不包括');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '请用不超过 100 词写一份给外国朋友的邮件，介绍中国春节最特别的一项习俗。', '[]', 'Open with greetings; describe one custom (e.g., 团圆饭/红包/贴春联) with cultural meaning; close with invitation. Use proper letter format.', '评分关注：格式 (称呼+落款) / 内容 (习俗具体描述+文化含义) / 语言 (词汇句式得体)。', '写作', 'subjective', '应用文写作', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '请用不超过 100 词写一份给外国朋友的邮件，介绍中国春节最特别的一项习俗。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '请将以下句子翻译成中文：The rapid development of artificial intelligence has profoundly transformed the way we work and live.', '[]', '人工智能的飞速发展已深刻改变了我们的工作和生活方式。', '翻译关键：rapid development—飞速发展；profoundly transform—深刻改变；the way we work and live—工作和生活方式。', '翻译', 'subjective', '英译汉', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '请将以下句子翻译成中文：The rapid development of artificial intelligence has profoundly transformed the way we work and live.');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列单词与 "significant" 含义最接近的是', '["A.trivial","B.crucial","C.casual","D.lateral"]', 'B', 'significant 意为"重要的"，与 crucial 同义。', '词汇', 'single', '同义词', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列单词与 "significant" 含义最接近的是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '动词短语 "give in" 的意思是', '["A.分发","B.让步","C.放弃","D.参与"]', 'B', 'give in 意为"屈服，让步"。"放弃"应为 give up。', '词汇', 'single', '动词短语', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '动词短语 "give in" 的意思是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '前缀 "sub-" 通常表示', '["A.超过","B.之下、次于","C.重新","D.反对"]', 'B', 'sub- 表示"在……之下，次于"，如 submarine（潜艇）、subordinate（下级）。', '词汇', 'single', '构词法', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '前缀 "sub-" 通常表示');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列词形变化正确的是', '["A.success - succeed - successful","B.success - succeed - successive","C.success - succeed - succeeding","D.success - succeed - succeedful"]', 'A', 'success（名词）→ succeed（动词）→ successful（形容词）。', '词汇', 'single', '构词法', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列词形变化正确的是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'All the workers ___ working in the factory have to follow the safety rules.', '["A.who","B.which","C.whom","D.whose"]', 'A', '先行词为人且作主语，关系代词用 who。', '语法', 'single', '定语从句', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'All the workers ___ working in the factory have to follow the safety rules.');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '情态动词 must 表示推测时通常表达', '["A.强烈的肯定","B.弱可能性","C.被动义务","D.过去时态"]', 'A', 'must 表推测时表强烈肯定，意为"一定"。', '语法', 'single', '情态动词', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '情态动词 must 表示推测时通常表达');

-- ==================== 题库：行测题库 ====================
INSERT INTO question_banks (name, target, subject, description, difficulty, status, active)
SELECT '行测题库', 'kaogong', '行测', '言语理解、数量关系、判断推理、资料分析、常识判断，30 题', 'middle', 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM question_banks WHERE name = '行测题库');

SET @bank_id := (SELECT id FROM question_banks WHERE name = '行测题库' LIMIT 1);

INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '从下列选项中选出最合适的一项填入问号处：2, 4, 8, 16, ?', '["A.24","B.28","C.32","D.36"]', 'C', '等比数列，公比为 2。', '数量关系', 'single', '数字推理', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '从下列选项中选出最合适的一项填入问号处：2, 4, 8, 16, ?');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '甲、乙两人从相距 36 千米的两地相向而行，甲速 4km/h，乙速 5km/h，几小时后相遇？', '["A.3小时","B.3.5小时","C.4小时","D.4.5小时"]', 'C', '相遇时间 = 总路程 ÷ 速度和 = 36 ÷ (4+5) = 4 小时。', '数量关系', 'single', '行程问题', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '甲、乙两人从相距 36 千米的两地相向而行，甲速 4km/h，乙速 5km/h，几小时后相遇？');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '某商品进价 100 元，按 150 元出售，利润率为多少？', '["A.30%","B.40%","C.50%","D.60%"]', 'C', '利润率 = (售价-进价) ÷ 进价 = 50 ÷ 100 = 50%。', '数量关系', 'single', '经济利润', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '某商品进价 100 元，按 150 元出售，利润率为多少？');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '1, 1, 2, 3, 5, 8, 13, ?', '["A.18","B.20","C.21","D.24"]', 'C', '斐波那契数列，每项等于前两项之和：8+13=21。', '数量关系', 'single', '数字推理', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '1, 1, 2, 3, 5, 8, 13, ?');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '一项工作甲单独做需 6 天，乙单独做需 9 天，两人合作需多少天？', '["A.3.6天","B.4天","C.4.5天","D.5天"]', 'A', '合作效率 = 1/6 + 1/9 = 5/18，时间 = 1 ÷ (5/18) = 3.6 天。', '数量关系', 'single', '工程问题', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '一项工作甲单独做需 6 天，乙单独做需 9 天，两人合作需多少天？');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '某班 40 人，男女生比为 3:5，则男生人数为', '["A.12","B.15","C.18","D.20"]', 'B', '男生 = 40 × 3/(3+5) = 15 人。', '数量关系', 'single', '比例问题', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '某班 40 人，男女生比为 3:5，则男生人数为');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列词语中，没有错别字的一项是', '["A.不径而走","B.一愁莫展","C.再接再励","D.脍炙人口"]', 'D', 'A→不胫而走，B→一筹莫展，C→再接再厉。', '言语理解', 'single', '字形辨析', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列词语中，没有错别字的一项是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '选词填空：他对工作 ___ ，连续多年被评为先进个人。', '["A.兢兢业业","B.津津有味","C.斤斤计较","D.惴惴不安"]', 'A', '兢兢业业形容工作认真负责，符合语境。', '言语理解', 'single', '成语辨析', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '选词填空：他对工作 ___ ，连续多年被评为先进个人。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列句子没有语病的一项是', '["A.通过这次活动，使我们受到很大教育。","B.这部小说塑造了一位优秀的边防战士的英雄形象。","C.能否成功取决于努力。","D.我们应该认真听取并研究同志们的意见。"]', 'B', 'A 主语缺失，C 一面对两面，D 语序错误（应为研究并采纳）。', '言语理解', 'single', '语病辨析', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列句子没有语病的一项是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '片段阅读：科技进步极大推动了生产力发展，但也带来环境污染、资源消耗等问题，呼唤可持续发展理念。本段主要论述', '["A.科技对生产力的推动作用","B.科技进步带来的负面影响","C.科技发展与可持续发展的关系","D.可持续发展理念的内涵"]', 'C', '段落总结落脚于"呼唤可持续发展"，主旨为科技发展与可持续发展的关系。', '言语理解', 'single', '片段阅读', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '片段阅读：科技进步极大推动了生产力发展，但也带来环境污染、资源消耗等问题，呼唤可持续发展理念。本段主要论述');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列各句中，加点成语使用恰当的有', '["A.他文采飞扬，写得一手好文章","B.这则消息一传十、十传百，不胫而走","C.他遇到困难能屡见不鲜地解决","D.老师的话语让我茅塞顿开"]', 'ABD', 'C 选项中"屡见不鲜"形容事物常见，与"解决困难"语境不符。', '言语理解', 'multiple', '成语辨析', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列各句中，加点成语使用恰当的有');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '以下哪项不属于行政诉讼的受案范围？', '["A.对罚款不服","B.对行政拘留不服","C.对国防外交等国家行为不服","D.对吊销许可证不服"]', 'C', '国防、外交等国家行为不属于行政诉讼受案范围。', '判断推理', 'single', '法律常识', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '以下哪项不属于行政诉讼的受案范围？');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '图形推理：一组图形的共同特征通常考查', '["A.对称性","B.封闭面数量","C.线条数量","D.以上都可能"]', 'D', '图形推理常见考查维度均涉及，要全面排查。', '判断推理', 'single', '图形推理', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '图形推理：一组图形的共同特征通常考查');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '类比推理：医生:医院 类似于', '["A.学生:学校","B.教师:学校","C.书:图书馆","D.飞机:机场"]', 'B', '医生在医院工作，教师在学校工作，二者均为"职业:工作场所"关系。', '判断推理', 'single', '类比推理', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '类比推理：医生:医院 类似于');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '演绎推理：所有 A 都是 B，所有 B 都是 C，所以', '["A.所有 A 都是 C","B.所有 C 都是 A","C.有些 A 不是 C","D.无法推出"]', 'A', '三段论：大前提+小前提→结论，A→B→C，故所有 A 都是 C。', '判断推理', 'single', '演绎推理', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '演绎推理：所有 A 都是 B，所有 B 都是 C，所以');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列论证方式中，属于削弱论点的有', '["A.直接反驳论点","B.提出相反事实","C.指出论据不足","D.切断论据与论点的联系"]', 'ABCD', '削弱论点可从直接反驳、相反事实、论据不足、因果切断等多角度入手。', '判断推理', 'multiple', '论证分析', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列论证方式中，属于削弱论点的有');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '资料分析中，求增长率最常用的公式是', '["A.(现在量-基期量)÷基期量","B.(基期量-现在量)÷基期量","C.(现在量-基期量)÷现在量","D.(基期量-现在量)÷现在量"]', 'A', '增长率 = (现在量-基期量) ÷ 基期量。', '资料分析', 'single', '增长率', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '资料分析中，求增长率最常用的公式是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '已知某年 GDP 为 100 亿元，比上年增长 8%，则上年 GDP 约为', '["A.92.59亿元","B.93亿元","C.108亿元","D.92亿元"]', 'A', '基期量 = 现期量 ÷ (1+增长率) = 100 ÷ 1.08 ≈ 92.59 亿元。', '资料分析', 'single', '基期量计算', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '已知某年 GDP 为 100 亿元，比上年增长 8%，则上年 GDP 约为');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '比重计算公式为', '["A.部分量÷总量","B.总量÷部分量","C.部分量×总量","D.总量+部分量"]', 'A', '比重 = 部分量 ÷ 总量，常以百分比表示。', '资料分析', 'single', '比重', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '比重计算公式为');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '资料分析常见考查方式包括', '["A.增长率比较","B.比重计算","C.倍数计算","D.混合运算"]', 'ABCD', '上述均为资料分析的高频考点。', '资料分析', 'multiple', '题型', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '资料分析常见考查方式包括');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '我国的国体是', '["A.人民民主专政","B.人民代表大会制度","C.中国共产党领导的多党合作","D.民主集中制"]', 'A', '我国国体是工人阶级领导的、以工农联盟为基础的人民民主专政。', '常识判断', 'single', '宪法常识', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '我国的国体是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '中国第一部完整介绍马克思主义的著作是', '["A.《社会主义史》","B.《共产党宣言》","C.《阶级争斗》","D.《马克思〈资本论〉入门》"]', 'B', '1920年陈望道翻译的《共产党宣言》是第一部完整中译本。', '常识判断', 'single', '近代史', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '中国第一部完整介绍马克思主义的著作是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列属于我国四大发明的有', '["A.指南针","B.造纸术","C.火药","D.印刷术"]', 'ABCD', '四大发明：造纸术、印刷术、火药、指南针。', '常识判断', 'multiple', '历史常识', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列属于我国四大发明的有');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '光合作用的主要场所是', '["A.线粒体","B.叶绿体","C.细胞核","D.细胞膜"]', 'B', '叶绿体是绿色植物进行光合作用的主要细胞器。', '常识判断', 'single', '生物常识', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '光合作用的主要场所是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '宪法是我国的根本大法。', '["A.正确","B.错误"]', 'A', '宪法具有最高法律效力，是国家的根本大法。', '常识判断', 'judge', '法律常识', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '宪法是我国的根本大法。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '牛顿第一定律是惯性定律。', '["A.正确","B.错误"]', 'A', '牛顿第一定律即惯性定律：一切物体在没有外力作用时保持静止或匀速直线运动状态。', '常识判断', 'judge', '物理常识', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '牛顿第一定律是惯性定律。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列地理常识正确的是', '["A.我国最大的盆地是塔里木盆地","B.黄河发源于青藏高原","C.珠穆朗玛峰位于中尼边境","D.以上都是"]', 'D', '三项均为正确地理常识。', '常识判断', 'single', '地理常识', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列地理常识正确的是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列经济现象与所属经济学概念匹配正确的有', '["A.通货膨胀:物价持续上涨","B.GDP:国内生产总值","C.CPI:消费者价格指数","D.PPI:生产者价格指数"]', 'ABCD', '四项均为正确匹配。', '常识判断', 'multiple', '经济常识', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列经济现象与所属经济学概念匹配正确的有');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '行测做题策略中，应优先做的题型是', '["A.熟悉且分值高的题型","B.最难的题型","C.最长的题型","D.全部按顺序做"]', 'A', '时间紧张，应优先抢分，熟悉且高分题先做。', '应试技巧', 'single', '做题策略', 'middle', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '行测做题策略中，应优先做的题型是');

-- ==================== 题库：申论题库 ====================
INSERT INTO question_banks (name, target, subject, description, difficulty, status, active)
SELECT '申论题库', 'kaogong', '申论', '归纳概括、提出对策、综合分析、公文写作、文章论证，30 题', 'hard', 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM question_banks WHERE name = '申论题库');

SET @bank_id := (SELECT id FROM question_banks WHERE name = '申论题库' LIMIT 1);

INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '申论考试中，归纳概括题的核心要求是', '["A.全面、准确、简明","B.生动、形象、具体","C.华丽、优美、动人","D.复杂、深奥、晦涩"]', 'A', '归纳概括题强调全面、准确、简明。', '归纳概括', 'single', '题型特征', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '申论考试中，归纳概括题的核心要求是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '归纳概括的常见加工方式不包括', '["A.同类合并","B.层次提炼","C.要素归纳","D.主观臆断"]', 'D', '申论作答必须基于材料，不能主观臆断。', '归纳概括', 'single', '答题方法', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '归纳概括的常见加工方式不包括');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '归纳概括题答题首句通常采用', '["A.总括句","B.过渡句","C.设问句","D.比喻句"]', 'A', '总括句开头能使要点清晰。', '归纳概括', 'single', '答题结构', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '归纳概括题答题首句通常采用');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '提出对策题在作答时，措施应具备', '["A.针对性、可行性、操作性","B.理论性、抽象性、理想性","C.随意性、主观性、模糊性","D.复杂性、难懂性、空泛性"]', 'A', '对策题要求措施具有针对性、可行性和可操作性。', '提出对策', 'single', '对策标准', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '提出对策题在作答时，措施应具备');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '提出对策的常见来源不包括', '["A.材料中已有做法","B.材料中体现的问题反向推","C.结合自身知识储备","D.编造夸张的口号"]', 'D', '对策必须切实可行，不能编造空话套话。', '提出对策', 'single', '对策来源', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '提出对策的常见来源不包括');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '对策表述常用的格式是', '["A.动宾短语+具体内容+预期效果","B.主谓宾+地点状语","C.比喻+排比+反问","D.叙述+抒情+议论"]', 'A', '对策表述：动词+主体/手段+目标，使举措清晰可执行。', '提出对策', 'single', '答题格式', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '对策表述常用的格式是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '综合分析题中，分析原因的常见维度不包括', '["A.思想观念层面","B.制度机制层面","C.经济社会发展层面","D.个人好恶层面"]', 'D', '综合分析应从客观维度分析原因，个人好恶不够客观。', '综合分析', 'single', '原因分析', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '综合分析题中，分析原因的常见维度不包括');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '综合分析的核心思路通常是', '["A.是什么—为什么—怎么办","B.提问—回答—结尾","C.讲故事—引申意—警示","D.罗列现象—不作分析"]', 'A', '经典三段式：是什么（解释/亮明观点）、为什么（分析）、怎么办（对策）。', '综合分析', 'single', '答题结构', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '综合分析的核心思路通常是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列属于综合分析常考子题型的有', '["A.观点评价","B.词句理解","C.现象分析","D.比较分析"]', 'ABCD', '四项均为申论综合分析题常见类型。', '综合分析', 'multiple', '题型分类', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列属于综合分析常考子题型的有');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '公文写作中，请示的结束语正确的是', '["A.妥否，请批示","B.多谢合作","C.祝工作顺利","D.以上通知，请遵守"]', 'A', '请示规范结束语为"妥否，请批示"或"请批复"。', '公文写作', 'single', '请示', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '公文写作中，请示的结束语正确的是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列属于公文常用文种的有', '["A.通知","B.决定","C.报告","D.散文"]', 'ABC', '散文为文学体裁，不属于法定公文文种。', '公文写作', 'multiple', '文种识别', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列属于公文常用文种的有');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '公文写作的基本要素不包括', '["A.标题","B.主送机关","C.正文","D.个人签名"]', 'D', '公文以单位印章/发文机关代字为准，个人签名不属于必备要素。', '公文写作', 'single', '公文要素', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '公文写作的基本要素不包括');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '通知的语言风格应当', '["A.准确简明、严肃规范","B.夸张抒情","C.个性化幽默","D.口语化随意"]', 'A', '公文语言以准确简明、严肃规范为基本要求。', '公文写作', 'single', '公文语言', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '通知的语言风格应当');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '公告与通告的核心区别是', '["A.公告范围更广，对内对外通用","B.通告主要在国内有限范围使用","C.公告法律效力更高","D.以上都对"]', 'D', '公告面向全国乃至国际，通告范围相对局限。', '公文写作', 'single', '公告与通告', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '公告与通告的核心区别是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '申论文章的论证方法中，类比论证属于', '["A.事实论证","B.道理论证","C.比喻论证","D.对比论证"]', 'C', '类比论证以相似事物相比说明道理，属于比喻论证范畴。', '文章论证', 'single', '论证方法', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '申论文章的论证方法中，类比论证属于');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '申论大作文常见结构包括', '["A.总—分—总","B.分总","C.五段三分","D.以上都是"]', 'D', '三种结构均为申论大作文常用形式。', '文章论证', 'single', '文章结构', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '申论大作文常见结构包括');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列论据使用方式中，属于事实论据的有', '["A.援引政策文件","B.数据统计","C.典型案例","D.名人名言"]', 'ABC', '名人名言属于道理论据。', '文章论证', 'multiple', '论据类型', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列论据使用方式中，属于事实论据的有');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '申论文章首段开头的常见写法不包括', '["A.背景引入","B.名言点题","C.设问引出","D.大段抒情"]', 'D', '申论文章重在论证，不宜大段抒情。', '文章论证', 'single', '开头写法', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '申论文章首段开头的常见写法不包括');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '议论文中分论点的设置应', '["A.层次清晰","B.逻辑连贯","C.各有侧重","D.重复堆砌"]', 'ABC', '分论点应层次清晰、逻辑连贯、各有侧重，不重复。', '文章论证', 'multiple', '分论点设置', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '议论文中分论点的设置应');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '申论阅读材料的常见类型不包括', '["A.数据型材料","B.案例型材料","C.观点型材料","D.娱乐八卦型材料"]', 'D', '申论材料围绕国家治理、社会民生等主题，不会出现娱乐八卦。', '阅读材料', 'single', '材料类型', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '申论阅读材料的常见类型不包括');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '阅读材料时圈画关键信息应重点关注', '["A.领导讲话与政策文件","B.数据统计与典型案例","C.材料中的转折与因果","D.以上都是"]', 'D', '上述均为材料关键信息，应重点把握。', '阅读材料', 'single', '阅读方法', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '阅读材料时圈画关键信息应重点关注');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '申论考查的核心能力不包括', '["A.阅读理解能力","B.综合分析能力","C.贯彻执行能力","D.快速口算能力"]', 'D', '口算属于行测数量关系，不属于申论核心能力。', '综合素养', 'single', '能力要求', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '申论考查的核心能力不包括');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '申论备考的常见误区有', '["A.只背模板不练手","B.脱离材料编造","C.堆砌华丽辞藻","D.研读真题精准训练"]', 'ABC', '前三项是常见误区；研读真题是正确方法。', '综合素养', 'multiple', '备考误区', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '申论备考的常见误区有');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '申论分数的拉开主要靠的是题型方法熟练而非语言华丽。', '["A.正确","B.错误"]', 'A', '申论关键在于材料把握、要点齐全、结构清晰，语言华丽并非加分核心。', '综合素养', 'judge', '备考观念', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '申论分数的拉开主要靠的是题型方法熟练而非语言华丽。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '请简要概括申论考试中归纳概括题的答题要点。', '[]', '1) 全面：要点齐全，覆盖材料核心；2) 准确：贴合材料，不作主观臆断；3) 简明：表述凝练，避免赘述；4) 结构：总括句+分类要点；5) 加工：合并同类、提炼层次。', '归纳概括题考查信息提取与整合，要点齐全准确、表达简明，先总括后分述，材料是答题基础。', '归纳概括', 'subjective', '题型方法', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '请简要概括申论考试中归纳概括题的答题要点。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '请就"基层减负"主题撰写一段不少于 200 字的政策性表态。', '[]', '围绕"基层是政策落地的最后一公里"，从减负的必要性、当前突出问题、具体减负举措（精简会议文件、压减督察检查、用数字化工具、为担当者撑腰）等多个维度展开论述。', '评分关注：政策站位 / 论据充分 / 对策可行 / 表达规范。', '热点写作', 'subjective', '表态写作', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '请就"基层减负"主题撰写一段不少于 200 字的政策性表态。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '请围绕"乡村振兴"为题，撰写一份给区委的工作建议提纲。', '[]', '建议提纲应包括：背景必要性 / 三类问题（产业弱、人才缺、治理软）/ 三项对策（特色产业、人才回流、共建治理）/ 预期效果。语言规范、条理清晰。', '公文式建议提纲：用"关于…的建议"为题，分背景—问题—对策—保障措施四段，每段标题居首，文字简明。', '公文写作', 'subjective', '建议提纲', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '请围绕"乡村振兴"为题，撰写一份给区委的工作建议提纲。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '申论作答中字数控制的常见原则', '["A.可少不可多","B.可多不可少","C.接近上限但不超出","D.不限字数"]', 'C', '申论字数应接近规定上限以充分论述，但不能超出限制。', '应试技巧', 'single', '字数控制', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '申论作答中字数控制的常见原则');

-- ==================== 题库：考研数学题库 ====================
INSERT INTO question_banks (name, target, subject, description, difficulty, status, active)
SELECT '考研数学题库', 'kaoyan', '数学', '高等数学、线性代数、概率论与数理统计，30 题', 'hard', 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM question_banks WHERE name = '考研数学题库');

SET @bank_id := (SELECT id FROM question_banks WHERE name = '考研数学题库' LIMIT 1);

INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'lim(x→0) sin(x)/x = ', '["A.0","B.1","C.无穷大","D.不存在"]', 'B', '重要极限：lim(x→0) sin(x)/x = 1。', '高等数学', 'single', '极限', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'lim(x→0) sin(x)/x = ');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'f(x) = x² 的导数是', '["A.x","B.2x","C.x²","D.2"]', 'B', '幂函数求导：(x^n)'' = n·x^(n-1)，故 (x²)'' = 2x。', '高等数学', 'single', '导数', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'f(x) = x² 的导数是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '∫ 2x dx = ', '["A.x²+C","B.2x²+C","C.x²/2+C","D.2+C"]', 'A', '幂函数积分：∫ x^n dx = x^(n+1)/(n+1)+C，∫ 2x dx = x²+C。', '高等数学', 'single', '不定积分', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '∫ 2x dx = ');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'lim(x→∞) (1+1/x)^x = ', '["A.1","B.e","C.0","D.无穷大"]', 'B', '重要极限：lim(x→∞) (1+1/x)^x = e。', '高等数学', 'single', '极限', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'lim(x→∞) (1+1/x)^x = ');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '函数 f(x)=ln(x) 的定义域是', '["A.x≥0","B.x>0","C.x≠0","D.全体实数"]', 'B', '对数函数 ln(x) 要求 x>0。', '高等数学', 'single', '函数与定义域', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '函数 f(x)=ln(x) 的定义域是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '定积分 ∫₀¹ x dx = ', '["A.0","B.1/2","C.1","D.2"]', 'B', '∫₀¹ x dx = [x²/2]₀¹ = 1/2。', '高等数学', 'single', '定积分', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '定积分 ∫₀¹ x dx = ');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '曲线 y=x²-2x 在 x=1 处的切线斜率是', '["A.0","B.1","C.2","D.-1"]', 'A', 'y''=2x-2，代入 x=1 得 y''(1)=0。', '高等数学', 'single', '导数应用', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '曲线 y=x²-2x 在 x=1 处的切线斜率是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '函数 z=x²+y² 在点 (1,1) 处沿向量 (1,0) 方向的方向导数是', '["A.1","B.2","C.0","D.4"]', 'B', '∂z/∂x = 2x，方向为 x 轴正向，方向导数 = 2x|_(1,1) = 2。', '高等数学', 'single', '多元函数', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '函数 z=x²+y² 在点 (1,1) 处沿向量 (1,0) 方向的方向导数是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列级数收敛的是', '["A.Σ 1/n","B.Σ 1/n²","C.Σ n","D.Σ (-1)^n"]', 'B', 'p-级数 Σ 1/n^p 在 p>1 时收敛，故 Σ 1/n² 收敛；Σ 1/n 是调和级数，发散。', '高等数学', 'single', '级数收敛', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列级数收敛的是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '微分方程 dy/dx = y 的通解是', '["A.y=Cx","B.y=C·e^x","C.y=C+x","D.y=Csin(x)"]', 'B', '分离变量得 dy/y = dx，积分得 ln|y|=x+C₁，故 y=C·e^x。', '高等数学', 'single', '微分方程', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '微分方程 dy/dx = y 的通解是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列函数在 x=0 处可导的是', '["A.|x|","B.x²","C.√|x|","D.x·|x|"]', 'BD', '|x| 在 x=0 不可导（左右导数不等）；√|x| 在 x=0 不可导；x² 与 x|x| 在 x=0 可导。', '高等数学', 'multiple', '可导性', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列函数在 x=0 处可导的是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'n 阶单位矩阵 I 的行列式 |I| = ', '["A.0","B.1","C.n","D.n!"]', 'B', '单位矩阵主对角线全为 1，行列式 |I|=1。', '线性代数', 'single', '行列式', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'n 阶单位矩阵 I 的行列式 |I| = ');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '若 A 为 n 阶可逆矩阵，则', '["A.|A|=0","B.|A|≠0","C.A 必为对称矩阵","D.A 必为对角矩阵"]', 'B', '矩阵可逆 ⇔ |A|≠0。', '线性代数', 'single', '矩阵可逆性', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '若 A 为 n 阶可逆矩阵，则');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '向量组 α₁,α₂,α₃ 线性无关的充要条件是', '["A.其中任一向量不能由其他向量线性表示","B.向量组的秩等于向量个数","C.对应齐次方程组只有零解","D.以上都是"]', 'D', '三种说法等价，都是线性无关的等价条件。', '线性代数', 'single', '线性无关', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '向量组 α₁,α₂,α₃ 线性无关的充要条件是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '若 λ 是矩阵 A 的特征值，则 A-λI 的行列式', '["A.>0","B.<0","C.=0","D.无法判断"]', 'C', 'λ 是特征值 ⇔ 特征方程 |A-λI|=0。', '线性代数', 'single', '特征值', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '若 λ 是矩阵 A 的特征值，则 A-λI 的行列式');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'n 元齐次线性方程组 Ax=0 有非零解的充要条件是', '["A.|A|=0","B.|A|≠0","C.A 是方阵","D.A 不可逆"]', 'A', '齐次方程组 Ax=0 有非零解 ⇔ |A|=0（A 为方阵时）。', '线性代数', 'single', '齐次方程组', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'n 元齐次线性方程组 Ax=0 有非零解的充要条件是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '矩阵的初等行变换不改变矩阵的', '["A.行列式","B.秩","C.特征值","D.维数"]', 'B', '初等行变换不改变矩阵的秩，但可能改变行列式与特征值。', '线性代数', 'single', '初等变换', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '矩阵的初等行变换不改变矩阵的');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '若 A、B 均为 n 阶矩阵，则下列说法正确的是', '["A.(AB)^T = A^T B^T","B.(AB)^T = B^T A^T","C.|AB| = |A|+|B|","D.AB = BA"]', 'B', '矩阵转置满足 (AB)^T = B^T A^T；行列式有 |AB|=|A||B|；矩阵乘法不交换。', '线性代数', 'single', '矩阵运算', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '若 A、B 均为 n 阶矩阵，则下列说法正确的是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'P(A∪B) = ', '["A.P(A)+P(B)","B.P(A)+P(B)-P(AB)","C.P(A)·P(B)","D.P(A|B)"]', 'B', '概率加法公式：P(A∪B) = P(A)+P(B)-P(AB)。', '概率论', 'single', '概率公式', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'P(A∪B) = ');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '若 A、B 互斥，则 P(A∪B) = ', '["A.P(A)+P(B)","B.P(A)·P(B)","C.P(A)-P(B)","D.0"]', 'A', '互斥事件 P(AB)=0，故 P(A∪B)=P(A)+P(B)。', '概率论', 'single', '互斥事件', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '若 A、B 互斥，则 P(A∪B) = ');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '随机变量 X 服从标准正态分布，则 E(X) 与 D(X) 分别为', '["A.0,1","B.0,0","C.1,1","D.1,0"]', 'A', '标准正态分布 N(0,1)：均值 E(X)=0，方差 D(X)=1。', '概率论', 'single', '正态分布', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '随机变量 X 服从标准正态分布，则 E(X) 与 D(X) 分别为');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '抛掷一枚均匀硬币 3 次，恰好出现 2 次正面的概率为', '["A.1/8","B.2/8","C.3/8","D.4/8"]', 'C', 'C(3,2)·(1/2)^2·(1/2)^1 = 3/8。', '概率论', 'single', '二项分布', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '抛掷一枚均匀硬币 3 次，恰好出现 2 次正面的概率为');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '条件概率 P(A|B) 的计算公式是', '["A.P(AB)/P(B)","B.P(B)/P(A)","C.P(A)/P(B)","D.P(A)·P(B)"]', 'A', 'P(A|B) = P(AB)/P(B)，其中 P(B)>0。', '概率论', 'single', '条件概率', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '条件概率 P(A|B) 的计算公式是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列关于无偏估计的说法正确的有', '["A.样本均值是总体均值的无偏估计","B.样本方差S²是总体方差的无偏估计","C.无偏估计一定存在","D.无偏估计是唯一的"]', 'AB', '样本均值与样本方差(分母 n-1)分别是总体均值与方差的无偏估计；无偏估计未必存在或唯一。', '数理统计', 'multiple', '估计量', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列关于无偏估计的说法正确的有');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'lim(x→0) (1-cos(x))/x² = ', '["A.0","B.1/2","C.1","D.不存在"]', 'B', '用泰勒展开：1-cos(x) ≈ x²/2，故极限 = 1/2。', '高等数学', 'single', '等价无穷小', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'lim(x→0) (1-cos(x))/x² = ');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '函数 y=e^x 的麦克劳林级数前三项是', '["A.1+x+x²/2","B.1-x+x²/2","C.x+x²/2+x³/3","D.1+x²+x⁴"]', 'A', 'e^x = 1 + x + x²/2! + x³/3! + ...', '高等数学', 'single', '幂级数展开', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '函数 y=e^x 的麦克劳林级数前三项是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '矩阵的秩 r(A) 等于其', '["A.最高阶非零子式的阶数","B.行向量组与列向量组的秩","C.线性无关行（列）向量的最大个数","D.以上都对"]', 'D', '秩有多种等价定义，三项均成立。', '线性代数', 'single', '秩', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '矩阵的秩 r(A) 等于其');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '求 lim(x→0) ln(1+x)/x。', '[]', 'lim(x→0) ln(1+x)/x = 1。可用洛必达或等价无穷小 ln(1+x)~x。', 'ln(1+x) 与 x 是 x→0 时的等价无穷小，故极限为 1。', '高等数学', 'subjective', '极限计算', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '求 lim(x→0) ln(1+x)/x。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '求二阶常系数齐次微分方程 y''''-3y''+2y=0 的通解。', '[]', '特征方程 r²-3r+2=0，根 r=1,2。通解 y = C₁e^x + C₂e^(2x)。', '二阶常系数齐次方程通过特征方程求根：单实根用 e^(rx) 形式叠加。', '高等数学', 'subjective', '微分方程', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '求二阶常系数齐次微分方程 y''''-3y''+2y=0 的通解。');

-- ==================== 题库：计算机专业课题库 ====================
INSERT INTO question_banks (name, target, subject, description, difficulty, status, active)
SELECT '计算机专业课题库', 'kaoyan', '计算机', '数据结构、操作系统、计算机网络、计算机组成原理，30 题', 'hard', 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM question_banks WHERE name = '计算机专业课题库');

SET @bank_id := (SELECT id FROM question_banks WHERE name = '计算机专业课题库' LIMIT 1);

INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '在长度为 n 的有序顺序表中进行折半查找，最坏情况下的时间复杂度是', '["A.O(1)","B.O(log n)","C.O(n)","D.O(n log n)"]', 'B', '折半查找每次缩小一半搜索区间，时间复杂度 O(log n)。', '数据结构', 'single', '查找算法', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '在长度为 n 的有序顺序表中进行折半查找，最坏情况下的时间复杂度是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列排序算法中，平均时间复杂度为 O(n log n) 的是', '["A.冒泡排序","B.快速排序","C.插入排序","D.选择排序"]', 'B', '快速排序平均 O(n log n)，最坏 O(n²)。冒泡/插入/选择均为 O(n²)。', '数据结构', 'single', '排序算法', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列排序算法中，平均时间复杂度为 O(n log n) 的是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '栈是一种___数据结构。', '["A.先进先出","B.后进先出","C.随机访问","D.无序"]', 'B', '栈是后进先出（LIFO）的数据结构。', '数据结构', 'single', '栈与队列', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '栈是一种___数据结构。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '队列是一种___数据结构。', '["A.先进先出","B.后进先出","C.随机访问","D.无序"]', 'A', '队列是先进先出（FIFO）的数据结构。', '数据结构', 'single', '栈与队列', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '队列是一种___数据结构。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '在二叉树的链式存储中，有 n 个结点的二叉树共有空指针', '["A.n-1 个","B.n 个","C.n+1 个","D.2n 个"]', 'C', 'n 个节点共 2n 个指针域，使用 n-1 条边对应 n-1 个非空指针，故空指针 = 2n-(n-1)= n+1。', '数据结构', 'single', '二叉树', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '在二叉树的链式存储中，有 n 个结点的二叉树共有空指针');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '深度为 k 的满二叉树共有的节点数为', '["A.2^k","B.2^k-1","C.k²","D.k"]', 'B', '深度为 k 的满二叉树节点数为 2^k - 1。', '数据结构', 'single', '二叉树', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '深度为 k 的满二叉树共有的节点数为');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列哈希冲突解决方法中，开放定址法的常见形式有', '["A.线性探测","B.二次探测","C.伪随机探测","D.链地址法"]', 'ABC', '链地址法不属于开放定址法，是另一类冲突解决方法。', '数据结构', 'multiple', '哈希表', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列哈希冲突解决方法中，开放定址法的常见形式有');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '图的两种常见遍历是 DFS 和 BFS，其中 BFS 通常借助', '["A.栈","B.队列","C.堆","D.链表"]', 'B', 'BFS 借助队列，DFS 借助栈（递归即隐式栈）。', '数据结构', 'single', '图遍历', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '图的两种常见遍历是 DFS 和 BFS，其中 BFS 通常借助');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '操作系统的主要功能不包括', '["A.进程管理","B.存储管理","C.设备管理","D.编译翻译"]', 'D', '编译翻译是编译器的功能，不属于操作系统四大功能。', '操作系统', 'single', 'OS 概念', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '操作系统的主要功能不包括');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '进程与线程的主要区别在于', '["A.进程是资源分配的最小单位，线程是 CPU 调度的最小单位","B.进程比线程快","C.线程不能并发","D.两者完全相同"]', 'A', '进程是资源分配的基本单位，线程是 CPU 调度的基本单位。', '操作系统', 'single', '进程与线程', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '进程与线程的主要区别在于');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列死锁产生的必要条件不包括', '["A.互斥条件","B.占有等待","C.剥夺条件","D.循环等待"]', 'C', '死锁四个必要条件：互斥、占有并等待、不可剥夺、循环等待。"剥夺"破坏了不可剥夺条件。', '操作系统', 'single', '死锁', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列死锁产生的必要条件不包括');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '采用页式存储管理时，存在的主要问题是', '["A.内部碎片","B.外部碎片","C.无碎片","D.以上都不对"]', 'A', '页式分配最后一页可能装不满，产生内部碎片；段式存储产生外部碎片。', '操作系统', 'single', '存储管理', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '采用页式存储管理时，存在的主要问题是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列调度算法中，可能导致饥饿的是', '["A.先来先服务（FCFS）","B.最短作业优先（SJF）","C.优先级调度","D.时间片轮转"]', 'BC', 'SJF 偏向短作业，长作业可能一直得不到调度；优先级调度低优先级也可能饥饿。FCFS 与时间片轮转保证公平。', '操作系统', 'multiple', '进程调度', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列调度算法中，可能导致饥饿的是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '虚拟内存利用了程序运行时的局部性原理。', '["A.正确","B.错误"]', 'A', '局部性原理（时间/空间）是虚拟内存有效的理论基础。', '操作系统', 'judge', '虚拟内存', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '虚拟内存利用了程序运行时的局部性原理。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'OSI 七层模型中，传输层位于第几层', '["A.第3层","B.第4层","C.第5层","D.第6层"]', 'B', 'OSI 自下而上：物理层(1)、数据链路层(2)、网络层(3)、传输层(4)、会话层(5)、表示层(6)、应用层(7)。', '计算机网络', 'single', 'OSI 模型', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'OSI 七层模型中，传输层位于第几层');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'TCP 与 UDP 的主要区别是', '["A.TCP 面向连接，UDP 无连接","B.TCP 可靠传输，UDP 尽力而为","C.TCP 有流量控制和拥塞控制","D.以上都是"]', 'D', 'TCP 在面向连接、可靠性、流量与拥塞控制等方面均与 UDP 不同。', '计算机网络', 'single', '传输层', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'TCP 与 UDP 的主要区别是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列协议中，工作在应用层的是', '["A.HTTP","B.FTP","C.SMTP","D.IP"]', 'ABC', 'HTTP/FTP/SMTP 都是应用层协议；IP 工作在网络层。', '计算机网络', 'multiple', '应用层协议', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列协议中，工作在应用层的是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'TCP 三次握手的目的是', '["A.确认双方收发能力","B.同步序号","C.建立连接","D.以上都是"]', 'D', '三次握手保证双方收发能力、同步初始序号、建立可靠连接。', '计算机网络', 'single', 'TCP 握手', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'TCP 三次握手的目的是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'IPv4 地址 192.168.1.1 属于', '["A.A 类公网地址","B.B 类公网地址","C.C 类私有地址","D.D 类组播地址"]', 'C', '192.168.0.0/16 是 C 类私有地址段。', '计算机网络', 'single', 'IP 地址', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'IPv4 地址 192.168.1.1 属于');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'DNS 协议主要用于', '["A.IP 地址与域名互相解析","B.传输文件","C.加密通信","D.路由选择"]', 'A', 'DNS 是域名系统，将域名解析为 IP 地址，反之亦然。', '计算机网络', 'single', 'DNS', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'DNS 协议主要用于');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'HTTPS 在 HTTP 之上使用 TLS/SSL 提供加密。', '["A.正确","B.错误"]', 'A', 'HTTPS = HTTP + TLS/SSL，在传输层之上提供加密、身份验证与完整性。', '计算机网络', 'judge', 'HTTPS', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'HTTPS 在 HTTP 之上使用 TLS/SSL 提供加密。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'CPU 的核心组件包括', '["A.运算器","B.控制器","C.寄存器","D.以上都是"]', 'D', 'CPU 包括运算器（ALU）、控制器（CU）和寄存器组。', '计算机组成原理', 'single', 'CPU 结构', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'CPU 的核心组件包括');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'Cache 与主存之间的映射方式不包括', '["A.直接映射","B.全相联映射","C.组相联映射","D.随机映射"]', 'D', '三种标准映射：直接映射、全相联映射、组相联映射。', '计算机组成原理', 'single', 'Cache', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'Cache 与主存之间的映射方式不包括');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '原码、反码、补码三种机器数表示中，0 的表示唯一的是', '["A.原码","B.反码","C.补码","D.三者均唯一"]', 'C', '原码、反码 0 有 +0 与 -0 两种表示，补码 0 唯一。', '计算机组成原理', 'single', '机器数', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '原码、反码、补码三种机器数表示中，0 的表示唯一的是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '下列关于流水线技术说法正确的是', '["A.可以提高指令吞吐率","B.单条指令执行时间不变或略增","C.可能存在数据冒险与控制冒险","D.以上都对"]', 'D', '流水线提高吞吐率，单条指令延迟不缩短，并存在多种冒险。', '计算机组成原理', 'single', '流水线', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '下列关于流水线技术说法正确的是');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT 'Cache 与虚拟内存均依赖局部性原理。', '["A.正确","B.错误"]', 'A', 'Cache（时间/空间局部性）和虚拟内存（页置换）均利用局部性原理提升性能。', '计算机组成原理', 'judge', '局部性原理', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = 'Cache 与虚拟内存均依赖局部性原理。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '请简述进程与线程的区别及多线程的优势。', '[]', '区别：进程是资源分配的最小单位，线程是 CPU 调度的最小单位；进程间互相独立，线程共享所属进程的资源。多线程优势：上下文切换开销小、共享内存通信便捷、并发提升 IO 与多核 CPU 利用率。', '进程拥有独立资源（地址空间/打开文件/信号），线程共享所属进程资源仅有自己的栈与寄存器。多线程上下文切换开销小、数据共享方便。', '操作系统', 'subjective', '进程与线程', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '请简述进程与线程的区别及多线程的优势。');
INSERT INTO questions (stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)
SELECT '请简述 TCP 三次握手的过程及为什么不能两次握手。', '[]', '三次握手：1) C→S: SYN, seq=x；2) S→C: SYN+ACK, seq=y, ack=x+1；3) C→S: ACK, ack=y+1。
两次握手不安全：服务端无法确认客户端是否真实收到 SYN+ACK，老旧重传的 SYN 可能让服务端误建立连接。', '三次握手保证双方收发能力可达，并交换初始序号；少于三次无法可靠确认双向通路。', '计算机网络', 'subjective', 'TCP 握手', 'hard', 2024, 'published', 1, @bank_id, 1
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = '请简述 TCP 三次握手的过程及为什么不能两次握手。');

