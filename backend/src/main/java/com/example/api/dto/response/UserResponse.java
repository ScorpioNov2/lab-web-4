package com.example.api.dto.response;

public record UserResponse(long id, String fullName, String username, String email, String role) {
}
