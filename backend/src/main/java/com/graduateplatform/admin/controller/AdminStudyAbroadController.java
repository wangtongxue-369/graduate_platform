package com.graduateplatform.admin.controller;

import com.graduateplatform.common.dto.ApiResponse;
import com.graduateplatform.studyabroad.service.StudyAbroadService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/studyabroad")
public class AdminStudyAbroadController {

    private final StudyAbroadService studyAbroadService;

    public AdminStudyAbroadController(StudyAbroadService studyAbroadService) {
        this.studyAbroadService = studyAbroadService;
    }

    @GetMapping("/schools")
    public ApiResponse<?> schools(@RequestParam Map<String, String> params) {
        return ApiResponse.ok(studyAbroadService.adminGetSchoolProgramsPage(params));
    }

    @PostMapping("/schools")
    public ApiResponse<?> createSchool(@RequestBody Map<String, Object> body) {
        return ApiResponse.ok(studyAbroadService.adminCreateSchoolProgram(body), "院校创建成功");
    }

    @PutMapping("/schools/{id}")
    public ApiResponse<?> updateSchool(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ApiResponse.ok(studyAbroadService.adminUpdateSchoolProgram(id, body), "院校更新成功");
    }

    @DeleteMapping("/schools/{id}")
    public ApiResponse<?> deleteSchool(@PathVariable Long id) {
        studyAbroadService.adminDeleteSchoolProgram(id);
        return ApiResponse.ok(null, "院校已删除");
    }

    @GetMapping("/admission-cases")
    public ApiResponse<?> admissionCases(@RequestParam Map<String, String> params) {
        return ApiResponse.ok(studyAbroadService.adminGetAdmissionCasesPage(params));
    }

    @DeleteMapping("/admission-cases/{id}")
    public ApiResponse<?> deleteAdmissionCase(@PathVariable Long id) {
        studyAbroadService.adminDeleteAdmissionCase(id);
        return ApiResponse.ok(null, "案例已删除");
    }

    @GetMapping("/experiences")
    public ApiResponse<?> experiences(@RequestParam Map<String, String> params) {
        return ApiResponse.ok(studyAbroadService.adminGetExperiencesPage(params));
    }

    @DeleteMapping("/experiences/{id}")
    public ApiResponse<?> deleteExperience(@PathVariable Long id) {
        studyAbroadService.adminDeleteExperience(id);
        return ApiResponse.ok(null, "经验已删除");
    }

    @GetMapping("/dashboard")
    public ApiResponse<?> dashboard() {
        return ApiResponse.ok(studyAbroadService.getAdminDashboard());
    }
}
