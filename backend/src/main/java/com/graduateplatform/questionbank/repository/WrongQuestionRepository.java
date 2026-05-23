package com.graduateplatform.questionbank.repository;

import com.graduateplatform.questionbank.entity.WrongQuestion;
import jakarta.persistence.LockModeType;
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

    @Query("SELECT w FROM WrongQuestion w " +
           "WHERE w.user.id = :userId " +
           "AND (:target IS NULL OR w.question.bank.target = :target) " +
           "AND (:subject IS NULL OR w.question.bank.subject = :subject) " +
           "AND (:chapter IS NULL OR w.question.chapter = :chapter) " +
           "AND (:minWrongCount IS NULL OR w.wrongCount >= :minWrongCount) " +
           "ORDER BY w.lastWrongAt DESC")
    List<WrongQuestion> findReviewList(
        @Param("userId") Long userId,
        @Param("target") String target,
        @Param("subject") String subject,
        @Param("chapter") String chapter,
        @Param("minWrongCount") Integer minWrongCount
    );
}
