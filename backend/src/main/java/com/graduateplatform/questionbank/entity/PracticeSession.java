package com.graduateplatform.questionbank.entity;

import com.graduateplatform.common.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "practice_sessions", indexes = @Index(name = "idx_ps_user_status_submitted", columnList = "user_id,status,submitted_at"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PracticeSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_id", nullable = false)
    private QuestionBank bank;

    @Column(nullable = false)
    private String mode; // chapter / random / mock

    private String status; // in_progress / submitted

    @Column(nullable = false, updatable = false)
    private LocalDateTime startedAt;

    private LocalDateTime submittedAt;

    private Integer totalCount;

    private Integer answeredCount;

    private Integer correctCount;

    private Integer wrongCount;

    private Integer subjectiveCount;

    private Integer durationSeconds;

    private Integer score;

    private Integer accuracy;

    // ===== 筛选条件冗余（便于独立统计，不依赖关联查询题库） =====

    private String target;

    private String subject;

    private String chapter;

    private String questionType;

    private String difficulty;

    private Integer year;

    @Column(columnDefinition = "TEXT")
    private String sourceRuleJson; // 创建规则，如随机题量、章节集合、模拟卷来源

    @Version
    private Long version; // 乐观锁，防止并发提交

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderNo ASC")
    @Builder.Default
    private List<PracticeAnswer> answers = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) {
            startedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "in_progress";
        }
    }
}
