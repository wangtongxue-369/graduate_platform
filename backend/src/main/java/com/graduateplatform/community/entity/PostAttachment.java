package com.graduateplatform.community.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "post_attachments",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_post_attachment_hash", columnNames = {"post_id", "file_hash"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "post")
@EqualsAndHashCode(exclude = "post")
public class PostAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(nullable = false, length = 255)
    private String originalName;

    @Column(nullable = false)
    private Long fileSize;

    @Column(nullable = false, length = 120)
    private String fileType;

    @Column(nullable = false, length = 500)
    private String cosKey;

    @Column(name = "file_hash", nullable = false, length = 64)
    private String fileHash;

    @Builder.Default
    private Integer downloadCount = 0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

