package com.example.api.service.domain.user;

import org.springframework.stereotype.Service;

@Service
public class UserCommandService {
    private final UserRepository repository;

    UserCommandService(UserRepository repository) {
        this.repository = repository;
    }

    public UserAccount create(String fullName, String username, String email, String passwordHash) {
        return repository.insert(fullName, username, email, passwordHash);
    }
}
