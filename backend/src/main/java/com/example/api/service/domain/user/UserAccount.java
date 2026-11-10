package com.example.api.service.domain.user;

public record UserAccount(long id, String fullName, String username, String email, String passwordHash, String role) {
}
