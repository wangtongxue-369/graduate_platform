package com.graduateplatform.questionbank.service;

import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.questionbank.dto.BankResponse;
import com.graduateplatform.questionbank.dto.PagedResult;
import com.graduateplatform.questionbank.entity.QuestionBank;
import com.graduateplatform.questionbank.repository.QuestionBankRepository;
import com.graduateplatform.questionbank.repository.QuestionRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.LinkedHashMap;

@Service
public class QuestionBankService {

    private final QuestionBankRepository repository;
    private final QuestionRepository questionRepository;

    public QuestionBankService(QuestionBankRepository repository, QuestionRepository questionRepository) {
        this.repository = repository;
        this.questionRepository = questionRepository;
    }

    // ==================== 公共接口 ====================

    @Transactional(readOnly = true)
    public List<BankResponse> getBanks(String target, String subject, String chapter,
                                        String questionType, String difficulty, Integer year) {
        List<QuestionBank> banks;
        String normalizedTarget = normalize(target);
        if (normalizedTarget != null) {
            banks = repository.findActiveBanksByTarget(normalizedTarget);
        } else {
            banks = repository.findActiveBanks();
        }
        String normalizedSubject = normalize(subject);
        String normalizedDifficulty = normalize(difficulty);
        String normalizedChapter = normalize(chapter);
        String normalizedQuestionType = normalize(questionType);
        return banks.stream()
            .filter(bank -> normalizedSubject == null || normalizedSubject.equals(bank.getSubject()))
            .filter(bank -> normalizedDifficulty == null || normalizedDifficulty.equals(bank.getDifficulty()))
            .map(bank -> {
                var questions = questionRepository.findPracticeCandidates(
                    bank.getId(), normalizedChapter, normalizedQuestionType, normalizedDifficulty, year
                );
                long count = questions.size();
                long chapterCount = questions.stream().map(q -> q.getChapter()).filter(Objects::nonNull).distinct().count();
                return BankResponse.withDetails(bank, count, chapterCount, List.of("chapter", "random", "mock"));
            })
            .filter(bank -> bank.questionCount() > 0)
            .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "questionBank:options", sync = true)
    public Map<String, Object> getOptions() {
        Map<String, Object> options = new LinkedHashMap<>();
        options.put("targets", repository.findDistinctTargets());
        options.put("subjects", repository.findDistinctSubjects());
        options.put("chapters", questionRepository.findDistinctChapters());
        options.put("questionTypes", questionRepository.findDistinctQuestionTypes());
        options.put("difficulties", repository.findDistinctDifficulties());
        options.put("years", questionRepository.findDistinctYears());
        return options;
    }

    // ==================== 管理端接口 ====================

    @Transactional(readOnly = true)
    public PagedResult<BankResponse> getBanksPaged(int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        // 软删除（active=false）的题库不再回到管理员治理列表，否则"删除"按钮看起来无效。
        // NULL 视为启用，兼容 active 列引入前的历史数据。
        Page<QuestionBank> bankPage = repository.findActiveBanksPaged(pageable);

        List<BankResponse> content = bankPage.getContent().stream().map(bank -> {
            long questionCount = bank.getQuestions().stream()
                .filter(q -> Boolean.TRUE.equals(q.getActive())).count();
            return BankResponse.withQuestionCount(bank, questionCount);
        }).toList();

        return new PagedResult<>(content, bankPage.getTotalPages(), bankPage.getTotalElements());
    }

    @Transactional
    @CacheEvict(value = "questionBank:options", allEntries = true)
    public BankResponse createBank(String name, String target, String subject,
                                    String difficulty, String description) {
        if (name == null || name.isBlank()) {
            throw new BusinessException("题库名称不能为空");
        }

        QuestionBank bank = QuestionBank.builder()
            .name(name.trim())
            .target(nullable(target))
            .subject(nullable(subject))
            .difficulty(nullable(difficulty))
            .description(nullable(description))
            .status("active")
            .active(true)
            .build();

        bank = repository.save(bank);
        return BankResponse.from(bank);
    }

    @Transactional
    @CacheEvict(value = "questionBank:options", allEntries = true)
    public BankResponse updateBank(Long id, String name, String target, String subject,
                                    String difficulty, String description) {
        QuestionBank bank = repository.findById(id)
            .orElseThrow(() -> new BusinessException("题库不存在"));

        if (name != null) {
            if (name.isBlank()) throw new BusinessException("题库名称不能为空");
            bank.setName(name.trim());
        }
        if (target != null) bank.setTarget(nullable(target));
        if (subject != null) bank.setSubject(nullable(subject));
        if (difficulty != null) bank.setDifficulty(nullable(difficulty));
        if (description != null) bank.setDescription(nullable(description));

        repository.save(bank);
        return BankResponse.from(bank);
    }

    @Transactional
    @CacheEvict(value = "questionBank:options", allEntries = true)
    public void deleteBank(Long id) {
        QuestionBank bank = repository.findById(id)
            .orElseThrow(() -> new BusinessException("题库不存在"));

        // 逻辑删除：仅停用题库本身，保留题目自身 active 标志不变。
        // 练习候选/错题本查询会按 bank.active=true 过滤，此时题库内题目自动不可见；
        // 后续启用题库后，题目无须重新逐个发布即可恢复练习。
        bank.setActive(false);
        bank.setStatus("inactive");
        repository.save(bank);
    }

    @Transactional
    @CacheEvict(value = "questionBank:options", allEntries = true)
    public BankResponse toggleBankStatus(Long id, String status) {
        QuestionBank bank = repository.findById(id)
            .orElseThrow(() -> new BusinessException("题库不存在"));

        // 仅翻转题库自身 status；active 由 deleteBank 维护。
        // 解耦后"停用→启用"不会把已软删的题库误复活，
        // 与题目 toggleQuestionStatus 口径一致。
        bank.setStatus(status);
        repository.save(bank);
        return BankResponse.from(bank);
    }

    // ==================== 辅助 ====================

    private String nullable(Object value) {
        if (value == null || (value instanceof String s && s.isBlank())) {
            return null;
        }
        return value.toString().trim();
    }

    private String normalize(String value) {
        if (value == null || value.isBlank() || "all".equals(value)) {
            return null;
        }
        return value.trim();
    }
}
