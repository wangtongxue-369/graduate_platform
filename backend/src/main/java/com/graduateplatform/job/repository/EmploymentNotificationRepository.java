package com.graduateplatform.job.repository;

import com.graduateplatform.job.entity.EmploymentNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmploymentNotificationRepository extends JpaRepository<EmploymentNotification, Long> {
    List<EmploymentNotification> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<EmploymentNotification> findByIdAndUserId(Long id, Long userId);
    boolean existsByUserIdAndRelatedTypeAndRelatedId(Long userId, String relatedType, Long relatedId);
    long countByUserIdAndReadFlagFalse(Long userId);
}
