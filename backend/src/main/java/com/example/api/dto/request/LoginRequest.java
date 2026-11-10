package com.example.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Size(max = 255) String loginIdentifier,
        @NotBlank @Size(max = 72) String password) {
}
