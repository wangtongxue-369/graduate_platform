package com.graduateplatform.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReportCommentRequest {
    @NotBlank
    @Size(max = 300)
    private String reason;
}
