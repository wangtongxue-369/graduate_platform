package com.graduateplatform.questionbank.dto;

import com.graduateplatform.questionbank.entity.QuestionBank;

import java.util.List;

public record BankResponse(
    Long id,
    String name,
    String target,
    String subject,
    String difficulty,
    String description,
    Long questionCount,
    Long chapterCount,
    List<String> supportedModes
) {
    public static BankResponse from(QuestionBank bank) {
        return new BankResponse(bank.getId(), bank.getName(), bank.getTarget(),
            bank.getSubject(), bank.getDifficulty(), bank.getDescription(),
            null, null, null);
    }

    public static BankResponse withQuestionCount(QuestionBank bank, Long questionCount) {
        return new BankResponse(bank.getId(), bank.getName(), bank.getTarget(),
            bank.getSubject(), bank.getDifficulty(), bank.getDescription(),
            questionCount, null, null);
    }

    public static BankResponse withDetails(QuestionBank bank, Long questionCount,
                                           Long chapterCount, List<String> supportedModes) {
        return new BankResponse(bank.getId(), bank.getName(), bank.getTarget(),
            bank.getSubject(), bank.getDifficulty(), bank.getDescription(),
            questionCount, chapterCount, supportedModes);
    }
}
