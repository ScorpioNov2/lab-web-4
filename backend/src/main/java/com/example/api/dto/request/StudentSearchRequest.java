package com.example.api.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record StudentSearchRequest(
        @Size(max = 255) String search,
        @Size(max = 255) String fullName,
        @Size(max = 100) String groupName,
        @Positive Long isuId,
        @Min(1) Integer dormitoryNumber,
        Boolean foreigner,
        @Min(0) @Max(1_000_000) Integer page,
        @Min(1) @Max(100) Integer size,
        @Pattern(regexp = "isuId|fullName|groupName|dormitoryNumber|roomNumber|settlementTerm") String sortBy,
        @Pattern(regexp = "(?i)asc|desc") String sortDirection) {
    public StudentSearchRequest {
        page = page == null ? 0 : page;
        size = size == null ? 20 : size;
        sortBy = sortBy == null || sortBy.isBlank() ? null : sortBy;
        sortDirection = sortDirection == null || sortDirection.isBlank() ? "asc" : sortDirection;
    }
}
