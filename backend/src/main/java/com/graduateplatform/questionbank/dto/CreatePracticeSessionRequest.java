package com.graduateplatform.questionbank.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreatePracticeSessionRequest {
    /** 题库ID，错题重练模式下可不传 */
    private Long bankId;

    @NotBlank(message = "练习模式不能为空")
    private String mode;

    private String chapter;

    private String questionType;

    private String difficulty;

    private Integer year;

    private Integer limit;

    /**
     * 错题重练模式下，指定错题ID列表。
     * 非空时忽略 chapter/questionType/difficulty/year 筛选条件。
     */
    private List<Long> wrongQuestionIds;
}
