package com.graduateplatform.community.service;

import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.community.entity.CommunityNotification;
import com.graduateplatform.community.repository.CommunityNotificationRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class CommunityNotificationService {

    private final CommunityNotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public CommunityNotificationService(CommunityNotificationRepository notificationRepository,
                                        UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void create(User user, String title, String content, String relatedType, Long relatedId) {
        if (user == null) {
            return;
        }
        notificationRepository.save(CommunityNotification.builder()
            .user(user)
            .title(title)
            .content(content)
            .relatedType(relatedType)
            .relatedId(relatedId)
            .build());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> list(Long userId, int page, int size) {
        requireUser(userId);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var notificationPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", notificationPage.getContent().stream().map(this::toMap).toList());
        result.put("totalPages", notificationPage.getTotalPages());
        result.put("totalElements", notificationPage.getTotalElements());
        result.put("number", notificationPage.getNumber());
        result.put("size", notificationPage.getSize());
        result.put("unreadCount", notificationRepository.countByUserIdAndReadFlagFalse(userId));
        return result;
    }

    @Transactional
    public Map<String, Object> markRead(Long userId, Long notificationId) {
        requireUser(userId);
        CommunityNotification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
            .orElseThrow(() -> new BusinessException("通知不存在或不属于当前用户"));
        if (!Boolean.TRUE.equals(notification.getReadFlag())) {
            notification.setReadFlag(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
        return toMap(notification);
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("用户不存在"));
    }

    private Map<String, Object> toMap(CommunityNotification notification) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", notification.getId());
        map.put("title", notification.getTitle());
        map.put("content", notification.getContent());
        map.put("relatedType", notification.getRelatedType());
        map.put("relatedId", notification.getRelatedId());
        map.put("readFlag", notification.getReadFlag());
        map.put("createdAt", notification.getCreatedAt() != null ? notification.getCreatedAt().toString() : null);
        map.put("readAt", notification.getReadAt() != null ? notification.getReadAt().toString() : null);
        return map;
    }
}
