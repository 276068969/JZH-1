package com.carrental.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@Order(1)
public class DatabaseMigrationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationRunner.class);

    private static final String MIGRATION_VERSION = "V20240612_01";
    private static final String MIGRATION_NAME = "vehicle_structured_specs";

    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            ensureSchemaMigrationsTable();

            if (isMigrationApplied()) {
                log.info("[DB-Migration] {} already applied, skipping.", MIGRATION_VERSION);
                return;
            }

            log.info("[DB-Migration] Running {}: {}", MIGRATION_VERSION, MIGRATION_NAME);

            addColumnIfMissing("vehicles", "seats", "INT DEFAULT NULL");
            addColumnIfMissing("vehicles", "fuel", "VARCHAR(30) DEFAULT NULL");
            addColumnIfMissing("vehicles", "transmission", "VARCHAR(30) DEFAULT NULL");
            addColumnIfMissing("vehicles", "year", "INT DEFAULT NULL");

            backfillSeatsFromSpecs();
            backfillFuelFromSpecs();
            backfillTransmissionFromSpecs();
            backfillYearFromSpecs();

            addIndexIfMissing("vehicles", "idx_seats", "seats");
            addIndexIfMissing("vehicles", "idx_fuel", "fuel");
            addIndexIfMissing("vehicles", "idx_transmission", "transmission");

            markMigrationApplied();

            log.info("[DB-Migration] {} completed successfully.", MIGRATION_VERSION);
        } catch (Exception e) {
            log.warn("[DB-Migration] skipped due to error: {}", e.getMessage());
        }
    }

    private void ensureSchemaMigrationsTable() {
        jdbcTemplate.execute(
            "CREATE TABLE IF NOT EXISTS schema_migrations (" +
            "  version VARCHAR(50) NOT NULL, " +
            "  name VARCHAR(200) NOT NULL, " +
            "  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP, " +
            "  PRIMARY KEY (version)" +
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    }

    private boolean isMigrationApplied() {
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM schema_migrations WHERE version = ?",
                Integer.class,
                MIGRATION_VERSION
            );
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }

    private void markMigrationApplied() {
        jdbcTemplate.update(
            "INSERT IGNORE INTO schema_migrations(version, name) VALUES (?, ?)",
            MIGRATION_VERSION, MIGRATION_NAME
        );
    }

    private boolean columnExists(String table, String column) {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT COUNT(*) AS c FROM information_schema.COLUMNS " +
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                table, column
            );
            if (rows.isEmpty()) return false;
            Object cnt = rows.get(0).get("c");
            return cnt != null && ((Number) cnt).longValue() > 0;
        } catch (Exception e) {
            return false;
        }
    }

    private void addColumnIfMissing(String table, String column, String definition) {
        if (!columnExists(table, column)) {
            String sql = String.format("ALTER TABLE %s ADD COLUMN %s %s", table, column, definition);
            log.info("[DB-Migration] Executing: {}", sql);
            jdbcTemplate.execute(sql);
            log.info("[DB-Migration] Column {} added to {}.", column, table);
        } else {
            log.info("[DB-Migration] Column {}.{} already exists, skip add.", table, column);
        }
    }

    private boolean indexExists(String table, String indexName) {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT COUNT(*) AS c FROM information_schema.STATISTICS " +
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?",
                table, indexName
            );
            if (rows.isEmpty()) return false;
            Object cnt = rows.get(0).get("c");
            return cnt != null && ((Number) cnt).longValue() > 0;
        } catch (Exception e) {
            return false;
        }
    }

    private void addIndexIfMissing(String table, String indexName, String column) {
        if (!indexExists(table, indexName)) {
            String sql = String.format("CREATE INDEX %s ON %s(%s)", indexName, table, column);
            log.info("[DB-Migration] Executing: {}", sql);
            jdbcTemplate.execute(sql);
            log.info("[DB-Migration] Index {} created on {}.", indexName, table);
        } else {
            log.info("[DB-Migration] Index {} on {} already exists, skip add.", indexName, table);
        }
    }

    private void backfillSeatsFromSpecs() {
        int updated;
        try {
            updated = jdbcTemplate.update(
                "UPDATE vehicles SET seats = CAST(REGEXP_REPLACE(" +
                "  SUBSTRING_INDEX(SUBSTRING_INDEX(specs, '座位数:', -1), '|', 1), '[^0-9]', '') AS UNSIGNED) " +
                "WHERE seats IS NULL AND specs IS NOT NULL AND specs LIKE '%座位数:%' " +
                "AND REGEXP_REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(specs, '座位数:', -1), '|', 1), '[^0-9]', '') <> ''"
            );
        } catch (Exception e) {
            updated = backfillSeatsFromSpecsFallback();
        }
        log.info("[DB-Migration] Backfilled seats for {} rows.", updated);
    }

    private int backfillSeatsFromSpecsFallback() {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, specs FROM vehicles WHERE seats IS NULL AND specs IS NOT NULL AND specs LIKE '%座位数:%'"
            );
            int count = 0;
            for (Map<String, Object> row : rows) {
                Long id = ((Number) row.get("id")).longValue();
                String specs = (String) row.get("specs");
                String val = substringBetween(specs, "座位数:", "|");
                if (val == null) val = substringAfter(specs, "座位数:");
                if (val != null) {
                    String num = val.replaceAll("[^0-9]", "");
                    if (!num.isEmpty()) {
                        jdbcTemplate.update("UPDATE vehicles SET seats = ? WHERE id = ?", Integer.parseInt(num), id);
                        count++;
                    }
                }
            }
            return count;
        } catch (Exception ex) {
            log.warn("[DB-Migration] seats fallback backfill failed: {}", ex.getMessage());
            return 0;
        }
    }

    private void backfillFuelFromSpecs() {
        int updated;
        try {
            updated = jdbcTemplate.update(
                "UPDATE vehicles SET fuel = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(specs, '燃料:', -1), '|', 1)) " +
                "WHERE fuel IS NULL AND specs IS NOT NULL AND specs LIKE '%燃料:%'"
            );
        } catch (Exception e) {
            updated = backfillStringFieldFromSpecs("fuel", "燃料:");
        }
        log.info("[DB-Migration] Backfilled fuel for {} rows.", updated);
    }

    private void backfillTransmissionFromSpecs() {
        int updated;
        try {
            updated = jdbcTemplate.update(
                "UPDATE vehicles SET transmission = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(specs, '变速箱:', -1), '|', 1)) " +
                "WHERE transmission IS NULL AND specs IS NOT NULL AND specs LIKE '%变速箱:%'"
            );
        } catch (Exception e) {
            updated = backfillStringFieldFromSpecs("transmission", "变速箱:");
        }
        log.info("[DB-Migration] Backfilled transmission for {} rows.", updated);
    }

    private void backfillYearFromSpecs() {
        int updated;
        try {
            updated = jdbcTemplate.update(
                "UPDATE vehicles SET year = CAST(REGEXP_REPLACE(" +
                "  SUBSTRING_INDEX(SUBSTRING_INDEX(specs, '年份:', -1), '|', 1), '[^0-9]', '') AS UNSIGNED) " +
                "WHERE year IS NULL AND specs IS NOT NULL AND specs LIKE '%年份:%' " +
                "AND REGEXP_REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(specs, '年份:', -1), '|', 1), '[^0-9]', '') <> ''"
            );
        } catch (Exception e) {
            updated = backfillYearFromSpecsFallback();
        }
        log.info("[DB-Migration] Backfilled year for {} rows.", updated);
    }

    private int backfillStringFieldFromSpecs(String column, String key) {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, specs FROM vehicles WHERE " + column + " IS NULL AND specs IS NOT NULL AND specs LIKE '%" + key + "%'"
            );
            int count = 0;
            for (Map<String, Object> row : rows) {
                Long id = ((Number) row.get("id")).longValue();
                String specs = (String) row.get("specs");
                String val = substringBetween(specs, key, "|");
                if (val == null) val = substringAfter(specs, key);
                if (val != null && !val.trim().isEmpty()) {
                    jdbcTemplate.update("UPDATE vehicles SET " + column + " = ? WHERE id = ?", val.trim(), id);
                    count++;
                }
            }
            return count;
        } catch (Exception ex) {
            log.warn("[DB-Migration] {} fallback backfill failed: {}", column, ex.getMessage());
            return 0;
        }
    }

    private int backfillYearFromSpecsFallback() {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, specs FROM vehicles WHERE year IS NULL AND specs IS NOT NULL AND specs LIKE '%年份:%'"
            );
            int count = 0;
            for (Map<String, Object> row : rows) {
                Long id = ((Number) row.get("id")).longValue();
                String specs = (String) row.get("specs");
                String val = substringBetween(specs, "年份:", "|");
                if (val == null) val = substringAfter(specs, "年份:");
                if (val != null) {
                    String num = val.replaceAll("[^0-9]", "");
                    if (!num.isEmpty()) {
                        jdbcTemplate.update("UPDATE vehicles SET year = ? WHERE id = ?", Integer.parseInt(num), id);
                        count++;
                    }
                }
            }
            return count;
        } catch (Exception ex) {
            log.warn("[DB-Migration] year fallback backfill failed: {}", ex.getMessage());
            return 0;
        }
    }

    private static String substringBetween(String str, String open, String close) {
        if (str == null || open == null || close == null) return null;
        int start = str.indexOf(open);
        if (start < 0) return null;
        start += open.length();
        int end = str.indexOf(close, start);
        if (end < 0) return null;
        return str.substring(start, end);
    }

    private static String substringAfter(String str, String open) {
        if (str == null || open == null) return null;
        int start = str.indexOf(open);
        if (start < 0) return null;
        return str.substring(start + open.length());
    }
}
