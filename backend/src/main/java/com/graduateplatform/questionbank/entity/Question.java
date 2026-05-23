package com.graduateplatform.questionbank.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "questions", indexes = {
    @Index(name = "idx_q_bank_id", columnList = "bank_id"),
    @Index(name = "idx_q_bank_active_status", columnList = "bank_id,active,status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 2000)
    private String stem;

    @Column(nullable = false, length = 2000)
    private String optionsJson; // JSON array string: ["A.xxx","B.xxx","C.xxx","D.xxx"]

    @Column(nullable = false)
    private String answer; // A / B / C / D

    @Column(length = 2000)
    private String analysis;

    private String chapter;

    private String questionType; // single / multiple / judge / subjective

    private String knowledgePoint;

    private String difficulty; // easy / middle / hard

    private Integer year;

    private String status; // draft / published / disabled

    private Integer versionNo; // 题目版本号，与快照对齐

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_id", nullable = false)
    private QuestionBank bank;

    @Builder.Default
    private Boolean active = true;
}
