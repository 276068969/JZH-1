-- =================================================================
-- Vehicle 表结构化字段迁移脚本
-- 版本: V20240612_01
-- 适用: 已有旧库升级（含 mysql_data 历史数据）
-- 功能: 新增 seats / fuel / transmission / year 四列，从 specs 文本解析回填，建索引
-- 幂等: 可重复执行，已存在的列不会重复添加
-- =================================================================

USE car_rental;

-- -----------------------------------------------------------------
-- 1) 迁移版本记录表（用于追踪已执行的迁移，避免重复）
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `version` VARCHAR(50) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `applied_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 如果此版本已执行过则直接退出（通过存储过程实现，避免跨版本重复报错）
DELIMITER $$
DROP PROCEDURE IF EXISTS `run_migration_if_needed` $$
CREATE PROCEDURE `run_migration_if_needed`(
  IN  p_version  VARCHAR(50),
  IN  p_name     VARCHAR(200),
  OUT p_should_run TINYINT
)
BEGIN
  DECLARE v_count INT DEFAULT 0;
  SELECT COUNT(*) INTO v_count FROM `schema_migrations` WHERE `version` = p_version;
  IF v_count = 0 THEN
    SET p_should_run = 1;
    INSERT INTO `schema_migrations`(`version`, `name`) VALUES (p_version, p_name);
  ELSE
    SET p_should_run = 0;
  END IF;
END $$
DELIMITER ;

SET @should_run = 0;
CALL `run_migration_if_needed`('V20240612_01', 'vehicle_structured_specs', @should_run);

-- 必须在一个 CALL 之后才能使用用户变量做 IF 判断，这里改用存储过程包裹整个迁移
DELIMITER $$
DROP PROCEDURE IF EXISTS `migrate_vehicle_spec_columns` $$
CREATE PROCEDURE `migrate_vehicle_spec_columns`()
BEGIN
  DECLARE v_count INT DEFAULT 0;
  SELECT COUNT(*) INTO v_count FROM `schema_migrations` WHERE `version` = 'V20240612_01_LOCK';
  IF v_count > 0 THEN
    SIGNAL SQLSTATE '01000' SET MESSAGE_TEXT = 'Migration V20240612_01 already applied, skipping.';
  END IF;

  -- 加执行锁（防止并发）
  INSERT IGNORE INTO `schema_migrations`(`version`, `name`) VALUES ('V20240612_01_LOCK', 'lock_during_apply');

  -- -------------------------------------------------------------
  -- 2) 为旧库 ALTER TABLE：逐列检查并添加（兼容 MySQL 无原生 IF NOT EXISTS）
  -- -------------------------------------------------------------

  -- seats 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicles' AND COLUMN_NAME = 'seats'
  ) THEN
    ALTER TABLE `vehicles` ADD COLUMN `seats` INT DEFAULT NULL AFTER `features`;
  END IF;

  -- fuel 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicles' AND COLUMN_NAME = 'fuel'
  ) THEN
    ALTER TABLE `vehicles` ADD COLUMN `fuel` VARCHAR(30) DEFAULT NULL AFTER `seats`;
  END IF;

  -- transmission 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicles' AND COLUMN_NAME = 'transmission'
  ) THEN
    ALTER TABLE `vehicles` ADD COLUMN `transmission` VARCHAR(30) DEFAULT NULL AFTER `fuel`;
  END IF;

  -- year 列
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicles' AND COLUMN_NAME = 'year'
  ) THEN
    ALTER TABLE `vehicles` ADD COLUMN `year` INT DEFAULT NULL AFTER `transmission`;
  END IF;

  -- -------------------------------------------------------------
  -- 3) 从 specs 文本回填结构化字段（只回填当前为 NULL 的列）
  --    specs 格式: "座位数:5|变速箱:自动|燃料:纯电动|年份:2024"
  -- -------------------------------------------------------------

  -- 回填 seats: 提取 "座位数:N"
  UPDATE `vehicles`
    SET `seats` = CAST(
      REGEXP_REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '座位数:', -1), '|', 1), '[^0-9]', '') AS UNSIGNED
    )
  WHERE `seats` IS NULL
    AND `specs` IS NOT NULL
    AND `specs` LIKE '%座位数:%'
    AND REGEXP_REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '座位数:', -1), '|', 1), '[^0-9]', '') <> '';

  -- 回填 fuel: 提取 "燃料:XXX"
  UPDATE `vehicles`
    SET `fuel` = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '燃料:', -1), '|', 1))
  WHERE `fuel` IS NULL
    AND `specs` IS NOT NULL
    AND `specs` LIKE '%燃料:%';

  -- 回填 transmission: 提取 "变速箱:XXX"
  UPDATE `vehicles`
    SET `transmission` = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '变速箱:', -1), '|', 1))
  WHERE `transmission` IS NULL
    AND `specs` IS NOT NULL
    AND `specs` LIKE '%变速箱:%';

  -- 回填 year: 提取 "年份:YYYY"
  UPDATE `vehicles`
    SET `year` = CAST(
      REGEXP_REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '年份:', -1), '|', 1), '[^0-9]', '') AS UNSIGNED
    )
  WHERE `year` IS NULL
    AND `specs` IS NOT NULL
    AND `specs` LIKE '%年份:%'
    AND REGEXP_REPLACE(SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '年份:', -1), '|', 1), '[^0-9]', '') <> '';

  -- -------------------------------------------------------------
  -- 4) 补索引（IF NOT EXISTS 形式）
  -- -------------------------------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicles' AND INDEX_NAME = 'idx_seats'
  ) THEN
    CREATE INDEX `idx_seats` ON `vehicles`(`seats`);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicles' AND INDEX_NAME = 'idx_fuel'
  ) THEN
    CREATE INDEX `idx_fuel` ON `vehicles`(`fuel`);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicles' AND INDEX_NAME = 'idx_transmission'
  ) THEN
    CREATE INDEX `idx_transmission` ON `vehicles`(`transmission`);
  END IF;

  -- 标记主迁移版本已完成
  INSERT IGNORE INTO `schema_migrations`(`version`, `name`)
  VALUES ('V20240612_01', 'vehicle_structured_specs');

  -- 清理临时锁记录
  DELETE FROM `schema_migrations` WHERE `version` = 'V20240612_01_LOCK';
END $$
DELIMITER ;

CALL `migrate_vehicle_spec_columns`();

-- 清理临时存储过程
DROP PROCEDURE IF EXISTS `migrate_vehicle_spec_columns`;
DROP PROCEDURE IF EXISTS `run_migration_if_needed`;

-- =================================================================
-- 验证输出（可选，查看回填结果）
-- =================================================================
SELECT
  COUNT(*)                          AS total_count,
  SUM(CASE WHEN seats IS NOT NULL THEN 1 ELSE 0 END)        AS seats_filled,
  SUM(CASE WHEN fuel IS NOT NULL THEN 1 ELSE 0 END)         AS fuel_filled,
  SUM(CASE WHEN transmission IS NOT NULL THEN 1 ELSE 0 END) AS transmission_filled,
  SUM(CASE WHEN year IS NOT NULL THEN 1 ELSE 0 END)         AS year_filled
FROM `vehicles`;

SELECT id, name, seats, fuel, transmission, year, specs
FROM `vehicles`
ORDER BY id;
