-- =================================================================
-- Vehicle 表结构化字段迁移脚本
-- 版本: V20240612_01
-- 适用: 已有旧库升级（含 mysql_data 历史数据）
-- 功能: 新增 seats / fuel / transmission / year 四列，从 specs 文本解析回填，建索引
-- 幂等: 可重复执行，已存在的列不会重复添加
-- 兼容: 同时支持半角冒号（座位数:5）与全角冒号（座位数：5）
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

DELIMITER $$
DROP PROCEDURE IF EXISTS `migrate_vehicle_spec_columns` $$
CREATE PROCEDURE `migrate_vehicle_spec_columns`()
BEGIN
  DECLARE v_count INT DEFAULT 0;

  -- -------------------------------------------------------------
  -- 2) 为旧库 ALTER TABLE：逐列检查并添加
  -- -------------------------------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicles' AND COLUMN_NAME = 'seats'
  ) THEN
    ALTER TABLE `vehicles` ADD COLUMN `seats` INT DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicles' AND COLUMN_NAME = 'fuel'
  ) THEN
    ALTER TABLE `vehicles` ADD COLUMN `fuel` VARCHAR(30) DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicles' AND COLUMN_NAME = 'transmission'
  ) THEN
    ALTER TABLE `vehicles` ADD COLUMN `transmission` VARCHAR(30) DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicles' AND COLUMN_NAME = 'year'
  ) THEN
    ALTER TABLE `vehicles` ADD COLUMN `year` INT DEFAULT NULL;
  END IF;

  -- -------------------------------------------------------------
  -- 3) 从 specs 文本回填结构化字段（只回填当前为 NULL 的列）
  --    specs 格式: "座位数:5|变速箱:自动|燃料:纯电动|年份:2024"
  --             or "座位数：5｜变速箱：自动｜燃料：纯电动｜年份：2024"（全角冒号/分隔符）
  --    兼容 key 变体: "座位"/"燃料类型"/"变速器"/"年款" 等
  --    兼容冒号: 半角「:」、全角「：」
  --    兼容分隔符: 半角「|」、全角「｜」
  --    安全策略: 先用 LOCATE 判断 key 确实存在, 再用 SUBSTRING_INDEX 提取
  -- -------------------------------------------------------------

  -- 先归一化 specs: 全角冒号「：」→ 半角「:」, 全角分隔符「｜」→ 半角「|」
  -- 兼容: 全角空格「　」、连续空格、中文逗号「，」等各种不标准分隔符
  UPDATE `vehicles`
    SET `specs` = TRIM(
      REGEXP_REPLACE(
        REPLACE(REPLACE(REPLACE(REPLACE(`specs`,
          '：', ':'),
          '｜', '|'),
          '　', ' '),
          '，', '|'),
        '[[:space:]]+', '')
    )
    WHERE `specs` IS NOT NULL AND `specs` <> '';

  -- 回填 seats: 半角冒号 + 变体 key + 归一化后的分隔符
  UPDATE `vehicles`
    SET `seats` = CAST(REGEXP_REPLACE(CASE
      WHEN LOCATE('座位数:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '座位数:', -1), '|', 1)
      WHEN LOCATE('座位:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '座位:', -1), '|', 1)
      WHEN LOCATE('Seats:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, 'Seats:', -1), '|', 1)
      WHEN LOCATE('seats:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, 'seats:', -1), '|', 1)
      ELSE NULL
    END, '[^0-9]', '') AS UNSIGNED)
  WHERE `seats` IS NULL
    AND `specs` IS NOT NULL AND `specs` <> ''
    AND REGEXP_REPLACE(CASE
      WHEN LOCATE('座位数:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '座位数:', -1), '|', 1)
      WHEN LOCATE('座位:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '座位:', -1), '|', 1)
      WHEN LOCATE('Seats:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, 'Seats:', -1), '|', 1)
      WHEN LOCATE('seats:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, 'seats:', -1), '|', 1)
      ELSE NULL
    END, '[^0-9]', '') <> '';

  -- 回填 fuel: 半角冒号 + 变体 key + 归一化后的分隔符
  UPDATE `vehicles`
    SET `fuel` = TRIM(CASE
      WHEN LOCATE('燃料类型:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '燃料类型:', -1), '|', 1)
      WHEN LOCATE('燃料:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '燃料:', -1), '|', 1)
      WHEN LOCATE('燃油类型:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '燃油类型:', -1), '|', 1)
      WHEN LOCATE('燃油:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '燃油:', -1), '|', 1)
      WHEN LOCATE('Fuel:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, 'Fuel:', -1), '|', 1)
      WHEN LOCATE('fuel:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, 'fuel:', -1), '|', 1)
      ELSE NULL
    END)
  WHERE (`fuel` IS NULL OR `fuel` = '')
    AND `specs` IS NOT NULL AND `specs` <> ''
    AND CASE
      WHEN LOCATE('燃料类型:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '燃料类型:', -1), '|', 1)
      WHEN LOCATE('燃料:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '燃料:', -1), '|', 1)
      WHEN LOCATE('燃油类型:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '燃油类型:', -1), '|', 1)
      WHEN LOCATE('燃油:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '燃油:', -1), '|', 1)
      WHEN LOCATE('Fuel:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, 'Fuel:', -1), '|', 1)
      WHEN LOCATE('fuel:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, 'fuel:', -1), '|', 1)
      ELSE NULL
    END IS NOT NULL;

  -- 回填 transmission: 半角冒号 + 变体 key + 归一化后的分隔符
  UPDATE `vehicles`
    SET `transmission` = TRIM(CASE
      WHEN LOCATE('变速箱:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '变速箱:', -1), '|', 1)
      WHEN LOCATE('变速器:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '变速器:', -1), '|', 1)
      WHEN LOCATE('Transmission:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, 'Transmission:', -1), '|', 1)
      WHEN LOCATE('transmission:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, 'transmission:', -1), '|', 1)
      ELSE NULL
    END)
  WHERE (`transmission` IS NULL OR `transmission` = '')
    AND `specs` IS NOT NULL AND `specs` <> ''
    AND CASE
      WHEN LOCATE('变速箱:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '变速箱:', -1), '|', 1)
      WHEN LOCATE('变速器:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '变速器:', -1), '|', 1)
      WHEN LOCATE('Transmission:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, 'Transmission:', -1), '|', 1)
      WHEN LOCATE('transmission:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, 'transmission:', -1), '|', 1)
      ELSE NULL
    END IS NOT NULL;

  -- 回填 year: 半角冒号 + 变体 key + 归一化后的分隔符
  UPDATE `vehicles`
    SET `year` = CAST(REGEXP_REPLACE(CASE
      WHEN LOCATE('年份:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '年份:', -1), '|', 1)
      WHEN LOCATE('年款:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '年款:', -1), '|', 1)
      WHEN LOCATE('出厂年份:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '出厂年份:', -1), '|', 1)
      WHEN LOCATE('生产年份:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '生产年份:', -1), '|', 1)
      WHEN LOCATE('Year:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, 'Year:', -1), '|', 1)
      WHEN LOCATE('year:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, 'year:', -1), '|', 1)
      ELSE NULL
    END, '[^0-9]', '') AS UNSIGNED)
  WHERE `year` IS NULL
    AND `specs` IS NOT NULL AND `specs` <> ''
    AND REGEXP_REPLACE(CASE
      WHEN LOCATE('年份:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '年份:', -1), '|', 1)
      WHEN LOCATE('年款:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '年款:', -1), '|', 1)
      WHEN LOCATE('出厂年份:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '出厂年份:', -1), '|', 1)
      WHEN LOCATE('生产年份:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, '生产年份:', -1), '|', 1)
      WHEN LOCATE('Year:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, 'Year:', -1), '|', 1)
      WHEN LOCATE('year:', `specs`) > 0 THEN SUBSTRING_INDEX(SUBSTRING_INDEX(`specs`, 'year:', -1), '|', 1)
      ELSE NULL
    END, '[^0-9]', '') <> '';

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

  -- 标记迁移版本已完成（使用 INSERT IGNORE 保证幂等）
  INSERT IGNORE INTO `schema_migrations`(`version`, `name`)
  VALUES ('V20240612_01', 'vehicle_structured_specs');
END $$
DELIMITER ;

CALL `migrate_vehicle_spec_columns`();

DROP PROCEDURE IF EXISTS `migrate_vehicle_spec_columns`;
