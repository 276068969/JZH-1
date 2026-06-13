package com.carrental.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Order(1)
public class DatabaseMigrationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationRunner.class);

    private static final String MIGRATION_VERSION = "V20240612_01";
    private static final String MIGRATION_NAME = "vehicle_structured_specs";

    private static final List<String> SEATS_KEYS = Arrays.asList("座位数", "座位", "Seats", "seats");
    private static final List<String> FUEL_KEYS = Arrays.asList("燃料类型", "燃料", "燃油类型", "燃油", "Fuel", "fuel");
    private static final List<String> TRANSMISSION_KEYS = Arrays.asList("变速箱", "变速器", "Transmission", "transmission");
    private static final List<String> YEAR_KEYS = Arrays.asList("年份", "年款", "出厂年份", "生产年份", "Year", "year");
    private static final List<String> COLONS = Arrays.asList(":", "：");
    private static final List<String> SEPARATORS = Arrays.asList("|", "｜");

    private static final Pattern INT_PATTERN = Pattern.compile("(\\d+)");

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
                log.info("[DB-Migration] Checking for NULL structured columns anyway (safety re-backfill)...");
                rebackfillIfAnyNull();
                return;
            }

            log.info("[DB-Migration] Running {}: {}", MIGRATION_VERSION, MIGRATION_NAME);

            addColumnIfMissing("vehicles", "seats", "INT DEFAULT NULL");
            addColumnIfMissing("vehicles", "fuel", "VARCHAR(30) DEFAULT NULL");
            addColumnIfMissing("vehicles", "transmission", "VARCHAR(30) DEFAULT NULL");
            addColumnIfMissing("vehicles", "year", "INT DEFAULT NULL");

            int seats = backfillSeatsFromSpecs();
            int fuel = backfillFuelFromSpecs();
            int trans = backfillTransmissionFromSpecs();
            int year = backfillYearFromSpecs();
            log.info("[DB-Migration] Backfill summary: seats={}, fuel={}, transmission={}, year={}", seats, fuel, trans, year);

            addIndexIfMissing("vehicles", "idx_seats", "seats");
            addIndexIfMissing("vehicles", "idx_fuel", "fuel");
            addIndexIfMissing("vehicles", "idx_transmission", "transmission");

            markMigrationApplied();

            log.info("[DB-Migration] {} completed successfully.", MIGRATION_VERSION);
        } catch (Exception e) {
            log.warn("[DB-Migration] skipped due to error: {}", e.getMessage());
        }
    }

    private void rebackfillIfAnyNull() {
        try {
            Map<String, Object> row = jdbcTemplate.queryForMap(
                "SELECT " +
                "  SUM(CASE WHEN seats IS NULL THEN 1 ELSE 0 END) AS seats_null, " +
                "  SUM(CASE WHEN fuel IS NULL OR fuel = '' THEN 1 ELSE 0 END) AS fuel_null, " +
                "  SUM(CASE WHEN transmission IS NULL OR transmission = '' THEN 1 ELSE 0 END) AS trans_null, " +
                "  SUM(CASE WHEN year IS NULL THEN 1 ELSE 0 END) AS year_null, " +
                "  COUNT(*) AS total " +
                "FROM vehicles"
            );
            Number totalN = (Number) row.get("total");
            if (totalN == null || totalN.longValue() == 0) return;

            long seatsNull = ((Number) row.get("seats_null")).longValue();
            long fuelNull = ((Number) row.get("fuel_null")).longValue();
            long transNull = ((Number) row.get("trans_null")).longValue();
            long yearNull = ((Number) row.get("year_null")).longValue();

            if (seatsNull == 0 && fuelNull == 0 && transNull == 0 && yearNull == 0) {
                log.info("[DB-Migration] All {} rows have structured columns filled, no re-backfill needed.", totalN);
                return;
            }

            log.info("[DB-Migration] Re-backfilling: seats({}), fuel({}), transmission({}), year({}) / total {}",
                seatsNull, fuelNull, transNull, yearNull, totalN);

            if (seatsNull > 0) backfillSeatsFromSpecs();
            if (fuelNull > 0) backfillFuelFromSpecs();
            if (transNull > 0) backfillTransmissionFromSpecs();
            if (yearNull > 0) backfillYearFromSpecs();
        } catch (Exception e) {
            log.warn("[DB-Migration] re-backfill check skipped: {}", e.getMessage());
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

    private int backfillSeatsFromSpecs() {
        return backfillIntFieldFromSpecsWithFallback("seats", SEATS_KEYS);
    }

    private int backfillFuelFromSpecs() {
        return backfillStringFieldFromSpecsWithFallback("fuel", FUEL_KEYS);
    }

    private int backfillTransmissionFromSpecs() {
        return backfillStringFieldFromSpecsWithFallback("transmission", TRANSMISSION_KEYS);
    }

    private int backfillYearFromSpecs() {
        return backfillIntFieldFromSpecsWithFallback("year", YEAR_KEYS);
    }

    private int backfillStringFieldFromSpecsWithFallback(String column, List<String> keys) {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, specs FROM vehicles " +
                "WHERE (" + column + " IS NULL OR " + column + " = '') " +
                "AND specs IS NOT NULL"
            );
            log.info("[DB-Migration] Backfill {} query found {} rows.", column, rows.size());
            int count = 0;
            for (Map<String, Object> row : rows) {
                Long id = ((Number) row.get("id")).longValue();
                Object specsObj = row.get("specs");
                String specs = asString(specsObj);
                log.debug("[DB-Migration] id={}, specs type={}, specs={}", id, specsObj != null ? specsObj.getClass().getSimpleName() : "null", specs);
                String val = extractStringByKeys(specs, keys);
                if (val != null && !val.trim().isEmpty()) {
                    jdbcTemplate.update("UPDATE vehicles SET " + column + " = ? WHERE id = ?", val.trim(), id);
                    count++;
                }
            }
            log.info("[DB-Migration] Backfilled {} (string) for {} rows.", column, count);
            return count;
        } catch (Exception ex) {
            log.warn("[DB-Migration] {} backfill failed: {}", column, ex.getMessage(), ex);
            return 0;
        }
    }

    private int backfillIntFieldFromSpecsWithFallback(String column, List<String> keys) {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, specs FROM vehicles " +
                "WHERE " + column + " IS NULL " +
                "AND specs IS NOT NULL"
            );
            log.info("[DB-Migration] Backfill {} query found {} rows.", column, rows.size());
            int count = 0;
            for (Map<String, Object> row : rows) {
                Long id = ((Number) row.get("id")).longValue();
                Object specsObj = row.get("specs");
                String specs = asString(specsObj);
                log.debug("[DB-Migration] id={}, specs type={}, specs={}", id, specsObj != null ? specsObj.getClass().getSimpleName() : "null", specs);
                Integer val = extractIntByKeys(specs, keys);
                if (val != null) {
                    jdbcTemplate.update("UPDATE vehicles SET " + column + " = ? WHERE id = ?", val, id);
                    count++;
                }
            }
            log.info("[DB-Migration] Backfilled {} (int) for {} rows.", column, count);
            return count;
        } catch (Exception ex) {
            log.warn("[DB-Migration] {} backfill failed: {}", column, ex.getMessage(), ex);
            return 0;
        }
    }

    private static String normalizeSpecs(String specs) {
        if (specs == null || specs.isEmpty()) return specs;
        String s = specs;
        s = s.replace('：', ':');
        s = s.replace('｜', '|');
        s = s.replace('，', '|');
        s = s.replace('　', ' ');
        s = s.replaceAll("\\s+", "");
        return s;
    }

    private static String asString(Object val) {
        if (val == null) return null;
        String s;
        if (val instanceof String) {
            s = (String) val;
        } else if (val instanceof byte[]) {
            s = new String((byte[]) val, StandardCharsets.UTF_8);
        } else {
            s = val.toString();
        }
        return fixDoubleEncoding(s);
    }

    private static String fixDoubleEncoding(String s) {
        if (s == null || s.isEmpty()) return s;
        if (containsChinese(s)) {
            return s;
        }
        if (!looksLikeDoubleEncoded(s)) {
            return s;
        }
        try {
            byte[] raw = s.getBytes(StandardCharsets.ISO_8859_1);
            String decoded = new String(raw, StandardCharsets.UTF_8);
            if (containsChinese(decoded)) {
                return decoded;
            }
            return s;
        } catch (Exception e) {
            return s;
        }
    }

    private static boolean looksLikeDoubleEncoded(String s) {
        if (s == null || s.isEmpty()) return false;
        int weirdCount = 0;
        for (char c : s.toCharArray()) {
            if (c >= '\u00c0' && c <= '\u00ff') {
                weirdCount++;
            }
        }
        return weirdCount >= 3;
    }

    private static boolean containsChinese(String s) {
        for (char c : s.toCharArray()) {
            if (c >= '\u4e00' && c <= '\u9fa5') return true;
        }
        return false;
    }

    private static String extractStringByKeys(String specs, List<String> keys) {
        specs = normalizeSpecs(specs);
        if (specs == null || specs.isEmpty()) return null;
        for (String key : keys) {
            for (String colon : COLONS) {
                String open = key + colon;
                for (String sep : SEPARATORS) {
                    String val = substringBetween(specs, open, sep);
                    if (val != null && !val.trim().isEmpty()) {
                        return val.trim();
                    }
                }
                String val = substringAfter(specs, open);
                if (val != null && !val.trim().isEmpty()) {
                    return val.trim();
                }
            }
        }
        for (String key : keys) {
            for (String sep : SEPARATORS) {
                String val = substringBetweenIgnoreCase(specs, key, sep);
                if (val != null) {
                    val = val.trim();
                    while (val.startsWith(":") || val.startsWith("：")) {
                        val = val.substring(1).trim();
                    }
                    if (!val.isEmpty()) return val;
                }
            }
        }
        return null;
    }

    private static Integer extractIntByKeys(String specs, List<String> keys) {
        specs = normalizeSpecs(specs);
        if (specs == null || specs.isEmpty()) return null;
        for (String key : keys) {
            for (String colon : COLONS) {
                String open = key + colon;
                for (String sep : SEPARATORS) {
                    String raw = substringBetween(specs, open, sep);
                    Integer v = parseIntRaw(raw);
                    if (v != null) return v;
                }
                String raw = substringAfter(specs, open);
                Integer v = parseIntRaw(raw);
                if (v != null) return v;
            }
        }
        return null;
    }

    private static Integer parseIntRaw(String raw) {
        if (raw == null || raw.isEmpty()) return null;
        Matcher m = INT_PATTERN.matcher(raw);
        if (m.find()) {
            try {
                return Integer.parseInt(m.group(1));
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
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

    private static String substringBetweenIgnoreCase(String str, String open, String close) {
        if (str == null || open == null || close == null) return null;
        String lower = str.toLowerCase();
        int start = lower.indexOf(open.toLowerCase());
        if (start < 0) return null;
        start += open.length();
        int end = lower.indexOf(close.toLowerCase(), start);
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
