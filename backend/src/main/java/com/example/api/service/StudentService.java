package com.example.api.service;

import com.example.api.dto.request.StudentCreateRequest;
import com.example.api.dto.request.StudentPatchRequest;
import com.example.api.dto.request.StudentSearchRequest;
import com.example.api.dto.response.PagedResponse;
import com.example.api.dto.response.StudentResponse;
import com.example.api.service.domain.student.StudentCommandService;
import com.example.api.service.domain.student.StudentQueryService;
import com.example.api.service.domain.student.StudentRecord;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentService {
    private final StudentQueryService queryService;
    private final StudentCommandService commandService;

    public StudentService(StudentQueryService queryService, StudentCommandService commandService) {
        this.queryService = queryService;
        this.commandService = commandService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<StudentResponse> search(StudentSearchRequest request) {
        List<StudentResponse> students = queryService.findAll(request).stream().map(this::toResponse).toList();
        long totalElements = queryService.count(request);
        int totalPages = (int) Math.ceil((double) totalElements / request.size());
        return new PagedResponse<>(students, request.page(), request.size(), totalElements, totalPages);
    }

    @Transactional(readOnly = true)
    public StudentResponse getByIsuId(long isuId) {
        return toResponse(queryService.getByIsuId(isuId));
    }

    @Transactional
    public StudentResponse create(StudentCreateRequest request) {
        return toResponse(commandService.create(request));
    }

    @Transactional
    public StudentResponse patch(long isuId, StudentPatchRequest request) {
        return toResponse(commandService.patch(isuId, request));
    }

    @Transactional
    public void delete(long isuId) {
        commandService.delete(isuId);
    }

    private StudentResponse toResponse(StudentRecord student) {
        return new StudentResponse(
                student.fullName(),
                student.groupName(),
                student.isuId(),
                student.dormitoryNumber(),
                student.roomNumber(),
                student.settlementTerm(),
                student.foreigner(),
                student.notes(),
                student.createdAt());
    }
}
