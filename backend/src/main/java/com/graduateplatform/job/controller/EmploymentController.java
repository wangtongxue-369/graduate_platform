package com.graduateplatform.job.controller;

import com.graduateplatform.common.dto.ApiResponse;
import com.graduateplatform.job.dto.*;
import com.graduateplatform.job.service.EmploymentService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/job")
public class EmploymentController {
    private final EmploymentService employmentService;

    public EmploymentController(EmploymentService employmentService) {
        this.employmentService = employmentService;
    }

    @GetMapping("/fairs")
    public ApiResponse<?> fairs(@RequestParam(required = false) String city,
                                @RequestParam(required = false) String industry,
                                @RequestParam(required = false) String keyword,
                                @RequestParam(required = false) Integer page,
                                @RequestParam(required = false) Integer size,
                                @RequestParam(defaultValue = "false") boolean includeExpired) {
        if (page != null || size != null) {
            return ApiResponse.ok(employmentService.listFairsPage(city, industry, keyword, includeExpired, page, size));
        }
        return ApiResponse.ok(employmentService.listFairs(city, industry, keyword));
    }

    @GetMapping("/fairs/{id}")
    public ApiResponse<?> fairDetail(@PathVariable Long id) {
        return ApiResponse.ok(employmentService.fairDetail(id));
    }

    @GetMapping("/postings")
    public ApiResponse<?> postings(@RequestParam(required = false) String city,
                                   @RequestParam(required = false) String industry,
                                   @RequestParam(required = false) String roleType,
                                   @RequestParam(required = false) String keyword) {
        return ApiResponse.ok(employmentService.listPostings(city, industry, roleType, keyword));
    }

    @GetMapping("/postings/{id}")
    public ApiResponse<?> postingDetail(@PathVariable Long id) {
        return ApiResponse.ok(employmentService.postingDetail(id));
    }

    @GetMapping("/preferences")
    public ApiResponse<?> preference(Authentication auth) {
        return ApiResponse.ok(employmentService.getPreference(currentUserId(auth)));
    }

    @PutMapping("/preferences")
    public ApiResponse<?> savePreference(@RequestBody JobSubscriptionPreferenceRequest req, Authentication auth) {
        return ApiResponse.ok(employmentService.savePreference(currentUserId(auth), req), "Preferences saved");
    }

    @GetMapping("/resume")
    public ApiResponse<?> resume(Authentication auth) {
        return ApiResponse.ok(employmentService.getResume(currentUserId(auth)));
    }

    @PutMapping("/resume")
    public ApiResponse<?> upsertResume(@RequestBody ResumeProfileRequest req, Authentication auth) {
        return ApiResponse.ok(employmentService.upsertResume(currentUserId(auth), req), "Resume saved");
    }

    @GetMapping("/recommendations")
    public ApiResponse<?> recommendations(@RequestParam(required = false) String city,
                                          @RequestParam(required = false) String industry,
                                          @RequestParam(required = false) String roleType,
                                          Authentication auth) {
        return ApiResponse.ok(employmentService.recommendations(currentUserId(auth), city, industry, roleType));
    }

    @GetMapping("/applications")
    public ApiResponse<?> applications(Authentication auth) {
        return ApiResponse.ok(employmentService.listApplications(currentUserId(auth)));
    }

    @PostMapping("/applications")
    public ApiResponse<?> createApplication(@Valid @RequestBody ApplicationRecordRequest req, Authentication auth) {
        return ApiResponse.ok(employmentService.createApplication(currentUserId(auth), req), "Application created");
    }

    @PutMapping("/applications/{id}")
    public ApiResponse<?> updateApplication(@PathVariable Long id,
                                            @Valid @RequestBody ApplicationRecordRequest req,
                                            Authentication auth) {
        return ApiResponse.ok(employmentService.updateApplication(currentUserId(auth), id, req), "Application updated");
    }

    @DeleteMapping("/applications/{id}")
    public ApiResponse<?> deleteApplication(@PathVariable Long id, Authentication auth) {
        return ApiResponse.ok(employmentService.deleteApplication(currentUserId(auth), id), "Application deleted");
    }

    @GetMapping("/notifications")
    public ApiResponse<?> notifications(Authentication auth) {
        return ApiResponse.ok(employmentService.listNotifications(currentUserId(auth)));
    }

    @PutMapping("/notifications/{id}/read")
    public ApiResponse<?> markNotificationRead(@PathVariable Long id, Authentication auth) {
        return ApiResponse.ok(employmentService.markNotificationRead(currentUserId(auth), id), "Notification marked read");
    }

    private Long currentUserId(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof Long userId)) {
            return null;
        }
        return userId;
    }
}
