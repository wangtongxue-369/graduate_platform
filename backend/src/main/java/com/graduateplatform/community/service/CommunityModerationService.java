package com.graduateplatform.community.service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CommunityModerationService {

    public static final int POST_REPORT_ESCALATION_THRESHOLD = 3;
    public static final int COMMENT_REPORT_ESCALATION_THRESHOLD = 3;

    private static final List<String> SENSITIVE_WORDS = List.of(
        "违规词",
        "敏感词",
        "广告引流",
        "诈骗",
        "刷单",
        "代考"
    );

    public Optional<String> findSensitiveWord(String... values) {
        if (values == null) {
            return Optional.empty();
        }
        for (String value : values) {
            if (value == null || value.isBlank()) {
                continue;
            }
            for (String word : SENSITIVE_WORDS) {
                if (value.contains(word)) {
                    return Optional.of(word);
                }
            }
        }
        return Optional.empty();
    }

    public String sensitiveReason(String word) {
        return "命中敏感词: " + word;
    }
}
