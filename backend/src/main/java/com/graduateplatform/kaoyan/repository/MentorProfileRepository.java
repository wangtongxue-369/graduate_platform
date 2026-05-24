package com.graduateplatform.kaoyan.repository;

import com.graduateplatform.kaoyan.entity.MentorProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface MentorProfileRepository extends JpaRepository<MentorProfile, Long>, JpaSpecificationExecutor<MentorProfile> {
    Optional<MentorProfile> findByUserId(Long userId);
    Optional<MentorProfile> findByIdAndActiveTrue(Long id);
    boolean existsByUserId(Long userId);
    Page<MentorProfile> findByActiveTrue(Pageable pageable);
}