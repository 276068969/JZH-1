CREATE DATABASE IF NOT EXISTS car_rental DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE car_rental;

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100),
  `phone` VARCHAR(20),
  `user_type` VARCHAR(20) DEFAULT 'personal',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` TINYINT DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `location` VARCHAR(200),
  `latitude` DOUBLE,
  `longitude` DOUBLE,
  `available` BOOLEAN DEFAULT TRUE,
  `rating` DECIMAL(2,1) DEFAULT 5.0,
  `description` TEXT,
  `specs` TEXT,
  `features` TEXT,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` TINYINT DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_available` (`available`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `vehicle_id` BIGINT NOT NULL,
  `start_date` DATETIME NOT NULL,
  `end_date` DATETIME NOT NULL,
  `total_price` DECIMAL(10,2) NOT NULL,
  `status` VARCHAR(20) DEFAULT 'pending',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted` TINYINT DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_vehicle_id` (`vehicle_id`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`username`, `password`, `email`, `phone`, `user_type`) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', 'admin@carrental.com', '13800138000', 'enterprise'),
('test', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', 'test@carrental.com', '13900139000', 'personal');

INSERT INTO `vehicles` (`name`, `type`, `price`, `location`, `latitude`, `longitude`, `available`, `rating`, `description`, `specs`, `features`) VALUES
('特斯拉 Model 3', '电动车', 299.00, '北京市朝阳区', 39.9042, 116.4074, TRUE, 4.8, '高性能纯电动轿车，续航500公里，搭载自动驾驶系统', '座位数:5|变速箱:自动|燃料:纯电动|年份:2024', '自动驾驶,全景天窗,智能互联,快速充电,辅助泊车,OTA升级'),
('宝马 5系', '轿车', 399.00, '上海市浦东新区', 31.2304, 121.4737, TRUE, 4.9, '豪华商务轿车，舒适驾乘体验', '座位数:5|变速箱:自动|燃料:汽油|年份:2024', '真皮座椅,导航系统,全景天窗,氛围灯,哈曼卡顿音响'),
('奥迪 A6L', '轿车', 359.00, '广州市天河区', 23.1291, 113.2644, TRUE, 4.7, '科技感十足的豪华轿车', '座位数:5|变速箱:自动|燃料:汽油|年份:2024', '虚拟座舱,矩阵大灯,四驱系统,空气悬架'),
('奔驰 E级', '轿车', 429.00, '深圳市南山区', 22.5431, 114.0579, TRUE, 4.9, '尊贵舒适的商务座驾', '座位数:5|变速箱:自动|燃料:汽油|年份:2024', '柏林之声,香氛系统,氛围灯,魔术车身控制'),
('保时捷 911', '跑车', 1299.00, '杭州市西湖区', 30.2741, 120.1551, TRUE, 5.0, '极致驾驶体验，澎湃动力', '座位数:2|变速箱:自动|燃料:汽油|年份:2024', '运动排气,碳陶瓷刹车,Sport Chrono组件,动力转向升级'),
('大众 途观L', 'SUV', 259.00, '成都市高新区', 30.5728, 104.0668, TRUE, 4.6, '家庭出行首选，宽敞空间', '座位数:7|变速箱:自动|燃料:汽油|年份:2024', '全景天窗,四驱系统,ACC自适应巡航,自动泊车'),
('丰田 埃尔法', 'MPV', 599.00, '北京市海淀区', 39.9812, 116.3119, TRUE, 4.8, '明星保姆车，豪华舒适', '座位数:7|变速箱:自动|燃料:汽油|年份:2024', '航空座椅,隔音玻璃,车载冰箱,后排娱乐系统'),
('蔚来 ES8', '电动车', 499.00, '上海市静安区', 31.2304, 121.4737, TRUE, 4.7, '智能电动SUV', '座位数:6|变速箱:自动|燃料:纯电动|年份:2024', 'NOMI助手,换电服务,自动驾驶,女王副驾'),
('奥迪 Q5L', 'SUV', 379.00, '广州市越秀区', 23.1291, 113.2644, TRUE, 4.6, '全能城市SUV', '座位数:5|变速箱:自动|燃料:汽油|年份:2024', 'quattro四驱,虚拟座舱,矩阵大灯,全景影像');
