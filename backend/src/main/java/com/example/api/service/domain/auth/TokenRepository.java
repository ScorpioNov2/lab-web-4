package com.example.api.service.domain.auth;

import java.time.LocalDateTime;
import java.util.Optional;

import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Record;
import org.jooq.Table;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Repository;

@Repository
@DependsOn("flyway")
class TokenRepository {
    private static final Table<Record> TOKENS = org.jooq.impl.DSL.table("refresh_tokens");
    private static final Field<Long> USER_ID = org.jooq.impl.DSL.field("user_id", Long.class);
    private static final Field<String> TOKEN = org.jooq.impl.DSL.field("token", String.class);
    private static final Field<LocalDateTime> EXPIRY_DATE =
            org.jooq.impl.DSL.field("expiry_date", LocalDateTime.class);

    private final DSLContext dsl;

    TokenRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    void insert(long userId, String tokenHash, LocalDateTime expiryDate) {
        dsl.insertInto(TOKENS)
                .columns(USER_ID, TOKEN, EXPIRY_DATE)
                .values(userId, tokenHash, expiryDate)
                .execute();
    }

    Optional<StoredRefreshToken> findByHash(String tokenHash) {
        return dsl.select(USER_ID, EXPIRY_DATE)
                .from(TOKENS)
                .where(TOKEN.eq(tokenHash))
                .fetchOptional(record -> new StoredRefreshToken(
                        record.get(USER_ID), record.get(EXPIRY_DATE)));
    }

    boolean deleteByHash(String tokenHash) {
        return dsl.deleteFrom(TOKENS).where(TOKEN.eq(tokenHash)).execute() == 1;
    }

    void deleteExpired(LocalDateTime now) {
        dsl.deleteFrom(TOKENS).where(EXPIRY_DATE.le(now)).execute();
    }

    record StoredRefreshToken(long userId, LocalDateTime expiryDate) {
    }
}
