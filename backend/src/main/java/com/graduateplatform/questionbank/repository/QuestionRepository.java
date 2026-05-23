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

    @Query("SELECT q FROM Question q " +
           "WHERE q.bank.id = :bankId " +
           "AND q.active = true " +
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
