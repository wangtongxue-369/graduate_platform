package com.graduateplatform.kaoyan.repository;

import com.graduateplatform.kaoyan.entity.CounselingSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CounselingSessionRepository extends JpaRepository<CounselingSession, Long> {

    Page<CounselingSession> findByStudentIdAndStatusNot(Long studentId, String status, Pageable pageable);

    Page<CounselingSession> findByMentorIdAndStatusNot(Long mentorId, String status, Pageable pageable);

    @Query("SELECT COUNT(m) FROM CounselingMessage m WHERE m.session.student.id = :userId AND m.sender.id != :userId AND m.isRead = false")
    long countUnreadByStudentId(@Param("userId") Long userId);

    @Query("SELECT COUNT(m) FROM CounselingMessage m WHERE m.session.mentor.id = :userId AND m.sender.id != :userId AND m.isRead = false")
    long countUnreadByMentorId(@Param("userId") Long userId);
}