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
                .requestMatchers(HttpMethod.GET, "/api/studyabroad/experiences", "/api/studyabroad/experiences/page").permitAll()
                // Study abroad management APIs require authenticated users
                .requestMatchers("/api/studyabroad/**").authenticated()
                // Kaoyan materials - my page and download require auth
                .requestMatchers("/api/kaoyan/materials/my").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/kaoyan/materials/*/download/*").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/kaoyan/materials").authenticated()
                // Admin APIs must be declared before generic /api/** GET allow rules
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/community/notifications/**").authenticated()
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
                // 题库练习与答题记录属于个人数据：所有方法都需登录，
                // 否则匿名 GET 会命中下方 /api/** 放行规则、在控制器里强转 principal 抛 500
                .requestMatchers("/api/practice/**").authenticated()
                .requestMatchers("/api/attempts/**").authenticated()
                // Generic GET APIs are public for read-only browsing
                .requestMatchers(HttpMethod.GET, "/api/**").permitAll()
                // Write operations, question attempts, and user profile APIs require auth
                .requestMatchers(HttpMethod.POST, "/api/posts/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/questions/*/attempt").authenticated()
                .requestMatchers("/api/auth/me", "/api/auth/logout", "/api/users/**").authenticated()
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
