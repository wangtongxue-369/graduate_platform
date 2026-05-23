package com.graduateplatform.questionbank.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "question_snapshots", indexes = {
    @Index(name = "idx_qs_question_id", columnList = "question_id"),
    @Index(name = "idx_qs_question_version", columnList = "question_id,version_no")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "question_id", nullable = false)
    private Long questionId;

    @Column(name = "bank_id")
    private Long bankId;

    @Column(nullable = false, length = 2000)
    private String stem;

    @Column(nullable = false, length = 2000)
    private String optionsJson;

    @Column(nullable = false)
    private String answer;

    @Column(length = 2000)
    private String analysis;

    private String chapter;

    private String questionType;

    private String knowledgePoint;

    private String difficulty;

    private Integer year;

    @Column(name = "version_no", nullable = false)
    private Integer versionNo;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
