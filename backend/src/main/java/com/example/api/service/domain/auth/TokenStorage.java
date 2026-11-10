package com.example.api.service.domain.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.Optional;

import org.springframework.stereotype.Service;

@Service
public class TokenStorage {
    private final TokenRepository repository;

    TokenStorage(TokenRepository repository) {
        this.repository = repository;
    }

    public void store(long userId, String refreshToken, long expirationMs) {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        repository.deleteExpired(now);
        repository.insert(
                userId, hash(refreshToken), now.plus(Duration.ofMillis(expirationMs)));
    }

    public Optional<Long> consume(String refreshToken) {
        String tokenHash = hash(refreshToken);
        Optional<TokenRepository.StoredRefreshToken> stored = repository.findByHash(tokenHash);
        if (stored.isEmpty()
                || !stored.get().expiryDate().isAfter(LocalDateTime.now(ZoneOffset.UTC))
                || !repository.deleteByHash(tokenHash)) {
            return Optional.empty();
        }
        return Optional.of(stored.get().userId());
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }
}
