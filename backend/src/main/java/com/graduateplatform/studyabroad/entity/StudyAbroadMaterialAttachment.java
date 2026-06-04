package com.graduateplatform.studyabroad.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "study_abroad_material_attachments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyAbroadMaterialAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private StudyAbroadMaterial material;

    @Column(nullable = false, length = 255)
    private String originalName;

    private Long fileSize;

    @Column(nullable = false, length = 500)
    private String cosKey;

    @Column(length = 100)
    private String fileType;

    @Builder.Default
    private Integer downloadCount = 0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
