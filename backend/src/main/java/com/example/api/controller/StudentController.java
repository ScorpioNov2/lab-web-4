package com.example.api.controller;

import com.example.api.dto.request.StudentCreateRequest;
import com.example.api.dto.request.StudentPatchRequest;
import com.example.api.dto.request.StudentSearchRequest;
import com.example.api.dto.response.PagedResponse;
import com.example.api.dto.response.StudentResponse;
import com.example.api.service.StudentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/students")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Students", description = "Student search, filtering, pagination and role-protected CRUD")
public class StudentController {
    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'USER')")
    @Operation(summary = "Search students", description = "GET query parameters support keyword search, field filters, sorting and pagination.")
    public PagedResponse<StudentResponse> search(@Valid @ModelAttribute StudentSearchRequest request) {
        return studentService.search(request);
    }

    @GetMapping("/{isuId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'USER')")
    @Operation(summary = "Get student by ISU ID")
    public StudentResponse getByIsuId(@PathVariable @Positive long isuId) {
        return studentService.getByIsuId(isuId);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Create student (ADMIN)")
    public ResponseEntity<StudentResponse> create(@Valid @RequestBody StudentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentService.create(request));
    }

    @PatchMapping("/{isuId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Partially update student by ISU ID (ADMIN)")
    public StudentResponse patch(
            @PathVariable @Positive long isuId, @Valid @RequestBody StudentPatchRequest request) {
        return studentService.patch(isuId, request);
    }

    @DeleteMapping("/{isuId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Delete student by ISU ID (ADMIN)")
    public ResponseEntity<Void> delete(@PathVariable @Positive long isuId) {
        studentService.delete(isuId);
        return ResponseEntity.noContent().build();
    }
}
