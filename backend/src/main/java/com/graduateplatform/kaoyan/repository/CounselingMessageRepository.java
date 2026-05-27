package com.graduateplatform.kaoyan.repository;

import com.graduateplatform.kaoyan.entity.CounselingMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CounselingMessageRepository extends JpaRepository<CounselingMessage, Long> {

    Page<CounselingMessage> findBySessionIdOrderByCreatedAtAsc(Long sessionId, Pageable pageable);

    @Modifying
    @Query("UPDATE CounselingMessage m SET m.isRead = true WHERE m.session.id = :sessionId AND m.sender.id != :userId")
    void markAsReadBySessionIdAndNotSender(@Param("sessionId") Long sessionId, @Param("userId") Long userId);
}