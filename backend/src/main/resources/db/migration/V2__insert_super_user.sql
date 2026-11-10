--UPDATE users SET role = 'ADMIN' WHERE username = 'superuser';

-- Insert Admin using Flyway placeholder
INSERT INTO users (username, email, password, role, full_name)
VALUES (
    '${admin.username}',
    '${admin.email}',
    '${admin.password}', -- hash BCrypt from env PROD
    '${admin.role}',
    '${admin.full-name}'
);
