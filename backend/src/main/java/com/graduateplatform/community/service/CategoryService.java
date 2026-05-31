package com.graduateplatform.community.service;

import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.community.dto.CategoryRequest;
import com.graduateplatform.community.entity.Post;
import com.graduateplatform.community.entity.PostCategory;
import com.graduateplatform.community.repository.PostCategoryRepository;
import com.graduateplatform.community.repository.PostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class CategoryService {

    private final PostCategoryRepository repository;
    private final PostRepository postRepository;

    public CategoryService(PostCategoryRepository repository, PostRepository postRepository) {
        this.repository = repository;
        this.postRepository = postRepository;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAll() {
        return repository.findByActiveTrueOrderBySortOrderAscIdAsc().stream()
            .map(this::toMap)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAdminAll() {
        return repository.findAllByOrderBySortOrderAscIdAsc().stream()
            .map(this::toMap)
            .toList();
    }

    @Transactional
    public Map<String, Object> create(CategoryRequest req) {
        String code = normalizeCode(req.getCode());
        if (repository.findByCode(code).isPresent()) {
            throw new BusinessException("分类编码已存在");
        }
        PostCategory category = PostCategory.builder()
            .code(code)
            .name(normalizeName(req.getName()))
            .description(normalizeDescription(req.getDescription()))
            .sortOrder(req.getSortOrder() == null ? 0 : req.getSortOrder())
            .active(req.getActive() == null || req.getActive())
            .build();
        return toMap(repository.save(category));
    }

    @Transactional
    public Map<String, Object> update(Long id, CategoryRequest req) {
        PostCategory category = repository.findById(id)
            .orElseThrow(() -> new BusinessException("分类不存在"));

        if (req.getCode() != null && !req.getCode().isBlank()) {
            String code = normalizeCode(req.getCode());
            repository.findByCode(code)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BusinessException("分类编码已存在");
                });
            category.setCode(code);
        }
        if (req.getName() != null) {
            category.setName(normalizeName(req.getName()));
        }
        if (req.getDescription() != null) {
            category.setDescription(normalizeDescription(req.getDescription()));
        }
        if (req.getSortOrder() != null) {
            category.setSortOrder(req.getSortOrder());
        }
        if (req.getActive() != null) {
            category.setActive(req.getActive());
        }
        return toMap(repository.save(category));
    }

    @Transactional
    public Map<String, Object> updateActive(Long id, boolean active) {
        PostCategory category = repository.findById(id)
            .orElseThrow(() -> new BusinessException("分类不存在"));
        category.setActive(active);
        return toMap(repository.save(category));
    }

    @Transactional
    public Map<String, Object> merge(Long sourceId, Long targetId) {
        if (sourceId.equals(targetId)) {
            throw new BusinessException("不能合并到同一个分类");
        }
        PostCategory source = repository.findById(sourceId)
            .orElseThrow(() -> new BusinessException("源分类不存在"));
        PostCategory target = repository.findById(targetId)
            .orElseThrow(() -> new BusinessException("目标分类不存在"));

        List<Post> posts = postRepository.findByCategoryId(sourceId);
        posts.forEach(post -> post.setCategory(target));
        postRepository.saveAll(posts);

        source.setActive(false);
        repository.save(source);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("source", toMap(source));
        result.put("target", toMap(target));
        result.put("movedPostCount", posts.size());
        return result;
    }

    private Map<String, Object> toMap(PostCategory c) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", c.getId());
        map.put("code", c.getCode());
        map.put("name", c.getName());
        map.put("description", c.getDescription());
        map.put("sortOrder", c.getSortOrder());
        map.put("active", c.getActive());
        return map;
    }

    private String normalizeCode(String code) {
        String normalized = code == null ? "" : code.trim().toLowerCase(Locale.ROOT);
        if (!normalized.matches("[a-z0-9_-]{2,32}")) {
            throw new BusinessException("分类编码需为 2-32 位小写字母、数字、下划线或短横线");
        }
        return normalized;
    }

    private String normalizeName(String name) {
        String normalized = name == null ? "" : name.trim();
        if (normalized.length() < 2 || normalized.length() > 20) {
            throw new BusinessException("分类名称需在 2-20 个字符之间");
        }
        return normalized;
    }

    private String normalizeDescription(String description) {
        String normalized = description == null ? "" : description.trim();
        if (normalized.length() > 120) {
            throw new BusinessException("分类说明不能超过 120 个字符");
        }
        return normalized;
    }
}
