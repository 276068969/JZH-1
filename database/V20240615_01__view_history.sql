-- 最近浏览功能相关表结构
USE car_rental;

-- 创建浏览历史表
CREATE TABLE IF NOT EXISTS `view_history` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `vehicle_id` BIGINT NOT NULL COMMENT '车辆ID',
  `source_page` VARCHAR(50) DEFAULT 'unknown' COMMENT '来源页面:home/list/detail',
  `view_time` DATETIME DEFAULT NULL COMMENT '浏览时间',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除标记 0:未删除 1:已删除',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_vehicle_id` (`vehicle_id`),
  KEY `idx_user_vehicle` (`user_id`, `vehicle_id`),
  KEY `idx_view_time` (`view_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='车辆浏览历史表';
