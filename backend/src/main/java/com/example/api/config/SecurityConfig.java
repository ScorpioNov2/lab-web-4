package com.example.api.config;

import com.example.api.exception.ApiError;
import com.example.api.security.JwtAuthenticationFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import tools.jackson.databind.ObjectMapper;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:5173",    // 1. Vite (React/Vue) - localhost
                "http://127.0.0.1:5173",    // 2. Vite (React/Vue) - IP address
                "http://localhost:3000",    // 3. React (CRA) - localhost
                "http://127.0.0.1:3000",    // 4. React (CRA) - IP address
                "http://localhost:5500",    // 5. VS Code Live Server - localhost
                "http://127.0.0.1:5500",    // 6. VS Code Live Server - IP address
                "http://localhost:4200",    // 7. Angular - localhost
                "http://127.0.0.1:4200"     // 8. Angular - IP address
//                "http://localhost:*",       // Allow all ports on localhost
//                "http://127.0.0.1:*"        // Allow all ports on 127.0.0.1 IP
//                "*"                         // Allow all address
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    @Bean
    FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterServletRegistration(
            JwtAuthenticationFilter jwtAuthenticationFilter) {
        FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(jwtAuthenticationFilter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    org.springframework.security.web.AuthenticationEntryPoint authenticationEntryPoint(ObjectMapper objectMapper) {
        return (request, response, exception) -> writeSecurityError(
                objectMapper, request.getRequestURI(), response, HttpStatus.UNAUTHORIZED, "Authentication is required");
    }

    @Bean
    org.springframework.security.web.access.AccessDeniedHandler accessDeniedHandler(ObjectMapper objectMapper) {
        return (request, response, exception) -> writeSecurityError(
                objectMapper, request.getRequestURI(), response, HttpStatus.FORBIDDEN, "Access is denied");
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            org.springframework.security.web.AuthenticationEntryPoint authenticationEntryPoint,
            org.springframework.security.web.access.AccessDeniedHandler accessDeniedHandler)
            throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(
                                "/api/auth/**", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**")
                        .permitAll()
                        .anyRequest()
                        .authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    private static void writeSecurityError(
            ObjectMapper objectMapper,
            String path,
            jakarta.servlet.http.HttpServletResponse response,
            HttpStatus status,
            String message)
            throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), new ApiError(
                Instant.now(), status.value(), status.getReasonPhrase(), message, path, Map.of()));
    }
}
