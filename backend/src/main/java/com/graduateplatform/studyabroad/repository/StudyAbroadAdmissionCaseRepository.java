package com.graduateplatform.studyabroad.repository;

import com.graduateplatform.studyabroad.entity.StudyAbroadAdmissionCase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface StudyAbroadAdmissionCaseRepository extends JpaRepository<StudyAbroadAdmissionCase, Long> {
    Optional<StudyAbroadAdmissionCase> findByIdAndAuthorId(Long id, Long authorId);

    @Query("""
        select c from StudyAbroadAdmissionCase c
        where (:country is null or c.country = :country)
          and (:result is null or c.admissionResult = :result)
          and (:major is null or lower(c.studentMajor) like lower(concat('%', :major, '%')))
          and (:keyword is null
            or lower(c.school) like lower(concat('%', :keyword, '%'))
            or lower(c.program) like lower(concat('%', :keyword, '%'))
            or lower(c.studentMajor) like lower(concat('%', :keyword, '%'))
            or lower(coalesce(c.tags, '')) like lower(concat('%', :keyword, '%')))
        """)
    Page<StudyAbroadAdmissionCase> searchPage(@Param("country") String country,
                                              @Param("result") String result,
                                              @Param("major") String major,
                                              @Param("keyword") String keyword,
                                              Pageable pageable);
}
