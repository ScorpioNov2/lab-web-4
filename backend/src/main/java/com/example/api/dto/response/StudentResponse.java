package com.example.api.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record StudentResponse(
        String fullName,
        String groupName,
        long isuId,
        int dormitoryNumber,
        String roomNumber,
        LocalDate settlementTerm,
        boolean foreigner,
        String notes,
        LocalDateTime createdAt) {
}
