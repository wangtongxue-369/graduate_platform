package com.graduateplatform.kaoyan.service;

import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.common.service.CosService;
import com.graduateplatform.kaoyan.dto.CreateMaterialRequest;
import com.graduateplatform.kaoyan.entity.MaterialAttachment;
import com.graduateplatform.kaoyan.entity.MaterialStatus;
import com.graduateplatform.kaoyan.entity.ResourceMaterial;
import com.graduateplatform.kaoyan.repository.MaterialAttachmentRepository;
import com.graduateplatform.kaoyan.repository.ResourceMaterialRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import com.qcloud.cos.model.COSObject;

@Service
@Transactional
public class MaterialService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final int MAX_FILE_COUNT = 10;

    private final ResourceMaterialRepository materialRepository;
    private final MaterialAttachmentRepository attachmentRepository;
    private final CosService cosService;

    public MaterialService(ResourceMaterialRepository materialRepository,
                           MaterialAttachmentRepository attachmentRepository,
                           CosService cosService) {
        this.materialRepository = materialRepository;
        this.attachmentRepository = attachmentRepository;
        this.cosService = cosService;
    }

    // ========== User query ==========

    public Map<String, Object> listApprovedMaterialsPage(Map<String, String> filters) {
        Page<ResourceMaterial> page = materialRepository.findAll(
            materialSpec(filters, true, true),
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return toPageMap(page);
    }

    public Map<String, Object> getMaterialDetail(Long id) {
        ResourceMaterial material = materialRepository.findById(id)
            .orElseThrow(() -> new BusinessException("资料不存在"));
        material.setViewCount(material.getViewCount() + 1);
        return toMaterialDetailMap(material);
    }

    public Map<String, Object> listMyMaterials(Long userId, Map<String, String> filters) {
        String statusFilter = filters.get("status");
        Page<ResourceMaterial> page;
        if (statusFilter != null && !statusFilter.isEmpty()) {
            MaterialStatus status = MaterialStatus.valueOf(statusFilter.toUpperCase());
            page = materialRepository.findByUploaderIdAndStatusAndActiveTrue(userId, status,
                PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "createdAt")));
        } else {
            page = materialRepository.findByUploaderIdAndActiveTrue(userId,
                PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "createdAt")));
        }
        return toPageMap(page);
    }

    // ========== Upload ==========

    public Map<String, Object> createMaterial(Long uploaderId, CreateMaterialRequest request, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new BusinessException("请上传至少一个文件");
        }
        if (files.size() > MAX_FILE_COUNT) {
            throw new BusinessException("最多上传" + MAX_FILE_COUNT + "个文件");
        }

        ResourceMaterial material = ResourceMaterial.builder()
            .uploaderId(uploaderId)
            .title(request.getTitle())
            .description(request.getDescription())
            .school(request.getSchool())
            .major(request.getMajor())
            .subject(request.getSubject())
            .year(request.getYear())
            .materialType(request.getMaterialType())
            .status(MaterialStatus.PENDING)
            .viewCount(0)
            .downloadCount(0)
            .active(true)
            .build();

        material = materialRepository.save(material);

        for (MultipartFile file : files) {
            if (file.getSize() > MAX_FILE_SIZE) {
                throw new BusinessException("文件 " + file.getOriginalFilename() + " 超过10MB限制");
            }
            String cosKey = "materials/" + UUID.randomUUID().toString();
            String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
            try {
                cosService.uploadFile(file.getInputStream(), file.getSize(), cosKey, contentType);
            } catch (IOException e) {
                throw new BusinessException("文件读取失败: " + file.getOriginalFilename());
            }

            MaterialAttachment attachment = MaterialAttachment.builder()
                .originalName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .cosKey(cosKey)
                .fileType(contentType)
                .downloadCount(0)
                .build();
            material.addAttachment(attachment);
        }

        material = materialRepository.save(material);
        return toMaterialDetailMap(material);
    }

    // ========== Download ==========

    public Object[] getDownloadStream(Long materialId, Long attachmentId, Long userId) {
        ResourceMaterial material = materialRepository.findById(materialId)
            .orElseThrow(() -> new BusinessException("资料不存在"));

        MaterialAttachment attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow(() -> new BusinessException("附件不存在"));

        if (!material.getActive()) {
            throw new BusinessException("资料已被删除");
        }
        if (material.getStatus() != MaterialStatus.APPROVED && !material.getUploaderId().equals(userId)) {
            throw new BusinessException("资料尚未审核通过");
        }

        attachment.setDownloadCount(attachment.getDownloadCount() + 1);
        material.setDownloadCount(material.getDownloadCount() + 1);
        attachmentRepository.save(attachment);
        materialRepository.save(material);

        COSObject cosObject = cosService.getObject(attachment.getCosKey());
        return new Object[]{cosObject.getObjectContent(), cosObject.getObjectMetadata(), attachment.getOriginalName()};
    }

    // ========== Admin ==========

    public Map<String, Object> adminListPendingPage(Map<String, String> filters) {
        Page<ResourceMaterial> page = materialRepository.findAll(
            (root, query, builder) -> builder.and(
                builder.equal(root.get("status"), MaterialStatus.PENDING),
                builder.isTrue(root.get("active")),
                query.getRestriction()
            ),
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return toPageMap(page);
    }

    public Map<String, Object> adminListMaterialsPage(Map<String, String> filters) {
        Page<ResourceMaterial> page = materialRepository.findAll(
            adminMaterialSpec(filters),
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return toPageMap(page);
    }

    public Map<String, Object> reviewMaterial(Long id, String status) {
        ResourceMaterial material = materialRepository.findById(id)
            .orElseThrow(() -> new BusinessException("资料不存在"));
        material.setStatus(MaterialStatus.valueOf(status.toUpperCase()));
        materialRepository.save(material);
        return toMaterialDetailMap(material);
    }

    public Map<String, Object> deleteMaterial(Long id) {
        ResourceMaterial material = materialRepository.findById(id)
            .orElseThrow(() -> new BusinessException("资料不存在"));
        material.setActive(false);
        materialRepository.save(material);
        return Map.of("id", id);
    }

    // ========== Specifications ==========

    private Specification<ResourceMaterial> materialSpec(Map<String, String> filters, boolean activeOnly, boolean approvedOnly) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (activeOnly) predicates.add(builder.isTrue(root.get("active")));
            if (approvedOnly) predicates.add(builder.equal(root.get("status"), MaterialStatus.APPROVED));
            if (hasText(filters.get("keyword"))) {
                String kw = "%" + filters.get("keyword") + "%";
                Predicate titleLike = builder.like(root.get("title"), kw);
                Predicate schoolLike = builder.like(root.get("school"), kw);
                Predicate majorLike = builder.like(root.get("major"), kw);
                Predicate subjectLike = builder.like(root.get("subject"), kw);
                predicates.add(builder.or(titleLike, schoolLike, majorLike, subjectLike));
            }
            if (hasText(filters.get("school"))) predicates.add(builder.like(root.get("school"), "%" + filters.get("school") + "%"));
            if (hasText(filters.get("major"))) predicates.add(builder.like(root.get("major"), "%" + filters.get("major") + "%"));
            if (hasText(filters.get("subject"))) predicates.add(builder.like(root.get("subject"), "%" + filters.get("subject") + "%"));
            if (hasText(filters.get("year"))) predicates.add(builder.equal(root.get("year"), Integer.parseInt(filters.get("year"))));
            if (hasText(filters.get("materialType"))) predicates.add(builder.equal(root.get("materialType"), filters.get("materialType")));
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<ResourceMaterial> adminMaterialSpec(Map<String, String> filters) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.isTrue(root.get("active")));
            if (hasText(filters.get("status"))) {
                predicates.add(builder.equal(root.get("status"), MaterialStatus.valueOf(filters.get("status").toUpperCase())));
            }
            if (hasText(filters.get("keyword"))) {
                String kw = "%" + filters.get("keyword") + "%";
                predicates.add(builder.or(
                    builder.like(root.get("title"), kw),
                    builder.like(root.get("school"), kw),
                    builder.like(root.get("major"), kw)
                ));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    // ========== Mappers ==========

    private Map<String, Object> toMaterialDetailMap(ResourceMaterial material) {
        java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("id", material.getId());
        map.put("uploaderId", material.getUploaderId());
        map.put("title", material.getTitle());
        map.put("description", material.getDescription());
        map.put("school", material.getSchool());
        map.put("major", material.getMajor());
        map.put("subject", material.getSubject());
        map.put("year", material.getYear());
        map.put("materialType", material.getMaterialType());
        map.put("status", material.getStatus().name());
        map.put("viewCount", material.getViewCount());
        map.put("downloadCount", material.getDownloadCount());
        map.put("createdAt", material.getCreatedAt());
        map.put("attachments", material.getAttachments().stream().map(this::toAttachmentMap).collect(Collectors.toList()));
        return map;
    }

    private Map<String, Object> toAttachmentMap(MaterialAttachment attachment) {
        java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("id", attachment.getId());
        map.put("originalName", attachment.getOriginalName());
        map.put("fileSize", attachment.getFileSize());
        map.put("fileType", attachment.getFileType());
        map.put("downloadCount", attachment.getDownloadCount());
        map.put("createdAt", attachment.getCreatedAt());
        return map;
    }

    private Map<String, Object> toPageMap(Page<ResourceMaterial> page) {
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("content", page.getContent().stream().map(this::toMaterialDetailMap).collect(Collectors.toList()));
        result.put("page", page.getNumber());
        result.put("size", page.getSize());
        result.put("totalElements", page.getTotalElements());
        result.put("totalPages", Math.max(1, page.getTotalPages()));
        return result;
    }

    // ========== Helpers ==========

    private int pageNumber(Map<String, String> filters) {
        return Math.max(0, toInt(filters.get("page"), 0));
    }

    private int pageSize(Map<String, String> filters) {
        return Math.max(1, Math.min(100, toInt(filters.get("size"), 10)));
    }

    private int toInt(Object value, int fallback) {
        if (value == null) return fallback;
        String s = String.valueOf(value).trim();
        if (s.isEmpty()) return fallback;
        return Integer.parseInt(s);
    }

    private boolean hasText(Object value) {
        return value != null && !String.valueOf(value).isBlank();
    }
}