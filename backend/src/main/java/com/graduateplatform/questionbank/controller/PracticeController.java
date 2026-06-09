package com.graduateplatform.questionbank.controller;

import com.graduateplatform.common.dto.ApiResponse;
import com.graduateplatform.common.exception.UnauthorizedException;
import com.graduateplatform.questionbank.dto.CreatePracticeSessionRequest;
import com.graduateplatform.questionbank.dto.SavePracticeAnswerRequest;
import com.graduateplatform.questionbank.service.PracticeService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/practice")
public class PracticeController {

    private final PracticeService practiceService;

    public PracticeController(PracticeService practiceService) {
        this.practiceService = practiceService;
    }

    @PostMapping("/sessions")
    public ApiResponse<?> createSession(@Valid @RequestBody CreatePracticeSessionRequest req, Authentication auth) {
        return ApiResponse.ok(practiceService.createSession(currentUserId(auth), req), "练习已开始");
    }

    @GetMapping("/sessions/{id}")
    public ApiResponse<?> getSession(@PathVariable Long id, Authentication auth) {
        return ApiResponse.ok(practiceService.getSession(currentUserId(auth), id));
    }

    @PutMapping("/sessions/{id}/answers/{questionId}")
    public ApiResponse<?> saveAnswer(@PathVariable Long id,
                                     @PathVariable Long questionId,
                                     @Valid @RequestBody SavePracticeAnswerRequest req,
                                     Authentication auth) {
        return ApiResponse.ok(practiceService.saveAnswer(currentUserId(auth), id, questionId, req), "答案已暂存");
    }

    @PostMapping("/sessions/{id}/submit")
    public ApiResponse<?> submit(@PathVariable Long id, Authentication auth) {
        return ApiResponse.ok(practiceService.submitSession(currentUserId(auth), id), "交卷完成");
    }

    @GetMapping("/wrong-questions")
    public ApiResponse<?> wrongQuestions(@RequestParam(required = false) String target,
                                         @RequestParam(required = false) String subject,
                                         @RequestParam(required = false) String chapter,
                                         @RequestParam(required = false) Integer minWrongCount,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "20") int size,
                                         Authentication auth) {
        return ApiResponse.ok(practiceService.getWrongQuestions(
            currentUserId(auth), target, subject, chapter, minWrongCount, page, size
        ));
    }

    @PostMapping("/wrong-questions/rebuild-session")
    public ApiResponse<?> rebuildWrongSession(@RequestBody java.util.Map<String, java.util.List<Long>> body,
                                               Authentication auth) {
        java.util.List<Long> ids = body.get("wrongQuestionIds");
        if (ids == null || ids.isEmpty()) {
            return ApiResponse.fail("错题ID列表不能为空");
        }
        CreatePracticeSessionRequest req = new CreatePracticeSessionRequest();
        req.setMode("wrong_retry");
        req.setWrongQuestionIds(ids);
        return ApiResponse.ok(practiceService.createSession(currentUserId(auth), req), "错题重练会话已创建");
    }

    @GetMapping("/statistics")
    public ApiResponse<?> statistics(@RequestParam(defaultValue = "day") String granularity, Authentication auth) {
        return ApiResponse.ok(practiceService.getStatistics(currentUserId(auth), granularity));
    }

    @GetMapping("/history")
    public ApiResponse<?> history(@RequestParam(required = false) String mode,
                                   @RequestParam(required = false) String target,
                                   @RequestParam(required = false) String subject,
                                   @RequestParam(required = false) String dateFrom,
                                   @RequestParam(required = false) String dateTo,
                                   @RequestParam(defaultValue = "1") int page,
                                   @RequestParam(defaultValue = "20") int size,
                                   Authentication auth) {
        LocalDateTime from = dateFrom != null ? LocalDateTime.parse(dateFrom + "T00:00:00") : null;
        LocalDateTime to = dateTo != null ? LocalDateTime.parse(dateTo + "T23:59:59") : null;
        return ApiResponse.ok(practiceService.getHistory(
            currentUserId(auth), mode, target, subject, from, to, page, size
        ));
    }

    private Long currentUserId(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Long userId)) {
            throw new UnauthorizedException("请先登录");
        }
        return userId;
    }
}
