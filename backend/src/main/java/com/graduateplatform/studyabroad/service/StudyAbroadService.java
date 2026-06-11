package com.graduateplatform.studyabroad.service;

import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.common.service.CosService;
import com.graduateplatform.studyabroad.dto.AdmissionCaseRequest;
import com.graduateplatform.studyabroad.dto.ApplicationRequest;
import com.graduateplatform.studyabroad.dto.ExperienceRequest;
import com.graduateplatform.studyabroad.dto.MaterialRequest;
import com.graduateplatform.studyabroad.dto.TimelineRequest;
import com.graduateplatform.studyabroad.entity.StudyAbroadAdmissionCase;
import com.graduateplatform.studyabroad.entity.StudyAbroadApplication;
import com.graduateplatform.studyabroad.entity.StudyAbroadExperience;
import com.graduateplatform.studyabroad.entity.StudyAbroadMaterial;
import com.graduateplatform.studyabroad.entity.StudyAbroadMaterialAttachment;
import com.graduateplatform.studyabroad.entity.StudyAbroadSchoolProgram;
import com.graduateplatform.studyabroad.entity.StudyAbroadTimeline;
import com.graduateplatform.studyabroad.repository.StudyAbroadAdmissionCaseRepository;
import com.graduateplatform.studyabroad.repository.StudyAbroadApplicationRepository;
import com.graduateplatform.studyabroad.repository.StudyAbroadExperienceRepository;
import com.graduateplatform.studyabroad.repository.StudyAbroadMaterialAttachmentRepository;
import com.graduateplatform.studyabroad.repository.StudyAbroadMaterialRepository;
import com.graduateplatform.studyabroad.repository.StudyAbroadSchoolProgramRepository;
import com.graduateplatform.studyabroad.repository.StudyAbroadTimelineRepository;
import com.qcloud.cos.model.COSObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;

@Service
public class StudyAbroadService {

    private static final Set<String> VALID_TIMELINE_STATUSES = Set.of("todo", "doing", "done");
    private static final Set<String> VALID_APPLICATION_STATUSES =
        Set.of("planning", "preparing", "submitted", "offer", "rejected");
    private static final Set<String> VALID_PRIORITIES = Set.of("dream", "match", "safe");
    private static final Set<String> VALID_ADMISSION_RESULTS = Set.of("admit", "reject", "waitlist");
    private static final long MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
    private static final int MAX_ATTACHMENT_COUNT = 5;

    private final StudyAbroadAdmissionCaseRepository admissionCaseRepository;
    private final StudyAbroadSchoolProgramRepository schoolProgramRepository;
    private final StudyAbroadApplicationRepository applicationRepository;
    private final StudyAbroadExperienceRepository experienceRepository;
    private final StudyAbroadTimelineRepository timelineRepository;
    private final StudyAbroadMaterialRepository materialRepository;
    private final StudyAbroadMaterialAttachmentRepository materialAttachmentRepository;
    private final UserRepository userRepository;
    private final CosService cosService;

