package com.graduateplatform.job.service;

import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.common.service.CosService;
import com.graduateplatform.job.dto.*;
import com.graduateplatform.job.entity.*;
import com.graduateplatform.job.repository.*;
import com.qcloud.cos.model.COSObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class EmploymentService {
    private static final Set<String> VALID_STATUSES = Set.of(
        "TODO", "APPLIED", "SCREENING", "VIEWED", "WRITTEN_TEST", "FIRST_INTERVIEW",
        "SECOND_INTERVIEW", "HR_INTERVIEW", "FINAL_INTERVIEW", "INTERVIEW", "OFFER",
        "ACCEPTED", "DECLINED", "REJECTED", "WITHDRAWN", "CLOSED"
    );
    private static final long MAX_RESUME_FILE_SIZE = 10 * 1024 * 1024;
    private static final Map<String, String> RESUME_FILE_TYPES = Map.of(
        "pdf", "application/pdf",
        "doc", "application/msword",
        "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private final CareerFairRepository fairRepository;
    private final JobPostingRepository jobRepository;
    private final ResumeProfileRepository resumeRepository;
    private final ApplicationRecordRepository applicationRepository;
    private final JobSubscriptionPreferenceRepository preferenceRepository;
    private final EmploymentNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final CosService cosService;

    public EmploymentService(CareerFairRepository fairRepository,
                             JobPostingRepository jobRepository,
                             ResumeProfileRepository resumeRepository,
                             ApplicationRecordRepository applicationRepository,
                             JobSubscriptionPreferenceRepository preferenceRepository,
                             EmploymentNotificationRepository notificationRepository,
                             UserRepository userRepository,
                             CosService cosService) {
        this.fairRepository = fairRepository;
        this.jobRepository = jobRepository;
        this.resumeRepository = resumeRepository;
        this.applicationRepository = applicationRepository;
        this.preferenceRepository = preferenceRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.cosService = cosService;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listFairs(String city, String industry, String keyword) {
        LocalDateTime now = LocalDateTime.now();
        return deduplicateFairs(fairRepository.findActive(blankToNull(city), blankToNull(industry), blankToNull(keyword)), now)
            .stream().map(fair -> toFairMap(fair, now)).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listFairsPage(String city, String industry, String keyword,
                                             boolean includeExpired, Integer page, Integer size) {
        int pageNumber = Math.max(page == null ? 1 : page, 1);
        int pageSize = Math.min(Math.max(size == null ? 6 : size, 1), 50);
        LocalDateTime now = LocalDateTime.now();
        List<CareerFair> fairs = deduplicateFairs(
                fairRepository.findActive(blankToNull(city), blankToNull(industry), blankToNull(keyword)), now)
            .stream()
            .filter(fair -> includeExpired || !isFairExpired(fair, now))
            .sorted(fairListComparator(now))
            .toList();
        int fromIndex = Math.min((pageNumber - 1) * pageSize, fairs.size());
        int toIndex = Math.min(fromIndex + pageSize, fairs.size());
        List<CareerFair> pageItems = fairs.subList(fromIndex, toIndex);
        int totalPages = Math.max(1, (int) Math.ceil((double) fairs.size() / pageSize));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", pageItems.stream().map(fair -> toFairMap(fair, now)).toList());
        result.put("page", pageNumber);
        result.put("size", pageSize);
        result.put("totalPages", totalPages);
        result.put("totalItems", fairs.size());
        result.put("includeExpired", includeExpired);
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> fairDetail(Long id) {
        CareerFair fair = fairRepository.findById(id).filter(CareerFair::getActive)
            .orElseThrow(() -> new BusinessException("招聘会不存在或已停用"));
        return toFairMap(fair);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listPostings(String city, String industry, String roleType, String keyword) {
        return jobRepository.findActive(blankToNull(city), blankToNull(industry), blankToNull(roleType), blankToNull(keyword))
            .stream().map(this::toJobMap).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listPostingsPage(String city, String industry, String roleType, String keyword,
                                                Integer page, Integer size) {
        List<JobPosting> jobs = jobRepository.findActive(
            blankToNull(city), blankToNull(industry), blankToNull(roleType), blankToNull(keyword));
        return pageResult(jobs, page, size, this::toJobMap);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> postingDetail(Long id) {
        JobPosting job = jobRepository.findById(id).filter(JobPosting::getActive)
            .orElseThrow(() -> new BusinessException("岗位不存在或已停用"));
        return toJobMap(job);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPreference(Long userId) {
        ensureUser(userId);
        return preferenceRepository.findByUserId(userId).map(this::toPreferenceMap).orElseGet(LinkedHashMap::new);
    }

    @Transactional
    public Map<String, Object> savePreference(Long userId, JobSubscriptionPreferenceRequest req) {
        User user = ensureUser(userId);
        JobSubscriptionPreference pref = preferenceRepository.findByUserId(userId)
            .orElseGet(() -> JobSubscriptionPreference.builder().user(user).build());
        pref.setCities(trim(req.getCities()));
        pref.setIndustries(trim(req.getIndustries()));
        pref.setRoleTypes(trim(req.getRoleTypes()));
        pref.setSalaryRange(trim(req.getSalaryRange()));
        pref.setCompanyTypes(trim(req.getCompanyTypes()));
        pref.setActive(req.getActive() == null || req.getActive());
        return toPreferenceMap(preferenceRepository.save(pref));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getResume(Long userId) {
        ensureUser(userId);
        return resumeRepository.findByUserId(userId).map(this::toResumeMap).orElseGet(LinkedHashMap::new);
    }

    @Transactional
    public Map<String, Object> upsertResume(Long userId, ResumeProfileRequest req) {
        User user = ensureUser(userId);
        ResumeProfile resume = resumeRepository.findByUserId(userId)
            .orElseGet(() -> ResumeProfile.builder().user(user).build());
        String templateType = trim(req.getTemplateType());
        if (templateType != null) {
            resume.setTemplateType(templateType);
        } else if (trim(resume.getTemplateType()) == null) {
            resume.setTemplateType("default");
        }
        resume.setTargetRole(trim(req.getTargetRole()));
        resume.setExpectedCities(trim(req.getExpectedCities()));
        resume.setExpectedIndustries(trim(req.getExpectedIndustries()));
        resume.setExpectedSalary(trim(req.getExpectedSalary()));
        resume.setEducationLevel(trim(firstNonBlank(req.getEducationLevel(), req.getHighestEducation())));
        resume.setMajor(trim(req.getMajor()));
        resume.setPhone(trim(req.getPhone()));
        resume.setEmail(trim(req.getEmail()));
        resume.setSkillTags(trim(req.getSkillTags()));
        resume.setProjectKeywords(trim(req.getProjectKeywords()));
        resume.setInternshipKeywords(trim(req.getInternshipKeywords()));
        resume.setCertificates(trim(req.getCertificates()));
        resume.setPortfolioUrl(trim(req.getPortfolioUrl()));
        resume.setBaseInfo(trim(req.getBaseInfo()));
        resume.setEducation(trim(req.getEducation()));
        resume.setProjects(trim(req.getProjects()));
        resume.setInternships(trim(req.getInternships()));
        resume.setSkills(trim(req.getSkills()));
        resume.setSelfEvaluation(trim(req.getSelfEvaluation()));
        return toResumeMap(resumeRepository.save(resume));
    }

    @Transactional
    public Map<String, Object> uploadResumeFile(Long userId, MultipartFile file) {
        User user = ensureUser(userId);
        validateResumeFile(file);
        ResumeProfile resume = resumeRepository.findByUserId(userId)
            .orElseGet(() -> ResumeProfile.builder().user(user).build());
        String oldCosKey = resume.getResumeCosKey();
        String originalFileName = safeOriginalFilename(file.getOriginalFilename());
        String contentType = normalizedResumeContentType(originalFileName, file.getContentType());
        String cosKey = buildResumeCosKey(userId, originalFileName);

        try {
            cosService.uploadFile(file.getInputStream(), file.getSize(), cosKey, contentType);
        } catch (IOException e) {
            throw new BusinessException("简历文件读取失败，请重新选择文件");
        }

        resume.setResumeFileName(originalFileName);
        resume.setResumeFileSize(file.getSize());
        resume.setResumeFileType(contentType);
        resume.setResumeCosKey(cosKey);
        resume.setResumeUploadedAt(LocalDateTime.now());
        Map<String, Object> result = toResumeMap(resumeRepository.saveAndFlush(resume));
        deleteCosObjectBestEffort(oldCosKey, "replace");
        return result;
    }

    @Transactional(readOnly = true)
    public ResumeFileDownload downloadResumeFile(Long userId) {
        ensureUser(userId);
        ResumeProfile resume = resumeRepository.findByUserId(userId)
            .orElseThrow(() -> new BusinessException("请先上传简历附件"));
        if (!hasText(resume.getResumeCosKey())) {
            throw new BusinessException("请先上传简历附件");
        }
        COSObject object = cosService.getObject(resume.getResumeCosKey());
        return new ResumeFileDownload(object, resume.getResumeFileName(), resume.getResumeFileSize(), resume.getResumeFileType());
    }

    @Transactional
    public Map<String, Object> deleteResumeFile(Long userId) {
        ensureUser(userId);
        ResumeProfile resume = resumeRepository.findByUserId(userId)
            .orElseThrow(() -> new BusinessException("请先上传简历附件"));
        String oldCosKey = resume.getResumeCosKey();
        if (!hasText(oldCosKey)) {
            return toResumeMap(resume);
        }
        resume.setResumeFileName(null);
        resume.setResumeFileSize(null);
        resume.setResumeFileType(null);
        resume.setResumeCosKey(null);
        resume.setResumeUploadedAt(null);
        Map<String, Object> result = toResumeMap(resumeRepository.saveAndFlush(resume));
        deleteCosObjectBestEffort(oldCosKey, "delete");
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> recommendations(Long userId, Map<String, String> filters) {
        return recommendationResults(userId, filters);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> recommendationsPage(Long userId, Map<String, String> filters, Integer page, Integer size) {
        return pageResult(recommendationResults(userId, filters), page, size, item -> item);
    }

    private List<Map<String, Object>> recommendationResults(Long userId, Map<String, String> filters) {
        User user = ensureUser(userId);
        JobSubscriptionPreference pref = preferenceRepository.findByUserId(userId).orElse(null);
        ResumeProfile resume = resumeRepository.findByUserId(userId).orElse(null);
        Map<String, String> normalizedFilters = filters == null ? Map.of() : filters;
        List<JobPosting> jobs = jobRepository.findByActiveTrueOrderByCreatedAtDesc();
        List<JobPosting> candidates = jobs.stream()
            .filter(job -> recommendationFilterPasses(job, normalizedFilters))
            .toList();
        if (candidates.isEmpty()) {
            return List.of();
        }

        List<String> queryTokens = profileTokens(user, pref, resume, normalizedFilters);
        Map<JobPosting, List<String>> documentTokens = new LinkedHashMap<>();
        Map<String, Integer> documentFrequency = new LinkedHashMap<>();
        for (JobPosting job : candidates) {
            List<String> tokens = jobProfileTokens(job);
            documentTokens.put(job, tokens);
            new HashSet<>(tokens).forEach(token -> documentFrequency.merge(token, 1, Integer::sum));
        }
        double averageDocumentLength = documentTokens.values().stream().mapToInt(List::size).average().orElse(1.0);

        List<RecommendationCandidate> scored = new ArrayList<>();
        double maxBm25 = 0.0;
        for (JobPosting job : candidates) {
            List<String> tokens = documentTokens.get(job);
            double cosine = tfIdfCosine(queryTokens, tokens, documentFrequency, candidates.size());
            double bm25 = bm25(queryTokens, tokens, documentFrequency, candidates.size(), averageDocumentLength);
            maxBm25 = Math.max(maxBm25, bm25);
            scored.add(new RecommendationCandidate(job, cosine, bm25, preferenceScore(job, user, pref, resume, normalizedFilters)));
        }

        final double bm25Max = maxBm25;
        return scored.stream()
            .map(candidate -> algorithmRecommendationMap(candidate, bm25Max))
            .sorted((a, b) -> Integer.compare((Integer) b.get("matchScore"), (Integer) a.get("matchScore")))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listApplications(Long userId) {
        ensureUser(userId);
        return applicationRepository.findByUserIdOrderByAppliedAtDescCreatedAtDesc(userId)
            .stream().map(this::toApplicationMap).toList();
    }

    @Transactional
    public Map<String, Object> createApplication(Long userId, ApplicationRecordRequest req) {
        User user = ensureUser(userId);
        JobPosting job = resolveJob(req.getJobPostingId());
        ApplicationRecord record = ApplicationRecord.builder()
            .user(user)
            .companyName(trimRequired(firstNonBlank(req.getCompanyName(), job == null ? null : job.getCompanyName()), "公司名称不能为空"))
            .jobTitle(trimRequired(firstNonBlank(req.getJobTitle(), job == null ? null : job.getTitle()), "必填字段不能为空"))
            .jobPosting(job)
            .status(normalizeStatus(req.getStatus()))
            .appliedAt(req.getAppliedAt())
            .nextStepAt(req.getNextStepAt())
            .notes(trim(req.getNotes()))
            .build();
        applyApplicationDetails(record, req, job, true);
        applyCurrentResumeSnapshot(record, userId, req.getResumeFileName());
        return toApplicationMap(applicationRepository.save(record));
    }

    @Transactional
    public Map<String, Object> updateApplication(Long userId, Long id, ApplicationRecordRequest req) {
        ensureUser(userId);
        ApplicationRecord record = applicationRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException("投递记录不存在或不属于当前用户"));
        JobPosting job = resolveJob(req.getJobPostingId());
        boolean linkedJobChanged = !Objects.equals(record.getJobPosting() == null ? null : record.getJobPosting().getId(), req.getJobPostingId());
        record.setCompanyName(trimRequired(applicationSnapshotValue(req.getCompanyName(), record.getCompanyName(), job == null ? null : job.getCompanyName(), linkedJobChanged), "公司名称不能为空"));
        record.setJobTitle(trimRequired(applicationSnapshotValue(req.getJobTitle(), record.getJobTitle(), job == null ? null : job.getTitle(), linkedJobChanged), "必填字段不能为空"));
        record.setJobPosting(job);
        record.setStatus(normalizeStatus(req.getStatus()));
        record.setAppliedAt(req.getAppliedAt() == null ? record.getAppliedAt() : req.getAppliedAt());
        record.setNextStepAt(req.getNextStepAt());
        record.setNotes(trim(req.getNotes()));
        applyApplicationDetails(record, req, job, linkedJobChanged);
        applyCurrentResumeSnapshot(record, userId, req.getResumeFileName());
        return toApplicationMap(applicationRepository.save(record));
    }

    @Transactional
    public Map<String, Object> deleteApplication(Long userId, Long id) {
        ensureUser(userId);
        ApplicationRecord record = applicationRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException("投递记录不存在或不属于当前用户"));
        applicationRepository.delete(record);
        return Map.of("deleted", true, "id", id);
    }

    private void applyApplicationDetails(ApplicationRecord record, ApplicationRecordRequest req, JobPosting job, boolean refreshFromJob) {
        record.setCity(trim(applicationSnapshotValue(req.getCity(), record.getCity(), job == null ? null : job.getCity(), refreshFromJob)));
        record.setIndustry(trim(applicationSnapshotValue(req.getIndustry(), record.getIndustry(), job == null ? null : job.getIndustry(), refreshFromJob)));
        record.setCompanyType(trim(applicationSnapshotValue(req.getCompanyType(), record.getCompanyType(), job == null ? null : job.getCompanyType(), refreshFromJob)));
        record.setRoleType(trim(applicationSnapshotValue(req.getRoleType(), record.getRoleType(), job == null ? null : job.getRoleType(), refreshFromJob)));
        record.setSalaryRange(trim(applicationSnapshotValue(req.getSalaryRange(), record.getSalaryRange(), job == null ? null : job.getSalaryRange(), refreshFromJob)));
        record.setEducationRequirement(trim(applicationSnapshotValue(req.getEducationRequirement(), record.getEducationRequirement(), job == null ? null : job.getEducationRequirement(), refreshFromJob)));
        record.setMajorKeywords(trim(applicationSnapshotValue(req.getMajorKeywords(), record.getMajorKeywords(), job == null ? null : job.getMajorKeywords(), refreshFromJob)));
        record.setSkillTags(trim(applicationSnapshotValue(req.getSkillTags(), record.getSkillTags(), job == null ? null : job.getSkillTags(), refreshFromJob)));
        record.setApplyUrl(trim(applicationSnapshotValue(req.getApplyUrl(), record.getApplyUrl(), job == null ? null : job.getApplyUrl(), refreshFromJob)));
        record.setApplicationChannel(applicationOptionalText(req.getApplicationChannel(), record.getApplicationChannel()));
        record.setContactName(applicationOptionalText(req.getContactName(), record.getContactName()));
        record.setContactInfo(applicationOptionalText(req.getContactInfo(), record.getContactInfo()));
        record.setInterviewRound(applicationOptionalText(req.getInterviewRound(), record.getInterviewRound()));
        record.setInterviewMethod(applicationOptionalText(req.getInterviewMethod(), record.getInterviewMethod()));
        record.setInterviewLocation(applicationOptionalText(req.getInterviewLocation(), record.getInterviewLocation()));
        record.setExpectedSalary(applicationOptionalText(req.getExpectedSalary(), record.getExpectedSalary()));
        record.setOfferSalary(applicationOptionalText(req.getOfferSalary(), record.getOfferSalary()));
        record.setLastFollowUpAt(req.getLastFollowUpAt());
        record.setFailureReason(applicationOptionalText(req.getFailureReason(), record.getFailureReason()));
    }

    private String applicationSnapshotValue(String requestedValue, String currentValue, String jobValue, boolean refreshFromJob) {
        return refreshFromJob
            ? firstNonBlank(requestedValue, jobValue, currentValue)
            : firstNonBlank(requestedValue, currentValue);
    }

    private String applicationOptionalText(String requestedValue, String currentValue) {
        return requestedValue == null ? currentValue : trim(requestedValue);
    }

    private void applyCurrentResumeSnapshot(ApplicationRecord record, Long userId, String requestedResumeFileName) {
        String currentResumeFileName = resumeRepository.findByUserId(userId)
            .map(ResumeProfile::getResumeFileName)
            .orElse(null);
        record.setResumeFileName(trim(firstNonBlank(requestedResumeFileName, record.getResumeFileName(), currentResumeFileName)));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> listNotifications(Long userId) {
        ensureUser(userId);
        List<Map<String, Object>> items = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
            .stream().map(this::toNotificationMap).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("unreadCount", notificationRepository.countByUserIdAndReadFlagFalse(userId));
        result.put("totalItems", items.size());
        return result;
    }

    @Transactional
    public Map<String, Object> markNotificationRead(Long userId, Long notificationId) {
        ensureUser(userId);
        EmploymentNotification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
            .orElseThrow(() -> new BusinessException("通知不存在或不属于当前用户"));
        notification.setReadFlag(true);
        notification.setReadAt(LocalDateTime.now());
        return toNotificationMap(notificationRepository.save(notification));
    }

    @Transactional
    public Map<String, Object> deleteNotification(Long userId, Long notificationId) {
        ensureUser(userId);
        EmploymentNotification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
            .orElseThrow(() -> new BusinessException("通知不存在或不属于当前用户"));
        notificationRepository.delete(notification);
        return Map.of("deleted", true, "id", notificationId);
    }

    @Transactional
    public List<Map<String, Object>> adminFairs() {
        cleanupDuplicateFairs();
        return fairRepository.findAll().stream()
            .sorted(Comparator.comparing(CareerFair::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(this::toFairMap).toList();
    }

    @Transactional
    public Map<String, Object> adminFairsPage(String keyword, Boolean active, Integer page, Integer size) {
        cleanupDuplicateFairs();
        LocalDateTime now = LocalDateTime.now();
        List<CareerFair> fairs = fairRepository.findAll().stream()
            .filter(fair -> active == null || Objects.equals(fair.getActive(), active))
            .filter(fair -> matchesAdminKeyword(keyword, fair.getTitle(), fair.getCompanyName(), fair.getCity(),
                fair.getIndustry(), fair.getLocation(), fair.getTargetRoles(), fair.getApplyUrl()))
            .sorted(Comparator.comparing(CareerFair::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .toList();
        return pageResult(fairs, page, size, fair -> toFairMap(fair, now));
    }

    @Transactional
    public Map<String, Object> createFair(CareerFairRequest req) {
        validateFairDuplicate(null, req);
        CareerFair fair = new CareerFair();
        applyFair(fair, req);
        return toFairMap(fairRepository.save(fair));
    }

    @Transactional
    public Map<String, Object> updateFair(Long id, CareerFairRequest req) {
        CareerFair fair = fairRepository.findById(id).orElseThrow(() -> new BusinessException("招聘会不存在"));
        validateFairDuplicate(id, req);
        applyFair(fair, req);
        return toFairMap(fairRepository.save(fair));
    }

    @Transactional
    public Map<String, Object> deleteFair(Long id) {
        CareerFair fair = fairRepository.findById(id).orElseThrow(() -> new BusinessException("招聘会不存在"));
        fairRepository.delete(fair);
        return Map.of("deleted", true, "id", id);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> adminJobs() {
        return jobRepository.findAll().stream()
            .sorted(Comparator.comparing(JobPosting::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(this::toJobMap).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> adminJobsPage(String keyword, Boolean active, Integer page, Integer size) {
        List<JobPosting> jobs = jobRepository.findAll().stream()
            .filter(job -> active == null || Objects.equals(job.getActive(), active))
            .filter(job -> matchesAdminKeyword(keyword, job.getTitle(), job.getCompanyName(), job.getCity(),
                job.getIndustry(), job.getCompanyType(), job.getRoleType(), job.getSalaryRange(), job.getApplyUrl()))
            .sorted(Comparator.comparing(JobPosting::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .toList();
        return pageResult(jobs, page, size, this::toJobMap);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> adminResumeSummaries() {
        List<User> users = userRepository.findAll().stream()
            .filter(user -> "user".equalsIgnoreCase(defaultString(user.getRole(), "")))
            .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .toList();
        Map<Long, ResumeProfile> resumesByUserId = new HashMap<>();
        List<Long> userIds = users.stream().map(User::getId).filter(Objects::nonNull).toList();
        for (ResumeProfile resume : resumeRepository.findByUserIdIn(userIds)) {
            if (resume.getUser() != null && resume.getUser().getId() != null) {
                resumesByUserId.put(resume.getUser().getId(), resume);
            }
        }
        return users.stream()
            .map(user -> toAdminResumeSummary(user, resumesByUserId.get(user.getId())))
            .toList();
    }

    @Transactional
    public Map<String, Object> createJob(JobPostingRequest req) {
        JobPosting job = new JobPosting();
        applyJob(job, req);
        return toJobMap(jobRepository.save(job));
    }

    @Transactional
    public Map<String, Object> updateJob(Long id, JobPostingRequest req) {
        JobPosting job = jobRepository.findById(id).orElseThrow(() -> new BusinessException("岗位不存在"));
        applyJob(job, req);
        return toJobMap(jobRepository.save(job));
    }

    @Transactional
    public Map<String, Object> deleteJob(Long id) {
        JobPosting job = jobRepository.findById(id).orElseThrow(() -> new BusinessException("岗位不存在"));
        if (applicationRepository.existsByJobPostingId(id)) {
            job.setActive(false);
            jobRepository.save(job);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("deleted", false);
            result.put("deactivated", true);
            result.put("id", id);
            return result;
        }
        jobRepository.delete(job);
        return Map.of("deleted", true, "id", id);
    }

    @Transactional
    public Map<String, Object> triggerNotification(NotificationTriggerRequest req) {
        String type = req.getRelatedType() == null ? "" : req.getRelatedType().trim().toUpperCase(Locale.ROOT);
        NotificationSource source = resolveNotificationSource(type, req.getRelatedId());
        List<JobSubscriptionPreference> prefs = preferenceRepository.findByActiveTrue();
        List<EmploymentNotification> created = new ArrayList<>();
        int skippedDuplicateCount = 0;
        for (JobSubscriptionPreference pref : prefs) {
            Long userId = pref.getUser() == null ? null : pref.getUser().getId();
            if (matchesPreference(pref, source.city(), source.industry(), source.roleType(), source.companyType())) {
                if (userId != null && notificationRepository.existsByUserIdAndRelatedTypeAndRelatedId(userId, type, req.getRelatedId())) {
                    skippedDuplicateCount++;
                    continue;
                }
                EmploymentNotification notification = EmploymentNotification.builder()
                    .user(pref.getUser())
                    .title(source.title())
                    .content(source.content())
                    .relatedType(type)
                    .relatedId(req.getRelatedId())
                    .readFlag(false)
                    .build();
                created.add(notificationRepository.save(notification));
            }
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("createdCount", created.size());
        result.put("skippedDuplicateCount", skippedDuplicateCount);
        result.put("notifications", created.stream().map(this::toNotificationMap).toList());
        return result;
    }

    private void applyFair(CareerFair fair, CareerFairRequest req) {
        validateFairTimes(req);
        validateHttpUrl(req.getApplyUrl(), "招聘会申请链接必须是 http 或 https 地址");
        fair.setTitle(trimRequired(req.getTitle(), "招聘会标题不能为空"));
        fair.setCompanyName(trimRequired(req.getCompanyName(), "公司名称不能为空"));
        fair.setCity(trim(req.getCity()));
        fair.setIndustry(trim(req.getIndustry()));
        fair.setTargetRoles(trim(req.getTargetRoles()));
        fair.setLocation(trim(req.getLocation()));
        fair.setStartTime(req.getStartTime());
        fair.setEndTime(req.getEndTime());
        fair.setApplyDeadline(req.getApplyDeadline());
        fair.setApplyUrl(trim(req.getApplyUrl()));
        fair.setBusinessKey(fairBusinessKey(req.getTitle(), req.getCompanyName(), req.getStartTime()));
        fair.setDescription(trim(req.getDescription()));
        fair.setActive(req.getActive() == null || req.getActive());
    }

    private void validateFairDuplicate(Long currentId, CareerFairRequest req) {
        String title = trimRequired(req.getTitle(), "招聘会标题不能为空");
        String companyName = trimRequired(req.getCompanyName(), "公司名称不能为空");
        String businessKey = fairBusinessKey(title, companyName, req.getStartTime());
        if (fairRepository.existsDuplicateBusinessKey(businessKey, currentId)
            || fairRepository.existsDuplicate(title, companyName, req.getStartTime(), currentId)) {
            throw new BusinessException("相同标题、公司和开始时间的招聘会已存在");
        }
        String displayKey = fairDisplayKey(title, companyName, req.getLocation(), req.getApplyUrl());
        boolean duplicatedDisplay = fairRepository.findDuplicateCandidates(normalizedKey(title), normalizedKey(companyName), currentId)
            .stream()
            .anyMatch(fair -> displayKey.equals(fairDisplayKey(fair)));
        if (duplicatedDisplay) {
            throw new BusinessException("相同标题、公司、地点和申请链接的招聘会已存在");
        }
    }

    private void validateFairTimes(CareerFairRequest req) {
        if (req.getStartTime() != null && req.getEndTime() != null && req.getEndTime().isBefore(req.getStartTime())) {
            throw new BusinessException("招聘会结束时间不能早于开始时间");
        }
    }

    private void validateHttpUrl(String value, String message) {
        String url = trim(value);
        if (!hasText(url)) return;
        try {
            URI uri = URI.create(url);
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            if (!Set.of("http", "https").contains(scheme) || !hasText(uri.getHost())) {
                throw new BusinessException(message);
            }
        } catch (IllegalArgumentException ex) {
            throw new BusinessException(message);
        }
    }

    private void applyJob(JobPosting job, JobPostingRequest req) {
        validateHttpUrl(req.getApplyUrl(), "岗位申请链接必须是 http 或 https 地址");
        job.setTitle(trimRequired(req.getTitle(), "岗位名称不能为空"));
        job.setCompanyName(trimRequired(req.getCompanyName(), "公司名称不能为空"));
        job.setCity(trim(req.getCity()));
        job.setIndustry(trim(req.getIndustry()));
        job.setCompanyType(trim(req.getCompanyType()));
        job.setRoleType(trim(req.getRoleType()));
        job.setSalaryRange(trim(req.getSalaryRange()));
        job.setEducationRequirement(trim(req.getEducationRequirement()));
        job.setMajorKeywords(trim(req.getMajorKeywords()));
        job.setSkillTags(trim(req.getSkillTags()));
        job.setDescription(trim(req.getDescription()));
        job.setApplyUrl(trim(req.getApplyUrl()));
        job.setActive(req.getActive() == null || req.getActive());
    }

    private NotificationSource resolveNotificationSource(String type, Long id) {
        if ("FAIR".equals(type)) {
            CareerFair fair = fairRepository.findById(id).orElseThrow(() -> new BusinessException("招聘会不存在"));
            String cityText = hasText(fair.getCity()) ? "在" + fair.getCity() : "";
            return new NotificationSource("新的招聘会：" + fair.getTitle(),
                fair.getCompanyName() + "将" + cityText + "举办招聘会，请进入就业页面查看详情。",
                fair.getCity(), fair.getIndustry(), fair.getTargetRoles(), null);
        }
        if ("JOB".equals(type)) {
            JobPosting job = jobRepository.findById(id).orElseThrow(() -> new BusinessException("岗位不存在"));
            return new NotificationSource("新的匹配岗位：" + job.getTitle(),
                job.getCompanyName() + "发布了" + job.getTitle() + "岗位，请进入就业页面查看详情。",
                job.getCity(), job.getIndustry(), job.getRoleType(), job.getCompanyType());
        }
        throw new BusinessException("通知来源必须是 FAIR 或 JOB");
    }

    private boolean recommendationFilterPasses(JobPosting job, Map<String, String> filters) {
        String keyword = filterValue(filters, "keyword");
        String city = filterValue(filters, "city");
        String industry = filterValue(filters, "industry");
        String roleType = filterValue(filters, "roleType");
        String companyType = filterValue(filters, "companyType");
        String education = firstFilterValue(filters, "education", "educationRequirement");
        String major = firstFilterValue(filters, "major", "majorKeywords");
        String skills = firstFilterValue(filters, "skills", "skillTags");
        String salaryRange = filterValue(filters, "salaryRange");
        boolean onlyApplyable = Boolean.parseBoolean(defaultString(filterValue(filters, "onlyApplyable"), "false"));

        if (hasText(keyword) && !matchesJobKeyword(job, keyword)) {
            return false;
        }
        return manualTextFilterPasses(job.getCity(), city)
            && manualTextFilterPasses(job.getIndustry(), industry)
            && manualTextFilterPasses(job.getRoleType(), roleType)
            && manualTextFilterPasses(job.getCompanyType(), companyType)
            && manualRequirementFilterPasses(job.getEducationRequirement(), education)
            && manualRequirementFilterPasses(job.getMajorKeywords(), major)
            && manualRequirementFilterPasses(job.getSkillTags(), skills)
            && manualTextFilterPasses(job.getSalaryRange(), salaryRange)
            && (!onlyApplyable || hasText(job.getApplyUrl()));
    }

    private Map<String, Object> algorithmRecommendationMap(RecommendationCandidate candidate, double maxBm25) {
        JobPosting job = candidate.job();
        double bm25Score = maxBm25 <= 0 ? 0 : candidate.bm25() / maxBm25;
        double timeScore = timeDecayScore(job.getCreatedAt());
        double applyScore = hasText(job.getApplyUrl()) ? 1.0 : 0.0;
        double finalScore = 20
            + 40 * candidate.cosine()
            + 22 * bm25Score
            + 23 * candidate.preferenceScore()
            + 8 * timeScore
            + 7 * applyScore;
        Map<String, Object> map = toJobMap(job);
        map.put("matchScore", Math.min(100, Math.max(0, (int) Math.round(finalScore))));
        map.put("matchReasons", algorithmReasons(candidate, bm25Score, timeScore, applyScore));
        return map;
    }

    private List<String> algorithmReasons(RecommendationCandidate candidate, double bm25Score, double timeScore, double applyScore) {
        List<String> reasons = new ArrayList<>();
        if (candidate.cosine() >= 0.18) reasons.add("简历与岗位画像相似");
        if (bm25Score >= 0.45) reasons.add("岗位文本相关度高");
        if (candidate.preferenceScore() >= 0.50) reasons.add("求职偏好匹配");
        if (timeScore >= 0.80) reasons.add("近期发布岗位");
        if (applyScore > 0) reasons.add("可直接投递");
        if (reasons.isEmpty()) reasons.add("可作为备选岗位");
        return reasons.stream().limit(5).toList();
    }

    private List<String> profileTokens(User user, JobSubscriptionPreference pref, ResumeProfile resume, Map<String, String> filters) {
        return tokenize(joinRecommendationText(
            filterValue(filters, "keyword"),
            filterValue(filters, "city"),
            filterValue(filters, "industry"),
            filterValue(filters, "roleType"),
            filterValue(filters, "companyType"),
            firstFilterValue(filters, "education", "educationRequirement"),
            firstFilterValue(filters, "major", "majorKeywords"),
            firstFilterValue(filters, "skills", "skillTags"),
            filterValue(filters, "salaryRange"),
            user.getMajor(),
            pref == null ? null : pref.getCities(),
            pref == null ? null : pref.getIndustries(),
            pref == null ? null : pref.getRoleTypes(),
            pref == null ? null : pref.getCompanyTypes(),
            pref == null ? null : pref.getSalaryRange(),
            resume == null ? null : resume.getTargetRole(),
            resume == null ? null : resume.getExpectedCities(),
            resume == null ? null : resume.getExpectedIndustries(),
            resume == null ? null : resume.getExpectedSalary(),
            resume == null ? null : resume.getEducationLevel(),
            resume == null ? null : resume.getMajor(),
            resume == null ? null : resume.getSkillTags(),
            resume == null ? null : resume.getProjectKeywords(),
            resume == null ? null : resume.getInternshipKeywords(),
            resume == null ? null : resume.getCertificates(),
            resume == null ? null : resume.getBaseInfo(),
            resume == null ? null : resume.getEducation(),
            resume == null ? null : resume.getProjects(),
            resume == null ? null : resume.getInternships(),
            resume == null ? null : resume.getSkills(),
            resume == null ? null : resume.getSelfEvaluation()
        ));
    }

    private List<String> jobProfileTokens(JobPosting job) {
        return tokenize(joinRecommendationText(
            job.getTitle(),
            job.getCompanyName(),
            job.getCity(),
            job.getIndustry(),
            job.getCompanyType(),
            job.getRoleType(),
            job.getSalaryRange(),
            job.getEducationRequirement(),
            job.getMajorKeywords(),
            job.getSkillTags(),
            job.getDescription()
        ));
    }

    private double preferenceScore(JobPosting job, User user, JobSubscriptionPreference pref, ResumeProfile resume, Map<String, String> filters) {
        int matched = 0;
        int total = 0;

        String citySignal = firstNonBlank(filterValue(filters, "city"), pref == null ? null : pref.getCities(), resume == null ? null : resume.getExpectedCities());
        if (hasText(citySignal)) {
            total++;
            if (matchesAny(citySignal, job.getCity()) || matchesText(job.getCity(), citySignal)) matched++;
        }

        String industrySignal = firstNonBlank(filterValue(filters, "industry"), pref == null ? null : pref.getIndustries(), resume == null ? null : resume.getExpectedIndustries());
        if (hasText(industrySignal)) {
            total++;
            if (matchesAny(industrySignal, job.getIndustry()) || matchesText(job.getIndustry(), industrySignal)) matched++;
        }

        String roleSignal = firstNonBlank(filterValue(filters, "roleType"), pref == null ? null : pref.getRoleTypes(), resume == null ? null : resume.getTargetRole());
        if (hasText(roleSignal)) {
            total++;
            if (matchesAny(roleSignal, job.getRoleType()) || matchesText(job.getRoleType(), roleSignal) || matchesText(job.getTitle(), roleSignal)) matched++;
        }

        String companyTypeSignal = firstNonBlank(filterValue(filters, "companyType"), pref == null ? null : pref.getCompanyTypes());
        if (hasText(companyTypeSignal)) {
            total++;
            if (matchesAny(companyTypeSignal, job.getCompanyType()) || matchesText(job.getCompanyType(), companyTypeSignal)) matched++;
        }

        String educationSignal = firstNonBlank(firstFilterValue(filters, "education", "educationRequirement"), resume == null ? null : resume.getEducationLevel());
        if (hasText(educationSignal)) {
            total++;
            if (requirementMatches(job.getEducationRequirement(), educationSignal)) matched++;
        }

        String majorSignal = firstNonBlank(firstFilterValue(filters, "major", "majorKeywords"), user.getMajor(), resume == null ? null : resume.getMajor(), resume == null ? null : resume.getEducation());
        if (hasText(majorSignal)) {
            total++;
            if (matchesAnyCandidate(job.getMajorKeywords(), majorSignal)) matched++;
        }

        String skillSignal = firstNonBlank(firstFilterValue(filters, "skills", "skillTags"), resume == null ? null : resume.getSkillTags(), resume == null ? null : resume.getSkills(), resume == null ? null : resume.getProjectKeywords(), resume == null ? null : resume.getInternshipKeywords());
        if (hasText(skillSignal)) {
            total++;
            if (matchesAnyCandidate(job.getSkillTags(), skillSignal)) matched++;
        }

        String salarySignal = firstNonBlank(filterValue(filters, "salaryRange"), pref == null ? null : pref.getSalaryRange(), resume == null ? null : resume.getExpectedSalary());
        if (hasText(salarySignal)) {
            total++;
            if (matchesText(job.getSalaryRange(), salarySignal)) matched++;
        }

        return total == 0 ? 0 : (double) matched / total;
    }

    private String joinRecommendationText(String... values) {
        List<String> parts = new ArrayList<>();
        if (values != null) {
            for (String value : values) {
                if (hasText(value)) parts.add(value.trim());
            }
        }
        return String.join(" ", parts);
    }

    private List<String> tokenize(String text) {
        if (!hasText(text)) return List.of();
        List<String> tokens = new ArrayList<>();
        java.util.regex.Matcher matcher = java.util.regex.Pattern
            .compile("[\\p{IsHan}]+|[A-Za-z0-9+#.]+")
            .matcher(text.toLowerCase(Locale.ROOT));
        while (matcher.find()) {
            String token = matcher.group();
            if (token.length() <= 1) continue;
            tokens.add(token);
            if (containsChinese(token) && token.length() > 2) {
                int max = Math.min(4, token.length());
                for (int size = 2; size <= max; size++) {
                    for (int i = 0; i + size <= token.length(); i++) {
                        tokens.add(token.substring(i, i + size));
                    }
                }
            }
        }
        return tokens;
    }

    private boolean containsChinese(String token) {
        return token.codePoints().anyMatch(codePoint -> Character.UnicodeScript.of(codePoint) == Character.UnicodeScript.HAN);
    }

    private double tfIdfCosine(List<String> queryTokens, List<String> documentTokens, Map<String, Integer> documentFrequency, int documentCount) {
        if (queryTokens.isEmpty() || documentTokens.isEmpty()) return 0.0;
        Map<String, Double> queryVector = tfIdfVector(queryTokens, documentFrequency, documentCount);
        Map<String, Double> documentVector = tfIdfVector(documentTokens, documentFrequency, documentCount);
        double dot = 0;
        for (Map.Entry<String, Double> entry : queryVector.entrySet()) {
            dot += entry.getValue() * documentVector.getOrDefault(entry.getKey(), 0.0);
        }
        double queryNorm = vectorNorm(queryVector);
        double documentNorm = vectorNorm(documentVector);
        if (queryNorm == 0 || documentNorm == 0) return 0.0;
        return dot / (queryNorm * documentNorm);
    }

    private Map<String, Double> tfIdfVector(List<String> tokens, Map<String, Integer> documentFrequency, int documentCount) {
        Map<String, Long> counts = tokens.stream().collect(java.util.stream.Collectors.groupingBy(token -> token, LinkedHashMap::new, java.util.stream.Collectors.counting()));
        Map<String, Double> vector = new LinkedHashMap<>();
        int length = Math.max(tokens.size(), 1);
        for (Map.Entry<String, Long> entry : counts.entrySet()) {
            double tf = (double) entry.getValue() / length;
            vector.put(entry.getKey(), tf * inverseDocumentFrequency(entry.getKey(), documentFrequency, documentCount));
        }
        return vector;
    }

    private double bm25(List<String> queryTokens, List<String> documentTokens, Map<String, Integer> documentFrequency, int documentCount, double averageDocumentLength) {
        if (queryTokens.isEmpty() || documentTokens.isEmpty()) return 0.0;
        Map<String, Long> termFrequency = documentTokens.stream().collect(java.util.stream.Collectors.groupingBy(token -> token, java.util.stream.Collectors.counting()));
        Set<String> query = new LinkedHashSet<>(queryTokens);
        double k1 = 1.5;
        double b = 0.75;
        double score = 0.0;
        for (String token : query) {
            long frequency = termFrequency.getOrDefault(token, 0L);
            if (frequency == 0) continue;
            double denominator = frequency + k1 * (1 - b + b * documentTokens.size() / Math.max(averageDocumentLength, 1.0));
            score += inverseDocumentFrequency(token, documentFrequency, documentCount) * (frequency * (k1 + 1)) / denominator;
        }
        return score;
    }

    private double inverseDocumentFrequency(String token, Map<String, Integer> documentFrequency, int documentCount) {
        int df = documentFrequency.getOrDefault(token, 0);
        return Math.log(1 + (documentCount - df + 0.5) / (df + 0.5));
    }

    private double vectorNorm(Map<String, Double> vector) {
        return Math.sqrt(vector.values().stream().mapToDouble(value -> value * value).sum());
    }

    private double timeDecayScore(LocalDateTime createdAt) {
        if (createdAt == null) return 0.4;
        long days = Math.max(0, java.time.Duration.between(createdAt, LocalDateTime.now()).toDays());
        return Math.exp(-days / 30.0);
    }

    private String filterValue(Map<String, String> filters, String key) {
        if (filters == null || key == null) return null;
        return trim(filters.get(key));
    }

    private String firstFilterValue(Map<String, String> filters, String... keys) {
        if (keys == null) return null;
        for (String key : keys) {
            String value = filterValue(filters, key);
            if (hasText(value)) return value;
        }
        return null;
    }

    private boolean manualTextFilterPasses(String actual, String expected) {
        return !hasText(expected) || matchesText(actual, expected);
    }

    private boolean manualRequirementFilterPasses(String requirement, String expected) {
        return !hasText(expected) || requirementMatches(requirement, expected);
    }

    private boolean requirementMatches(String requirement, String value) {
        if (!hasText(value) || unlimited(requirement)) return true;
        return matchesText(requirement, value) || matchesAny(requirement, value);
    }

    private boolean unlimited(String requirement) {
        return !hasText(requirement) || requirement.contains("不限");
    }

    private boolean matchesJobKeyword(JobPosting job, String keyword) {
        return matchesText(job.getTitle(), keyword)
            || matchesText(job.getCompanyName(), keyword)
            || matchesText(job.getCity(), keyword)
            || matchesText(job.getIndustry(), keyword)
            || matchesText(job.getCompanyType(), keyword)
            || matchesText(job.getRoleType(), keyword)
            || matchesText(job.getDescription(), keyword);
    }

    private boolean matchesResumeRole(JobPosting job, String targetRole) {
        return hasText(targetRole) && (matchesText(job.getRoleType(), targetRole) || matchesText(job.getTitle(), targetRole));
    }

    private boolean matchesAnyCandidate(String source, String... candidates) {
        if (!hasText(source) || candidates == null) return false;
        for (String candidate : candidates) {
            if (matchesAny(source, candidate) || matchesText(source, candidate)) {
                return true;
            }
        }
        return false;
    }

    private boolean matchesPreference(JobSubscriptionPreference pref, String city, String industry, String roleType, String companyType) {
        return matchesAny(pref.getCities(), city)
            || matchesAny(pref.getIndustries(), industry)
            || matchesAny(pref.getRoleTypes(), roleType)
            || matchesAny(pref.getCompanyTypes(), companyType)
            || (!hasText(pref.getCities()) && !hasText(pref.getIndustries())
                && !hasText(pref.getRoleTypes()) && !hasText(pref.getCompanyTypes()));
    }

    private JobPosting resolveJob(Long id) {
        if (id == null) return null;
        return jobRepository.findById(id).orElseThrow(() -> new BusinessException("岗位不存在"));
    }

    private User ensureUser(Long userId) {
        if (userId == null) throw new BusinessException("请先登录");
        return userRepository.findById(userId).orElseThrow(() -> new BusinessException("记录不存在"));
    }

    private String normalizeStatus(String status) {
        String normalized = hasText(status) ? status.trim() : "APPLIED";
        if (!VALID_STATUSES.contains(normalized)) {
            throw new BusinessException("投递状态无效");
        }
        return normalized;
    }

    private Map<String, Object> toFairMap(CareerFair fair) {
        return toFairMap(fair, LocalDateTime.now());
    }

    private Map<String, Object> toFairMap(CareerFair fair, LocalDateTime now) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", fair.getId());
        map.put("title", fair.getTitle());
        map.put("companyName", fair.getCompanyName());
        map.put("city", fair.getCity());
        map.put("industry", fair.getIndustry());
        map.put("targetRoles", fair.getTargetRoles());
        map.put("location", fair.getLocation());
        map.put("startTime", toString(fair.getStartTime()));
        map.put("endTime", toString(fair.getEndTime()));
        map.put("applyDeadline", toString(fair.getApplyDeadline()));
        map.put("applyUrl", fair.getApplyUrl());
        map.put("description", fair.getDescription());
        map.put("active", fair.getActive());
        map.put("createdAt", toString(fair.getCreatedAt()));
        map.put("expired", isFairExpired(fair, now));
        map.put("statusLabel", fairStatusLabel(fair, now));
        map.put("applicationClosed", isApplicationClosed(fair, now));
        map.put("applyStatusLabel", applyStatusLabel(fair, now));
        return map;
    }

    private boolean isFairExpired(CareerFair fair, LocalDateTime now) {
        return fair.getEndTime() != null && fair.getEndTime().isBefore(now);
    }

    private String fairStatusLabel(CareerFair fair, LocalDateTime now) {
        if (fair.getStartTime() != null && fair.getEndTime() != null
            && !fair.getStartTime().isAfter(now) && !fair.getEndTime().isBefore(now)) {
            return "进行中";
        }
        if (fair.getStartTime() != null && fair.getStartTime().isAfter(now)) {
            return "未开始";
        }
        if (fair.getEndTime() != null && fair.getEndTime().isBefore(now)) {
            return "已结束";
        }
        return "时间待定";
    }

    private boolean isApplicationClosed(CareerFair fair, LocalDateTime now) {
        return fair.getApplyDeadline() != null && fair.getApplyDeadline().isBefore(now);
    }

    private String applyStatusLabel(CareerFair fair, LocalDateTime now) {
        if (fair.getApplyDeadline() == null) {
            return hasText(fair.getApplyUrl()) ? "可网申" : "网申待公布";
        }
        return fair.getApplyDeadline().isBefore(now) ? "网申已截止" : "可网申";
    }

    private String fairDedupKey(CareerFair fair) {
        return fairDisplayKey(fair);
    }

    private String fairDisplayKey(CareerFair fair) {
        return fairDisplayKey(fair.getTitle(), fair.getCompanyName(), fair.getLocation(), fair.getApplyUrl());
    }

    private String fairDisplayKey(String title, String companyName, String location, String applyUrl) {
        return normalizedKey(title) + "|" +
            normalizedKey(companyName) + "|" +
            normalizedKey(location) + "|" +
            normalizedKey(applyUrl);
    }

    private String fairBusinessKey(CareerFair fair) {
        return fairBusinessKey(fair.getTitle(), fair.getCompanyName(), fair.getStartTime());
    }

    private String fairBusinessKey(String title, String companyName, LocalDateTime startTime) {
        return normalizedKey(title) + "|" + normalizedKey(companyName) + "|" + (startTime == null ? "" : startTime.toString());
    }

    private String normalizedKey(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private CareerFair betterFairForList(CareerFair left, CareerFair right, LocalDateTime now) {
        return fairListComparator(now).compare(left, right) <= 0 ? left : right;
    }

    private List<CareerFair> deduplicateFairs(List<CareerFair> fairs, LocalDateTime now) {
        return fairs.stream()
            .collect(
                java.util.stream.Collectors.toMap(
                    this::fairDedupKey,
                    fair -> fair,
                    (left, right) -> betterFairForList(left, right, now),
                    LinkedHashMap::new
                )
            )
            .values()
            .stream()
            .toList();
    }

    private void cleanupDuplicateFairs() {
        LocalDateTime now = LocalDateTime.now();
        List<CareerFair> fairs = fairRepository.findAll();
        Set<Long> duplicateIds = new HashSet<>();
        collectDuplicateIds(fairs, this::fairDisplayKey, now, duplicateIds);
        collectDuplicateIds(fairs, this::fairBusinessKey, now, duplicateIds);
        if (!duplicateIds.isEmpty()) {
            fairRepository.deleteAllById(duplicateIds);
            fairRepository.flush();
        }
        fairRepository.findAll().forEach(fair -> {
            String businessKey = fairBusinessKey(fair);
            if (!Objects.equals(fair.getBusinessKey(), businessKey)) {
                fair.setBusinessKey(businessKey);
                fairRepository.save(fair);
            }
        });
    }

    private void collectDuplicateIds(List<CareerFair> fairs,
                                     java.util.function.Function<CareerFair, String> keyFunction,
                                     LocalDateTime now,
                                     Set<Long> duplicateIds) {
        Map<String, List<CareerFair>> grouped = new LinkedHashMap<>();
        for (CareerFair fair : fairs) {
            if (fair.getId() == null) continue;
            grouped.computeIfAbsent(keyFunction.apply(fair), key -> new ArrayList<>()).add(fair);
        }
        grouped.values().stream()
            .filter(group -> group.size() > 1)
            .forEach(group -> {
                List<CareerFair> sorted = group.stream()
                    .sorted(fairListComparator(now))
                    .toList();
                sorted.stream().skip(1).map(CareerFair::getId).forEach(duplicateIds::add);
            });
    }

    private Comparator<CareerFair> fairListComparator(LocalDateTime now) {
        return Comparator
            .comparingInt((CareerFair fair) -> fairStatusRank(fair, now))
            .thenComparing(fair -> fairSortTime(fair, now), Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(CareerFair::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
    }

    private int fairStatusRank(CareerFair fair, LocalDateTime now) {
        if (fair.getStartTime() != null && fair.getEndTime() != null
            && !fair.getStartTime().isAfter(now) && !fair.getEndTime().isBefore(now)) {
            return 0;
        }
        if (fair.getStartTime() != null && fair.getStartTime().isAfter(now)) {
            return 1;
        }
        if (fair.getEndTime() != null && fair.getEndTime().isBefore(now)) {
            return 2;
        }
        return 3;
    }

    private LocalDateTime fairSortTime(CareerFair fair, LocalDateTime now) {
        if (fair.getStartTime() != null && fair.getStartTime().isAfter(now)) {
            return fair.getStartTime();
        }
        if (fair.getStartTime() != null && fair.getEndTime() != null
            && !fair.getStartTime().isAfter(now) && !fair.getEndTime().isBefore(now)) {
            return fair.getEndTime();
        }
        return fair.getEndTime() != null ? fair.getEndTime() : fair.getStartTime();
    }

    private Map<String, Object> toJobMap(JobPosting job) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", job.getId());
        map.put("title", job.getTitle());
        map.put("companyName", job.getCompanyName());
        map.put("city", job.getCity());
        map.put("industry", job.getIndustry());
        map.put("companyType", job.getCompanyType());
        map.put("roleType", job.getRoleType());
        map.put("salaryRange", job.getSalaryRange());
        map.put("educationRequirement", job.getEducationRequirement());
        map.put("majorKeywords", job.getMajorKeywords());
        map.put("skillTags", job.getSkillTags());
        map.put("description", job.getDescription());
        map.put("applyUrl", job.getApplyUrl());
        map.put("active", job.getActive());
        map.put("createdAt", toString(job.getCreatedAt()));
        return map;
    }

    private Map<String, Object> toResumeMap(ResumeProfile resume) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", resume.getId());
        map.put("templateType", resume.getTemplateType());
        map.put("targetRole", resume.getTargetRole());
        map.put("expectedCities", resume.getExpectedCities());
        map.put("expectedIndustries", resume.getExpectedIndustries());
        map.put("expectedSalary", resume.getExpectedSalary());
        map.put("educationLevel", resume.getEducationLevel());
        map.put("highestEducation", resume.getEducationLevel());
        map.put("major", resume.getMajor());
        map.put("phone", resume.getPhone());
        map.put("email", resume.getEmail());
        map.put("skillTags", resume.getSkillTags());
        map.put("projectKeywords", resume.getProjectKeywords());
        map.put("internshipKeywords", resume.getInternshipKeywords());
        map.put("certificates", resume.getCertificates());
        map.put("portfolioUrl", resume.getPortfolioUrl());
        map.put("baseInfo", resume.getBaseInfo());
        map.put("education", resume.getEducation());
        map.put("projects", resume.getProjects());
        map.put("internships", resume.getInternships());
        map.put("skills", resume.getSkills());
        map.put("selfEvaluation", resume.getSelfEvaluation());
        map.put("resumeFile", resumeFileSummary(resume));
        map.put("updatedAt", toString(resume.getUpdatedAt()));
        return map;
    }

    private Map<String, Object> resumeFileSummary(ResumeProfile resume) {
        Map<String, Object> file = new LinkedHashMap<>();
        boolean hasFile = resume != null && hasText(resume.getResumeCosKey());
        file.put("hasFile", hasFile);
        file.put("fileName", hasFile ? resume.getResumeFileName() : null);
        file.put("fileSize", hasFile ? resume.getResumeFileSize() : null);
        file.put("fileType", hasFile ? resume.getResumeFileType() : null);
        file.put("uploadedAt", hasFile ? toString(resume.getResumeUploadedAt()) : null);
        return file;
    }

    private Map<String, Object> toAdminResumeSummary(User user, ResumeProfile resume) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("userId", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("studentId", user.getStudentId());
        map.put("school", user.getSchool());
        map.put("major", user.getMajor());
        map.put("grade", user.getGrade());
        map.put("resumeUpdatedAt", resume == null ? null : toString(resume.getUpdatedAt()));
        map.put("resumeFile", resumeFileSummary(resume));
        return map;
    }

    private void validateResumeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("请选择要上传的简历文件");
        }
        if (file.getSize() > MAX_RESUME_FILE_SIZE) {
            throw new BusinessException("简历附件不能超过10MB");
        }
        String fileName = safeOriginalFilename(file.getOriginalFilename());
        String extension = fileExtension(fileName);
        if (!RESUME_FILE_TYPES.containsKey(extension)) {
            throw new BusinessException("简历附件仅支持 PDF、DOC、DOCX 格式");
        }
        String contentType = trim(file.getContentType());
        String expected = RESUME_FILE_TYPES.get(extension);
        if (hasText(contentType)
            && !"application/octet-stream".equalsIgnoreCase(contentType)
            && !expected.equalsIgnoreCase(contentType)) {
            throw new BusinessException("简历附件类型与文件后缀不匹配");
        }
    }

    private String normalizedResumeContentType(String fileName, String contentType) {
        String trimmed = trim(contentType);
        if (hasText(trimmed) && !"application/octet-stream".equalsIgnoreCase(trimmed)) {
            return trimmed;
        }
        return RESUME_FILE_TYPES.get(fileExtension(fileName));
    }

    private String buildResumeCosKey(Long userId, String fileName) {
        String extension = fileExtension(fileName);
        String baseName = fileName.substring(0, fileName.length() - extension.length() - 1)
            .replaceAll("[^A-Za-z0-9._-]", "_");
        if (!hasText(baseName)) {
            baseName = "resume";
        }
        if (baseName.length() > 80) {
            baseName = baseName.substring(0, 80);
        }
        return "employment/resumes/" + userId + "/" + UUID.randomUUID() + "-" + baseName + "." + extension;
    }

    private String safeOriginalFilename(String originalFilename) {
        String normalized = trim(originalFilename);
        if (!hasText(normalized)) {
            throw new BusinessException("简历文件名不能为空");
        }
        normalized = normalized.replace("\\", "/");
        int slashIndex = normalized.lastIndexOf('/');
        if (slashIndex >= 0) {
            normalized = normalized.substring(slashIndex + 1);
        }
        if (!hasText(normalized) || ".".equals(normalized) || "..".equals(normalized)) {
            throw new BusinessException("简历文件名不能为空");
        }
        return normalized.length() > 255 ? normalized.substring(normalized.length() - 255) : normalized;
    }

    private String fileExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
    }

    private void deleteCosObjectBestEffort(String cosKey, String action) {
        if (!hasText(cosKey)) {
            return;
        }
        try {
            cosService.deleteFile(cosKey);
        } catch (RuntimeException ex) {
            log.warn("Resume COS {} cleanup failed for key: {}", action, cosKey, ex);
        }
    }

    private Map<String, Object> toPreferenceMap(JobSubscriptionPreference pref) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", pref.getId());
        map.put("cities", pref.getCities());
        map.put("industries", pref.getIndustries());
        map.put("roleTypes", pref.getRoleTypes());
        map.put("salaryRange", pref.getSalaryRange());
        map.put("companyTypes", pref.getCompanyTypes());
        map.put("active", pref.getActive());
        map.put("updatedAt", toString(pref.getUpdatedAt()));
        return map;
    }

    private Map<String, Object> toApplicationMap(ApplicationRecord record) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", record.getId());
        map.put("companyName", record.getCompanyName());
        map.put("jobTitle", record.getJobTitle());
        map.put("jobPostingId", record.getJobPosting() != null ? record.getJobPosting().getId() : null);
        map.put("city", record.getCity());
        map.put("industry", record.getIndustry());
        map.put("companyType", record.getCompanyType());
        map.put("roleType", record.getRoleType());
        map.put("salaryRange", record.getSalaryRange());
        map.put("educationRequirement", record.getEducationRequirement());
        map.put("majorKeywords", record.getMajorKeywords());
        map.put("skillTags", record.getSkillTags());
        map.put("applyUrl", record.getApplyUrl());
        map.put("applicationChannel", record.getApplicationChannel());
        map.put("resumeFileName", record.getResumeFileName());
        map.put("contactName", record.getContactName());
        map.put("contactInfo", record.getContactInfo());
        map.put("interviewRound", record.getInterviewRound());
        map.put("interviewMethod", record.getInterviewMethod());
        map.put("interviewLocation", record.getInterviewLocation());
        map.put("expectedSalary", record.getExpectedSalary());
        map.put("offerSalary", record.getOfferSalary());
        map.put("status", record.getStatus());
        map.put("appliedAt", toString(record.getAppliedAt()));
        map.put("nextStepAt", toString(record.getNextStepAt()));
        map.put("lastFollowUpAt", toString(record.getLastFollowUpAt()));
        map.put("failureReason", record.getFailureReason());
        map.put("notes", record.getNotes());
        map.put("createdAt", toString(record.getCreatedAt()));
        map.put("updatedAt", toString(record.getUpdatedAt()));
        return map;
    }

    private Map<String, Object> toNotificationMap(EmploymentNotification notification) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", notification.getId());
        map.put("title", notification.getTitle());
        map.put("content", notification.getContent());
        map.put("relatedType", notification.getRelatedType());
        map.put("relatedId", notification.getRelatedId());
        map.put("readFlag", notification.getReadFlag());
        map.put("targetUrl", notificationTargetUrl(notification));
        map.put("createdAt", toString(notification.getCreatedAt()));
        map.put("readAt", toString(notification.getReadAt()));
        return map;
    }

    private String blankToNull(String value) {
        return hasText(value) ? value.trim() : null;
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }

    private String trimRequired(String value, String message) {
        String trimmed = trim(value);
        if (!hasText(trimmed)) throw new BusinessException(message);
        return trimmed;
    }

    private String defaultString(String value, String fallback) {
        return hasText(value) ? value.trim() : fallback;
    }

    private String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String value : values) {
            if (hasText(value)) return value.trim();
        }
        return null;
    }

    private String toString(LocalDateTime time) {
        return time == null ? null : time.toString();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private boolean matchesText(String actual, String expected) {
        if (!hasText(expected)) return false;
        if (!hasText(actual)) return false;
        String normalizedActual = actual.trim().toLowerCase(Locale.ROOT);
        String normalizedExpected = expected.trim().toLowerCase(Locale.ROOT);
        return normalizedActual.contains(normalizedExpected) || normalizedExpected.contains(normalizedActual);
    }

    private boolean matchesAny(String source, String candidate) {
        if (!hasText(source) || !hasText(candidate)) return false;
        String normalizedCandidate = candidate.toLowerCase(Locale.ROOT);
        for (String token : source.split("[,;\\s\\uFF0C\\u3001]+")) {
            if (hasText(token) && normalizedCandidate.contains(token.trim().toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        String normalizedSource = source.toLowerCase(Locale.ROOT);
        for (String token : candidate.split("[,;\\s\\uFF0C\\u3001]+")) {
            if (hasText(token) && normalizedSource.contains(token.trim().toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private String notificationTargetUrl(EmploymentNotification notification) {
        if (notification.getRelatedId() == null || !hasText(notification.getRelatedType())) return null;
        String type = notification.getRelatedType().trim().toUpperCase(Locale.ROOT);
        if ("FAIR".equals(type)) {
            return "/job/fairs/" + notification.getRelatedId();
        }
        if ("JOB".equals(type)) {
            return "/job/postings/" + notification.getRelatedId();
        }
        return null;
    }

    private <T> Map<String, Object> pageResult(List<T> items, Integer page, Integer size,
                                               java.util.function.Function<T, Map<String, Object>> mapper) {
        int pageNumber = Math.max(page == null ? 1 : page, 1);
        int pageSize = Math.min(Math.max(size == null ? 8 : size, 1), 50);
        int fromIndex = Math.min((pageNumber - 1) * pageSize, items.size());
        int toIndex = Math.min(fromIndex + pageSize, items.size());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items.subList(fromIndex, toIndex).stream().map(mapper).toList());
        result.put("page", pageNumber);
        result.put("size", pageSize);
        result.put("totalPages", Math.max(1, (int) Math.ceil((double) items.size() / pageSize)));
        result.put("totalItems", items.size());
        return result;
    }

    private boolean matchesAdminKeyword(String keyword, String... values) {
        String normalizedKeyword = blankToNull(keyword);
        if (normalizedKeyword == null) return true;
        String lowerKeyword = normalizedKeyword.toLowerCase(Locale.ROOT);
        for (String value : values) {
            if (hasText(value) && value.toLowerCase(Locale.ROOT).contains(lowerKeyword)) {
                return true;
            }
        }
        return false;
    }

    public record ResumeFileDownload(COSObject cosObject, String fileName, Long fileSize, String contentType) {}

    private record RecommendationCandidate(JobPosting job, double cosine, double bm25, double preferenceScore) {}

    private record NotificationSource(String title, String content, String city, String industry, String roleType, String companyType) {}
}
