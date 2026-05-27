package com.graduateplatform.questionbank.repository;

import com.graduateplatform.questionbank.entity.QuestionBank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface QuestionBankRepository extends JpaRepository<QuestionBank, Long> {
    List<QuestionBank> findByTarget(String target);

    List<QuestionBank> findByActiveTrue();

    List<QuestionBank> findByTargetAndActiveTrue(String target);

    @Query("SELECT DISTINCT b.target FROM QuestionBank b WHERE b.target IS NOT NULL AND b.active = true ORDER BY b.target")
    List<String> findDistinctTargets();

    @Query("SELECT DISTINCT b.subject FROM QuestionBank b WHERE b.subject IS NOT NULL AND b.active = true ORDER BY b.subject")
    List<String> findDistinctSubjects();

    @Query("SELECT DISTINCT b.difficulty FROM QuestionBank b WHERE b.difficulty IS NOT NULL AND b.active = true ORDER BY b.difficulty")
    List<String> findDistinctDifficulties();
}
