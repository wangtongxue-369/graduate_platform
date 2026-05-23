package com.graduateplatform.questionbank.repository;

import com.graduateplatform.questionbank.entity.QuestionSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionSnapshotRepository extends JpaRepository<QuestionSnapshot, Long> {
    List<QuestionSnapshot> findByQuestionIdOrderByVersionNoDesc(Long questionId);
}
