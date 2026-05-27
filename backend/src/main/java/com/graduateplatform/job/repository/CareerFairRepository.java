package com.graduateplatform.job.repository;

import com.graduateplatform.job.entity.CareerFair;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CareerFairRepository extends JpaRepository<CareerFair, Long> {
    @Query("SELECT f FROM CareerFair f WHERE f.active = true " +
           "AND (:city IS NULL OR f.city LIKE %:city%) " +
           "AND (:industry IS NULL OR f.industry LIKE %:industry%) " +
           "AND (:keyword IS NULL OR f.title LIKE %:keyword% OR f.companyName LIKE %:keyword% OR f.targetRoles LIKE %:keyword%) " +
           "ORDER BY f.startTime ASC, f.createdAt DESC")
    List<CareerFair> findActive(@Param("city") String city,
                                @Param("industry") String industry,
                                @Param("keyword") String keyword);

    List<CareerFair> findByTitleAndCompanyName(String title, String companyName);

    boolean existsByTitleAndCompanyName(String title, String companyName);

    boolean existsByTitleAndCompanyNameAndStartTime(String title, String companyName, LocalDateTime startTime);

    @Query("SELECT COUNT(f) > 0 FROM CareerFair f WHERE f.title = :title " +
           "AND f.companyName = :companyName " +
           "AND ((:startTime IS NULL AND f.startTime IS NULL) OR f.startTime = :startTime) " +
           "AND (:excludeId IS NULL OR f.id <> :excludeId)")
    boolean existsDuplicate(@Param("title") String title,
                            @Param("companyName") String companyName,
                            @Param("startTime") LocalDateTime startTime,
                            @Param("excludeId") Long excludeId);
}
