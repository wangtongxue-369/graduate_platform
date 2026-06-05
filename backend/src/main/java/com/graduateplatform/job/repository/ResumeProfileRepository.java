package com.graduateplatform.job.repository;

import com.graduateplatform.job.entity.ResumeProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ResumeProfileRepository extends JpaRepository<ResumeProfile, Long> {
    Optional<ResumeProfile> findByUserId(Long userId);
    List<ResumeProfile> findByUserIdIn(Collection<Long> userIds);
}
