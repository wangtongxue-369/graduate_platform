package com.graduateplatform.questionbank.repository;

import com.graduateplatform.questionbank.entity.QuestionBank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface QuestionBankRepository extends JpaRepository<QuestionBank, Long> {
    List<QuestionBank> findByTarget(String target);

    // active IS NULL 视为启用，兼容 active 列引入前的历史数据；
    // 否则旧题库（active=NULL）会被全部隐藏，公共列表整体空白。
    @Query("SELECT b FROM QuestionBank b WHERE b.active IS NULL OR b.active = true")
    List<QuestionBank> findActiveBanks();

    @Query("SELECT b FROM QuestionBank b WHERE b.target = :target AND (b.active IS NULL OR b.active = true)")
    List<QuestionBank> findActiveBanksByTarget(@Param("target") String target);

    @Query("SELECT DISTINCT b.target FROM QuestionBank b WHERE b.target IS NOT NULL AND (b.active IS NULL OR b.active = true) ORDER BY b.target")
    List<String> findDistinctTargets();

    @Query("SELECT DISTINCT b.subject FROM QuestionBank b WHERE b.subject IS NOT NULL AND (b.active IS NULL OR b.active = true) ORDER BY b.subject")
    List<String> findDistinctSubjects();

    @Query("SELECT DISTINCT b.difficulty FROM QuestionBank b WHERE b.difficulty IS NOT NULL AND (b.active IS NULL OR b.active = true) ORDER BY b.difficulty")
    List<String> findDistinctDifficulties();
}
