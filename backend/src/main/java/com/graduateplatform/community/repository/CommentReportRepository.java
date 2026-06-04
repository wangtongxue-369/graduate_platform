package com.graduateplatform.community.repository;

import com.graduateplatform.community.entity.CommentReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentReportRepository extends JpaRepository<CommentReport, Long> {
    boolean existsByCommentIdAndReporterId(Long commentId, Long reporterId);
    long countByCommentIdAndStatus(Long commentId, String status);
    Page<CommentReport> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    Page<CommentReport> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByStatus(String status);
}
