package com.graduateplatform.admin.controller;

import com.graduateplatform.admin.dto.ReviewReportRequest;
import com.graduateplatform.admin.service.AdminService;
import com.graduateplatform.common.dto.ApiResponse;
import com.graduateplatform.community.dto.CategoryRequest;
import com.graduateplatform.community.service.CommentService;
import com.graduateplatform.community.service.CategoryService;
import com.graduateplatform.kaogong.service.KaoGongService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final KaoGongService kaoGongService;
    private final CommentService commentService;
    private final CategoryService categoryService;

    public AdminController(AdminService adminService,
                           KaoGongService kaoGongService,
                           CommentService commentService,
                           CategoryService categoryService) {
        this.adminService = adminService;
        this.kaoGongService = kaoGongService;
        this.commentService = commentService;
        this.categoryService = categoryService;
    }

    @GetMapping("/dashboard")
    public ApiResponse<?> dashboard() {
        return ApiResponse.ok(adminService.getDashboard());
    }

    @GetMapping("/posts/pending")
    public ApiResponse<?> pendingPosts(@RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(adminService.getPendingPosts(page, size));
    }

    @GetMapping("/posts")
    public ApiResponse<?> reviewList(@RequestParam(required = false) String status,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(adminService.getReviewList(status, page, size));
    }

    @PutMapping("/posts/{id}/review")
    public ApiResponse<?> reviewPost(@PathVariable Long id,
                                     @RequestBody Map<String, String> body,
                                     Authentication auth) {
        Long adminId = (Long) auth.getPrincipal();
        return ApiResponse.ok(
            adminService.reviewPost(id, adminId, body.get("action"), body.getOrDefault("reason", "")),
            "鎿嶄綔鎴愬姛"
        );
    }

    @GetMapping("/reports")
    public ApiResponse<?> reports(@RequestParam(required = false) String status,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(adminService.getReports(status, page, size));
    }

    @PutMapping("/reports/{id}/review")
    public ApiResponse<?> reviewReport(@PathVariable Long id,
                                       @Valid @RequestBody ReviewReportRequest req,
                                       Authentication auth) {
        Long adminId = (Long) auth.getPrincipal();
        return ApiResponse.ok(
            adminService.reviewReport(id, adminId, req.getAction(), req.getNote()),
            "涓炬姤澶勭悊瀹屾垚"
        );
    }

    @GetMapping("/comment-reports")
    public ApiResponse<?> commentReports(@RequestParam(required = false) String status,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(commentService.getCommentReports(status, page, size));
    }

    @PutMapping("/comment-reports/{id}/review")
    public ApiResponse<?> reviewCommentReport(@PathVariable Long id,
                                              @Valid @RequestBody ReviewReportRequest req,
                                              Authentication auth) {
        Long adminId = (Long) auth.getPrincipal();
        return ApiResponse.ok(
            commentService.reviewCommentReport(id, adminId, req.getAction(), req.getNote()),
            "Comment report reviewed"
        );
    }

    @GetMapping("/post-categories")
    public ApiResponse<?> postCategories() {
        return ApiResponse.ok(categoryService.getAdminAll());
    }

    @PostMapping("/post-categories")
    public ApiResponse<?> createPostCategory(@RequestBody CategoryRequest req) {
        return ApiResponse.ok(categoryService.create(req), "Category created");
    }

    @PutMapping("/post-categories/{id}")
    public ApiResponse<?> updatePostCategory(@PathVariable Long id, @RequestBody CategoryRequest req) {
        return ApiResponse.ok(categoryService.update(id, req), "Category updated");
    }

    @PutMapping("/post-categories/{id}/status")
    public ApiResponse<?> updatePostCategoryStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        boolean active = Boolean.parseBoolean(String.valueOf(body.getOrDefault("active", true)));
        return ApiResponse.ok(categoryService.updateActive(id, active), "Category status updated");
    }

    @PostMapping("/post-categories/{id}/merge")
    public ApiResponse<?> mergePostCategory(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Object rawTargetId = body.get("targetId");
        Long targetId = rawTargetId instanceof Number number
            ? number.longValue()
            : Long.parseLong(String.valueOf(rawTargetId));
        return ApiResponse.ok(categoryService.merge(id, targetId), "Category merged");
    }

    @GetMapping("/users")
    public ApiResponse<?> users(@RequestParam(required = false) String target,
                                @RequestParam(required = false) String status,
                                @RequestParam(defaultValue = "0") int page,
                                @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(adminService.getUsers(target, status, page, size));
    }

    @PutMapping("/users/{id}/status")
    public ApiResponse<?> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ApiResponse.ok(
            adminService.updateUserStatus(id, body.get("status"), body.getOrDefault("reason", "")),
            "鐢ㄦ埛鐘舵€佸凡鏇存柊"
        );
    }

    @GetMapping("/kaogong/jobs")
    public ApiResponse<?> kaogongJobs(@RequestParam Map<String, String> filters) {
        return ApiResponse.ok(kaoGongService.adminJobs(filters));
    }

    @PostMapping("/kaogong/jobs")
    public ApiResponse<?> createKaogongJob(@RequestBody Map<String, Object> body) {
        return ApiResponse.ok(kaoGongService.createJob(body), "淇濆瓨鎴愬姛");
    }

    @PutMapping("/kaogong/jobs/{id}")
    public ApiResponse<?> updateKaogongJob(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(kaoGongService.updateJob(id, body), "淇濆瓨鎴愬姛");
    }

    @DeleteMapping("/kaogong/jobs/{id}")
    public ApiResponse<?> deleteKaogongJob(@PathVariable Long id) {
        return ApiResponse.ok(kaoGongService.deactivateJob(id), "鍒犻櫎鎴愬姛");
    }

    @GetMapping("/kaogong/score-lines")
    public ApiResponse<?> kaogongScoreLines(@RequestParam Map<String, String> filters) {
        return ApiResponse.ok(kaoGongService.adminScoreLines(filters));
    }

    @PostMapping("/kaogong/score-lines")
    public ApiResponse<?> createKaogongScoreLine(@RequestBody Map<String, Object> body) {
        return ApiResponse.ok(kaoGongService.createScoreLine(body), "淇濆瓨鎴愬姛");
    }

    @PutMapping("/kaogong/score-lines/{id}")
    public ApiResponse<?> updateKaogongScoreLine(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(kaoGongService.updateScoreLine(id, body), "淇濆瓨鎴愬姛");
    }

    @DeleteMapping("/kaogong/score-lines/{id}")
    public ApiResponse<?> deleteKaogongScoreLine(@PathVariable Long id) {
        return ApiResponse.ok(kaoGongService.deactivateScoreLine(id), "鍒犻櫎鎴愬姛");
    }

    @GetMapping("/kaogong/calendar-events")
    public ApiResponse<?> kaogongCalendarEvents(@RequestParam Map<String, String> filters) {
        return ApiResponse.ok(kaoGongService.adminCalendarEvents(filters));
    }

    @PostMapping("/kaogong/calendar-events")
    public ApiResponse<?> createKaogongCalendarEvent(@RequestBody Map<String, Object> body) {
        return ApiResponse.ok(kaoGongService.createCalendarEvent(body), "淇濆瓨鎴愬姛");
    }

    @PutMapping("/kaogong/calendar-events/{id}")
    public ApiResponse<?> updateKaogongCalendarEvent(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(kaoGongService.updateCalendarEvent(id, body), "淇濆瓨鎴愬姛");
    }

    @DeleteMapping("/kaogong/calendar-events/{id}")
    public ApiResponse<?> deleteKaogongCalendarEvent(@PathVariable Long id) {
        return ApiResponse.ok(kaoGongService.deactivateCalendarEvent(id), "鍒犻櫎鎴愬姛");
    }
}

