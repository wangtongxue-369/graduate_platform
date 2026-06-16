package com.graduateplatform.job.dto;

import lombok.Data;

@Data
public class ResumeProfileRequest {
    private String templateType;
    private String targetRole;
    private String expectedCities;
    private String expectedIndustries;
    private String expectedSalary;
    private String educationLevel;
    private String highestEducation;
    private String major;
    private String phone;
    private String email;
    private String skillTags;
    private String projectKeywords;
    private String internshipKeywords;
    private String certificates;
    private String portfolioUrl;
    private String baseInfo;
    private String education;
    private String projects;
    private String internships;
    private String skills;
    private String selfEvaluation;
}
