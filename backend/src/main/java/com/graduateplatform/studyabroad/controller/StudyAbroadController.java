package com.graduateplatform.studyabroad.controller;

import com.graduateplatform.common.dto.ApiResponse;
import com.graduateplatform.studyabroad.dto.AdmissionCaseRequest;
import com.graduateplatform.studyabroad.dto.ApplicationRequest;
import com.graduateplatform.studyabroad.dto.ExperienceRequest;
import com.graduateplatform.studyabroad.dto.MaterialRequest;
import com.graduateplatform.studyabroad.dto.TimelineRequest;
import com.graduateplatform.studyabroad.service.StudyAbroadService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/studyabroad")
public class StudyAbroadController {

    private final StudyAbroadService studyAbroadService;

    public StudyAbroadController(StudyAbroadService studyAbroadService) {
        this.studyAbroadService = studyAbroadService;
    }

    @GetMapping("/schools/page")
    public ApiResponse<?> schoolProgramsPage(@RequestParam(required = false) String country,
                                             @RequestParam(required = false) String subjectArea,
                                             @RequestParam(required = false) Boolean partnerOnly,
                                             @RequestParam(required = false) String keyword,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "9") int size) {
        return ApiResponse.ok(studyAbroadService.getSchoolProgramsPage(
            country,
            subjectArea,
            partnerOnly,
            keyword,
            page,
            size
        ));
    }

    @GetMapping("/admission-cases/page")
    public ApiResponse<?> admissionCasesPage(@RequestParam(required = false) String country,
                                             @RequestParam(required = false) String result,
                                             @RequestParam(required = false) String major,
                                             @RequestParam(required = false) String keyword,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "9") int size) {
        return ApiResponse.ok(studyAbroadService.getAdmissionCasesPage(country, result, major, keyword, page, size));
    }

    @PostMapping("/admission-cases")
    public ApiResponse<?> createAdmissionCase(@Valid @RequestBody AdmissionCaseRequest req, Authentication auth) {
        return ApiResponse.ok(
            studyAbroadService.createAdmissionCase(getCurrentUserId(auth), req),
            "Admission case created"
        );
    }

    @DeleteMapping("/admission-cases/{id}")
    public ApiResponse<?> deleteAdmissionCase(@PathVariable Long id, Authentication auth) {
        studyAbroadService.deleteAdmissionCase(getCurrentUserId(auth), id);
        return ApiResponse.ok(null, "Admission case deleted");
    }

    @GetMapping("/experiences")
    public ApiResponse<?> experiences(@RequestParam(required = false) String country,
                                      @RequestParam(required = false) String topic,
                                      @RequestParam(required = false) String keyword) {
        return ApiResponse.ok(studyAbroadService.getExperiences(country, topic, keyword));
    }

    @GetMapping("/experiences/page")
    public ApiResponse<?> experiencesPage(@RequestParam(required = false) String country,
                                          @RequestParam(required = false) String topic,
                                          @RequestParam(required = false) String keyword,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "9") int size) {
        return ApiResponse.ok(studyAbroadService.getExperiencesPage(country, topic, keyword, page, size));
    }

    @PostMapping("/experiences")
    public ApiResponse<?> createExperience(@Valid @RequestBody ExperienceRequest req, Authentication auth) {
        return ApiResponse.ok(
            studyAbroadService.createExperience(getCurrentUserId(auth), req),
            "Experience created"
        );
    }

    @PutMapping("/experiences/{id}")
    public ApiResponse<?> updateExperience(@PathVariable Long id,
                                           @Valid @RequestBody ExperienceRequest req,
                                           Authentication auth) {
        return ApiResponse.ok(
            studyAbroadService.updateExperience(getCurrentUserId(auth), id, req),
            "Experience updated"
        );
    }

    @DeleteMapping("/experiences/{id}")
    public ApiResponse<?> deleteExperience(@PathVariable Long id, Authentication auth) {
        studyAbroadService.deleteExperience(getCurrentUserId(auth), id);
        return ApiResponse.ok(null, "Experience deleted");
    }

    @GetMapping("/applications")
    public ApiResponse<?> applications(Authentication auth) {
        return ApiResponse.ok(studyAbroadService.getApplications(getCurrentUserId(auth)));
    }

    @PostMapping("/applications")
    public ApiResponse<?> createApplication(@Valid @RequestBody ApplicationRequest req, Authentication auth) {
        return ApiResponse.ok(
            studyAbroadService.createApplication(getCurrentUserId(auth), req),
            "Application created"
        );
    }

    @PutMapping("/applications/{id}")
    public ApiResponse<?> updateApplication(@PathVariable Long id,
                                            @Valid @RequestBody ApplicationRequest req,
                                            Authentication auth) {
        return ApiResponse.ok(
            studyAbroadService.updateApplication(getCurrentUserId(auth), id, req),
            "Application updated"
        );
    }

    @DeleteMapping("/applications/{id}")
    public ApiResponse<?> deleteApplication(@PathVariable Long id, Authentication auth) {
        studyAbroadService.deleteApplication(getCurrentUserId(auth), id);
        return ApiResponse.ok(null, "Application deleted");
    }

    @GetMapping("/timeline")
    public ApiResponse<?> timeline(Authentication auth) {
        return ApiResponse.ok(studyAbroadService.getTimeline(getCurrentUserId(auth)));
    }

    @PostMapping("/timeline")
    public ApiResponse<?> createTimeline(@Valid @RequestBody TimelineRequest req, Authentication auth) {
        return ApiResponse.ok(
            studyAbroadService.createTimeline(getCurrentUserId(auth), req),
            "Timeline item created"
        );
    }

    @PutMapping("/timeline/{id}")
    public ApiResponse<?> updateTimeline(@PathVariable Long id,
                                         @Valid @RequestBody TimelineRequest req,
                                         Authentication auth) {
        return ApiResponse.ok(
            studyAbroadService.updateTimeline(getCurrentUserId(auth), id, req),
            "Timeline item updated"
        );
    }

    @DeleteMapping("/timeline/{id}")
    public ApiResponse<?> deleteTimeline(@PathVariable Long id, Authentication auth) {
        studyAbroadService.deleteTimeline(getCurrentUserId(auth), id);
        return ApiResponse.ok(null, "Timeline item deleted");
    }

    @GetMapping("/materials")
    public ApiResponse<?> materials(Authentication auth) {
        return ApiResponse.ok(studyAbroadService.getMaterials(getCurrentUserId(auth)));
    }

    @PostMapping("/materials")
    public ApiResponse<?> createMaterial(@Valid @RequestBody MaterialRequest req, Authentication auth) {
        return ApiResponse.ok(
            studyAbroadService.createMaterial(getCurrentUserId(auth), req),
            "Material item created"
        );
    }

    @PutMapping("/materials/{id}")
    public ApiResponse<?> updateMaterial(@PathVariable Long id,
                                         @Valid @RequestBody MaterialRequest req,
                                         Authentication auth) {
        return ApiResponse.ok(
            studyAbroadService.updateMaterial(getCurrentUserId(auth), id, req),
            "Material item updated"
        );
    }

    @DeleteMapping("/materials/{id}")
    public ApiResponse<?> deleteMaterial(@PathVariable Long id, Authentication auth) {
        studyAbroadService.deleteMaterial(getCurrentUserId(auth), id);
        return ApiResponse.ok(null, "Material item deleted");
    }

    @PostMapping(value = "/materials/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<?> uploadMaterialAttachments(@PathVariable Long id,
                                                    @RequestParam("files") List<MultipartFile> files,
                                                    Authentication auth) {
        return ApiResponse.ok(
            studyAbroadService.uploadMaterialAttachments(getCurrentUserId(auth), id, files),
            "Material attachments uploaded"
        );
    }

    @GetMapping("/materials/{materialId}/attachments/{attachmentId}/download")
    public ResponseEntity<StreamingResponseBody> downloadMaterialAttachment(@PathVariable Long materialId,
                                                                            @PathVariable Long attachmentId,
                                                                            Authentication auth) {
        Object[] result = studyAbroadService.getMaterialAttachmentDownloadStream(
            getCurrentUserId(auth),
            materialId,
            attachmentId
        );
        InputStream inputStream = (InputStream) result[0];
        com.qcloud.cos.model.ObjectMetadata metadata = (com.qcloud.cos.model.ObjectMetadata) result[1];
        String originalName = (String) result[2];
        String contentType = metadata.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "application/octet-stream";
        }
        String encodedName = URLEncoder.encode(originalName, StandardCharsets.UTF_8).replace("+", "%20");

        StreamingResponseBody stream = out -> {
            try (inputStream) {
                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
            }
        };

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + originalName + "\"; filename*=UTF-8''" + encodedName)
            .contentType(MediaType.parseMediaType(contentType))
            .contentLength(metadata.getContentLength())
            .body(stream);
    }

    @DeleteMapping("/materials/{materialId}/attachments/{attachmentId}")
    public ApiResponse<?> deleteMaterialAttachment(@PathVariable Long materialId,
                                                   @PathVariable Long attachmentId,
                                                   Authentication auth) {
        studyAbroadService.deleteMaterialAttachment(getCurrentUserId(auth), materialId, attachmentId);
        return ApiResponse.ok(null, "Material attachment deleted");
    }

    private Long getCurrentUserId(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return null;
        }
        Object principal = auth.getPrincipal();
        return principal instanceof Long ? (Long) principal : null;
    }
}