    public StudyAbroadService(StudyAbroadAdmissionCaseRepository admissionCaseRepository,
                              StudyAbroadSchoolProgramRepository schoolProgramRepository,
                              StudyAbroadApplicationRepository applicationRepository,
                              StudyAbroadExperienceRepository experienceRepository,
                              StudyAbroadTimelineRepository timelineRepository,
                              StudyAbroadMaterialRepository materialRepository,
                              StudyAbroadMaterialAttachmentRepository materialAttachmentRepository,
                              UserRepository userRepository,
                              CosService cosService) {
        this.admissionCaseRepository = admissionCaseRepository;
        this.schoolProgramRepository = schoolProgramRepository;
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

    @Transactional(readOnly = true)
    public Map<String, Object> getSchoolProgramsPage(String country,
                                                     String subjectArea,
                                                     Boolean partnerOnly,
                                                     String keyword,
                                                     int page,
                                                     int size) {
        Page<StudyAbroadSchoolProgram> pageResult = schoolProgramRepository.searchPage(
            normalizeFilter(country),
            normalizeFilter(subjectArea),
            partnerOnly,
            normalizeFilter(keyword),
            PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)), Sort.by(Sort.Direction.ASC, "schoolName"))
        );
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("content", pageResult.getContent().stream().map(this::toSchoolProgramMap).toList());
        map.put("page", pageResult.getNumber());
        map.put("size", pageResult.getSize());
        map.put("totalElements", pageResult.getTotalElements());
        map.put("totalPages", Math.max(1, pageResult.getTotalPages()));
        return map;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAdmissionCasesPage(String country,
                                                     String result,
                                                     String major,
                                                     String keyword,
                                                     int page,
                                                     int size) {
        Page<StudyAbroadAdmissionCase> pageResult = admissionCaseRepository.searchPage(
            normalizeFilter(country),
            normalizeFilter(result),
            normalizeFilter(major),
            normalizeFilter(keyword),
            PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, 50)), Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("content", pageResult.getContent().stream().map(this::toAdmissionCaseMap).toList());
        map.put("page", pageResult.getNumber());
        map.put("size", pageResult.getSize());
        map.put("totalElements", pageResult.getTotalElements());
        map.put("totalPages", Math.max(1, pageResult.getTotalPages()));
        return map;
    }

    @Transactional
    public Map<String, Object> createAdmissionCase(Long userId, AdmissionCaseRequest req) {
        User user = ensureUser(userId);
        StudyAbroadAdmissionCase item = StudyAbroadAdmissionCase.builder()
            .author(user)
            .applicationYear(req.getApplicationYear().trim())
            .studentMajor(req.getStudentMajor().trim())
            .gpa(req.getGpa().trim())
            .rankPercent(normalize(req.getRankPercent(), "未填写"))
            .languageType(req.getLanguageType().trim())
            .languageScore(req.getLanguageScore().trim())
            .standardizedScore(normalize(req.getStandardizedScore(), "无"))
            .softBackground(normalize(req.getSoftBackground(), "暂未补充"))
            .country(req.getCountry().trim())
            .school(req.getSchool().trim())
            .program(req.getProgram().trim())
            .degree(req.getDegree().trim())
            .admissionResult(normalizeAdmissionResult(req.getAdmissionResult()))
            .scholarship(normalize(req.getScholarship(), "未说明"))
            .applicationMode(normalize(req.getApplicationMode(), "匿名分享"))
            .tags(normalize(req.getTags(), ""))
            .summary(req.getSummary().trim())
            .build();
        return toAdmissionCaseMap(admissionCaseRepository.save(item));
    }

    @Transactional
    public void deleteAdmissionCase(Long userId, Long id) {
        ensureUser(userId);
        StudyAbroadAdmissionCase item = admissionCaseRepository.findByIdAndAuthorId(id, userId)
            .orElseThrow(() -> new BusinessException("录取案例不存在或无权限操作"));
        admissionCaseRepository.delete(item);
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
            .orElseThrow(() -> new BusinessException("经验不存在或无权限操作"));
        experienceRepository.delete(item);
    }

    @Transactional
    public Map<String, Object> updateExperience(Long userId, Long id, ExperienceRequest req) {
        ensureUser(userId);
        StudyAbroadExperience item = experienceRepository.findByIdAndAuthorId(id, userId)
            .orElseThrow(() -> new BusinessException("经验不存在或无权限操作"));
        item.setTitle(req.getTitle().trim());
        item.setCountry(req.getCountry().trim());
        item.setTopic(req.getTopic().trim());
        item.setAuthorName(normalize(req.getAuthorName(), item.getAuthorName()));
        item.setReadTime(normalize(req.getReadTime(), "5 min"));
        item.setSummary(req.getSummary().trim());
        item.setContent(req.getContent().trim());
        item.setTags(normalize(req.getTags(), ""));
        return toExperienceMap(experienceRepository.save(item));
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
            .note(normalize(req.getNote(), "暂无备注"))
            .build();
        return toApplicationMap(applicationRepository.save(item));
    }

    @Transactional
    public Map<String, Object> updateApplication(Long userId, Long id, ApplicationRequest req) {
        ensureUser(userId);
        StudyAbroadApplication item = applicationRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException("申请项目不存在或无权限操作"));

        item.setCountry(req.getCountry().trim());
        item.setSchool(req.getSchool().trim());
        item.setProgram(req.getProgram().trim());
        item.setDegree(req.getDegree().trim());
        item.setIntake(req.getIntake().trim());
        item.setApplicationRound(req.getApplicationRound().trim());
        item.setDeadline(req.getDeadline());
        item.setStatus(normalizeApplicationStatus(req.getStatus()));
        item.setPriority(normalizePriority(req.getPriority()));
        item.setNote(normalize(req.getNote(), "暂无备注"));
        return toApplicationMap(applicationRepository.save(item));
    }

    @Transactional
    public void deleteApplication(Long userId, Long id) {
        ensureUser(userId);
        StudyAbroadApplication item = applicationRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException("申请项目不存在或无权限操作"));
        materialRepository.deleteByUserIdAndApplicationId(userId, id);
        timelineRepository.deleteByUserIdAndApplicationId(userId, id);
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
            .school(normalize(req.getSchool(), "待定院校"))
            .phase(req.getPhase().trim())
            .dueDate(req.getDueDate())
            .status(normalizeTimelineStatus(req.getStatus()))
            .note(normalize(req.getNote(), "暂无备注"))
            .build();
        return toTimelineMap(timelineRepository.save(item));
    }

    @Transactional
    public Map<String, Object> updateTimeline(Long userId, Long id, TimelineRequest req) {
        ensureUser(userId);
        StudyAbroadTimeline item = timelineRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException("时间线事项不存在或无权限操作"));

        item.setTitle(req.getTitle().trim());
        item.setApplication(findOwnedApplication(userId, req.getApplicationId()));
        item.setCountry(req.getCountry().trim());
        item.setSchool(normalize(req.getSchool(), "待定院校"));
        item.setPhase(req.getPhase().trim());
        item.setDueDate(req.getDueDate());
        item.setStatus(normalizeTimelineStatus(req.getStatus()));
        item.setNote(normalize(req.getNote(), "暂无备注"));
        return toTimelineMap(timelineRepository.save(item));
    }

    @Transactional
    public void deleteTimeline(Long userId, Long id) {
        ensureUser(userId);
        StudyAbroadTimeline item = timelineRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException("时间线事项不存在或无权限操作"));
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
            .note(normalize(req.getNote(), "暂无备注"))
            .build();
        return toMaterialMap(materialRepository.save(item));
    }

    @Transactional
    public Map<String, Object> updateMaterial(Long userId, Long id, MaterialRequest req) {
        ensureUser(userId);
        StudyAbroadMaterial item = materialRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException("材料条目不存在或无权限操作"));

        item.setTitle(req.getTitle().trim());
        item.setApplication(findOwnedApplication(userId, req.getApplicationId()));
        item.setCountry(req.getCountry().trim());
        item.setStage(req.getStage().trim());
        item.setCategory(req.getCategory().trim());
        item.setDeadline(req.getDeadline());
        item.setCompleted(Boolean.TRUE.equals(req.getCompleted()));
        item.setNote(normalize(req.getNote(), "暂无备注"));
        return toMaterialMap(materialRepository.save(item));
    }

    @Transactional
    public void deleteMaterial(Long userId, Long id) {
        ensureUser(userId);
        StudyAbroadMaterial item = materialRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException("材料条目不存在或无权限操作"));
        materialRepository.delete(item);
    }

    @Transactional
    public Map<String, Object> uploadMaterialAttachments(Long userId, Long materialId, List<MultipartFile> files) {
        ensureUser(userId);
        StudyAbroadMaterial material = materialRepository.findByIdAndUserId(materialId, userId)
            .orElseThrow(() -> new BusinessException("材料条目不存在或无权限操作"));
        List<MultipartFile> normalizedFiles = normalizeFiles(files);
        int currentCount = material.getAttachments() == null ? 0 : material.getAttachments().size();
        if (currentCount + normalizedFiles.size() > MAX_ATTACHMENT_COUNT) {
            throw new BusinessException("每个材料最多上传 " + MAX_ATTACHMENT_COUNT + " 个附件");
        }

        for (MultipartFile file : normalizedFiles) {
            validateAttachmentFile(file);
            String originalName = normalize(file.getOriginalFilename(), "附件");
            String contentType = normalize(file.getContentType(), "application/octet-stream");
            String cosKey = "studyabroad/materials/" + materialId + "/" + UUID.randomUUID();
            try {
                cosService.uploadFile(file.getInputStream(), file.getSize(), cosKey, contentType);
            } catch (IOException e) {
                throw new BusinessException("读取文件失败：" + originalName);
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
            .orElseThrow(() -> new BusinessException("附件不存在或无权限操作"));
        attachment.setDownloadCount(attachment.getDownloadCount() + 1);
        materialAttachmentRepository.save(attachment);
        COSObject cosObject = cosService.getObject(attachment.getCosKey());
        return new Object[]{cosObject.getObjectContent(), cosObject.getObjectMetadata(), attachment.getOriginalName()};
    }

    @Transactional
    public void deleteMaterialAttachment(Long userId, Long materialId, Long attachmentId) {
        ensureUser(userId);
        StudyAbroadMaterial material = materialRepository.findByIdAndUserId(materialId, userId)
            .orElseThrow(() -> new BusinessException("材料条目不存在或无权限操作"));
        StudyAbroadMaterialAttachment attachment = materialAttachmentRepository
            .findByIdAndMaterialIdAndMaterialUserId(attachmentId, materialId, userId)
            .orElseThrow(() -> new BusinessException("附件不存在或无权限操作"));
        material.removeAttachment(attachment);
        materialRepository.save(material);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> adminGetSchoolProgramsPage(Map<String, String> params) {
        Page<StudyAbroadSchoolProgram> pageResult = schoolProgramRepository.searchPage(
            normalizeFilter(params.get("country")),
            normalizeFilter(params.get("subjectArea")),
            parseBooleanFilter(params.get("partnerOnly")),
            normalizeFilter(params.get("keyword")),
            PageRequest.of(parsePage(params.get("page")), parseSize(params.get("size")),
                Sort.by(Sort.Direction.ASC, "schoolName"))
        );
        return pageMap(pageResult, pageResult.getContent().stream().map(this::toSchoolProgramMap).toList());
    }

    @Transactional
    public Map<String, Object> adminCreateSchoolProgram(Map<String, Object> body) {
        String country = requiredBodyText(body, "country", "国家/地区不能为空");
        String schoolName = requiredBodyText(body, "schoolName", "院校名称不能为空");
        String programName = requiredBodyText(body, "programName", "项目名称不能为空");
        String degree = requiredBodyText(body, "degree", "学位不能为空");
        String subjectArea = requiredBodyText(body, "subjectArea", "学科领域不能为空");
        if (schoolProgramRepository.existsBySchoolNameAndProgramName(schoolName, programName)) {
            throw new BusinessException("该院校项目已存在");
        }
        StudyAbroadSchoolProgram item = StudyAbroadSchoolProgram.builder()
            .country(country)
            .schoolName(schoolName)
            .programName(programName)
            .degree(degree)
            .subjectArea(subjectArea)
            .qsRank(bodyText(body, "qsRank", null))
            .theRank(bodyText(body, "theRank", null))
            .usNewsRank(bodyText(body, "usNewsRank", null))
            .tuitionRange(bodyText(body, "tuitionRange", null))
            .durationText(bodyText(body, "durationText", null))
            .deadlineText(bodyText(body, "deadlineText", null))
            .applicationRequirements(bodyText(body, "applicationRequirements", null))
            .visaPolicy(bodyText(body, "visaPolicy", null))
            .employmentPolicy(bodyText(body, "employmentPolicy", null))
            .partnerProgram(bodyBoolean(body, "partnerProgram", false))
            .partnerNote(bodyText(body, "partnerNote", null))
            .riskTags(bodyText(body, "riskTags", null))
            .riskSummary(bodyText(body, "riskSummary", null))
            .sourceNote(bodyText(body, "sourceNote", null))
            .policyUpdatedAt(bodyDate(body, "policyUpdatedAt"))
            .build();
        return toSchoolProgramMap(schoolProgramRepository.save(item));
    }

    @Transactional
    public Map<String, Object> adminUpdateSchoolProgram(Long id, Map<String, Object> body) {
        StudyAbroadSchoolProgram item = schoolProgramRepository.findById(id)
            .orElseThrow(() -> new BusinessException("院校项目不存在"));
        updateText(body, "country", item::setCountry);
        updateText(body, "schoolName", item::setSchoolName);
        updateText(body, "programName", item::setProgramName);
        updateText(body, "degree", item::setDegree);
        updateText(body, "subjectArea", item::setSubjectArea);
        updateText(body, "qsRank", item::setQsRank);
        updateText(body, "theRank", item::setTheRank);
        updateText(body, "usNewsRank", item::setUsNewsRank);
        updateText(body, "tuitionRange", item::setTuitionRange);
        updateText(body, "durationText", item::setDurationText);
        updateText(body, "deadlineText", item::setDeadlineText);
        updateText(body, "applicationRequirements", item::setApplicationRequirements);
        updateText(body, "visaPolicy", item::setVisaPolicy);
        updateText(body, "employmentPolicy", item::setEmploymentPolicy);
        updateText(body, "partnerNote", item::setPartnerNote);
        updateText(body, "riskTags", item::setRiskTags);
        updateText(body, "riskSummary", item::setRiskSummary);
        updateText(body, "sourceNote", item::setSourceNote);
        if (body.containsKey("partnerProgram")) {
            item.setPartnerProgram(bodyBoolean(body, "partnerProgram", false));
        }
        if (body.containsKey("policyUpdatedAt")) {
            item.setPolicyUpdatedAt(bodyDate(body, "policyUpdatedAt"));
        }
        return toSchoolProgramMap(schoolProgramRepository.save(item));
    }

    @Transactional
    public void adminDeleteSchoolProgram(Long id) {
        StudyAbroadSchoolProgram item = schoolProgramRepository.findById(id)
            .orElseThrow(() -> new BusinessException("院校项目不存在"));
        schoolProgramRepository.delete(item);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> adminGetAdmissionCasesPage(Map<String, String> params) {
        Page<StudyAbroadAdmissionCase> pageResult = admissionCaseRepository.searchPage(
            normalizeFilter(params.get("country")),
            normalizeFilter(params.get("result")),
            normalizeFilter(params.get("major")),
            normalizeFilter(params.get("keyword")),
            PageRequest.of(parsePage(params.get("page")), parseSize(params.get("size")),
                Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return pageMap(pageResult, pageResult.getContent().stream().map(this::toAdmissionCaseMap).toList());
    }

    @Transactional
    public void adminDeleteAdmissionCase(Long id) {
        StudyAbroadAdmissionCase item = admissionCaseRepository.findById(id)
            .orElseThrow(() -> new BusinessException("案例不存在"));
        admissionCaseRepository.delete(item);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> adminGetExperiencesPage(Map<String, String> params) {
        Page<StudyAbroadExperience> pageResult = experienceRepository.searchPage(
            normalizeFilter(params.get("country")),
            normalizeFilter(params.get("topic")),
            normalizeFilter(params.get("keyword")),
            PageRequest.of(parsePage(params.get("page")), parseSize(params.get("size")),
                Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return pageMap(pageResult, pageResult.getContent().stream().map(this::toExperienceMap).toList());
    }

    @Transactional
    public void adminDeleteExperience(Long id) {
        StudyAbroadExperience item = experienceRepository.findById(id)
            .orElseThrow(() -> new BusinessException("经验不存在"));
        experienceRepository.delete(item);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAdminDashboard() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("totalSchools", schoolProgramRepository.count());
        map.put("totalAdmissionCases", admissionCaseRepository.count());
        map.put("totalExperiences", experienceRepository.count());
        return map;
    }

    private User ensureUser(Long userId) {
        if (userId == null) {
            throw new BusinessException("请先登录后使用留学管理功能");
        }
        return userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("用户不存在"));
    }

    private String normalizeTimelineStatus(String status) {
        String normalized = status == null || status.isBlank() ? "todo" : status.trim();
        if (!VALID_TIMELINE_STATUSES.contains(normalized)) {
            throw new BusinessException("时间线状态无效");
        }
        return normalized;
    }

    private StudyAbroadApplication findOwnedApplication(Long userId, Long applicationId) {
        if (applicationId == null) {
            return null;
        }
        return applicationRepository.findByIdAndUserId(applicationId, userId)
            .orElseThrow(() -> new BusinessException("申请项目不存在或无权限操作"));
    }

    private String normalizeApplicationStatus(String status) {
        String normalized = status == null || status.isBlank() ? "planning" : status.trim();
        if (!VALID_APPLICATION_STATUSES.contains(normalized)) {
            throw new BusinessException("申请状态无效");
        }
        return normalized;
    }

    private String normalizePriority(String priority) {
        String normalized = priority == null || priority.isBlank() ? "match" : priority.trim();
        if (!VALID_PRIORITIES.contains(normalized)) {
            throw new BusinessException("申请梯度无效");
        }
        return normalized;
    }

    private String normalizeAdmissionResult(String result) {
        String normalized = result == null || result.isBlank() ? "admit" : result.trim();
        if (!VALID_ADMISSION_RESULTS.contains(normalized)) {
            throw new BusinessException("录取结果状态无效");
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

    private Map<String, Object> pageMap(Page<?> pageResult, List<Map<String, Object>> content) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("content", content);
        map.put("page", pageResult.getNumber());
        map.put("size", pageResult.getSize());
        map.put("totalElements", pageResult.getTotalElements());
        map.put("totalPages", Math.max(1, pageResult.getTotalPages()));
        return map;
    }

    private int parsePage(String value) {
        try {
            return Math.max(0, Integer.parseInt(normalize(value, "0")));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private int parseSize(String value) {
        try {
            return Math.max(1, Math.min(Integer.parseInt(normalize(value, "20")), 100));
        } catch (NumberFormatException e) {
            return 20;
        }
    }

    private Boolean parseBooleanFilter(String value) {
        if (value == null || value.isBlank() || "all".equalsIgnoreCase(value.trim())) {
            return null;
        }
        return Boolean.parseBoolean(value.trim());
    }

    private String requiredBodyText(Map<String, Object> body, String key, String message) {
        String value = bodyText(body, key, null);
        if (value == null || value.isBlank()) {
            throw new BusinessException(message);
        }
        return value;
    }

    private String bodyText(Map<String, Object> body, String key, String fallback) {
        Object value = body.get(key);
        if (value == null) {
            return fallback;
        }
        String text = String.valueOf(value).trim();
        return text.isBlank() ? fallback : text;
    }

    private Boolean bodyBoolean(Map<String, Object> body, String key, Boolean fallback) {
        Object value = body.get(key);
        if (value == null) {
            return fallback;
        }
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private LocalDate bodyDate(Map<String, Object> body, String key) {
        String value = bodyText(body, key, null);
        if (value == null) {
            return null;
        }
        try {
            return LocalDate.parse(value);
        } catch (RuntimeException e) {
            throw new BusinessException("日期格式应为 yyyy-MM-dd");
        }
    }

    private void updateText(Map<String, Object> body, String key, Consumer<String> setter) {
        if (body.containsKey(key)) {
            setter.accept(bodyText(body, key, null));
        }
    }

    private Map<String, Object> toExperienceMap(StudyAbroadExperience item) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", item.getId());
        map.put("authorId", item.getAuthor() != null ? item.getAuthor().getId() : null);
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

    private Map<String, Object> toAdmissionCaseMap(StudyAbroadAdmissionCase item) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", item.getId());
        map.put("authorId", item.getAuthor() != null ? item.getAuthor().getId() : null);
        map.put("applicationYear", item.getApplicationYear());
        map.put("studentMajor", item.getStudentMajor());
        map.put("gpa", item.getGpa());
        map.put("rankPercent", item.getRankPercent());
        map.put("languageType", item.getLanguageType());
        map.put("languageScore", item.getLanguageScore());
        map.put("standardizedScore", item.getStandardizedScore());
        map.put("softBackground", item.getSoftBackground());
        map.put("country", item.getCountry());
        map.put("school", item.getSchool());
        map.put("program", item.getProgram());
        map.put("degree", item.getDegree());
        map.put("admissionResult", item.getAdmissionResult());
        map.put("scholarship", item.getScholarship());
        map.put("applicationMode", item.getApplicationMode());
        map.put("tags", splitTags(item.getTags()));
        map.put("summary", item.getSummary());
        map.put("createdAt", item.getCreatedAt() != null ? item.getCreatedAt().toString() : null);
        map.put("updatedAt", item.getUpdatedAt() != null ? item.getUpdatedAt().toString() : null);
        return map;
    }

    private Map<String, Object> toSchoolProgramMap(StudyAbroadSchoolProgram item) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", item.getId());
        map.put("country", item.getCountry());
        map.put("schoolName", item.getSchoolName());
        map.put("programName", item.getProgramName());
        map.put("degree", item.getDegree());
        map.put("subjectArea", item.getSubjectArea());
        map.put("qsRank", item.getQsRank());
        map.put("theRank", item.getTheRank());
        map.put("usNewsRank", item.getUsNewsRank());
        map.put("tuitionRange", item.getTuitionRange());
        map.put("durationText", item.getDurationText());
        map.put("deadlineText", item.getDeadlineText());
        map.put("applicationRequirements", item.getApplicationRequirements());
        map.put("visaPolicy", item.getVisaPolicy());
        map.put("employmentPolicy", item.getEmploymentPolicy());
        map.put("partnerProgram", item.getPartnerProgram());
        map.put("partnerNote", item.getPartnerNote());
        map.put("riskTags", splitTags(item.getRiskTags()));
        map.put("riskSummary", item.getRiskSummary());
        map.put("sourceNote", item.getSourceNote());
        map.put("policyUpdatedAt", item.getPolicyUpdatedAt() != null ? item.getPolicyUpdatedAt().toString() : null);
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
            throw new BusinessException("请至少上传一个文件");
        }
        List<MultipartFile> normalized = files.stream()
            .filter(file -> file != null && !file.isEmpty())
            .toList();
        if (normalized.isEmpty()) {
            throw new BusinessException("请至少上传一个文件");
        }
        return normalized;
    }

    private void validateAttachmentFile(MultipartFile file) {
        if (file.getSize() > MAX_ATTACHMENT_SIZE) {
            throw new BusinessException("文件 " + file.getOriginalFilename() + " 超过 10MB");
        }
    }
}
