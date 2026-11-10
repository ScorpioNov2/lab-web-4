package com.example.api.service.domain.student;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record StudentRecord(
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
