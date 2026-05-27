package com.graduateplatform.job.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class NotificationTriggerRequest {
    @NotBlank(message = "关联类型不能为空")
    private String relatedType;
    @NotNull(message = "关联 ID 不能为空")
    private Long relatedId;
}
