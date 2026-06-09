package com.graduateplatform.studyabroad.repository;

import com.graduateplatform.studyabroad.entity.StudyAbroadSchoolProgram;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudyAbroadSchoolProgramRepository extends JpaRepository<StudyAbroadSchoolProgram, Long> {

    boolean existsBySchoolNameAndProgramName(String schoolName, String programName);

    @Query("""
        select p from StudyAbroadSchoolProgram p
        where (:country is null or p.country = :country)
          and (:subjectArea is null or p.subjectArea = :subjectArea)
          and (:partnerOnly is null or p.partnerProgram = :partnerOnly)
          and (:keyword is null
            or lower(p.schoolName) like lower(concat('%', :keyword, '%'))
            or lower(p.programName) like lower(concat('%', :keyword, '%'))
            or lower(p.applicationRequirements) like lower(concat('%', :keyword, '%'))
            or lower(coalesce(p.riskTags, '')) like lower(concat('%', :keyword, '%')))
        """)
    Page<StudyAbroadSchoolProgram> searchPage(@Param("country") String country,
                                              @Param("subjectArea") String subjectArea,
                                              @Param("partnerOnly") Boolean partnerOnly,
                                              @Param("keyword") String keyword,
                                              Pageable pageable);
}
