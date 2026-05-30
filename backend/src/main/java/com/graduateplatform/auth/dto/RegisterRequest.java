package com.graduateplatform.auth.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String name;

    private String username;

    @NotBlank
    private String password;

    private String phone;
    private String email;
    private String studentId;
    private String verifyCode;

    @NotBlank
    private String target; // kaoyan / kaogong / job / liuxue

    private String school;
    private String major;
    private String grade;
    private String intentRegion;

    // 前端额外发送的字段
    private String accountType;      // phone / email / studentId
    private Boolean agreementAccepted;
}
