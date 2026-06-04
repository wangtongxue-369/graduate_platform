package com.graduateplatform.studyabroad.repository;

import com.graduateplatform.studyabroad.entity.StudyAbroadMaterial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudyAbroadMaterialRepository extends JpaRepository<StudyAbroadMaterial, Long> {
    List<StudyAbroadMaterial> findByUserIdOrderByDeadlineAsc(Long userId);

    Optional<StudyAbroadMaterial> findByIdAndUserId(Long id, Long userId);

    void deleteByUserIdAndApplicationId(Long userId, Long applicationId);
}
