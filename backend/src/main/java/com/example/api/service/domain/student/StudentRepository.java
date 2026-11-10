package com.example.api.service.domain.student;

import com.example.api.dto.request.StudentPatchRequest;
import com.example.api.dto.request.StudentSearchRequest;
import com.example.api.exception.ApiException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.jooq.Condition;
import org.jooq.Field;
import org.jooq.Record;
import org.jooq.SortField;
import org.jooq.SortOrder;
import org.jooq.Table;
import org.jooq.UpdateQuery;
import org.jooq.impl.DSL;
import org.springframework.http.HttpStatus;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Repository;

@Repository
@DependsOn("flyway")
class StudentRepository {
    private static final Table<Record> STUDENTS = DSL.table("students");
    private static final Field<String> FULL_NAME = DSL.field("full_name", String.class);
    private static final Field<String> GROUP_NAME = DSL.field("group_name", String.class);
    private static final Field<Long> ISU_ID = DSL.field("isu_id", Long.class);
    private static final Field<Integer> DORMITORY_NUMBER = DSL.field("dormitory_number", Integer.class);
    private static final Field<String> ROOM_NUMBER = DSL.field("room_number", String.class);
    private static final Field<LocalDate> SETTLEMENT_TERM = DSL.field("settlement_term", LocalDate.class);
    private static final Field<Boolean> FOREIGNER = DSL.field("is_foreigner", Boolean.class);
    private static final Field<String> NOTES = DSL.field("notes", String.class);
    private static final Field<LocalDateTime> CREATED_AT = DSL.field("created_at", LocalDateTime.class);

    private final org.jooq.DSLContext dsl;

    StudentRepository(org.jooq.DSLContext dsl) {
        this.dsl = dsl;
    }

    List<StudentRecord> findAll(StudentSearchRequest search) {
        Condition condition = condition(search);
        long offset = (long) search.page() * search.size();
        if (offset > Integer.MAX_VALUE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Requested page is too large");
        }
        List<SortField<?>> orderBy = new ArrayList<>();
        if (search.sortBy() != null) {
            orderBy.add(sortField(search));
            orderBy.add(ISU_ID.asc());
        }
        return dsl.select(FULL_NAME, GROUP_NAME, ISU_ID, DORMITORY_NUMBER, ROOM_NUMBER,
                        SETTLEMENT_TERM, FOREIGNER, NOTES, CREATED_AT)
                .from(STUDENTS)
                .where(condition)
                .orderBy(orderBy)
                .limit(search.size())
                .offset((int) offset)
                .fetch(this::map);
    }

    long count(StudentSearchRequest search) {
        Long count = dsl.selectCount().from(STUDENTS).where(condition(search)).fetchOne(0, Long.class);
        return count == null ? 0 : count;
    }

    Optional<StudentRecord> findByIsuId(long isuId) {
        return dsl.select(FULL_NAME, GROUP_NAME, ISU_ID, DORMITORY_NUMBER, ROOM_NUMBER,
                        SETTLEMENT_TERM, FOREIGNER, NOTES, CREATED_AT)
                .from(STUDENTS)
                .where(ISU_ID.eq(isuId))
                .fetchOptional(this::map);
    }

    StudentRecord insert(
            String fullName,
            String groupName,
            long isuId,
            int dormitoryNumber,
            String roomNumber,
            LocalDate settlementTerm,
            boolean foreigner,
            String notes) {
        dsl.insertInto(STUDENTS)
                .columns(FULL_NAME, GROUP_NAME, ISU_ID, DORMITORY_NUMBER, ROOM_NUMBER,
                        SETTLEMENT_TERM, FOREIGNER, NOTES)
                .values(fullName, groupName, isuId, dormitoryNumber, roomNumber,
                        settlementTerm, foreigner, notes)
                .execute();
        return findByIsuId(isuId)
                .orElseThrow(() -> new IllegalStateException("Database did not return the created student"));
    }

