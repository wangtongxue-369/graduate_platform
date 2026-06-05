package com.graduateplatform.studyabroad.repository;

import com.graduateplatform.studyabroad.entity.StudyAbroadExperience;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudyAbroadExperienceRepository extends JpaRepository<StudyAbroadExperience, Long> {
    Optional<StudyAbroadExperience> findByIdAndAuthorId(Long id, Long authorId);

    @Query("""
        select e from StudyAbroadExperience e
        where (:country is null or e.country = :country)
          and (:topic is null or e.topic = :topic)
          and (:keyword is null
            or lower(e.title) like lower(concat('%', :keyword, '%'))
            or lower(e.summary) like lower(concat('%', :keyword, '%'))
            or lower(e.tags) like lower(concat('%', :keyword, '%')))
        order by e.createdAt desc
        """)
    List<StudyAbroadExperience> search(@Param("country") String country,
                                       @Param("topic") String topic,
                                       @Param("keyword") String keyword);

    @Query("""
        select e from StudyAbroadExperience e
        where (:country is null or e.country = :country)
          and (:topic is null or e.topic = :topic)
          and (:keyword is null
            or lower(e.title) like lower(concat('%', :keyword, '%'))
            or lower(e.summary) like lower(concat('%', :keyword, '%'))
            or lower(e.tags) like lower(concat('%', :keyword, '%')))
        """)
    Page<StudyAbroadExperience> searchPage(@Param("country") String country,
                                           @Param("topic") String topic,
                                           @Param("keyword") String keyword,
                                           Pageable pageable);
}
