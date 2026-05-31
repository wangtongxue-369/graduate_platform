package com.graduateplatform.community.repository;

import com.graduateplatform.community.entity.PostAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostAttachmentRepository extends JpaRepository<PostAttachment, Long> {
    Optional<PostAttachment> findByIdAndPostId(Long id, Long postId);
    boolean existsByPostIdAndFileHash(Long postId, String fileHash);
}

