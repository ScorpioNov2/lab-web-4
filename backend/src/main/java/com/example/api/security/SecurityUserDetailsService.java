package com.example.api.security;

import com.example.api.service.domain.user.UserAccount;
import com.example.api.service.domain.user.UserQueryService;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class SecurityUserDetailsService implements UserDetailsService {
    private final UserQueryService userQueryService;

    public SecurityUserDetailsService(UserQueryService userQueryService) {
        this.userQueryService = userQueryService;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserAccount account = userQueryService.findByUsernameOrEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User account was not found"));
        return User.withUsername(account.username())
                .password(account.passwordHash())
                .authorities(new SimpleGrantedAuthority(account.role()))
                .build();
    }
}
