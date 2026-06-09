package com.graduateplatform.job.entity;

import com.graduateplatform.common.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "resume_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 80)
    private String templateType;

    @Column(length = 120)
    private String targetRole;

    @Column(length = 500)
    private String expectedCities;

    @Column(length = 500)
    private String expectedIndustries;

    @Column(length = 120)
    private String expectedSalary;

    @Column(length = 80)
    private String educationLevel;

    @Column(length = 120)
    private String major;

    @Column(length = 500)
    private String skillTags;

    @Column(length = 500)
    private String projectKeywords;

    @Column(length = 500)
    private String internshipKeywords;

    @Column(length = 500)
    private String certificates;

    @Column(length = 500)
    private String portfolioUrl;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String baseInfo;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String education;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String projects;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String internships;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String skills;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String selfEvaluation;

    @Column(length = 255)
    private String resumeFileName;

    private Long resumeFileSize;

    @Column(length = 100)
    private String resumeFileType;

    @Column(length = 500)
    private String resumeCosKey;

    private LocalDateTime resumeUploadedAt;

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
