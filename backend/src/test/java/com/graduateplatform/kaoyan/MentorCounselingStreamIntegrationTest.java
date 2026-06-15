package com.graduateplatform.kaoyan;

import com.graduateplatform.common.security.JwtTokenProvider;
import com.graduateplatform.kaoyan.service.MentorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MentorCounselingStreamIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @MockBean
    private MentorService mentorService;

    private String token;

    @BeforeEach
    void setUp() {
        token = tokenProvider.generateToken(99L, "user");
        when(mentorService.subscribeCounseling(99L)).thenReturn(new SseEmitter());
    }

    @Test
    void opensCounselingStreamWithQueryToken() throws Exception {
        mockMvc.perform(
                get("/api/kaoyan/mentors/counseling/stream")
                    .param("token", token)
            )
            .andExpect(status().isOk())
            .andExpect(request().asyncStarted());

        verify(mentorService).subscribeCounseling(99L);
    }
}
