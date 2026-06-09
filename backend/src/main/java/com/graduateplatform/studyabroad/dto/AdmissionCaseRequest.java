package com.graduateplatform.studyabroad.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdmissionCaseRequest {
    @NotBlank
    @Size(max = 20)
    private String applicationYear;

    @NotBlank
    @Size(max = 60)
    private String studentMajor;

    @NotBlank
    @Size(max = 40)
    private String gpa;

    @Size(max = 40)
    private String rankPercent;

    @NotBlank
    @Size(max = 40)
    private String languageType;

    @NotBlank
    @Size(max = 40)
    private String languageScore;

    @Size(max = 80)
    private String standardizedScore;

    @Size(max = 500)
    private String softBackground;

    @NotBlank
    @Size(max = 40)
    private String country;

    @NotBlank
    @Size(max = 120)
    private String school;

    @NotBlank
    @Size(max = 120)
    private String program;

    @NotBlank
    @Size(max = 40)
    private String degree;

    @NotBlank
    @Size(max = 30)
    private String admissionResult;

    @Size(max = 120)
    private String scholarship;

    @Size(max = 40)
    private String applicationMode;

    @Size(max = 255)
    private String tags;

    @NotBlank
    @Size(max = 500)
    private String summary;
}
