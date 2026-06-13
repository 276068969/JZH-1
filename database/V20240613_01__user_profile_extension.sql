USE car_rental;

ALTER TABLE `users`
    ADD COLUMN `id_card` VARCHAR(18) DEFAULT NULL COMMENT '身份证号（个人用户）' AFTER `user_type`,
    ADD COLUMN `license_number` VARCHAR(20) DEFAULT NULL COMMENT '驾照号（个人用户）' AFTER `id_card`,
    ADD COLUMN `company_name` VARCHAR(100) DEFAULT NULL COMMENT '公司名称（企业用户）' AFTER `license_number`,
    ADD COLUMN `credit_code` VARCHAR(18) DEFAULT NULL COMMENT '统一社会信用代码（企业用户）' AFTER `company_name`,
    ADD COLUMN `legal_person_name` VARCHAR(50) DEFAULT NULL COMMENT '法人代表姓名（企业用户）' AFTER `credit_code`,
    ADD COLUMN `legal_person_id_card` VARCHAR(18) DEFAULT NULL COMMENT '法人代表身份证号（企业用户）' AFTER `legal_person_name`,
    ADD COLUMN `profile_complete` TINYINT DEFAULT 0 COMMENT '资料完整度标记 0-未完成 1-已完成' AFTER `legal_person_id_card`;

ALTER TABLE `users`
    ADD UNIQUE INDEX `idx_id_card` (`id_card`),
    ADD UNIQUE INDEX `idx_license_number` (`license_number`),
    ADD UNIQUE INDEX `idx_credit_code` (`credit_code`);
