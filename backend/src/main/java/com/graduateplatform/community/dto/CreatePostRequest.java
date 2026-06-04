package com.graduateplatform.community.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class CreatePostRequest {
    @Size(max = 60)
    private String title;

    @NotBlank
    private String categoryCode;

    private java.util.List<String> tags;

    private String visibility = "public"; // public / members

    private Boolean anonymous = false;

    private Boolean hasAttachment = false;

    private String attachmentNote;

    private String status = "PENDING"; // DRAFT / PENDING

    private String content;

    private MultipartFile markdownFile;

    private java.util.List<MultipartFile> attachments;
}
