package com.graduateplatform.job.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ApplicationRecordRequest {
    private String companyName;
    private String jobTitle;
    private Long jobPostingId;
    private String city;
    private String industry;
    private String companyType;
    private String roleType;
    private String salaryRange;
    private String educationRequirement;
    private String majorKeywords;
    private String skillTags;
    private String applyUrl;
    private String applicationChannel;
    private String resumeFileName;
    private String contactName;
    private String contactInfo;
    private String interviewRound;
    private String interviewMethod;
    private String interviewLocation;
    private String expectedSalary;
    private String offerSalary;
    private String status;
    private LocalDateTime appliedAt;
    private LocalDateTime nextStepAt;
    private LocalDateTime lastFollowUpAt;
    private String failureReason;
    private String notes;
}
