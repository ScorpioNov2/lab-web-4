package com.example.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 255) String fullName,
        @NotBlank @Size(min = 5, max = 20)
        @Pattern(regexp = "^[a-zA-Z0-9][a-zA-Z0-9_-]{3,18}[a-zA-Z0-9]$")
        String username,
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotBlank String passwordConfirm) {
}
