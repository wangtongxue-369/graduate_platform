package com.graduateplatform.studyabroad.entity;

import com.graduateplatform.common.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "study_abroad_admission_cases")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyAbroadAdmissionCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 20)
    private String applicationYear;

    @Column(nullable = false, length = 60)
    private String studentMajor;

    @Column(nullable = false, length = 40)
    private String gpa;

    @Column(length = 40)
    private String rankPercent;

    @Column(nullable = false, length = 40)
    private String languageType;

    @Column(nullable = false, length = 40)
    private String languageScore;

    @Column(length = 80)
    private String standardizedScore;

    @Column(length = 500)
    private String softBackground;

    @Column(nullable = false, length = 40)
    private String country;

    @Column(nullable = false, length = 120)
    private String school;

    @Column(nullable = false, length = 120)
    private String program;

    @Column(nullable = false, length = 40)
    private String degree;

    @Column(nullable = false, length = 30)
    private String admissionResult;

    @Column(length = 120)
    private String scholarship;

    @Column(length = 40)
    private String applicationMode;

    @Column(length = 255)
    private String tags;

    @Column(nullable = false, length = 500)
    private String summary;

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
