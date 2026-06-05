package com.graduateplatform.admin.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.common.service.CosService;
import com.graduateplatform.questionbank.dto.BankResponse;
import com.graduateplatform.questionbank.dto.PagedResult;
import com.graduateplatform.questionbank.dto.QuestionResponse;
import com.graduateplatform.questionbank.dto.SnapshotResponse;
import com.graduateplatform.questionbank.service.QuestionBankService;
import com.graduateplatform.questionbank.service.QuestionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class AdminQuestionBankService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final List<String> ALLOWED_EXTENSIONS = List.of(".csv", ".json");

    private final QuestionBankService questionBankService;
    private final QuestionService questionService;
    private final CosService cosService;
    private final ObjectMapper objectMapper;

    public AdminQuestionBankService(QuestionBankService questionBankService,
                                    QuestionService questionService,
                                    CosService cosService,
                                    ObjectMapper objectMapper) {
        this.questionBankService = questionBankService;
        this.questionService = questionService;
        this.cosService = cosService;
        this.objectMapper = objectMapper;
    }

    // ==================== 题库管理 ====================

    @Transactional(readOnly = true)
    public PagedResult<BankResponse> getBanks(int page, int size) {
        return questionBankService.getBanksPaged(page, size);
    }

    @Transactional
    public BankResponse createBank(Map<String, Object> body) {
        return questionBankService.createBank(
            str(body.get("name")),
            str(body.get("target")),
            str(body.get("subject")),
            str(body.get("difficulty")),
            str(body.get("description"))
        );
    }

    @Transactional
    public BankResponse updateBank(Long id, Map<String, Object> body) {
        return questionBankService.updateBank(
            id,
            str(body.get("name")),      // null = not provided, "" triggers validation
            str(body.get("target")),
            str(body.get("subject")),
            str(body.get("difficulty")),
            str(body.get("description"))
        );
    }

    @Transactional
    public void deleteBank(Long id) {
        questionBankService.deleteBank(id);
    }

    @Transactional
    public BankResponse toggleBankStatus(Long id, String status) {
        return questionBankService.toggleBankStatus(id, status);
    }

    // ==================== 题目管理 ====================

    @Transactional(readOnly = true)
    public PagedResult<QuestionResponse> getQuestions(Long bankId, int page, int size) {
        return questionService.getQuestionsPaged(bankId, page, size);
    }

    @Transactional
    public QuestionResponse createQuestion(Long bankId, Map<String, Object> body) {
        return questionService.createQuestion(bankId, body);
    }

    @Transactional
    public QuestionResponse updateQuestion(Long id, Map<String, Object> body) {
        return questionService.updateQuestion(id, body);
    }

    @Transactional
    public void deleteQuestion(Long id) {
        questionService.deleteQuestion(id);
    }

    @Transactional
    public QuestionResponse toggleQuestionStatus(Long id, String status) {
        return questionService.toggleQuestionStatus(id, status);
    }

    // ==================== 批量操作 ====================

    @Transactional
    public Map<String, Object> batchUpdateQuestions(List<Long> ids, Map<String, Object> updates) {
        return questionService.batchUpdateQuestions(ids, updates);
    }

    // ==================== 批量导入 ====================

    @Transactional
    public Map<String, Object> batchCreateQuestions(Long bankId, List<Map<String, Object>> questions) {
        return questionService.batchCreateQuestions(bankId, questions);
    }

    // ==================== 版本快照 ====================

    @Transactional(readOnly = true)
    public List<SnapshotResponse> getSnapshots(Long questionId) {
        return questionService.getSnapshots(questionId);
    }

    // ==================== 文件导入 ====================

    @Transactional
    public Map<String, Object> importQuestions(Long bankId, MultipartFile file) {
        // 校验文件
        if (file == null || file.isEmpty()) {
            throw new BusinessException("上传文件不能为空");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException("文件大小不能超过5MB");
        }
        String originalName = file.getOriginalFilename();
        String ext = originalName != null && originalName.contains(".")
            ? originalName.substring(originalName.lastIndexOf(".")).toLowerCase() : "";
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new BusinessException("仅支持 .csv 和 .json 格式文件");
        }

        // 上传到 COS
        String cosKey = "questionbank/imports/" + UUID.randomUUID() + ext;
        try {
            cosService.uploadFile(file.getInputStream(), file.getSize(), cosKey, file.getContentType());
        } catch (Exception e) {
            log.error("Failed to upload import file to COS", e);
            throw new BusinessException("文件上传失败: " + e.getMessage());
        }

        // 解析文件
        List<Map<String, Object>> parsed;
        try {
            if (".json".equals(ext)) {
                parsed = parseJsonFile(file);
            } else {
                parsed = parseCsvFile(file);
            }
        } catch (Exception e) {
            throw new BusinessException("文件解析失败: " + e.getMessage());
        }

        if (parsed.isEmpty()) {
            throw new BusinessException("文件中没有有效数据");
        }

        // 调用已有批量创建
        Map<String, Object> result = questionService.batchCreateQuestions(bankId, parsed);
        result.put("cosKey", cosKey);
        return result;
    }

    private List<Map<String, Object>> parseJsonFile(MultipartFile file) throws Exception {
        List<Map<String, Object>> raw = objectMapper.readValue(
            file.getInputStream(), new TypeReference<>() {});
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> item : raw) {
            Map<String, Object> normalized = new HashMap<>();
            normalized.put("stem", item.get("stem") != null ? item.get("stem").toString() : "");
            normalized.put("optionsJson", item.get("optionsJson") != null ? item.get("optionsJson").toString() : "");
            normalized.put("answer", item.get("answer") != null ? item.get("answer").toString() : "");
            if (item.get("analysis") != null) normalized.put("analysis", item.get("analysis").toString());
            if (item.get("chapter") != null) normalized.put("chapter", item.get("chapter").toString());
            if (item.get("questionType") != null) normalized.put("questionType", item.get("questionType").toString());
            if (item.get("knowledgePoint") != null) normalized.put("knowledgePoint", item.get("knowledgePoint").toString());
            if (item.get("difficulty") != null) normalized.put("difficulty", item.get("difficulty").toString());
            if (item.get("year") != null) normalized.put("year", item.get("year"));
            if (item.get("status") != null) normalized.put("status", item.get("status").toString());
            result.add(normalized);
        }
        return result;
    }

    private List<Map<String, Object>> parseCsvFile(MultipartFile file) throws Exception {
        List<Map<String, Object>> result = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) return result;
            String[] headers = parseCsvLine(headerLine);

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                String[] values = parseCsvLine(line);
                Map<String, Object> row = new HashMap<>();
                for (int i = 0; i < headers.length && i < values.length; i++) {
                    row.put(headers[i].trim(), values[i].trim());
                }
                // 映射 CSV 列名到字段名
                Map<String, Object> mapped = new HashMap<>();
                mapped.put("stem", getOrDefault(row, "stem", "题干"));
                mapped.put("optionsJson", getOrDefault(row, "optionsJson", "选项"));
                mapped.put("answer", getOrDefault(row, "answer", "答案"));
                mapped.put("analysis", row.getOrDefault("analysis", row.get("解析")));
                mapped.put("chapter", row.getOrDefault("chapter", row.get("章节")));
                mapped.put("questionType", row.getOrDefault("questionType", row.get("题型")));
                mapped.put("knowledgePoint", row.getOrDefault("knowledgePoint", row.get("知识点")));
                mapped.put("difficulty", row.getOrDefault("difficulty", row.get("难度")));
                Object yearVal = row.getOrDefault("year", row.get("年份"));
                if (yearVal != null && !yearVal.toString().isBlank()) {
                    try { mapped.put("year", Integer.parseInt(yearVal.toString().trim())); } catch (NumberFormatException ignored) {}
                }
                mapped.put("status", row.getOrDefault("status", row.get("状态")));
                result.add(mapped);
            }
        }
        return result;
    }

    private String getOrDefault(Map<String, Object> row, String key1, String key2) {
        Object v = row.get(key1);
        if (v != null) return v.toString();
        v = row.get(key2);
        return v != null ? v.toString() : "";
    }

    private String[] parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                fields.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        fields.add(current.toString());
        return fields.toArray(new String[0]);
    }

    // ==================== 辅助 ====================

    private String str(Object value) {
        if (value == null) return null;
        return value.toString();
    }
}
