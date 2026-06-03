package com.graduateplatform.job.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "job_postings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobPosting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 120)
    private String companyName;

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

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String description;

    @Column(length = 500)
    private String applyUrl;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

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
