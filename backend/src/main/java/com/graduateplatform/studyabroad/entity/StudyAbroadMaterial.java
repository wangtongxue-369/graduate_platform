package com.graduateplatform.studyabroad.entity;

import com.graduateplatform.common.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "study_abroad_materials")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyAbroadMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    private StudyAbroadApplication application;

    @Column(nullable = false, length = 80)
    private String title;

    @Column(nullable = false, length = 40)
    private String country;

    @Column(nullable = false, length = 40)
    private String stage;

    @Column(nullable = false, length = 60)
    private String category;

    @Column(nullable = false)
    private LocalDate deadline;

    @Column(nullable = false)
    private Boolean completed;

    @Column(length = 500)
    private String note;

    @Builder.Default
    @OneToMany(mappedBy = "material", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StudyAbroadMaterialAttachment> attachments = new ArrayList<>();

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

    public void addAttachment(StudyAbroadMaterialAttachment attachment) {
        attachments.add(attachment);
        attachment.setMaterial(this);
    }

    public void removeAttachment(StudyAbroadMaterialAttachment attachment) {
        attachments.remove(attachment);
        attachment.setMaterial(null);
    }
}
