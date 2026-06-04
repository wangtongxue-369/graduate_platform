package com.graduateplatform.job.repository;

import com.graduateplatform.job.entity.JobPosting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {
    @Query("SELECT j FROM JobPosting j WHERE j.active = true " +
           "AND (:city IS NULL OR j.city LIKE %:city%) " +
           "AND (:industry IS NULL OR j.industry LIKE %:industry%) " +
           "AND (:roleType IS NULL OR j.roleType LIKE %:roleType%) " +
           "AND (:keyword IS NULL OR j.title LIKE %:keyword% OR j.companyName LIKE %:keyword% OR j.description LIKE %:keyword%) " +
           "ORDER BY j.createdAt DESC")
    List<JobPosting> findActive(@Param("city") String city,
                                @Param("industry") String industry,
                                @Param("roleType") String roleType,
                                @Param("keyword") String keyword);

    List<JobPosting> findByActiveTrueOrderByCreatedAtDesc();

    List<JobPosting> findByTitleAndCompanyName(String title, String companyName);

    boolean existsByTitleAndCompanyName(String title, String companyName);
}
