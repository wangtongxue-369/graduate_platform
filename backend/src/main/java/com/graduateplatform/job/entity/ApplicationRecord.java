package com.graduateplatform.job.entity;

import com.graduateplatform.common.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "job_application_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 120)
    private String companyName;

    @Column(nullable = false, length = 120)
    private String jobTitle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id")
    private JobPosting jobPosting;

    @Column(length = 80)
    private String city;

    @Column(length = 80)
    private String industry;

    @Column(length = 80)
    private String companyType;

    @Column(length = 80)
    private String roleType;

    @Column(length = 80)
    private String salaryRange;

    @Column(length = 120)
    private String educationRequirement;

    @Column(length = 500)
    private String majorKeywords;

    @Column(length = 500)
    private String skillTags;

    @Column(length = 500)
    private String applyUrl;

    @Column(length = 80)
    private String applicationChannel;

    @Column(length = 120)
    private String resumeFileName;

    @Column(length = 120)
    private String contactName;

    @Column(length = 120)
    private String contactInfo;

    @Column(length = 80)
    private String interviewRound;

    @Column(length = 80)
    private String interviewMethod;

    @Column(length = 300)
    private String interviewLocation;

    @Column(length = 80)
    private String expectedSalary;

    @Column(length = 80)
    private String offerSalary;

    private LocalDateTime lastFollowUpAt;

    @Column(length = 500)
    private String failureReason;

    @Column(nullable = false, length = 40)
    private String status;

    private LocalDateTime appliedAt;

    private LocalDateTime nextStepAt;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (appliedAt == null) {
            appliedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
