package com.graduateplatform.kaogong.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.kaogong.entity.CivilServicePost;
import com.graduateplatform.kaogong.repository.CivilServicePostRepository;
import com.graduateplatform.kaogong.repository.ExamCalendarEventRepository;
import com.graduateplatform.kaogong.repository.InterviewFeedbackRepository;
import com.graduateplatform.kaogong.repository.InterviewScoreLineRepository;
import com.graduateplatform.kaogong.repository.JobFavoriteRepository;
import com.graduateplatform.kaogong.repository.JobMatchHistoryRepository;
import com.graduateplatform.kaogong.repository.MockInterviewAttachmentRepository;
import com.graduateplatform.kaogong.repository.MockInterviewMessageRepository;
import com.graduateplatform.kaogong.repository.MockInterviewParticipantRepository;
import com.graduateplatform.kaogong.repository.MockInterviewRoomRepository;
import com.graduateplatform.kaogong.repository.NotificationMessageRepository;
import com.graduateplatform.kaogong.repository.ReminderSubscriptionRepository;
import com.graduateplatform.kaogong.repository.ScoreLineFavoriteRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class KaoGongServiceTest {

    @Test
    void matchJobsTreatsEducationAndDegreeRequirementsAsMinimumLevels() {
        CivilServicePostRepository postRepository = mock(CivilServicePostRepository.class);
        when(postRepository.findByActiveTrueOrderByRegistrationEndAsc()).thenReturn(List.of(
            post(1L, "本科及以上", "学士及以上", "不限"),
            post(2L, "硕士及以上", "硕士及以上", "不限"),
            post(3L, "博士", "博士", "不限")
        ));

        KaoGongService service = service(postRepository);

        List<Map<String, Object>> results = service.matchJobs(Map.of(
            "education", "硕士",
            "degree", "硕士"
        ), null);

        assertThat(resultIds(results)).containsExactly(1L, 2L);
    }

    @Test
    void matchJobsFiltersHouseholdAndKeepsUnlimitedPosts() {
        CivilServicePostRepository postRepository = mock(CivilServicePostRepository.class);
        when(postRepository.findByActiveTrueOrderByRegistrationEndAsc()).thenReturn(List.of(
            post(1L, "本科及以上", "学士及以上", "不限"),
            post(2L, "本科及以上", "学士及以上", "上海生源"),
            post(3L, "本科及以上", "学士及以上", "北京户籍")
        ));

        KaoGongService service = service(postRepository);

        List<Map<String, Object>> results = service.matchJobs(Map.of("household", "上海生源"), null);

        assertThat(resultIds(results)).containsExactly(2L, 1L);
    }

    private static List<Long> resultIds(List<Map<String, Object>> results) {
        return results.stream()
            .map(item -> (Long) item.get("id"))
            .toList();
    }

    private static CivilServicePost post(Long id, String educationRequirement, String degreeRequirement, String householdRequirement) {
        return CivilServicePost.builder()
            .id(id)
            .examType("国家公务员考试")
            .year(2026)
            .region("北京")
            .jobName("综合管理岗" + id)
            .recruitingUnit("测试单位" + id)
            .unitType("中央机关直属机构")
            .jobCategory("综合管理")
            .recruitCount(2)
            .educationRequirement(educationRequirement)
            .degreeRequirement(degreeRequirement)
            .majorRequirement("不限")
            .householdRequirement(householdRequirement)
            .politicalStatusRequirement("不限")
            .registrationStart(LocalDate.of(2026, 5, 1))
            .registrationEnd(LocalDate.of(2026, 5, 10))
            .active(true)
            .build();
    }

    private static KaoGongService service(CivilServicePostRepository postRepository) {
        return new KaoGongService(
            postRepository,
            mock(JobFavoriteRepository.class),
            mock(JobMatchHistoryRepository.class),
            mock(InterviewScoreLineRepository.class),
            mock(ScoreLineFavoriteRepository.class),
            mock(ExamCalendarEventRepository.class),
            mock(ReminderSubscriptionRepository.class),
            mock(NotificationMessageRepository.class),
            mock(MockInterviewRoomRepository.class),
            mock(MockInterviewParticipantRepository.class),
            mock(MockInterviewMessageRepository.class),
            mock(MockInterviewAttachmentRepository.class),
            mock(InterviewFeedbackRepository.class),
            mock(UserRepository.class),
            new ObjectMapper()
        );
    }
}
