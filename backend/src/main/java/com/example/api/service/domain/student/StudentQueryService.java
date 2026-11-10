package com.example.api.service.domain.student;

import com.example.api.dto.request.StudentSearchRequest;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class StudentQueryService {
    private final StudentRepository repository;

    StudentQueryService(StudentRepository repository) {
        this.repository = repository;
    }

    public List<StudentRecord> findAll(StudentSearchRequest search) {
        return repository.findAll(search);
    }

    public long count(StudentSearchRequest search) {
        return repository.count(search);
    }

    public boolean existsByIsuId(long isuId) {
        return repository.existsByIsuId(isuId);
    }

    public StudentRecord getByIsuId(long isuId) {
        return repository.findByIsuId(isuId)
                .orElseThrow(() -> new com.example.api.exception.ApiException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Student was not found"));
    }
}
