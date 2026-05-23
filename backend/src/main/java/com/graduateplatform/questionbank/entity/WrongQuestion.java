package com.graduateplatform.questionbank.entity;

import com.graduateplatform.common.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "wrong_questions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "question_id"}),
    indexes = @Index(name = "idx_wq_user_id", columnList = "user_id")
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WrongQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    private Integer wrongCount;

    @Column(length = 2000)
    private String lastAnswer;

    private LocalDateTime lastWrongAt;

    // ===== 错题快照字段（不依赖 Question 主表当前值） =====

    @Column(columnDefinition = "TEXT")
    private String snapshotStem;

    private String snapshotTarget;

    private String snapshotSubject;

    private String snapshotChapter;

    private String snapshotKnowledgePoint;

    private String snapshotQuestionType;

    @Version
    private Long version; // 乐观锁，防止并发重复记录

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (wrongCount == null) {
            wrongCount = 1;
        }
        if (lastWrongAt == null) {
            lastWrongAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
