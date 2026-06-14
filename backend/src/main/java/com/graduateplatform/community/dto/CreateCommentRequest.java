package com.graduateplatform.community.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateCommentRequest {
    @NotBlank
    @Size(max = 300)
    private String content;

    @Positive(message = "parentId must be greater than 0")
    private Long parentId;

    @Positive(message = "replyToId must be greater than 0")
    private Long replyToId;
}
