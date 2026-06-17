package com.graduateplatform.kaoyan.service;

import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.kaoyan.entity.GraduateScoreLine;
import com.graduateplatform.kaoyan.entity.GraduateScoreLineFavorite;
import com.graduateplatform.kaoyan.entity.GraduateSchool;
import com.graduateplatform.kaoyan.repository.GraduateScoreLineFavoriteRepository;
import com.graduateplatform.kaoyan.repository.GraduateScoreLineRepository;
import com.graduateplatform.kaoyan.repository.GraduateSchoolRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class KaoyanService {

    private final GraduateSchoolRepository schoolRepository;
    private final GraduateScoreLineRepository scoreLineRepository;
    private final GraduateScoreLineFavoriteRepository favoriteRepository;
    private final UserRepository userRepository;

    public KaoyanService(GraduateSchoolRepository schoolRepository,
                         GraduateScoreLineRepository scoreLineRepository,
                         GraduateScoreLineFavoriteRepository favoriteRepository,
                         UserRepository userRepository) {
        this.schoolRepository = schoolRepository;
        this.scoreLineRepository = scoreLineRepository;
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
    }

    // ========== User query ==========

    public Map<String, Object> listSchoolsPage(Map<String, String> filters) {
        Page<GraduateSchool> rows = schoolRepository.findAll(
            schoolSpec(filters, true),
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.ASC, "name"))
        );
        return page(rows.map(this::toSchoolMap));
    }

    public Map<String, Object> queryScoreLinesPage(Map<String, String> filters) {
        Page<GraduateScoreLine> rows = scoreLineRepository.findAll(
            scoreLineSpec(filters, true),
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(
                Sort.Order.desc("year"),
                Sort.Order.desc("id")
            ))
        );
        return page(rows.map(this::toScoreLineMap));
    }

    public Map<String, Object> favoriteScoreLine(Long scoreLineId, Long userId) {
        findUser(userId);
        GraduateScoreLine scoreLine = scoreLineRepository.findById(scoreLineId)
            .orElseThrow(() -> new BusinessException("分数线记录不存在"));
        if (!favoriteRepository.existsByUserIdAndScoreLineId(userId, scoreLineId)) {
            favoriteRepository.save(GraduateScoreLineFavorite.builder()
                .user(findUser(userId))
                .scoreLine(scoreLine)
                .build());
        }
        return toScoreLineMap(scoreLine);
    }

    public Map<String, Object> unfavoriteScoreLine(Long scoreLineId, Long userId) {
        scoreLineRepository.findById(scoreLineId)
            .orElseThrow(() -> new BusinessException("分数线记录不存在"));
        favoriteRepository.deleteByUserIdAndScoreLineId(userId, scoreLineId);
        return Map.of("id", scoreLineId);
    }

    public List<Map<String, Object>> myFavoriteScoreLines(Long userId) {
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(f -> f.getScoreLine())
            // 过滤掉已停用院校 / 已停用分数线，避免学生侧看到失效数据
            .filter(line -> line != null
                && Boolean.TRUE.equals(line.getActive())
                && line.getSchool() != null
                && Boolean.TRUE.equals(line.getSchool().getActive()))
            .map(this::toScoreLineMap)
            .toList();
    }

    // ========== Admin CRUD ==========

    public Map<String, Object> adminSchools(Map<String, String> filters) {
        Page<GraduateSchool> rows = schoolRepository.findAll(
            schoolSpec(filters, false),
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "id"))
        );
        return page(rows.map(this::toSchoolMap));
    }

    public Map<String, Object> createSchool(Map<String, Object> body) {
        GraduateSchool school = GraduateSchool.builder()
            .name(require(body, "name"))
            .region(str(body.get("region")))
            .province(str(body.get("province")))
            .is985(bool(body.get("is985")))
            .is211(bool(body.get("is211")))
            .isDoubleFirstClass(bool(body.get("isDoubleFirstClass")))
            .schoolType(str(body.get("schoolType")))
            .logoUrl(str(body.get("logoUrl")))
            .description(str(body.get("description")))
            .officialSite(str(body.get("officialSite")))
            .build();
        return toSchoolMap(schoolRepository.save(school));
    }

    public Map<String, Object> updateSchool(Long id, Map<String, Object> body) {
        GraduateSchool school = schoolRepository.findById(id)
            .orElseThrow(() -> new BusinessException("院校不存在"));
        if (hasText(body.get("name"))) school.setName(str(body.get("name")));
        if (body.containsKey("region")) school.setRegion(str(body.get("region")));
        if (body.containsKey("province")) school.setProvince(str(body.get("province")));
        if (body.containsKey("is985")) school.setIs985(bool(body.get("is985")));
        if (body.containsKey("is211")) school.setIs211(bool(body.get("is211")));
        if (body.containsKey("isDoubleFirstClass")) school.setIsDoubleFirstClass(bool(body.get("isDoubleFirstClass")));
        if (body.containsKey("schoolType")) school.setSchoolType(str(body.get("schoolType")));
        if (body.containsKey("logoUrl")) school.setLogoUrl(str(body.get("logoUrl")));
        if (body.containsKey("description")) school.setDescription(str(body.get("description")));
        if (body.containsKey("officialSite")) school.setOfficialSite(str(body.get("officialSite")));
        if (body.containsKey("active")) school.setActive(bool(body.get("active")));
        return toSchoolMap(schoolRepository.save(school));
    }

    public Map<String, Object> deactivateSchool(Long id) {
        GraduateSchool school = schoolRepository.findById(id)
            .orElseThrow(() -> new BusinessException("院校不存在"));
        school.setActive(false);
        schoolRepository.save(school);
        return Map.of("id", id);
    }

    public Map<String, Object> adminScoreLines(Map<String, String> filters) {
        Page<GraduateScoreLine> rows = scoreLineRepository.findAll(
            scoreLineSpec(filters, false),
            PageRequest.of(pageNumber(filters), pageSize(filters), Sort.by(Sort.Direction.DESC, "id"))
        );
        return page(rows.map(this::toScoreLineMap));
    }

    public Map<String, Object> createScoreLine(Map<String, Object> body) {
        Long schoolId = toLong(body.get("schoolId"));
        GraduateSchool school = schoolRepository.findById(schoolId)
            .orElseThrow(() -> new BusinessException("院校不存在：" + schoolId));

        GraduateScoreLine line = GraduateScoreLine.builder()
            .school(school)
            .year(toInt(body.get("year"), 0))
            .majorCategory(str(body.get("majorCategory")))
            .majorName(str(body.get("majorName")))
            .degreeType(str(body.get("degreeType")))
            .isNationalLine(bool(body.get("isNationalLine")))
            .politicsLine(toDecimal(body.get("politicsLine")))
            .foreignLangLine(toDecimal(body.get("foreignLangLine")))
            .subject1Line(toDecimal(body.get("subject1Line")))
            .subject2Line(toDecimal(body.get("subject2Line")))
            .totalScoreLine(toDecimal(body.get("totalScoreLine")))
            .plannedEnrollment(toIntBox(body.get("plannedEnrollment")))
            .actualApplicants(toIntBox(body.get("actualApplicants")))
            .admissionRatio(toDecimal(body.get("admissionRatio")))
            .note(str(body.get("note")))
            .source(str(body.get("source")))
            .build();
        return toScoreLineMap(scoreLineRepository.save(line));
    }

    public Map<String, Object> updateScoreLine(Long id, Map<String, Object> body) {
        GraduateScoreLine line = scoreLineRepository.findById(id)
            .orElseThrow(() -> new BusinessException("分数线不存在"));

        if (body.containsKey("schoolId")) {
            Long schoolId = toLong(body.get("schoolId"));
            GraduateSchool school = schoolRepository.findById(schoolId)
                .orElseThrow(() -> new BusinessException("院校不存在：" + schoolId));
            line.setSchool(school);
        }
        if (body.containsKey("year")) line.setYear(toInt(body.get("year"), 0));
        if (body.containsKey("majorCategory")) line.setMajorCategory(str(body.get("majorCategory")));
        if (body.containsKey("majorName")) line.setMajorName(str(body.get("majorName")));
        if (body.containsKey("degreeType")) line.setDegreeType(str(body.get("degreeType")));
        if (body.containsKey("isNationalLine")) line.setIsNationalLine(bool(body.get("isNationalLine")));
        if (body.containsKey("politicsLine")) line.setPoliticsLine(toDecimal(body.get("politicsLine")));
        if (body.containsKey("foreignLangLine")) line.setForeignLangLine(toDecimal(body.get("foreignLangLine")));
        if (body.containsKey("subject1Line")) line.setSubject1Line(toDecimal(body.get("subject1Line")));
        if (body.containsKey("subject2Line")) line.setSubject2Line(toDecimal(body.get("subject2Line")));
        if (body.containsKey("totalScoreLine")) line.setTotalScoreLine(toDecimal(body.get("totalScoreLine")));
        if (body.containsKey("plannedEnrollment")) line.setPlannedEnrollment(body.get("plannedEnrollment") == null ? null : toInt(body.get("plannedEnrollment"), 0));
        if (body.containsKey("actualApplicants")) line.setActualApplicants(body.get("actualApplicants") == null ? null : toInt(body.get("actualApplicants"), 0));
        if (body.containsKey("admissionRatio")) line.setAdmissionRatio(toDecimal(body.get("admissionRatio")));
        if (body.containsKey("note")) line.setNote(str(body.get("note")));
        if (body.containsKey("source")) line.setSource(str(body.get("source")));
        if (body.containsKey("active")) line.setActive(bool(body.get("active")));
        return toScoreLineMap(scoreLineRepository.save(line));
    }

    public Map<String, Object> deactivateScoreLine(Long id) {
        GraduateScoreLine line = scoreLineRepository.findById(id)
            .orElseThrow(() -> new BusinessException("分数线不存在"));
        line.setActive(false);
        scoreLineRepository.save(line);
        return Map.of("id", id);
    }

    // ========== Specifications ==========

    private Specification<GraduateSchool> schoolSpec(Map<String, String> filters, boolean activeOnly) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (activeOnly) predicates.add(builder.isTrue(root.get("active")));
            if (hasText(filters.get("name"))) {
                predicates.add(builder.like(root.get("name"), "%" + filters.get("name") + "%"));
            }
            if (hasText(filters.get("region"))) {
                predicates.add(builder.like(root.get("region"), "%" + filters.get("region") + "%"));
            }
            if (hasText(filters.get("province"))) {
                predicates.add(builder.like(root.get("province"), "%" + filters.get("province") + "%"));
            }
            if (hasText(filters.get("is985"))) {
                predicates.add(builder.equal(root.get("is985"), Boolean.parseBoolean(filters.get("is985"))));
            }
            if (hasText(filters.get("is211"))) {
                predicates.add(builder.equal(root.get("is211"), Boolean.parseBoolean(filters.get("is211"))));
            }
            if (hasText(filters.get("isDoubleFirstClass"))) {
                predicates.add(builder.equal(root.get("isDoubleFirstClass"), Boolean.parseBoolean(filters.get("isDoubleFirstClass"))));
            }
            if (hasText(filters.get("schoolType"))) {
                predicates.add(builder.equal(root.get("schoolType"), filters.get("schoolType")));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<GraduateScoreLine> scoreLineSpec(Map<String, String> filters, boolean activeOnly) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (activeOnly) {
                predicates.add(builder.isTrue(root.get("active")));
                // 学生侧：停用院校下的分数线条目同样不展示
                predicates.add(builder.isTrue(root.get("school").get("active")));
            }
            if (hasText(filters.get("schoolId"))) {
                predicates.add(builder.equal(root.get("school").get("id"), toLong(filters.get("schoolId"))));
            }
            if (hasText(filters.get("schoolName"))) {
                predicates.add(builder.like(root.get("school").get("name"), "%" + filters.get("schoolName") + "%"));
            }
            if (hasText(filters.get("year"))) {
                predicates.add(builder.equal(root.get("year"), Integer.parseInt(filters.get("year"))));
            }
            if (hasText(filters.get("majorCategory"))) {
                predicates.add(builder.equal(root.get("majorCategory"), filters.get("majorCategory")));
            }
            if (hasText(filters.get("majorName"))) {
                predicates.add(builder.like(root.get("majorName"), "%" + filters.get("majorName") + "%"));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    // ========== Map converters ==========

    private Map<String, Object> toSchoolMap(GraduateSchool school) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", school.getId());
        map.put("name", school.getName());
        map.put("region", school.getRegion());
        map.put("province", school.getProvince());
        map.put("is985", school.getIs985());
        map.put("is211", school.getIs211());
        map.put("isDoubleFirstClass", school.getIsDoubleFirstClass());
        map.put("schoolType", school.getSchoolType());
        map.put("logoUrl", school.getLogoUrl());
        map.put("description", school.getDescription());
        map.put("officialSite", school.getOfficialSite());
        map.put("active", school.getActive());
        map.put("createdAt", school.getCreatedAt());
        return map;
    }

    private Map<String, Object> toScoreLineMap(GraduateScoreLine line) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", line.getId());
        if (line.getSchool() != null) {
            map.put("schoolId", line.getSchool().getId());
            map.put("schoolName", line.getSchool().getName());
            map.put("schoolRegion", line.getSchool().getRegion());
            map.put("is985", line.getSchool().getIs985());
            map.put("is211", line.getSchool().getIs211());
        }
        map.put("year", line.getYear());
        map.put("majorCategory", line.getMajorCategory());
        map.put("majorName", line.getMajorName());
        map.put("degreeType", line.getDegreeType());
        map.put("isNationalLine", line.getIsNationalLine());
        map.put("politicsLine", line.getPoliticsLine());
        map.put("foreignLangLine", line.getForeignLangLine());
        map.put("subject1Line", line.getSubject1Line());
        map.put("subject2Line", line.getSubject2Line());
        map.put("totalScoreLine", line.getTotalScoreLine());
        map.put("plannedEnrollment", line.getPlannedEnrollment());
        map.put("actualApplicants", line.getActualApplicants());
        map.put("admissionRatio", line.getAdmissionRatio());
        map.put("note", line.getNote());
        map.put("source", line.getSource());
        map.put("active", line.getActive());
        map.put("createdAt", line.getCreatedAt());
        return map;
    }

    private Map<String, Object> page(Page<Map<String, Object>> rows) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", rows.getContent());
        result.put("page", rows.getNumber());
        result.put("size", rows.getSize());
        result.put("totalElements", rows.getTotalElements());
        result.put("totalPages", Math.max(1, rows.getTotalPages()));
        return result;
    }

    // ========== Helpers ==========

    private User findUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("用户不存在"));
    }

    private String require(Map<String, Object> body, String key) {
        String value = str(body.get(key));
        if (value.isBlank()) throw new BusinessException("参数缺失：" + key);
        return value;
    }

    private int pageNumber(Map<String, String> filters) {
        return Math.max(0, toInt(filters.get("page"), 0));
    }

    private int pageSize(Map<String, String> filters) {
        return Math.max(1, Math.min(100, toInt(filters.get("size"), 20)));
    }

    private int toInt(Object value, int fallback) {
        if (value == null) return fallback;
        String s = String.valueOf(value).trim();
        if (s.isEmpty()) return fallback;
        return Integer.parseInt(s);
    }

    private Integer toIntBox(Object value) {
        if (value == null) return null;
        String s = String.valueOf(value).trim();
        if (s.isEmpty()) return null;
        return Integer.parseInt(s);
    }

    private long toLong(Object value) {
        if (value == null) return 0;
        String s = String.valueOf(value).trim();
        if (s.isEmpty()) return 0;
        return Long.parseLong(s);
    }

    private boolean hasText(Object value) {
        return value != null && !String.valueOf(value).isBlank();
    }

    private String str(Object value) {
        return value == null ? null : String.valueOf(value).trim();
    }

    private Boolean bool(Object value) {
        if (value == null) return null;
        if (value instanceof Boolean) return (Boolean) value;
        String s = String.valueOf(value).trim().toLowerCase();
        if (s.isEmpty()) return null;
        return Boolean.parseBoolean(s);
    }

    private BigDecimal toDecimal(Object value) {
        if (value == null) return null;
        String s = String.valueOf(value).trim();
        if (s.isEmpty()) return null;
        return new BigDecimal(s);
    }
}