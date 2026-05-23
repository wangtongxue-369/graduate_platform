package com.graduateplatform.questionbank.dto;

import java.util.List;

public record PagedResult<T>(
    List<T> content,
    int totalPages,
    long totalElements
) {}
