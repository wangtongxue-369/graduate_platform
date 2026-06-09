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
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.io.Reader;
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
        // 1. 校验文件
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

        // 2. 读取原始字节（解析与审计上传都要用，避免 InputStream 一次性消费）
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (Exception e) {
            throw new BusinessException("读取上传文件失败: " + e.getMessage());
        }

        // 3. 先解析、入库——这是用户期望的核心结果。失败必须立即回滚，
        //    且不留 COS 孤儿对象（旧实现先传 COS 再解析，解析失败时 COS 文件无法清理）。
        List<Map<String, Object>> parsed;
        try {
            parsed = ".json".equals(ext) ? parseJsonBytes(bytes) : parseCsvBytes(bytes);
        } catch (Exception e) {
            throw new BusinessException("文件解析失败: " + e.getMessage());
        }
        if (parsed.isEmpty()) {
            throw new BusinessException("文件中没有有效数据");
        }
        Map<String, Object> result = questionService.batchCreateQuestions(bankId, parsed);

        // 4. 审计性上传 COS：失败仅记录日志，不影响主流程。
        //    业务结果已落库，没必要让 COS 故障导致整个导入失败。
        try {
            String cosKey = "questionbank/imports/" + UUID.randomUUID() + ext;
            cosService.uploadFile(new ByteArrayInputStream(bytes), bytes.length, cosKey, file.getContentType());
            result.put("cosKey", cosKey);
        } catch (Exception e) {
            log.warn("Audit upload to COS failed (import already succeeded)", e);
        }

        return result;
    }

    private List<Map<String, Object>> parseJsonBytes(byte[] bytes) throws Exception {
        List<Map<String, Object>> raw = objectMapper.readValue(bytes, new TypeReference<>() {});
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

    /**
     * 用 commons-csv 解析：天然支持多行字段（题干/选项含换行）和 "" 双引号转义；
     * 旧实现按 readLine() + 手写状态机切分，遇上述真实数据会切碎或字段错位。
     */
    private List<Map<String, Object>> parseCsvBytes(byte[] bytes) throws Exception {
        List<Map<String, Object>> result = new ArrayList<>();
        // 注意：CSVFormat.DEFAULT 已处理 RFC 4180；setHeader/setSkipHeaderRecord 让我们能按列名取值。
        CSVFormat format = CSVFormat.DEFAULT.builder()
            .setHeader()
            .setSkipHeaderRecord(true)
            .setIgnoreEmptyLines(true)
            .setTrim(true)
            .build();
        try (Reader reader = new InputStreamReader(new ByteArrayInputStream(bytes), StandardCharsets.UTF_8);
             CSVParser parser = format.parse(reader)) {
            for (CSVRecord row : parser) {
                Map<String, Object> mapped = new HashMap<>();
                mapped.put("stem", csvField(row, "stem", "题干"));
                mapped.put("optionsJson", csvField(row, "optionsJson", "选项"));
                mapped.put("answer", csvField(row, "answer", "答案"));
                mapped.put("analysis", csvField(row, "analysis", "解析"));
                mapped.put("chapter", csvField(row, "chapter", "章节"));
                mapped.put("questionType", csvField(row, "questionType", "题型"));
                mapped.put("knowledgePoint", csvField(row, "knowledgePoint", "知识点"));
                mapped.put("difficulty", csvField(row, "difficulty", "难度"));
                mapped.put("status", csvField(row, "status", "状态"));
                String yearVal = csvField(row, "year", "年份");
                if (yearVal != null && !yearVal.isBlank()) {
                    try { mapped.put("year", Integer.parseInt(yearVal.trim())); } catch (NumberFormatException ignored) {}
                }
                result.add(mapped);
            }
        }
        return result;
    }

    /** 从 CSV 行按主键名/中文别名取值；列不存在或为空返回 null。 */
    private String csvField(CSVRecord row, String key, String aliasKey) {
        if (row.isMapped(key)) {
            String v = row.get(key);
            if (v != null && !v.isEmpty()) return v;
        }
        if (row.isMapped(aliasKey)) {
            String v = row.get(aliasKey);
            if (v != null && !v.isEmpty()) return v;
        }
        return null;
    }

    // ==================== 辅助 ====================

    private String str(Object value) {
        if (value == null) return null;
        return value.toString();
    }
}
