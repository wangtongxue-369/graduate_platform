package com.graduateplatform.job.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ApplicationRecordRequest {
    @NotBlank(message = "公司名称不能为空")
    private String companyName;
    @NotBlank(message = "岗位名称不能为空")
    private String jobTitle;
    private Long jobPostingId;
    private String status;
    private LocalDateTime appliedAt;
    private LocalDateTime nextStepAt;
    private String notes;
}
