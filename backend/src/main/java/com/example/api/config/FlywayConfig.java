package com.example.api.config;

import java.util.Map;
import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class FlywayConfig {
    @Bean(initMethod = "migrate")
    Flyway flyway(DataSource dataSource, Environment environment) {
        String locations = environment.getProperty("spring.flyway.locations", "classpath:db/migration");

        String adminUsername = environment.getProperty("spring.flyway.placeholders.admin.username");
        String adminEmail = environment.getProperty("spring.flyway.placeholders.admin.email");
        String adminPassword = environment.getProperty("spring.flyway.placeholders.admin.password");
        String adminFullName = environment.getProperty("spring.flyway.placeholders.admin.full-name");
        String adminRole = environment.getProperty("spring.flyway.placeholders.admin.role");

        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations(locations.split(","))
                .placeholders(Map.of(
                        "admin.username", adminUsername,
                        "admin.email", adminEmail,
                        "admin.password", adminPassword,
                        "admin.full-name", adminFullName,
                        "admin.role", adminRole
                ))
                .load();

        flyway.repair();

        return flyway;
    }
}
