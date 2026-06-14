-- 取车还车确认功能相关字段扩展
USE car_rental;

-- 扩展 orders 表，增加取车还车确认相关字段
ALTER TABLE `orders`
  ADD COLUMN `pickup_time` DATETIME DEFAULT NULL COMMENT '取车确认时间' AFTER `renew_count`,
  ADD COLUMN `pickup_note` VARCHAR(500) DEFAULT NULL COMMENT '取车备注' AFTER `pickup_time`,
  ADD COLUMN `pickup_odometer` DECIMAL(10,1) DEFAULT NULL COMMENT '取车时里程(km)' AFTER `pickup_note`,
  ADD COLUMN `return_time` DATETIME DEFAULT NULL COMMENT '还车确认时间' AFTER `pickup_odometer`,
  ADD COLUMN `return_note` VARCHAR(500) DEFAULT NULL COMMENT '还车备注' AFTER `return_time`,
  ADD COLUMN `return_odometer` DECIMAL(10,1) DEFAULT NULL COMMENT '还车时里程(km)' AFTER `return_note`;

-- 为状态字段建索引，加速查询
CREATE INDEX IF NOT EXISTS `idx_pickup_time` ON `orders`(`pickup_time`);
CREATE INDEX IF NOT EXISTS `idx_return_time` ON `orders`(`return_time`);
