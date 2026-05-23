package com.graduateplatform.questionbank.dto;

import com.graduateplatform.questionbank.entity.QuestionSnapshot;

public record SnapshotResponse(
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
    Integer versionNo,
    String createdAt
) {
    public static SnapshotResponse from(QuestionSnapshot s) {
        return new SnapshotResponse(
            s.getId(), s.getStem(), s.getOptionsJson(), s.getAnswer(),
            s.getAnalysis(), s.getChapter(), s.getQuestionType(),
            s.getKnowledgePoint(), s.getDifficulty(), s.getYear(),
            s.getVersionNo(),
            s.getCreatedAt() != null ? s.getCreatedAt().toString() : null
        );
    }
}
