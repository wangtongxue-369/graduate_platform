package com.graduateplatform.questionbank.repository;

import com.graduateplatform.questionbank.entity.WrongQuestion;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WrongQuestionRepository extends JpaRepository<WrongQuestion, Long> {
    Optional<WrongQuestion> findByUserIdAndQuestionId(Long userId, Long questionId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM WrongQuestion w WHERE w.user.id = :userId AND w.question.id = :questionId")
    Optional<WrongQuestion> findByUserIdAndQuestionIdWithLock(@Param("userId") Long userId, @Param("questionId") Long questionId);

    List<WrongQuestion> findByUserId(Long userId);

    // 仅返回题目仍可练习（题目和题库都未被停用）的错题；
    // 否则前端列出的错题在重练时会被 PracticeService 过滤掉，触发"所选错题均不可练习"的混乱报错。
    // bank.active 为 NULL 视为启用，兼容 active 列加入前的历史数据。
    @Query("SELECT w FROM WrongQuestion w " +
           "WHERE w.user.id = :userId " +
           "AND w.question.active = true " +
           "AND (w.question.bank IS NULL OR w.question.bank.active IS NULL OR w.question.bank.active = true) " +
           "AND (:target IS NULL OR w.question.bank.target = :target) " +
           "AND (:subject IS NULL OR w.question.bank.subject = :subject) " +
           "AND (:chapter IS NULL OR w.question.chapter = :chapter) " +
           "AND (:minWrongCount IS NULL OR w.wrongCount >= :minWrongCount) " +
           "ORDER BY w.lastWrongAt DESC")
    Page<WrongQuestion> findReviewListPaged(
        @Param("userId") Long userId,
        @Param("target") String target,
        @Param("subject") String subject,
        @Param("chapter") String chapter,
        @Param("minWrongCount") Integer minWrongCount,
        Pageable pageable
    );
}
