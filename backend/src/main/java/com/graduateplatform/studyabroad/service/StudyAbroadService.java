package com.graduateplatform.studyabroad.service;

import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.common.service.CosService;
import com.graduateplatform.studyabroad.dto.ApplicationRequest;
import com.graduateplatform.studyabroad.dto.ExperienceRequest;
import com.graduateplatform.studyabroad.dto.MaterialRequest;
import com.graduateplatform.studyabroad.dto.TimelineRequest;
import com.graduateplatform.studyabroad.entity.StudyAbroadApplication;
import com.graduateplatform.studyabroad.entity.StudyAbroadExperience;
import com.graduateplatform.studyabroad.entity.StudyAbroadMaterial;
import com.graduateplatform.studyabroad.entity.StudyAbroadMaterialAttachment;
import com.graduateplatform.studyabroad.entity.StudyAbroadTimeline;
import com.graduateplatform.studyabroad.repository.StudyAbroadApplicationRepository;
import com.graduateplatform.studyabroad.repository.StudyAbroadExperienceRepository;
import com.graduateplatform.studyabroad.repository.StudyAbroadMaterialAttachmentRepository;
import com.graduateplatform.studyabroad.repository.StudyAbroadMaterialRepository;
import com.graduateplatform.studyabroad.repository.StudyAbroadTimelineRepository;
import com.qcloud.cos.model.COSObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class StudyAbroadService {

    private static final Set<String> VALID_TIMELINE_STATUSES = Set.of("todo", "doing", "done");
    private static final Set<String> VALID_APPLICATION_STATUSES =
        Set.of("planning", "preparing", "submitted", "offer", "rejected");
    private static final Set<String> VALID_PRIORITIES = Set.of("dream", "match", "safe");
    private static final long MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
    private static final int MAX_ATTACHMENT_COUNT = 5;

    private final StudyAbroadApplicationRepository applicationRepository;
    private final StudyAbroadExperienceRepository experienceRepository;
    private final StudyAbroadTimelineRepository timelineRepository;
    private final StudyAbroadMaterialRepository materialRepository;
    private final StudyAbroadMaterialAttachmentRepository materialAttachmentRepository;
    private final UserRepository userRepository;
    private final CosService cosService;

    public StudyAbroadService(StudyAbroadApplicationRepository applicationRepository,
                              StudyAbroadExperienceRepository experienceRepository,
                              StudyAbroadTimelineRepository timelineRepository,
                              StudyAbroadMaterialRepository materialRepository,
                              StudyAbroadMaterialAttachmentRepository materialAttachmentRepository,
                              UserRepository userRepository,
                              CosService cosService) {
        this.applicationRepository = applicationRepository;
        this.experienceRepository = experienceRepository;
        this.timelineRepository = timelineRepository;
        this.materialRepository = materialRepository;
        this.materialAttachmentRepository = materialAttachmentRepository;
        this.userRepository = userRepository;
        this.cosService = cosService;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getExperiences(String country, String topic, String keyword) {
        return experienceRepository.search(
                normalizeFilter(country),
                normalizeFilter(topic),
                normalizeFilter(keyword)
            )
            .stream()
            .map(this::toExperienceMap)
            .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getExperiencesPage(String country, String topic, String keyword, int page, int size) {
        Page<StudyAbroadExperience> result = experienceRepository.searchPage(
            normalizeFilter(country),
            normalizeFilter(topic),
            normalizeFilter(keyword),
            PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)), Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("content", result.getContent().stream().map(this::toExperienceMap).toList());
        map.put("page", result.getNumber());
        map.put("size", result.getSize());
        map.put("totalElements", result.getTotalElements());
        map.put("totalPages", Math.max(1, result.getTotalPages()));
        return map;
    }

    @Transactional
    public Map<String, Object> createExperience(Long userId, ExperienceRequest req) {
        User user = ensureUser(userId);
        StudyAbroadExperience item = StudyAbroadExperience.builder()
            .author(user)
            .title(req.getTitle().trim())
            .country(req.getCountry().trim())
            .topic(req.getTopic().trim())
            .authorName(normalize(req.getAuthorName(), user.getName()))
            .readTime(normalize(req.getReadTime(), "5 min"))
            .summary(req.getSummary().trim())
            .content(req.getContent().trim())
            .tags(normalize(req.getTags(), ""))
            .build();
        return toExperienceMap(experienceRepository.save(item));
    }

    @Transactional
    public void deleteExperience(Long userId, Long id) {
        ensureUser(userId);
        StudyAbroadExperience item = experienceRepository.findByIdAndAuthorId(id, userId)
            .orElseThrow(() -> new BusinessException("Experience not found or access denied"));
        experienceRepository.delete(item);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getApplications(Long userId) {
        ensureUser(userId);
        return applicationRepository.findByUserIdOrderByDeadlineAsc(userId)
            .stream()
            .map(this::toApplicationMap)
            .toList();
    }

    @Transactional
    public Map<String, Object> createApplication(Long userId, ApplicationRequest req) {
        User user = ensureUser(userId);
        StudyAbroadApplication item = StudyAbroadApplication.builder()
            .user(user)
            .country(req.getCountry().trim())
            .school(req.getSchool().trim())
            .program(req.getProgram().trim())
            .degree(req.getDegree().trim())
            .intake(req.getIntake().trim())
            .applicationRound(req.getApplicationRound().trim())
            .deadline(req.getDeadline())
            .status(normalizeApplicationStatus(req.getStatus()))
            .priority(normalizePriority(req.getPriority()))
            .note(normalize(req.getNote(), "No note"))
            .build();
        return toApplicationMap(applicationRepository.save(item));
    }

    @Transactional
    public Map<String, Object> updateApplication(Long userId, Long id, ApplicationRequest req) {
        ensureUser(userId);
        StudyAbroadApplication item = applicationRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException("Application not found or access denied"));

        item.setCountry(req.getCountry().trim());
        item.setSchool(req.getSchool().trim());
        item.setProgram(req.getProgram().trim());
        item.setDegree(req.getDegree().trim());
        item.setIntake(req.getIntake().trim());
        item.setApplicationRound(req.getApplicationRound().trim());
        item.setDeadline(req.getDeadline());
        item.setStatus(normalizeApplicationStatus(req.getStatus()));
        item.setPriority(normalizePriority(req.getPriority()));
        item.setNote(normalize(req.getNote(), "No note"));
        return toApplicationMap(applicationRepository.save(item));
    }

    @Transactional
    public void deleteApplication(Long userId, Long id) {
        ensureUser(userId);
        StudyAbroadApplication item = applicationRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException("Application not found or access denied"));
        applicationRepository.delete(item);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTimeline(Long userId) {
        ensureUser(userId);
        return timelineRepository.findByUserIdOrderByDueDateAsc(userId)
            .stream()
            .map(this::toTimelineMap)
            .toList();
    }

    @Transactional
    public Map<String, Object> createTimeline(Long userId, TimelineRequest req) {
        User user = ensureUser(userId);
        StudyAbroadTimeline item = StudyAbroadTimeline.builder()
            .user(user)
            .application(findOwnedApplication(userId, req.getApplicationId()))
            .title(req.getTitle().trim())
            .country(req.getCountry().trim())
            .school(normalize(req.getSchool(), "School TBD"))
            .phase(req.getPhase().trim())
            .dueDate(req.getDueDate())
            .status(normalizeTimelineStatus(req.getStatus()))
            .note(normalize(req.getNote(), "No note"))
            .build();
        return toTimelineMap(timelineRepository.save(item));
    }

    @Transactional
    public Map<String, Object> updateTimeline(Long userId, Long id, TimelineRequest req) {
        ensureUser(userId);
        StudyAbroadTimeline item = timelineRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException("Timeline item not found or access denied"));

        item.setTitle(req.getTitle().trim());
        item.setApplication(findOwnedApplication(userId, req.getApplicationId()));
        item.setCountry(req.getCountry().trim());
        item.setSchool(normalize(req.getSchool(), "School TBD"));
        item.setPhase(req.getPhase().trim());
        item.setDueDate(req.getDueDate());
        item.setStatus(normalizeTimelineStatus(req.getStatus()));
        item.setNote(normalize(req.getNote(), "No note"));
        return toTimelineMap(timelineRepository.save(item));
    }

    @Transactional
    public void deleteTimeline(Long userId, Long id) {
        ensureUser(userId);
        StudyAbroadTimeline item = timelineRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException("Timeline item not found or access denied"));
        timelineRepository.delete(item);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMaterials(Long userId) {
        ensureUser(userId);
        return materialRepository.findByUserIdOrderByDeadlineAsc(userId)
            .stream()
            .map(this::toMaterialMap)
            .toList();
    }

    @Transactional
    public Map<String, Object> createMaterial(Long userId, MaterialRequest req) {
        User user = ensureUser(userId);
        StudyAbroadMaterial item = StudyAbroadMaterial.builder()
            .user(user)
            .application(findOwnedApplication(userId, req.getApplicationId()))
            .title(req.getTitle().trim())
            .country(req.getCountry().trim())
            .stage(req.getStage().trim())
            .category(req.getCategory().trim())
            .deadline(req.getDeadline())
            .completed(Boolean.TRUE.equals(req.getCompleted()))
            .note(normalize(req.getNote(), "No note"))
            .build();
        return toMaterialMap(materialRepository.save(item));
    }

    @Transactional
    public Map<String, Object> updateMaterial(Long userId, Long id, MaterialRequest req) {
        ensureUser(userId);
        StudyAbroadMaterial item = materialRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException("Material item not found or access denied"));

        item.setTitle(req.getTitle().trim());
        item.setApplication(findOwnedApplication(userId, req.getApplicationId()));
        item.setCountry(req.getCountry().trim());
        item.setStage(req.getStage().trim());
        item.setCategory(req.getCategory().trim());
        item.setDeadline(req.getDeadline());
        item.setCompleted(Boolean.TRUE.equals(req.getCompleted()));
        item.setNote(normalize(req.getNote(), "No note"));
        return toMaterialMap(materialRepository.save(item));
    }

    @Transactional
    public void deleteMaterial(Long userId, Long id) {
        ensureUser(userId);
        StudyAbroadMaterial item = materialRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException("Material item not found or access denied"));
        materialRepository.delete(item);
    }

    @Transactional
    public Map<String, Object> uploadMaterialAttachments(Long userId, Long materialId, List<MultipartFile> files) {
        ensureUser(userId);
        StudyAbroadMaterial material = materialRepository.findByIdAndUserId(materialId, userId)
            .orElseThrow(() -> new BusinessException("Material item not found or access denied"));
        List<MultipartFile> normalizedFiles = normalizeFiles(files);
        int currentCount = material.getAttachments() == null ? 0 : material.getAttachments().size();
        if (currentCount + normalizedFiles.size() > MAX_ATTACHMENT_COUNT) {
            throw new BusinessException("Each material can upload at most " + MAX_ATTACHMENT_COUNT + " files");
        }

        for (MultipartFile file : normalizedFiles) {
            validateAttachmentFile(file);
            String originalName = normalize(file.getOriginalFilename(), "attachment");
            String contentType = normalize(file.getContentType(), "application/octet-stream");
            String cosKey = "studyabroad/materials/" + materialId + "/" + UUID.randomUUID();
            try {
                cosService.uploadFile(file.getInputStream(), file.getSize(), cosKey, contentType);
            } catch (IOException e) {
                throw new BusinessException("Failed to read file: " + originalName);
            }
            material.addAttachment(StudyAbroadMaterialAttachment.builder()
                .originalName(originalName)
                .fileSize(file.getSize())
                .cosKey(cosKey)
                .fileType(contentType)
                .downloadCount(0)
                .build());
        }
        return toMaterialMap(materialRepository.save(material));
    }

    @Transactional
    public Object[] getMaterialAttachmentDownloadStream(Long userId, Long materialId, Long attachmentId) {
        ensureUser(userId);
        StudyAbroadMaterialAttachment attachment = materialAttachmentRepository
            .findByIdAndMaterialIdAndMaterialUserId(attachmentId, materialId, userId)
            .orElseThrow(() -> new BusinessException("Attachment not found or access denied"));
        attachment.setDownloadCount(attachment.getDownloadCount() + 1);
        materialAttachmentRepository.save(attachment);
        COSObject cosObject = cosService.getObject(attachment.getCosKey());
        return new Object[]{cosObject.getObjectContent(), cosObject.getObjectMetadata(), attachment.getOriginalName()};
    }

    @Transactional
    public void deleteMaterialAttachment(Long userId, Long materialId, Long attachmentId) {
        ensureUser(userId);
        StudyAbroadMaterial material = materialRepository.findByIdAndUserId(materialId, userId)
            .orElseThrow(() -> new BusinessException("Material item not found or access denied"));
        StudyAbroadMaterialAttachment attachment = materialAttachmentRepository
            .findByIdAndMaterialIdAndMaterialUserId(attachmentId, materialId, userId)
            .orElseThrow(() -> new BusinessException("Attachment not found or access denied"));
        material.removeAttachment(attachment);
        materialRepository.save(material);
    }

    private User ensureUser(Long userId) {
        if (userId == null) {
            throw new BusinessException("Please sign in before using study abroad management");
        }
        return userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("User not found"));
    }

    private String normalizeTimelineStatus(String status) {
        String normalized = status == null || status.isBlank() ? "todo" : status.trim();
        if (!VALID_TIMELINE_STATUSES.contains(normalized)) {
            throw new BusinessException("Timeline status is invalid");
        }
        return normalized;
    }

    private StudyAbroadApplication findOwnedApplication(Long userId, Long applicationId) {
        if (applicationId == null) {
            return null;
        }
        return applicationRepository.findByIdAndUserId(applicationId, userId)
            .orElseThrow(() -> new BusinessException("Application not found or access denied"));
    }

    private String normalizeApplicationStatus(String status) {
        String normalized = status == null || status.isBlank() ? "planning" : status.trim();
        if (!VALID_APPLICATION_STATUSES.contains(normalized)) {
            throw new BusinessException("Application status is invalid");
        }
        return normalized;
    }

    private String normalizePriority(String priority) {
        String normalized = priority == null || priority.isBlank() ? "match" : priority.trim();
        if (!VALID_PRIORITIES.contains(normalized)) {
            throw new BusinessException("Application priority is invalid");
        }
        return normalized;
    }

    private String normalize(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String normalizeFilter(String value) {
        return value == null || value.isBlank() || "all".equalsIgnoreCase(value.trim())
            ? null
            : value.trim();
    }

    private Map<String, Object> toExperienceMap(StudyAbroadExperience item) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", item.getId());
        map.put("title", item.getTitle());
        map.put("country", item.getCountry());
        map.put("topic", item.getTopic());
        map.put("authorName", item.getAuthorName());
        map.put("readTime", item.getReadTime());
        map.put("summary", item.getSummary());
        map.put("content", item.getContent());
        map.put("tags", splitTags(item.getTags()));
        map.put("createdAt", item.getCreatedAt() != null ? item.getCreatedAt().toString() : null);
        map.put("updatedAt", item.getUpdatedAt() != null ? item.getUpdatedAt().toString() : null);
        return map;
    }

    private List<String> splitTags(String tags) {
        if (tags == null || tags.isBlank()) {
            return List.of();
        }
        return List.of(tags.split(","))
            .stream()
            .map(String::trim)
            .filter(tag -> !tag.isBlank())
            .toList();
    }

    private Map<String, Object> toApplicationMap(StudyAbroadApplication item) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", item.getId());
        map.put("country", item.getCountry());
        map.put("school", item.getSchool());
        map.put("program", item.getProgram());
        map.put("degree", item.getDegree());
        map.put("intake", item.getIntake());
        map.put("applicationRound", item.getApplicationRound());
        map.put("deadline", item.getDeadline().toString());
        map.put("status", item.getStatus());
        map.put("priority", item.getPriority());
        map.put("note", item.getNote());
        map.put("createdAt", item.getCreatedAt() != null ? item.getCreatedAt().toString() : null);
        map.put("updatedAt", item.getUpdatedAt() != null ? item.getUpdatedAt().toString() : null);
        return map;
    }

    private Map<String, Object> toTimelineMap(StudyAbroadTimeline item) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", item.getId());
        appendApplicationSummary(map, item.getApplication());
        map.put("title", item.getTitle());
        map.put("country", item.getCountry());
        map.put("school", item.getSchool());
        map.put("phase", item.getPhase());
        map.put("dueDate", item.getDueDate().toString());
        map.put("status", item.getStatus());
        map.put("note", item.getNote());
        map.put("createdAt", item.getCreatedAt() != null ? item.getCreatedAt().toString() : null);
        map.put("updatedAt", item.getUpdatedAt() != null ? item.getUpdatedAt().toString() : null);
        return map;
    }

    private Map<String, Object> toMaterialMap(StudyAbroadMaterial item) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", item.getId());
        appendApplicationSummary(map, item.getApplication());
        map.put("title", item.getTitle());
        map.put("country", item.getCountry());
        map.put("stage", item.getStage());
        map.put("category", item.getCategory());
        map.put("deadline", item.getDeadline().toString());
        map.put("completed", item.getCompleted());
        map.put("note", item.getNote());
        map.put("attachments", item.getAttachments() == null
            ? List.of()
            : item.getAttachments().stream().map(this::toAttachmentMap).toList());
        map.put("createdAt", item.getCreatedAt() != null ? item.getCreatedAt().toString() : null);
        map.put("updatedAt", item.getUpdatedAt() != null ? item.getUpdatedAt().toString() : null);
        return map;
    }

    private Map<String, Object> toAttachmentMap(StudyAbroadMaterialAttachment attachment) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", attachment.getId());
        map.put("originalName", attachment.getOriginalName());
        map.put("fileSize", attachment.getFileSize());
        map.put("fileType", attachment.getFileType());
        map.put("downloadCount", attachment.getDownloadCount());
        map.put("createdAt", attachment.getCreatedAt() != null ? attachment.getCreatedAt().toString() : null);
        map.put("downloadUrl", "/api/studyabroad/materials/" + attachment.getMaterial().getId()
            + "/attachments/" + attachment.getId() + "/download");
        return map;
    }

    private void appendApplicationSummary(Map<String, Object> map, StudyAbroadApplication application) {
        map.put("applicationId", application != null ? application.getId() : null);
        map.put("applicationSchool", application != null ? application.getSchool() : null);
        map.put("applicationProgram", application != null ? application.getProgram() : null);
    }

    private List<MultipartFile> normalizeFiles(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new BusinessException("Please upload at least one file");
        }
        List<MultipartFile> normalized = files.stream()
            .filter(file -> file != null && !file.isEmpty())
            .toList();
        if (normalized.isEmpty()) {
            throw new BusinessException("Please upload at least one file");
        }
        return normalized;
    }

    private void validateAttachmentFile(MultipartFile file) {
        if (file.getSize() > MAX_ATTACHMENT_SIZE) {
            throw new BusinessException("File " + file.getOriginalFilename() + " exceeds 10MB");
        }
    }
}
