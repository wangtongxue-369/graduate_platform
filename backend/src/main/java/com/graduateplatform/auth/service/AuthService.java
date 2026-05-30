package com.graduateplatform.auth.service;

import com.graduateplatform.auth.dto.LoginRequest;
import com.graduateplatform.auth.dto.RegisterRequest;
import com.graduateplatform.auth.dto.ResetPasswordRequest;
import com.graduateplatform.common.entity.User;
import com.graduateplatform.common.exception.BusinessException;
import com.graduateplatform.common.repository.UserRepository;
import com.graduateplatform.common.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d).{8,20}$");
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[A-Za-z][A-Za-z0-9_]{3,19}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final VerificationCodeService codeService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       VerificationCodeService codeService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.codeService = codeService;
    }

    public Map<String, Object> register(RegisterRequest req) {
        String username = normalizeUsername(blankToNull(req.getUsername()));
        String phone = blankToNull(req.getPhone());
        String email = blankToNull(req.getEmail());
        String studentId = blankToNull(req.getStudentId());

        if (username == null) {
            username = generateUniqueUsername(req.getTarget());
        } else {
            validateUsername(username);
            if (userRepository.existsByUsername(username)) {
                throw new BusinessException("Username already exists");
            }
        }

        if (phone != null && userRepository.existsByPhone(phone)) {
            throw new BusinessException("Phone number has already been registered");
        }
        if (email != null && userRepository.existsByEmail(email)) {
            throw new BusinessException("Email has already been registered");
        }
        if (studentId != null && userRepository.existsByStudentId(studentId)) {
            throw new BusinessException("Student ID has already been registered");
        }

        validatePassword(req.getPassword());

        User user = User.builder()
            .username(username)
            .phone(phone)
            .email(email)
            .studentId(studentId)
            .password(passwordEncoder.encode(req.getPassword()))
            .name(req.getName())
            .target(req.getTarget())
            .school(req.getSchool())
            .major(req.getMajor())
            .grade(req.getGrade())
            .intentRegion(req.getIntentRegion())
            .role("user")
            .status("normal")
            .build();

        user = userRepository.save(user);
        String token = tokenProvider.generateToken(user.getId(), user.getRole());

        Map<String, Object> result = toUserMap(user);
        result.put("token", token);
        return result;
    }

    public Map<String, Object> login(LoginRequest req) {
        String credential = blankToNull(req.getCredential());
        if (credential == null) {
            throw new BusinessException("Credential is required");
        }

        User user = findByCredential(credential)
            .orElseThrow(() -> new BusinessException("Account does not exist"));

        if ("banned".equals(user.getStatus())) {
            throw new BusinessException("Account has been banned");
        }
        if ("temporary_locked".equals(user.getStatus())) {
            if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
                throw new BusinessException("Account is temporarily locked. Please try again later.");
            }
            user.setStatus("normal");
            user.setLoginFailCount(0);
            user.setLockedUntil(null);
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            user.setLoginFailCount(user.getLoginFailCount() + 1);
            if (user.getLoginFailCount() >= 5) {
                user.setStatus("temporary_locked");
                user.setLockedUntil(LocalDateTime.now().plusMinutes(30));
                userRepository.save(user);
                throw new BusinessException("Password incorrect 5 times. Account locked for 30 minutes.");
            }
            userRepository.save(user);
            throw new BusinessException("Password is incorrect");
        }

        user.setLoginFailCount(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = tokenProvider.generateToken(user.getId(), user.getRole());
        Map<String, Object> result = toUserMap(user);
        result.put("token", token);
        return result;
    }

    public void resetPassword(ResetPasswordRequest req) {
        String accountType = blankToNull(req.getAccountType());
        String account = blankToNull(req.getAccount());
        if (accountType == null || account == null) {
            throw new BusinessException("Account type and account are required");
        }
        if (!"phone".equals(accountType) && !"email".equals(accountType) && !"studentId".equals(accountType)) {
            throw new BusinessException("Unsupported account type for password reset");
        }

        codeService.verifyAndConsume(account, accountType, req.getVerifyCode());
        User user = findByAccountType(accountType, account)
            .orElseThrow(() -> new BusinessException("Account does not exist"));

        validatePassword(req.getNewPassword());
        if (passwordEncoder.matches(req.getNewPassword(), user.getPassword())) {
            throw new BusinessException("New password cannot be the same as the old password");
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setLoginFailCount(0);
        user.setLockedUntil(null);
        if ("temporary_locked".equals(user.getStatus())) {
            user.setStatus("normal");
        }
        userRepository.save(user);
    }

    public Map<String, Object> getMe(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException("User does not exist"));
        return toUserMap(user);
    }

    public void logout(Long userId) {
        // JWT is stateless; future enhancement: token blacklist
    }

    private Map<String, Object> toUserMap(User user) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("username", user.getUsername());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("phone", user.getPhone());
        map.put("studentId", user.getStudentId());
        map.put("target", user.getTarget());
        map.put("school", user.getSchool());
        map.put("major", user.getMajor());
        map.put("grade", user.getGrade());
        map.put("intentRegion", user.getIntentRegion());
        map.put("role", user.getRole());
        map.put("status", user.getStatus());
        map.put("lastLoginAt", user.getLastLoginAt() != null ? user.getLastLoginAt().toString() : null);
        return map;
    }

    private Optional<User> findByCredential(String credential) {
        String normalizedUsername = normalizeUsername(credential);
        return userRepository.findByUsername(normalizedUsername)
            .or(() -> userRepository.findByPhone(credential))
            .or(() -> userRepository.findByEmail(credential))
            .or(() -> userRepository.findByStudentId(credential));
    }

    private Optional<User> findByAccountType(String accountType, String account) {
        return switch (accountType) {
            case "phone" -> userRepository.findByPhone(account);
            case "email" -> userRepository.findByEmail(account);
            case "studentId" -> userRepository.findByStudentId(account);
            default -> Optional.empty();
        };
    }

    private void validatePassword(String password) {
        if (password == null || !PASSWORD_PATTERN.matcher(password).matches()) {
            throw new BusinessException("Password must be 8-20 chars and include letters and numbers");
        }
    }

    private void validateUsername(String username) {
        if (!USERNAME_PATTERN.matcher(username).matches()) {
            throw new BusinessException("Username must start with a letter and be 4-20 chars (letters, numbers, underscore)");
        }
    }

    private String generateUniqueUsername(String target) {
        String sanitized = blankToNull(target);
        String base = sanitized == null ? "user" : sanitized.replaceAll("[^A-Za-z0-9]", "").toLowerCase(Locale.ROOT);
        if (base.length() < 4) {
            base = "user";
        }
        for (int i = 0; i < 10; i++) {
            String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toLowerCase(Locale.ROOT);
            String candidate = (base + "_" + suffix);
            if (!userRepository.existsByUsername(candidate)) {
                return candidate;
            }
        }
        return "user_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toLowerCase(Locale.ROOT);
    }

    private String normalizeUsername(String value) {
        String v = blankToNull(value);
        return v == null ? null : v.toLowerCase(Locale.ROOT);
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
