package com.graduateplatform.studyabroad.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "study_abroad_school_programs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyAbroadSchoolProgram {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String country;

    @Column(nullable = false, length = 120)
    private String schoolName;

    @Column(nullable = false, length = 160)
    private String programName;

    @Column(nullable = false, length = 40)
    private String degree;

    @Column(nullable = false, length = 80)
    private String subjectArea;

    @Column(length = 80)
    private String qsRank;

    @Column(length = 80)
    private String theRank;

    @Column(length = 80)
    private String usNewsRank;

    @Column(length = 120)
    private String tuitionRange;

    @Column(length = 120)
    private String durationText;

    @Column(length = 120)
    private String deadlineText;

    @Column(length = 500)
    private String applicationRequirements;

    @Column(length = 500)
    private String visaPolicy;

    @Column(length = 500)
    private String employmentPolicy;

    @Column(nullable = false)
    private Boolean partnerProgram;

    @Column(length = 255)
    private String partnerNote;

    @Column(length = 255)
    private String riskTags;

    @Column(length = 500)
    private String riskSummary;

    @Column(length = 255)
    private String sourceNote;

    private LocalDate policyUpdatedAt;

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
