package com.example.api.service.domain.student;

import com.example.api.dto.request.StudentCreateRequest;
import com.example.api.dto.request.StudentPatchRequest;
import com.example.api.exception.ApiException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class StudentCommandService {
    private final StudentRepository repository;
    private final StudentValidator validator;

    StudentCommandService(StudentRepository repository, StudentValidator validator) {
        this.repository = repository;
        this.validator = validator;
    }

    public StudentRecord create(StudentCreateRequest request) {
        validator.validateCreateIsuId(request.isuId());
        try {
            return repository.insert(
                    request.fullName().trim(),
                    request.groupName().trim(),
                    request.isuId(),
                    request.dormitoryNumber(),
                    request.roomNumber().trim(),
                    request.settlementTerm(),
                    request.foreigner(),
                    request.notes());
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(HttpStatus.CONFLICT, "A student with this ISU ID already exists");
        }
    }

    public StudentRecord patch(long isuId, StudentPatchRequest request) {
        validator.validatePatch(request);
        validator.validatePatchIsuId(isuId, request.isuId());
        try {
            if (!repository.update(isuId, request)) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Student was not found");
            }
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(HttpStatus.CONFLICT, "A student with this ISU ID already exists");
        }
        // The ISU ID is the primary key, so it may have just been changed by this very patch.
        long updatedIsuId = request.isuId() != null ? request.isuId() : isuId;
        return repository.findByIsuId(updatedIsuId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student was not found"));
    }

    public void delete(long isuId) {
        if (!repository.delete(isuId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Student was not found");
        }
    }
}
