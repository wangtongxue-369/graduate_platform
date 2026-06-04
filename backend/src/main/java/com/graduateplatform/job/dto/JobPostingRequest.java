package com.graduateplatform.job.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JobPostingRequest {
    @NotBlank(message = "岗位名称不能为空")
    private String title;
    @NotBlank(message = "公司名称不能为空")
    private String companyName;
    private String city;
    private String industry;
    private String companyType;
    private String roleType;
    private String salaryRange;
    private String educationRequirement;
    private String majorKeywords;
    private String skillTags;
    private String description;
    private String applyUrl;
    private Boolean active;
}
