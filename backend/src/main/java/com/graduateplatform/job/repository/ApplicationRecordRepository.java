package com.graduateplatform.job.repository;

import com.graduateplatform.job.entity.ApplicationRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicationRecordRepository extends JpaRepository<ApplicationRecord, Long> {
    List<ApplicationRecord> findByUserIdOrderByAppliedAtDescCreatedAtDesc(Long userId);
    Optional<ApplicationRecord> findByIdAndUserId(Long id, Long userId);
    boolean existsByJobPostingId(Long jobPostingId);
}
