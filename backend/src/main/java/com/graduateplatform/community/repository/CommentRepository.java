package com.graduateplatform.community.repository;

import com.graduateplatform.community.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);
    List<Comment> findByPostIdAndStatusInOrderByCreatedAtAsc(Long postId, List<String> statuses);
    Optional<Comment> findByIdAndPostIdAndStatusIn(Long id, Long postId, List<String> statuses);
    long countByAuthorId(Long authorId);
    Page<Comment> findByAuthorIdOrderByCreatedAtDesc(Long authorId, Pageable pageable);
    Optional<Comment> findByIdAndAuthorId(Long id, Long authorId);
    long countByPostIdAndStatusIn(Long postId, List<String> statuses);
}
