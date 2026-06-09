package com.graduateplatform.questionbank.repository;

import com.graduateplatform.questionbank.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByBankId(Long bankId);
    Page<Question> findByBankId(Long bankId, Pageable pageable);

    // 题库停用 = bank.active=false；不再级联翻转题目自身的 active，
    // 这样 disable→enable 题库后题目能恢复，可见性统一在查询侧过滤。
    // bank.active 为 NULL 视为启用，兼容 active 列加入前的历史数据
    // （否则上线后旧题库会因 active=NULL 被全部过滤为不可见）。
    @Query("SELECT q FROM Question q " +
           "WHERE q.bank.id = :bankId " +
           "AND q.active = true " +
           "AND (q.bank.active IS NULL OR q.bank.active = true) " +
           "AND (q.status IS NULL OR q.status = 'published') " +
           "AND (:chapter IS NULL OR q.chapter = :chapter) " +
           "AND (:questionType IS NULL OR q.questionType = :questionType) " +
           "AND (:difficulty IS NULL OR q.difficulty = :difficulty) " +
           "AND (:year IS NULL OR q.year = :year)")
    List<Question> findPracticeCandidates(
        @Param("bankId") Long bankId,
        @Param("chapter") String chapter,
        @Param("questionType") String questionType,
        @Param("difficulty") String difficulty,
        @Param("year") Integer year
    );

    @Query("SELECT DISTINCT q.chapter FROM Question q WHERE q.chapter IS NOT NULL ORDER BY q.chapter")
    List<String> findDistinctChapters();

    @Query("SELECT DISTINCT q.questionType FROM Question q WHERE q.questionType IS NOT NULL ORDER BY q.questionType")
    List<String> findDistinctQuestionTypes();

    @Query("SELECT DISTINCT q.year FROM Question q WHERE q.year IS NOT NULL ORDER BY q.year DESC")
    List<Integer> findDistinctYears();
}
