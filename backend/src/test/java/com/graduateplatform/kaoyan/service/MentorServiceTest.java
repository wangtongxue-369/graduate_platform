package com.graduateplatform.kaoyan.service;

import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.kaoyan.entity.CounselingSession;
import com.graduateplatform.kaoyan.entity.MentorProfile;
import com.graduateplatform.kaoyan.repository.CounselingMessageRepository;
import com.graduateplatform.kaoyan.repository.CounselingSessionRepository;
import com.graduateplatform.kaoyan.repository.MentorProfileRepository;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MentorServiceTest {

    private final MentorProfileRepository mentorRepository = mock(MentorProfileRepository.class);
    private final CounselingSessionRepository sessionRepository = mock(CounselingSessionRepository.class);
    private final CounselingMessageRepository messageRepository = mock(CounselingMessageRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final MentorService mentorService = new MentorService(
        mentorRepository,
        sessionRepository,
        messageRepository,
        userRepository
    );

    @Test
    void createSessionAllowsDifferentUsersEvenWhenUserIdMatchesMentorProfileId() {
        User student = user(7L, "student-7");
        User mentorUser = user(19L, "mentor-19");
        MentorProfile mentorProfile = mentorProfile(7L, mentorUser, true);

        when(mentorRepository.findById(mentorProfile.getId())).thenReturn(Optional.of(mentorProfile));
        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(sessionRepository.save(any(CounselingSession.class))).thenAnswer(invocation -> {
            CounselingSession session = invocation.getArgument(0);
            session.setId(55L);
            return session;
        });

        Map<String, Object> response = mentorService.createSession(student.getId(), mentorProfile.getId(), "复试咨询");

        assertThat(response).containsEntry("id", 55L);
        assertThat(response).containsEntry("studentId", 7L);
        assertThat(response).containsEntry("mentorId", 19L);
    }

    @Test
    void createSessionRejectsConsultingYourOwnProfileUsingMentorUserId() {
        User student = user(7L, "student-7");
        MentorProfile mentorProfile = mentorProfile(99L, student, true);

        when(mentorRepository.findById(mentorProfile.getId())).thenReturn(Optional.of(mentorProfile));

        assertThatThrownBy(() -> mentorService.createSession(student.getId(), mentorProfile.getId(), "自己问自己"))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("不能咨询自己");
    }

    private User user(Long id, String username) {
        return User.builder()
            .id(id)
            .username(username)
            .email(username + "@local")
            .password("encoded")
            .name("测试用户" + id)
            .target("kaoyan")
            .role("user")
            .status("normal")
            .build();
    }

    private MentorProfile mentorProfile(Long profileId, User user, boolean active) {
        return MentorProfile.builder()
            .id(profileId)
            .user(user)
            .nickname("学长学姐" + profileId)
            .graduateSchool("华东师范大学")
            .major("教育学")
            .expertiseSubjects("复试")
            .active(active)
            .build();
    }
}
