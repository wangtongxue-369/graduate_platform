package com.graduateplatform.community.dto;

import lombok.Data;

@Data
public class CategoryRequest {
    private String code;
    private String name;
    private String description;
    private Integer sortOrder;
    private Boolean active;
}
