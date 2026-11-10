package com.example.api.service.domain.user;

import java.util.Optional;

import org.springframework.stereotype.Service;

@Service
public class UserQueryService {
    private final UserRepository repository;

    UserQueryService(UserRepository repository) {
        this.repository = repository;
    }

    public Optional<UserAccount> findByUsernameOrEmail(String identity) {
        return repository.findByUsernameOrEmail(identity);
    }

    public Optional<UserAccount> findById(long id) {
        return repository.findById(id);
    }

    public boolean existsByUsernameOrEmail(String username, String email) {
        return repository.existsByUsernameOrEmail(username, email);
    }
}