    boolean update(long isuId, StudentPatchRequest request) {
        UpdateQuery<Record> update = dsl.updateQuery(STUDENTS);
        if (request.fullName() != null) {
            update.addValue(FULL_NAME, request.fullName().trim());
        }
        if (request.groupName() != null) {
            update.addValue(GROUP_NAME, request.groupName().trim());
        }
        if (request.isuId() != null) {
            update.addValue(ISU_ID, request.isuId());
        }
        if (request.dormitoryNumber() != null) {
            update.addValue(DORMITORY_NUMBER, request.dormitoryNumber());
        }
        if (request.roomNumber() != null) {
            update.addValue(ROOM_NUMBER, request.roomNumber().trim());
        }
        if (request.settlementTerm() != null) {
            update.addValue(SETTLEMENT_TERM, request.settlementTerm());
        }
        if (request.foreigner() != null) {
            update.addValue(FOREIGNER, request.foreigner());
        }
        if (request.notes() != null) {
            update.addValue(NOTES, request.notes());
        }
        update.addConditions(ISU_ID.eq(isuId));
        return update.execute() == 1;
    }

    boolean delete(long isuId) {
        return dsl.deleteFrom(STUDENTS).where(ISU_ID.eq(isuId)).execute() == 1;
    }

    boolean existsByIsuId(long isuId) {
        return dsl.fetchExists(dsl.selectOne().from(STUDENTS).where(ISU_ID.eq(isuId)));
    }

    private Condition condition(StudentSearchRequest search) {
        Condition condition = DSL.noCondition();
        if (search.search() != null && !search.search().isBlank()) {
            String escaped = "%" + escapeLike(search.search().trim()) + "%";
            condition = condition.and(FULL_NAME.likeIgnoreCase(escaped, '\\')
                    .or(GROUP_NAME.likeIgnoreCase(escaped, '\\'))
                    .or(ROOM_NUMBER.likeIgnoreCase(escaped, '\\'))
                    .or(DSL.cast(ISU_ID, String.class).likeIgnoreCase(escaped, '\\')));
        }
        if (search.fullName() != null && !search.fullName().isBlank()) {
            String escaped = escapeLike(search.fullName().trim());
            condition = condition.and(FULL_NAME.likeIgnoreCase("%" + escaped + "%", '\\'));
        }
        if (search.groupName() != null && !search.groupName().isBlank()) {
            condition = condition.and(GROUP_NAME.equalIgnoreCase(search.groupName().trim()));
        }
        if (search.isuId() != null) {
            condition = condition.and(ISU_ID.eq(search.isuId()));
        }
        if (search.dormitoryNumber() != null) {
            condition = condition.and(DORMITORY_NUMBER.eq(search.dormitoryNumber()));
        }
        if (search.foreigner() != null) {
            condition = condition.and(FOREIGNER.eq(search.foreigner()));
        }
        return condition;
    }

    private SortField<?> sortField(StudentSearchRequest search) {
        SortOrder direction;
        if ("asc".equalsIgnoreCase(search.sortDirection())) {
            direction = SortOrder.ASC;
        } else if ("desc".equalsIgnoreCase(search.sortDirection())) {
            direction = SortOrder.DESC;
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST, "sortDirection must be 'asc' or 'desc'");
        }
        Field<?> field = switch (search.sortBy()) {
            case "isuId" -> ISU_ID;
            case "fullName" -> FULL_NAME;
            case "groupName" -> GROUP_NAME;
            case "dormitoryNumber" -> DORMITORY_NUMBER;
            case "roomNumber" -> ROOM_NUMBER;
            case "settlementTerm" -> SETTLEMENT_TERM;
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported student sort field");
        };
        return field.sort(direction);
    }

    private String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private StudentRecord map(Record record) {
        return new StudentRecord(
                record.get(FULL_NAME),
                record.get(GROUP_NAME),
                record.get(ISU_ID),
                record.get(DORMITORY_NUMBER),
                record.get(ROOM_NUMBER),
                record.get(SETTLEMENT_TERM),
                Boolean.TRUE.equals(record.get(FOREIGNER)),
                record.get(NOTES),
                record.get(CREATED_AT));
    }
}
