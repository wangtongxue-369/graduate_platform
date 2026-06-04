package com.graduateplatform.community.repository;

import com.graduateplatform.community.entity.CommunityNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CommunityNotificationRepository extends JpaRepository<CommunityNotification, Long> {
    Page<CommunityNotification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserIdAndReadFlagFalse(Long userId);

    Optional<CommunityNotification> findByIdAndUserId(Long id, Long userId);
}
