package com.graduateplatform.common.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String username;

    @Column(unique = true)
    private String phone;

    @Column(unique = true)
    private String email;

    @Column(unique = true)
    private String studentId;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    private String avatar;

    private String school;

    private String major;

    private String grade;

    @Column(nullable = false)
    private String target; // kaoyan / kaogong / job / liuxue

    private String intentRegion;

    @Column(nullable = false)
    private String role; // user / admin

    @Column(nullable = false)
    private String status; // normal / muted / upload_limited / temporary_locked / banned

    @Builder.Default
    private Integer loginFailCount = 0;

    private LocalDateTime lockedUntil;

    private String lastLoginIp;

    private String lastLoginDevice;

    private LocalDateTime lastLoginAt;

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
