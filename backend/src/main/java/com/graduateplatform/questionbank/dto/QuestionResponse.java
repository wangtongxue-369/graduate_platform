package com.graduateplatform.questionbank.dto;

import com.graduateplatform.questionbank.entity.Question;

public record QuestionResponse(
    Long id,
    String stem,
    String optionsJson,
    String answer,
    String analysis,
    String chapter,
    String questionType,
    String knowledgePoint,
    String difficulty,
    Integer year,
    String status,
    Boolean active,
    Integer versionNo,
    Long bankId
) {
    public static QuestionResponse from(Question q) {
        return new QuestionResponse(
            q.getId(), q.getStem(), q.getOptionsJson(), q.getAnswer(),
            q.getAnalysis(), q.getChapter(), q.getQuestionType(),
            q.getKnowledgePoint(), q.getDifficulty(), q.getYear(),
            q.getStatus(), q.getActive(), q.getVersionNo(),
            q.getBank() != null ? q.getBank().getId() : null
        );
    }
}
