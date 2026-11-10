package com.example.api.dto.response;

import java.util.List;

public record PagedResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages) {
    public PagedResponse {
        content = List.copyOf(content);
    }
}
