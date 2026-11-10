package com.example.api.dto.request;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

public record StudentPatchRequest(
        @Size(max = 255) @Pattern(regexp = "^[^\\p{N}]*$") String fullName,
        @Size(max = 100) String groupName,
        @Positive Long isuId,
        @Positive Integer dormitoryNumber,
        @Size(max = 50) String roomNumber,
        LocalDate settlementTerm,
        Boolean foreigner,
        @Size(max = 4000) String notes) {
    @Schema(hidden = true)
    public boolean isEmpty() {
        return fullName == null
                && groupName == null
                && isuId == null
                && dormitoryNumber == null
                && roomNumber == null
                && settlementTerm == null
                && foreigner == null
                && notes == null;
    }

    public boolean hasInvalidBlankText() {
        return isBlank(fullName) || isBlank(groupName) || isBlank(roomNumber);
    }

    private boolean isBlank(String value) {
        return value != null && value.isBlank();
    }
}
