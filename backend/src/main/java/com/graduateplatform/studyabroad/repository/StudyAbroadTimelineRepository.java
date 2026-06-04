package com.graduateplatform.studyabroad.repository;

import com.graduateplatform.studyabroad.entity.StudyAbroadTimeline;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudyAbroadTimelineRepository extends JpaRepository<StudyAbroadTimeline, Long> {
    List<StudyAbroadTimeline> findByUserIdOrderByDueDateAsc(Long userId);

    Optional<StudyAbroadTimeline> findByIdAndUserId(Long id, Long userId);

    void deleteByUserIdAndApplicationId(Long userId, Long applicationId);
}
