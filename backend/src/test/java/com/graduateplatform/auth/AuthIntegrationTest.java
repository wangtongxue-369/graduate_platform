package com.graduateplatform.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.graduateplatform.auth.service.VerificationCodeService;
import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private VerificationCodeService verificationCodeService;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void registerAndLoginWithUsername() throws Exception {
        String suffix = String.valueOf(System.nanoTime());
        String studentId = "sid" + suffix;
        String username = "user" + suffix.substring(Math.max(0, suffix.length() - 8));

        mockMvc.perform(post("/api/auth/send-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "target", studentId,
                    "type", "studentId"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));

        String verifyCode = fetchCode("studentId", studentId);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.ofEntries(
                    Map.entry("username", username),
                    Map.entry("name", "Test User"),
                    Map.entry("password", "Passw0rd1"),
                    Map.entry("email", "user-" + suffix + "@test.local"),
                    Map.entry("studentId", studentId),
                    Map.entry("verifyCode", verifyCode),
                    Map.entry("target", "job"),
                    Map.entry("school", "Test School"),
                    Map.entry("major", "CS"),
                    Map.entry("grade", "2023"),
                    Map.entry("accountType", "studentId"),
                    Map.entry("agreementAccepted", true)
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.username").value(username.toLowerCase()));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "credential", username,
                    "password", "Passw0rd1",
                    "loginType", "username"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.username").value(username.toLowerCase()))
            .andExpect(jsonPath("$.data.token").isNotEmpty());
    }

    @Test
    void resetPasswordThenLoginWithNewPassword() throws Exception {
        String suffix = String.valueOf(System.nanoTime());
        String studentId = "resetsid" + suffix;

        userRepository.save(User.builder()
            .username("resetuser" + suffix.substring(Math.max(0, suffix.length() - 6)))
            .name("Reset User")
            .studentId(studentId)
            .password(passwordEncoder.encode("Oldpass1"))
            .target("job")
            .role("user")
            .status("normal")
            .build());

        mockMvc.perform(post("/api/auth/send-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "target", studentId,
                    "type", "studentId"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));

        String verifyCode = fetchCode("studentId", studentId);

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "accountType", "studentId",
                    "account", studentId,
                    "verifyCode", verifyCode,
                    "newPassword", "Newpass1"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "credential", studentId,
                    "password", "Oldpass1",
                    "loginType", "studentId"
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "credential", studentId,
                    "password", "Newpass1",
                    "loginType", "studentId"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.token").isNotEmpty());
    }

    @SuppressWarnings("unchecked")
    private String fetchCode(String type, String target) throws Exception {
        Map<String, Object> store = (Map<String, Object>) ReflectionTestUtils.getField(verificationCodeService, "store");
        Object entry = store.get(type + ":" + target);
        if (entry == null) {
            throw new IllegalStateException("Verification code not found for " + type + ":" + target);
        }
        var method = entry.getClass().getDeclaredMethod("code");
        method.setAccessible(true);
        return (String) method.invoke(entry);
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
