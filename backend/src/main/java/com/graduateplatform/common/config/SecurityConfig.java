package com.graduateplatform.common.config;

import com.graduateplatform.common.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public authentication POST endpoints
                .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login", "/api/auth/send-code", "/api/auth/reset-password").permitAll()
                .requestMatchers("/api/auth/me", "/api/auth/logout", "/api/users/**").authenticated()
                .requestMatchers(HttpMethod.GET,
                    "/api/studyabroad/experiences",
                    "/api/studyabroad/experiences/page",
                    "/api/studyabroad/admission-cases/page").permitAll()
                // Study abroad management APIs require authenticated users
                .requestMatchers("/api/studyabroad/**").authenticated()
                // Kaoyan materials - my page and download require auth
                .requestMatchers("/api/kaoyan/materials/my").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/kaoyan/materials/*/download/*").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/kaoyan/materials").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/kaoyan/score-lines/favorites").authenticated()
                .requestMatchers("/api/kaoyan/mentors/me", "/api/kaoyan/mentors/counseling/**").authenticated()
                .requestMatchers("/api/kaoyan/plans/**", "/api/kaoyan/checkins/**").authenticated()
                .requestMatchers("/api/kaoyan/study-rooms/me", "/api/kaoyan/study-rooms/me/created").authenticated()
                // Admin APIs must be declared before public GET allow rules
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/community/notifications/**").authenticated()
                .requestMatchers("/api/attempts/**", "/api/practice/**").authenticated()
                // Kaogong endpoints that require authenticated users
                .requestMatchers(HttpMethod.GET, "/api/kaogong/jobs/favorites").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/kaogong/jobs/match-history").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/kaogong/score-lines/favorites").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/kaogong/calendar/subscriptions/me").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/kaogong/notifications/me").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/kaogong/interviews/me").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/kaogong/interviews/me/page").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/kaogong/interviews/feedback/me").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/kaogong/interviews/feedback/me/page").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/kaogong/interviews/attachments/*/download").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/kaogong/jobs/*/favorite").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/kaogong/jobs/*/favorite").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/kaogong/score-lines/*/favorite").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/kaogong/score-lines/*/favorite").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/kaogong/calendar/subscriptions").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/kaogong/calendar/subscriptions/*/cancel").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/kaogong/interviews").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/kaogong/interviews/*/join").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/kaogong/interviews/*/status").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/kaogong/interviews/*/messages").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/kaogong/interviews/*/attachments").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/kaogong/interviews/*/feedback").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/kaogong/jobs/match").permitAll()
                // Employment public browse endpoints are open, personal data endpoints require auth
                .requestMatchers(HttpMethod.GET, "/api/job/fairs/**", "/api/job/postings/**").permitAll()
                .requestMatchers("/api/job/resume/**", "/api/job/applications/**", "/api/job/notifications/**",
                    "/api/job/preferences/**", "/api/job/recommendations/**").authenticated()
                // Public read-only browsing APIs
                .requestMatchers(HttpMethod.GET, "/api/post-categories/**", "/api/posts/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/question-banks/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/kaoyan/schools/page", "/api/kaoyan/score-lines/page").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/kaoyan/materials/page", "/api/kaoyan/materials/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/kaoyan/mentors/page", "/api/kaoyan/mentors/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/kaoyan/study-rooms", "/api/kaoyan/study-rooms/*",
                    "/api/kaoyan/study-rooms/*/messages", "/api/kaoyan/study-rooms/*/stream",
                    "/api/kaoyan/study-rooms/*/leaderboard").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/kaogong/jobs", "/api/kaogong/jobs/page",
                    "/api/kaogong/score-lines", "/api/kaogong/score-lines/page",
                    "/api/kaogong/calendar/events", "/api/kaogong/calendar/events/page", "/api/kaogong/calendar/exams/page",
                    "/api/kaogong/interviews", "/api/kaogong/interviews/page",
                    "/api/kaogong/interviews/*/stream", "/api/kaogong/interviews/*/messages",
                    "/api/kaogong/interviews/*/messages/page", "/api/kaogong/interviews/*/attachments",
                    "/api/kaogong/interviews/*/attachments/page", "/api/kaogong/interviews/*/feedback",
                    "/api/kaogong/interviews/*/feedback/page").permitAll()
                // 题库练习与答题记录属于个人数据：所有方法都需登录，
                // 否则匿名 GET 会命中下方 /api/** 放行规则、在控制器里强转 principal 抛 500
                .requestMatchers("/api/practice/**").authenticated()
                .requestMatchers("/api/attempts/**").authenticated()
                // Write operations, question attempts, and user profile APIs require auth
                .requestMatchers(HttpMethod.POST, "/api/posts/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/questions/*/attempt").authenticated()
                // H2 console
                .requestMatchers("/h2-console/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .headers(headers -> headers.frameOptions(fo -> fo.sameOrigin()));

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
