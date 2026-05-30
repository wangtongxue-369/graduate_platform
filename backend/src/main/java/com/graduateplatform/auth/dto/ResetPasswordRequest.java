package com.graduateplatform.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank
    private String accountType; // phone / email / studentId

    @NotBlank
    private String account;

    @NotBlank
    private String verifyCode;

    @NotBlank
    private String newPassword;
}
