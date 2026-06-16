package com.graduateplatform.questionbank.repository;

import com.graduateplatform.questionbank.entity.QuestionBank;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface QuestionBankRepository extends JpaRepository<QuestionBank, Long> {
    List<QuestionBank> findByTarget(String target);

    // 管理员题库治理列表：active=false 视为"已软删"，需排除，
    // 与题目 QuestionRepository.findByBankIdAndActiveTrue 口径一致。
    @Query("SELECT b FROM QuestionBank b WHERE b.active IS NULL OR b.active = true")
    Page<QuestionBank> findActiveBanksPaged(Pageable pageable);

    // 公共列表：同时排除"已软删"和"已停用"，两者对学生均不可见。
    // active IS NULL 视为启用；status IS NULL 视为活跃，兼容旧数据。
    @Query("SELECT b FROM QuestionBank b WHERE (b.active IS NULL OR b.active = true) AND (b.status IS NULL OR b.status <> 'inactive')")
    List<QuestionBank> findActiveBanks();

    @Query("SELECT b FROM QuestionBank b WHERE b.target = :target AND (b.active IS NULL OR b.active = true) AND (b.status IS NULL OR b.status <> 'inactive')")
    List<QuestionBank> findActiveBanksByTarget(@Param("target") String target);

    @Query("SELECT DISTINCT b.target FROM QuestionBank b WHERE b.target IS NOT NULL AND (b.active IS NULL OR b.active = true) AND (b.status IS NULL OR b.status <> 'inactive') ORDER BY b.target")
    List<String> findDistinctTargets();

    @Query("SELECT DISTINCT b.subject FROM QuestionBank b WHERE b.subject IS NOT NULL AND (b.active IS NULL OR b.active = true) AND (b.status IS NULL OR b.status <> 'inactive') ORDER BY b.subject")
    List<String> findDistinctSubjects();

    @Query("SELECT DISTINCT b.difficulty FROM QuestionBank b WHERE b.difficulty IS NOT NULL AND (b.active IS NULL OR b.active = true) AND (b.status IS NULL OR b.status <> 'inactive') ORDER BY b.difficulty")
    List<String> findDistinctDifficulties();
}
