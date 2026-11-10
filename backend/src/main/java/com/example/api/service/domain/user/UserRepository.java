package com.example.api.service.domain.user;

import java.util.Optional;

import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Record;
import org.jooq.Table;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Repository;

@Repository
@DependsOn("flyway")
class UserRepository {
    private static final Table<Record> USERS = org.jooq.impl.DSL.table("users");
    private static final Field<Long> ID = org.jooq.impl.DSL.field("id", Long.class);
    private static final Field<String> FULL_NAME = org.jooq.impl.DSL.field("full_name", String.class);
    private static final Field<String> USERNAME = org.jooq.impl.DSL.field("username", String.class);
    private static final Field<String> EMAIL = org.jooq.impl.DSL.field("email", String.class);
    private static final Field<String> PASSWORD = org.jooq.impl.DSL.field("password", String.class);
    private static final Field<String> ROLE = org.jooq.impl.DSL.field("role", String.class);

    private final DSLContext dsl;

    UserRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    Optional<UserAccount> findByUsernameOrEmail(String identity) {
        return dsl.select(ID, FULL_NAME, USERNAME, EMAIL, PASSWORD, ROLE)
                .from(USERS)
                .where(USERNAME.equalIgnoreCase(identity).or(EMAIL.equalIgnoreCase(identity)))
                .fetchOptional(this::map);
    }

    Optional<UserAccount> findById(long id) {
        return dsl.select(ID, FULL_NAME, USERNAME, EMAIL, PASSWORD, ROLE)
                .from(USERS)
                .where(ID.eq(id))
                .fetchOptional(this::map);
    }

    boolean existsByUsernameOrEmail(String username, String email) {
        return dsl.fetchExists(dsl.selectOne()
                .from(USERS)
                .where(USERNAME.equalIgnoreCase(username).or(EMAIL.equalIgnoreCase(email))));
    }

    UserAccount insert(String fullName, String username, String email, String passwordHash) {
        Record inserted = dsl.insertInto(USERS)
                .columns(FULL_NAME, USERNAME, EMAIL, PASSWORD, ROLE)
                .values(fullName, username, email, passwordHash, "USER")
                .returning(ID, FULL_NAME, USERNAME, EMAIL, PASSWORD, ROLE)
                .fetchOne();
        if (inserted == null) {
            throw new IllegalStateException("Database did not return the created user");
        }
        return map(inserted);
    }

    private UserAccount map(Record record) {
        return new UserAccount(
                record.get(ID),
                record.get(FULL_NAME),
                record.get(USERNAME),
                record.get(EMAIL),
                record.get(PASSWORD),
                record.get(ROLE));
    }
}
