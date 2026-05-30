package com.graduateplatform.community.repository;

import com.graduateplatform.community.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' " +
           "AND (:includeMembers = true OR p.visibility = 'public') " +
           "AND (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND (:keyword IS NULL OR p.title LIKE %:keyword% OR p.content LIKE %:keyword%) " +
           "AND (:tag IS NULL OR p.tags LIKE %:tag%) " +
           "AND (:hasAttachment IS NULL OR p.hasAttachment = :hasAttachment)")
    Page<Post> findPublishedPosts(
        @Param("includeMembers") boolean includeMembers,
        @Param("categoryId") Long categoryId,
        @Param("keyword") String keyword,
        @Param("tag") String tag,
        @Param("hasAttachment") Boolean hasAttachment,
        Pageable pageable
    );

    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHED' " +
           "AND (:includeMembers = true OR p.visibility = 'public') " +
           "AND (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND (:keyword IS NULL OR p.title LIKE %:keyword% OR p.content LIKE %:keyword%) " +
           "AND (:tag IS NULL OR p.tags LIKE %:tag%) " +
           "AND (:hasAttachment IS NULL OR p.hasAttachment = :hasAttachment) " +
           "ORDER BY (" +
           "COALESCE(p.viewCount, 0) + " +
           "COALESCE(p.likeCount, 0) * 15 + " +
           "COALESCE(p.favoriteCount, 0) * 10 + " +
           "(SELECT COUNT(c) FROM Comment c WHERE c.post = p AND c.status = 'PUBLISHED') * 8 - " +
           "COALESCE(p.reportCount, 0) * 15" +
           ") DESC, p.createdAt DESC")
    Page<Post> findPublishedPostsByHotScore(
        @Param("includeMembers") boolean includeMembers,
        @Param("categoryId") Long categoryId,
        @Param("keyword") String keyword,
        @Param("tag") String tag,
        @Param("hasAttachment") Boolean hasAttachment,
        Pageable pageable
    );

    long countByAuthorId(Long authorId);

    Page<Post> findByAuthorIdOrderByCreatedAtDesc(Long authorId, Pageable pageable);

    Optional<Post> findByIdAndAuthorId(Long id, Long authorId);

    Page<Post> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
