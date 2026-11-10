package com.example.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record StudentCreateRequest(
        @NotBlank @Size(max = 255) @Pattern(regexp = "^[^\\p{N}]*$") String fullName,
        @NotBlank @Size(max = 100) String groupName,
        @Positive long isuId,
        @Positive int dormitoryNumber,
        @NotBlank @Size(max = 50) String roomNumber,
        @NotNull LocalDate settlementTerm,
        boolean foreigner,
        @Size(max = 4000) String notes) {
}
