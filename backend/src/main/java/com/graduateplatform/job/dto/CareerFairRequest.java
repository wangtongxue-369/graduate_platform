package com.graduateplatform.job.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CareerFairRequest {
    @NotBlank(message = "招聘会标题不能为空")
    private String title;
    @NotBlank(message = "公司名称不能为空")
    private String companyName;
    private String city;
    private String industry;
    private String targetRoles;
    private String location;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime applyDeadline;
    private String applyUrl;
    private String description;
    private Boolean active;
}
