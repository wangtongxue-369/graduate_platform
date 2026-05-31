package com.graduateplatform.community.entity;
import com.graduateplatform.common.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private PostCategory category;

    @Column(length = 500)
    private String tags; // comma-separated

    @Column(nullable = false)
    private String visibility; // public / members

    @Column(nullable = false)
    @Builder.Default
    private Boolean anonymous = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean hasAttachment = false;

    @Column(length = 500)
    private String attachmentNote;

    @Column(length = 30)
    private String contentFormat;

    @Column(length = 255)
    private String sourceFileName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false)
    private String status; // DRAFT / PENDING / PUBLISHED / REJECTED / OFFLINE

    @Column(length = 500)
    private String reviewReason;

    private Long reviewedById;

    private LocalDateTime reviewedAt;

    @Builder.Default
    private Integer viewCount = 0;
    @Builder.Default
    private Integer likeCount = 0;
    @Builder.Default
    private Integer favoriteCount = 0;
    @Builder.Default
    private Integer reportCount = 0;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PostAttachment> attachments = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public int getCommentCount() {
        return comments != null ? comments.size() : 0;
    }

    public int getAttachmentCount() {
        return attachments != null ? attachments.size() : 0;
    }

    public void addAttachment(PostAttachment attachment) {
        if (attachment == null) return;
        attachment.setPost(this);
        attachments.add(attachment);
    }
}
