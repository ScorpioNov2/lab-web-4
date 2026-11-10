package com.example.api.service.domain.auth;

import java.nio.charset.StandardCharsets;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class CryptoService {
    private final PasswordEncoder passwordEncoder;

    public CryptoService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    public String hashPassword(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("Password must not exceed 72 UTF-8 bytes");
        }
        return passwordEncoder.encode(password);
    }

    public boolean matches(String password, String passwordHash) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            return false;
        }
        return passwordEncoder.matches(password, passwordHash);
    }
}
