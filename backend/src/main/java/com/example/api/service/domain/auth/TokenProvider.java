package com.example.api.service.domain.auth;

import com.example.api.service.domain.user.UserAccount;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TokenProvider {
    private final SecretKey signingKey;
    private final long accessExpirationMs;
    private final long refreshExpirationMs;

    public TokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-expiration-ms}") long accessExpirationMs,
            @Value("${app.jwt.refresh-expiration-ms}") long refreshExpirationMs) {
        if (accessExpirationMs <= 0 || refreshExpirationMs <= 0) {
            throw new IllegalStateException("JWT expiration values must be positive");
        }
        try {
            this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("JWT_SECRET must contain at least 32 UTF-8 bytes", exception);
        }
        this.accessExpirationMs = accessExpirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public String createAccessToken(UserAccount user) {
        return createToken(user, "access", accessExpirationMs);
    }

    public String createRefreshToken(UserAccount user) {
        return createToken(user, "refresh", refreshExpirationMs);
    }

    public Claims parseAccessToken(String token) {
        Claims claims = parse(token);
        if (!"access".equals(claims.get("token_type", String.class))) {
            throw new IllegalArgumentException("Token is not an access token");
        }
        return claims;
    }

    public Claims parseRefreshToken(String token) {
        Claims claims = parse(token);
        if (!"refresh".equals(claims.get("token_type", String.class))) {
            throw new IllegalArgumentException("Token is not a refresh token");
        }
        return claims;
    }

    public long getAccessExpirationSeconds() {
        return accessExpirationMs / 1000;
    }

    public long getRefreshExpirationMs() {
        return refreshExpirationMs;
    }

    private String createToken(UserAccount user, String tokenType, long expirationMs) {
        Date issuedAt = new Date();
        return Jwts.builder()
                .setSubject(user.username())
                .setId(UUID.randomUUID().toString())
                .claim("user_id", user.id())
                .claim("role", user.role())
                .claim("token_type", tokenType)
                .setIssuedAt(issuedAt)
                .setExpiration(new Date(issuedAt.getTime() + expirationMs))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    private Claims parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
