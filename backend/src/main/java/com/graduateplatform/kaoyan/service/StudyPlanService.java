package com.graduateplatform.kaoyan.service;

import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.kaoyan.entity.StudyCheckIn;
import com.graduateplatform.kaoyan.entity.StudyPlan;
import com.graduateplatform.kaoyan.repository.StudyCheckInRepository;
import com.graduateplatform.kaoyan.repository.StudyPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class StudyPlanService {

    private final StudyPlanRepository planRepository;
    private final StudyCheckInRepository checkInRepository;
    private final UserRepository userRepository;

    public StudyPlanService(StudyPlanRepository planRepository,
                            StudyCheckInRepository checkInRepository,
                            UserRepository userRepository) {
        this.planRepository = planRepository;
        this.checkInRepository = checkInRepository;
        this.userRepository = userRepository;
    }

    public Map<String, Object> createPlan(Long userId, Map<String, Object> body) {
        User user = findUser(userId);
        validateDateRange(body);

        StudyPlan plan = StudyPlan.builder()
            .user(user)
            .name(require(body, "name"))
            .description(str(body.get("description")))
            .startDate(LocalDate.parse(str(body.get("startDate"))))
            .endDate(LocalDate.parse(str(body.get("endDate"))))
            .totalDurationHours(toDecimal(body.get("totalDurationHours")))
            .build();
        return toPlanMap(planRepository.save(plan), false);
    }

    public List<Map<String, Object>> getPlans(Long userId) {
        return planRepository.findByUserIdOrderByStartDateDesc(userId).stream()
            .map(plan -> {
                Map<String, Object> row = toPlanMap(plan, false);
                List<StudyCheckIn> checkIns = checkInRepository.findByPlanIdAndUserIdOrderByCheckInDateAsc(plan.getId(), userId);
                row.put("completionRate", calculateCompletionRate(plan, checkIns));
                return row;
            })
            .collect(Collectors.toList());
    }

    public Map<String, Object> getPlanDetail(Long planId, Long userId) {
        StudyPlan plan = findPlanAndValidate(planId, userId);
        List<StudyCheckIn> checkIns = checkInRepository.findByPlanIdAndUserIdOrderByCheckInDateAsc(planId, userId);

        Map<String, Object> result = toPlanMap(plan, true);

        long totalDays = java.time.temporal.ChronoUnit.DAYS.between(plan.getStartDate(), plan.getEndDate()) + 1;
        Set<LocalDate> checkedDates = checkIns.stream()
            .map(StudyCheckIn::getCheckInDate)
            .collect(Collectors.toSet());

        BigDecimal totalDuration = BigDecimal.ZERO;
        for (StudyCheckIn c : checkIns) {
            if (c.getDurationHours() != null) {
                totalDuration = totalDuration.add(c.getDurationHours());
            }
        }

        int totalCheckInDays = checkedDates.size();
        int streak = calculateStreak(checkedDates, plan.getStartDate(), plan.getEndDate());

        result.put("totalDays", totalDays);
        result.put("checkedDays", totalCheckInDays);
        result.put("streak", streak);
        result.put("plannedDurationHours", plan.getTotalDurationHours());
        result.put("totalDurationHours", totalDuration);
        result.put("completionRate", calculateCompletionRate(plan, checkIns));
        result.put("checkIns", checkIns.stream().map(this::toCheckInMap).collect(Collectors.toList()));

        return result;
    }

    public Map<String, Object> updatePlan(Long planId, Long userId, Map<String, Object> body) {
        StudyPlan plan = findPlanAndValidate(planId, userId);
        if (body.containsKey("name")) plan.setName(str(body.get("name")));
        if (body.containsKey("description")) plan.setDescription(str(body.get("description")));
        if (body.containsKey("startDate")) plan.setStartDate(LocalDate.parse(str(body.get("startDate"))));
        if (body.containsKey("endDate")) plan.setEndDate(LocalDate.parse(str(body.get("endDate"))));
        if (body.containsKey("totalDurationHours")) plan.setTotalDurationHours(toDecimal(body.get("totalDurationHours")));
        return toPlanMap(planRepository.save(plan), false);
    }

    public Map<String, Object> deletePlan(Long planId, Long userId) {
        StudyPlan plan = findPlanAndValidate(planId, userId);
        planRepository.delete(plan);
        return Map.of("id", planId);
    }

    public Map<String, Object> addCheckIn(Long planId, Long userId, Map<String, Object> body) {
        StudyPlan plan = findPlanAndValidate(planId, userId);
        LocalDate date = LocalDate.parse(require(body, "checkInDate"));
        if (date.isBefore(plan.getStartDate()) || date.isAfter(plan.getEndDate())) {
            throw new BusinessException("打卡日期必须在计划范围内");
        }

        StudyCheckIn checkIn = StudyCheckIn.builder()
            .plan(plan)
            .user(findUser(userId))
            .checkInDate(date)
            .durationHours(toDecimal(body.get("durationHours")))
            .remark(str(body.get("remark")))
            .build();
        return toCheckInMap(checkInRepository.save(checkIn));
    }

    public List<Map<String, Object>> getCheckIns(Long planId, Long userId) {
        findPlanAndValidate(planId, userId);
        return checkInRepository.findByPlanIdAndUserIdOrderByCheckInDateAsc(planId, userId).stream()
            .map(this::toCheckInMap)
            .collect(Collectors.toList());
    }

    public Map<String, Object> updateCheckIn(Long checkInId, Long userId, Map<String, Object> body) {
        StudyCheckIn checkIn = checkInRepository.findByIdAndUserId(checkInId, userId)
            .orElseThrow(() -> new BusinessException("打卡记录不存在"));
        if (body.containsKey("durationHours")) checkIn.setDurationHours(toDecimal(body.get("durationHours")));
        if (body.containsKey("remark")) checkIn.setRemark(str(body.get("remark")));
        return toCheckInMap(checkInRepository.save(checkIn));
    }

    public Map<String, Object> deleteCheckIn(Long checkInId, Long userId) {
        StudyCheckIn checkIn = checkInRepository.findByIdAndUserId(checkInId, userId)
            .orElseThrow(() -> new BusinessException("打卡记录不存在"));
        checkInRepository.delete(checkIn);
        return Map.of("id", checkInId);
    }

    private BigDecimal calculateCompletionRate(StudyPlan plan, List<StudyCheckIn> checkIns) {
        if (plan.getTotalDurationHours() == null
            || plan.getTotalDurationHours().compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal totalDuration = BigDecimal.ZERO;
        for (StudyCheckIn c : checkIns) {
            if (c.getDurationHours() != null) {
                totalDuration = totalDuration.add(c.getDurationHours());
            }
        }
        return totalDuration
            .divide(plan.getTotalDurationHours(), 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100))
            .setScale(1, RoundingMode.HALF_UP);
    }

    private int calculateStreak(Set<LocalDate> checkedDates, LocalDate startDate, LocalDate endDate) {
        LocalDate today = LocalDate.now();
        if (today.isBefore(startDate)) return 0;
        int streak = 0;
        LocalDate date = today.isAfter(endDate) ? endDate : today;
        while (!date.isBefore(startDate)) {
            if (checkedDates.contains(date)) {
                streak++;
                date = date.minusDays(1);
            } else {
                break;
            }
        }
        return streak;
    }

    private Map<String, Object> toPlanMap(StudyPlan plan, boolean withStats) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", plan.getId());
        map.put("name", plan.getName());
        map.put("description", plan.getDescription());
        map.put("startDate", plan.getStartDate());
        map.put("endDate", plan.getEndDate());
        map.put("totalDurationHours", plan.getTotalDurationHours());
        map.put("createdAt", plan.getCreatedAt());
        return map;
    }

    private Map<String, Object> toCheckInMap(StudyCheckIn checkIn) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", checkIn.getId());
        map.put("planId", checkIn.getPlan().getId());
        map.put("checkInDate", checkIn.getCheckInDate());
        map.put("durationHours", checkIn.getDurationHours());
        map.put("remark", checkIn.getRemark());
        map.put("createdAt", checkIn.getCreatedAt());
        return map;
    }

    private StudyPlan findPlanAndValidate(Long planId, Long userId) {
        return planRepository.findByIdAndUserId(planId, userId)
            .orElseThrow(() -> new BusinessException("计划不存在"));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("用户不存在"));
    }

    private String require(Map<String, Object> body, String key) {
        String value = str(body.get(key));
        if (value == null || value.isBlank()) throw new BusinessException("参数缺失：" + key);
        return value;
    }

    private String str(Object value) {
        return value == null ? null : String.valueOf(value).trim();
    }

    private BigDecimal toDecimal(Object value) {
        if (value == null) return null;
        String s = String.valueOf(value).trim();
        if (s.isEmpty()) return null;
        return new BigDecimal(s);
    }

    private void validateDateRange(Map<String, Object> body) {
        LocalDate start = LocalDate.parse(str(body.get("startDate")));
        LocalDate end = LocalDate.parse(str(body.get("endDate")));
        if (end.isBefore(start)) {
            throw new BusinessException("结束日期不能早于开始日期");
        }
    }
}