package com.example.api.service;

import com.example.api.dto.request.LoginRequest;
import com.example.api.dto.request.RegisterRequest;
import com.example.api.dto.response.AuthResponse;
import com.example.api.dto.response.UserResponse;
import com.example.api.exception.ApiException;
import com.example.api.service.domain.auth.CryptoService;
import com.example.api.service.domain.auth.TokenProvider;
import com.example.api.service.domain.auth.TokenStorage;
import com.example.api.service.domain.user.UserAccount;
import com.example.api.service.domain.user.UserCommandService;
import com.example.api.service.domain.user.UserQueryService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;

import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserQueryService userQueryService;
    private final UserCommandService userCommandService;
    private final CryptoService cryptoService;
    private final TokenProvider tokenProvider;
    private final TokenStorage tokenStorage;

    public AuthService(
            UserQueryService userQueryService,
            UserCommandService userCommandService,
            CryptoService cryptoService,
            TokenProvider tokenProvider,
            TokenStorage tokenStorage) {
        this.userQueryService = userQueryService;
        this.userCommandService = userCommandService;
        this.cryptoService = cryptoService;
        this.tokenProvider = tokenProvider;
        this.tokenStorage = tokenStorage;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (!request.password().equals(request.passwordConfirm())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Password confirmation does not match");
        }
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userQueryService.existsByUsernameOrEmail(username, email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Username or email is already registered");
        }
        String passwordHash;
        try {
            passwordHash = cryptoService.hashPassword(request.password());
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
        UserAccount user;
        try {
            user = userCommandService.create(request.fullName().trim(), username, email, passwordHash);
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(HttpStatus.CONFLICT, "Username or email is already registered");
        }
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        UserAccount user = userQueryService.findByUsernameOrEmail(request.loginIdentifier().trim())
                .orElseThrow(() -> unauthorized("Invalid username or password"));
        if (!cryptoService.matches(request.password(), user.passwordHash())) {
            throw unauthorized("Invalid username or password");
        }
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse refresh(String refreshToken) {
        Claims claims;
        try {
            claims = tokenProvider.parseRefreshToken(refreshToken);
        } catch (JwtException | IllegalArgumentException exception) {
            throw unauthorized("Invalid or expired refresh token");
        }
        long userId;
        try {
            userId = Long.parseLong(claims.get("user_id").toString());
        } catch (NullPointerException | NumberFormatException exception) {
            throw unauthorized("Invalid or expired refresh token");
        }
        if (tokenStorage.consume(refreshToken).filter(id -> id == userId).isEmpty()) {
            throw unauthorized("Invalid or expired refresh token");
        }
        UserAccount user = userQueryService.findById(userId)
                .orElseThrow(() -> unauthorized("Invalid or expired refresh token"));
        return issueTokens(user);
    }

    private AuthResponse issueTokens(UserAccount user) {
        String accessToken = tokenProvider.createAccessToken(user);
        String refreshToken = tokenProvider.createRefreshToken(user);
        tokenStorage.store(user.id(), refreshToken, tokenProvider.getRefreshExpirationMs());
        return new AuthResponse(
                accessToken,
                refreshToken,
                "Bearer",
                tokenProvider.getAccessExpirationSeconds(),
                new UserResponse(user.id(), user.fullName(), user.username(), user.email(), user.role()));
    }

    private ApiException unauthorized(String message) {
        return new ApiException(HttpStatus.UNAUTHORIZED, message);
    }
}
