package com.graduateplatform.job.controller;

import com.graduateplatform.common.dto.ApiResponse;
import com.graduateplatform.job.dto.CareerFairRequest;
import com.graduateplatform.job.dto.JobPostingRequest;
import com.graduateplatform.job.dto.NotificationTriggerRequest;
import com.graduateplatform.job.service.EmploymentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/employment")
public class AdminEmploymentController {
    private final EmploymentService employmentService;

    public AdminEmploymentController(EmploymentService employmentService) {
        this.employmentService = employmentService;
    }

    @GetMapping("/fairs")
    public ApiResponse<?> fairs(@RequestParam(required = false) String keyword,
                                @RequestParam(required = false) Boolean active,
                                @RequestParam(required = false) Integer page,
                                @RequestParam(required = false) Integer size) {
        if (keyword != null || active != null || page != null || size != null) {
            return ApiResponse.ok(employmentService.adminFairsPage(keyword, active, page, size));
        }
        return ApiResponse.ok(employmentService.adminFairs());
    }

    @PostMapping("/fairs")
    public ApiResponse<?> createFair(@Valid @RequestBody CareerFairRequest req) {
        return ApiResponse.ok(employmentService.createFair(req), "Fair created");
    }

    @PutMapping("/fairs/{id}")
    public ApiResponse<?> updateFair(@PathVariable Long id, @Valid @RequestBody CareerFairRequest req) {
        return ApiResponse.ok(employmentService.updateFair(id, req), "Fair updated");
    }

    @DeleteMapping("/fairs/{id}")
    public ApiResponse<?> deleteFair(@PathVariable Long id) {
        return ApiResponse.ok(employmentService.deleteFair(id), "Fair deleted");
    }

    @GetMapping("/jobs")
    public ApiResponse<?> jobs(@RequestParam(required = false) String keyword,
                               @RequestParam(required = false) Boolean active,
                               @RequestParam(required = false) Integer page,
                               @RequestParam(required = false) Integer size) {
        if (keyword != null || active != null || page != null || size != null) {
            return ApiResponse.ok(employmentService.adminJobsPage(keyword, active, page, size));
        }
        return ApiResponse.ok(employmentService.adminJobs());
    }

    @PostMapping("/jobs")
    public ApiResponse<?> createJob(@Valid @RequestBody JobPostingRequest req) {
        return ApiResponse.ok(employmentService.createJob(req), "Job created");
    }

    @PutMapping("/jobs/{id}")
    public ApiResponse<?> updateJob(@PathVariable Long id, @Valid @RequestBody JobPostingRequest req) {
        return ApiResponse.ok(employmentService.updateJob(id, req), "Job updated");
    }

    @DeleteMapping("/jobs/{id}")
    public ApiResponse<?> deleteJob(@PathVariable Long id) {
        return ApiResponse.ok(employmentService.deleteJob(id), "Job deleted");
    }

    @PostMapping("/notifications/trigger")
    public ApiResponse<?> trigger(@Valid @RequestBody NotificationTriggerRequest req) {
        return ApiResponse.ok(employmentService.triggerNotification(req), "Station notification triggered");
    }
}
