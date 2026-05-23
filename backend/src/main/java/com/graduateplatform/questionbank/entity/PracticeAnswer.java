package com.graduateplatform.questionbank.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "practice_answers",
    indexes = @Index(name = "idx_pa_session_order", columnList = "session_id,order_no"),
    uniqueConstraints = @UniqueConstraint(columnNames = {"session_id", "question_id"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PracticeAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private PracticeSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(length = 2000)
    private String answer;

    private Boolean correct;

    private String reviewStatus; // pending / auto_scored / pending_manual / reviewed / saved_only

    private Integer orderNo;

    // ===== 题目快照字段（创建会话时写入，历史回放不依赖 Question 主表当前值） =====

    @Column(columnDefinition = "TEXT")
    private String snapshotStem;

    @Column(length = 2000)
    private String snapshotOptionsJson;

    @Column(length = 2000)
    private String snapshotAnswer;

    @Column(columnDefinition = "TEXT")
    private String snapshotAnalysis;

    private String snapshotQuestionType;

    private String snapshotKnowledgePoint;

    private String snapshotDifficulty;

    private Integer snapshotYear;

    private Integer snapshotVersionNo;

    // ===== 得分相关 =====

    private Integer scoreAwarded;

    private Integer manualScore;

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
}
