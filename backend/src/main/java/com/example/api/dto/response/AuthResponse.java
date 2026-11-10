package com.example.api.dto.response;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long accessExpiresInSeconds,
        UserResponse user) {
}
