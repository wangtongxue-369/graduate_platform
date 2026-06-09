package com.graduateplatform.init;

import com.graduateplatform.init.QuestionBankSeed.SeedBank;
import com.graduateplatform.init.QuestionBankSeed.SeedQuestion;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * 把 {@link QuestionBankSeed#ALL_BANKS} dump 成幂等 SQL 脚本，
 * 让运维可以在已有 MySQL 上一次性补齐题库（DataInitializer 仅在空库时跑一次）。
 *
 * <p>触发：{@code mvn test -Dseed.dump=true -Dtest=QuestionBankSeedDumpSqlTest}。
 * 默认不跑——避免普通 CI 的 mvn test 在 docs/ 下产生未提交副作用文件。
 * 修改种子数据后请手动跑一次再 commit。
 */
class QuestionBankSeedDumpSqlTest {

    @Test
    @EnabledIfSystemProperty(named = "seed.dump", matches = "true")
    void dumpSeedSql() throws IOException {
        StringBuilder sb = new StringBuilder();
        sb.append("-- 题库练习模块 — 种子题库与题目，幂等可重复执行。\n");
        sb.append("-- 仅在题库名不存在时插入题库；题目以 (bank_name, stem) 复合键去重。\n");
        sb.append("-- 字符集与时间戳与 JPA 写入路径保持一致。\n");
        sb.append("SET NAMES utf8mb4;\n\n");

        for (SeedBank bank : QuestionBankSeed.ALL_BANKS) {
            sb.append("-- ==================== 题库：").append(bank.name()).append(" ====================\n");
            // 1) 题库（按 name 去重）
            sb.append("INSERT INTO question_banks (name, target, subject, description, difficulty, status, active)\n");
            sb.append("SELECT ").append(sql(bank.name())).append(", ")
              .append(sql(bank.target())).append(", ")
              .append(sql(bank.subject())).append(", ")
              .append(sql(bank.description())).append(", ")
              .append(sql(bank.difficulty())).append(", 'active', 1\n");
            sb.append("WHERE NOT EXISTS (SELECT 1 FROM question_banks WHERE name = ").append(sql(bank.name())).append(");\n\n");

            sb.append("SET @bank_id := (SELECT id FROM question_banks WHERE name = ")
              .append(sql(bank.name())).append(" LIMIT 1);\n\n");

            // 2) 题目（按 bank_id+stem 去重）
            for (SeedQuestion q : bank.questions()) {
                String options = q.optionsJson() == null || q.optionsJson().isBlank() ? "[]" : q.optionsJson();
                String type = q.questionType() == null ? "single" : q.questionType();
                String diff = q.difficulty() == null ? bank.difficulty() : q.difficulty();
                sb.append("INSERT INTO questions ")
                  .append("(stem, options_json, answer, analysis, chapter, question_type, knowledge_point, difficulty, year, status, version_no, bank_id, active)\n");
                sb.append("SELECT ")
                  .append(sql(q.stem())).append(", ")
                  .append(sql(options)).append(", ")
                  .append(sql(q.answer())).append(", ")
                  .append(sql(q.analysis())).append(", ")
                  .append(sql(q.chapter())).append(", ")
                  .append(sql(type)).append(", ")
                  .append(sql(q.knowledgePoint())).append(", ")
                  .append(sql(diff)).append(", 2024, 'published', 1, @bank_id, 1\n");
                sb.append("WHERE NOT EXISTS (SELECT 1 FROM questions WHERE bank_id = @bank_id AND stem = ")
                  .append(sql(q.stem())).append(");\n");
            }
            sb.append('\n');
        }

        // user.dir 在 mvn test 时是 backend/，向上一级到仓库根
        Path target = Path.of(System.getProperty("user.dir")).getParent().resolve("docs").resolve("seed_question_banks.sql");
        Files.createDirectories(target.getParent());
        Files.writeString(target, sb.toString(), StandardCharsets.UTF_8);
        System.out.println("Seed SQL written to: " + target);
    }

    /** SQL 字符串字面量：null → NULL，否则用单引号包裹并转义内部单引号。 */
    private static String sql(String value) {
        if (value == null) return "NULL";
        return "'" + value.replace("\\", "\\\\").replace("'", "''") + "'";
    }
}
