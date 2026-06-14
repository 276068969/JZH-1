package com.carrental.config;

import com.carrental.entity.User;
import com.carrental.entity.Order;
import com.carrental.entity.Vehicle;
import com.carrental.mapper.UserMapper;
import com.carrental.mapper.OrderMapper;
import com.carrental.mapper.VehicleMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
@Order(2)
public class TestAccountInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(TestAccountInitializer.class);

    private final UserMapper userMapper;
    private final OrderMapper orderMapper;
    private final VehicleMapper vehicleMapper;
    private final PasswordEncoder passwordEncoder;

    public TestAccountInitializer(UserMapper userMapper, OrderMapper orderMapper,
                                   VehicleMapper vehicleMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.orderMapper = orderMapper;
        this.vehicleMapper = vehicleMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        try {
            User admin = ensureEnterpriseAccount("admin", "admin123", "admin@carrental.com", "13800138000");
            User test = ensurePersonalAccount("test", "test123", "test@carrental.com", "13900139000");
            ensureDemoOrders(admin, test);
            log.info("[Test-Account] Test accounts verification completed.");
        } catch (Exception e) {
            log.warn("[Test-Account] Initialization skipped due to error: {}", e.getMessage());
        }
    }

    private User ensurePersonalAccount(String username, String rawPassword, String email, String phone) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        User existingUser = userMapper.selectOne(wrapper);

        if (existingUser == null) {
            log.info("[Test-Account] Creating personal test account: {}", username);
            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setEmail(email);
            user.setPhone(phone);
            user.setUserType("personal");
            user.setIdCard("110101199001011234");
            user.setLicenseNumber("110101199001011234");
            user.setProfileComplete(1);
            user.setCreateTime(LocalDateTime.now());
            user.setUpdateTime(LocalDateTime.now());
            userMapper.insert(user);
            log.info("[Test-Account] Personal test account '{}' created successfully.", username);
            return user;
        } else {
            boolean dirty = false;
            if (!passwordEncoder.matches(rawPassword, existingUser.getPassword())) {
                log.info("[Test-Account] Password mismatch for '{}', resetting to default.", username);
                existingUser.setPassword(passwordEncoder.encode(rawPassword));
                dirty = true;
            }
            if (existingUser.getIdCard() == null) {
                existingUser.setIdCard("110101199001011234");
                dirty = true;
            }
            if (existingUser.getLicenseNumber() == null) {
                existingUser.setLicenseNumber("110101199001011234");
                dirty = true;
            }
            if (existingUser.getProfileComplete() == null || existingUser.getProfileComplete() != 1) {
                existingUser.setProfileComplete(1);
                dirty = true;
            }
            if (dirty) {
                existingUser.setUpdateTime(LocalDateTime.now());
                userMapper.updateById(existingUser);
                log.info("[Test-Account] Personal test account '{}' updated successfully.", username);
            } else {
                log.info("[Test-Account] Personal test account '{}' is up to date.", username);
            }
            return existingUser;
        }
    }

    private User ensureEnterpriseAccount(String username, String rawPassword, String email, String phone) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        User existingUser = userMapper.selectOne(wrapper);

        if (existingUser == null) {
            log.info("[Test-Account] Creating enterprise test account: {}", username);
            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setEmail(email);
            user.setPhone(phone);
            user.setUserType("enterprise");
            user.setCompanyName("北京演示汽车租赁有限公司");
            user.setCreditCode("91110000MA01234567");
            user.setLegalPersonName("张三");
            user.setLegalPersonIdCard("110101198001018888");
            user.setProfileComplete(1);
            user.setCreateTime(LocalDateTime.now());
            user.setUpdateTime(LocalDateTime.now());
            userMapper.insert(user);
            log.info("[Test-Account] Enterprise test account '{}' created successfully.", username);
            return user;
        } else {
            boolean dirty = false;
            if (!passwordEncoder.matches(rawPassword, existingUser.getPassword())) {
                log.info("[Test-Account] Password mismatch for '{}', resetting to default.", username);
                existingUser.setPassword(passwordEncoder.encode(rawPassword));
                dirty = true;
            }
            if (existingUser.getCompanyName() == null) {
                existingUser.setCompanyName("北京演示汽车租赁有限公司");
                dirty = true;
            }
            if (existingUser.getCreditCode() == null) {
                existingUser.setCreditCode("91110000MA01234567");
                dirty = true;
            }
            if (existingUser.getLegalPersonName() == null) {
                existingUser.setLegalPersonName("张三");
                dirty = true;
            }
            if (existingUser.getLegalPersonIdCard() == null) {
                existingUser.setLegalPersonIdCard("110101198001018888");
                dirty = true;
            }
            if (existingUser.getProfileComplete() == null || existingUser.getProfileComplete() != 1) {
                existingUser.setProfileComplete(1);
                dirty = true;
            }
            if (dirty) {
                existingUser.setUpdateTime(LocalDateTime.now());
                userMapper.updateById(existingUser);
                log.info("[Test-Account] Enterprise test account '{}' updated successfully.", username);
            } else {
                log.info("[Test-Account] Enterprise test account '{}' is up to date.", username);
            }
            return existingUser;
        }
    }

    private void ensureDemoOrders(User admin, User test) {
        try {
            List<Vehicle> vehicles = vehicleMapper.selectList(
                new LambdaQueryWrapper<Vehicle>()
                    .eq(Vehicle::getDeleted, 0)
                    .orderByAsc(Vehicle::getId)
                    .last("LIMIT 6")
            );
            if (vehicles == null || vehicles.isEmpty()) {
                log.warn("[Demo-Orders] No vehicles found, skipping demo order creation.");
                return;
            }

            LocalDateTime now = LocalDateTime.now();
            int createdCount = 0;

            Long testOrderCount = orderMapper.selectCount(
                new LambdaQueryWrapper<com.carrental.entity.Order>()
                    .eq(com.carrental.entity.Order::getUserId, test.getId())
                    .eq(com.carrental.entity.Order::getDeleted, 0)
            );
            if (testOrderCount == null || testOrderCount == 0) {
                Vehicle v1 = vehicles.get(0 % vehicles.size());
                Vehicle v2 = vehicles.get(1 % vehicles.size());
                Vehicle v3 = vehicles.get(2 % vehicles.size());

                Order order1 = new Order();
                order1.setUserId(test.getId());
                order1.setVehicleId(v1.getId());
                order1.setStartDate(now.plusDays(2).withHour(9).withMinute(0).withSecond(0).withNano(0));
                order1.setEndDate(now.plusDays(5).withHour(18).withMinute(0).withSecond(0).withNano(0));
                BigDecimal price1 = v1.getPrice() != null ? v1.getPrice() : BigDecimal.ZERO;
                order1.setTotalPrice(price1.multiply(BigDecimal.valueOf(3)));
                order1.setStatus("pending");
                order1.setRenewCount(0);
                order1.setCreateTime(now.minusDays(1));
                order1.setUpdateTime(now.minusDays(1));
                orderMapper.insert(order1);

                Order order2 = new Order();
                order2.setUserId(test.getId());
                order2.setVehicleId(v2.getId());
                order2.setStartDate(now.minusDays(1).withHour(9).withMinute(0).withSecond(0).withNano(0));
                order2.setEndDate(now.plusDays(3).withHour(18).withMinute(0).withSecond(0).withNano(0));
                BigDecimal price2 = v2.getPrice() != null ? v2.getPrice() : BigDecimal.ZERO;
                order2.setTotalPrice(price2.multiply(BigDecimal.valueOf(4)));
                order2.setStatus("picked_up");
                order2.setPickupTime(now.minusDays(1).withHour(10).withMinute(15));
                order2.setPickupNote("车辆状况良好，外观无明显划痕，油量满");
                order2.setPickupOdometer(new BigDecimal("12580.5"));
                order2.setRenewCount(1);
                order2.setCreateTime(now.minusDays(7));
                order2.setUpdateTime(now.minusDays(1));
                orderMapper.insert(order2);

                Order order3 = new Order();
                order3.setUserId(test.getId());
                order3.setVehicleId(v3.getId());
                order3.setStartDate(now.minusDays(10).withHour(9).withMinute(0).withSecond(0).withNano(0));
                order3.setEndDate(now.minusDays(5).withHour(18).withMinute(0).withSecond(0).withNano(0));
                BigDecimal price3 = v3.getPrice() != null ? v3.getPrice() : BigDecimal.ZERO;
                order3.setTotalPrice(price3.multiply(BigDecimal.valueOf(5)));
                order3.setStatus("returned");
                order3.setPickupTime(now.minusDays(10).withHour(9).withMinute(30));
                order3.setPickupNote("车辆状况良好");
                order3.setPickupOdometer(new BigDecimal("8920.0"));
                order3.setReturnTime(now.minusDays(5).withHour(17).withMinute(45));
                order3.setReturnNote("还车顺利，车辆无新增损伤");
                order3.setReturnOdometer(new BigDecimal("9650.5"));
                order3.setRenewCount(0);
                order3.setCreateTime(now.minusDays(15));
                order3.setUpdateTime(now.minusDays(5));
                orderMapper.insert(order3);

                createdCount += 3;
                log.info("[Demo-Orders] Created 3 demo orders for 'test' (pending/picked_up/returned).");
            } else {
                log.info("[Demo-Orders] Test user already has {} orders, skipping.", testOrderCount);
            }

            Long adminOrderCount = orderMapper.selectCount(
                new LambdaQueryWrapper<com.carrental.entity.Order>()
                    .eq(com.carrental.entity.Order::getUserId, admin.getId())
                    .eq(com.carrental.entity.Order::getDeleted, 0)
            );
            if (adminOrderCount == null || adminOrderCount == 0) {
                Vehicle v4 = vehicles.get(3 % vehicles.size());
                Vehicle v5 = vehicles.get(4 % vehicles.size());
                Vehicle v6 = vehicles.get(5 % vehicles.size());

                Order order4 = new Order();
                order4.setUserId(admin.getId());
                order4.setVehicleId(v4.getId());
                order4.setStartDate(now.plusDays(1).withHour(8).withMinute(0).withSecond(0).withNano(0));
                order4.setEndDate(now.plusDays(8).withHour(20).withMinute(0).withSecond(0).withNano(0));
                BigDecimal price4 = v4.getPrice() != null ? v4.getPrice() : BigDecimal.ZERO;
                order4.setTotalPrice(price4.multiply(BigDecimal.valueOf(7)));
                order4.setStatus("pending");
                order4.setRenewCount(0);
                order4.setCreateTime(now.minusDays(2));
                order4.setUpdateTime(now.minusDays(2));
                orderMapper.insert(order4);

                Order order5 = new Order();
                order5.setUserId(admin.getId());
                order5.setVehicleId(v5.getId());
                order5.setStartDate(now.minusDays(3).withHour(10).withMinute(0).withSecond(0).withNano(0));
                order5.setEndDate(now.plusDays(2).withHour(12).withMinute(0).withSecond(0).withNano(0));
                BigDecimal price5 = v5.getPrice() != null ? v5.getPrice() : BigDecimal.ZERO;
                order5.setTotalPrice(price5.multiply(BigDecimal.valueOf(5)));
                order5.setStatus("picked_up");
                order5.setPickupTime(now.minusDays(3).withHour(10).withMinute(30));
                order5.setPickupNote("商务用车，已检查车辆状况良好");
                order5.setPickupOdometer(new BigDecimal("25680.0"));
                order5.setRenewCount(0);
                order5.setCreateTime(now.minusDays(10));
                order5.setUpdateTime(now.minusDays(3));
                orderMapper.insert(order5);

                Order order6 = new Order();
                order6.setUserId(admin.getId());
                order6.setVehicleId(v6.getId());
                order6.setStartDate(now.minusDays(20).withHour(9).withMinute(0).withSecond(0).withNano(0));
                order6.setEndDate(now.minusDays(15).withHour(18).withMinute(0).withSecond(0).withNano(0));
                BigDecimal price6 = v6.getPrice() != null ? v6.getPrice() : BigDecimal.ZERO;
                order6.setTotalPrice(price6.multiply(BigDecimal.valueOf(5)));
                order6.setStatus("returned");
                order6.setPickupTime(now.minusDays(20).withHour(9).withMinute(10));
                order6.setPickupOdometer(new BigDecimal("15200.0"));
                order6.setReturnTime(now.minusDays(15).withHour(18).withMinute(0));
                order6.setReturnOdometer(new BigDecimal("15820.5"));
                order6.setReturnNote("企业商务接待用车，使用状况良好");
                order6.setRenewCount(1);
                order6.setCreateTime(now.minusDays(25));
                order6.setUpdateTime(now.minusDays(15));
                orderMapper.insert(order6);

                createdCount += 3;
                log.info("[Demo-Orders] Created 3 demo orders for 'admin' (pending/picked_up/returned).");
            } else {
                log.info("[Demo-Orders] Admin user already has {} orders, skipping.", adminOrderCount);
            }

            if (createdCount > 0) {
                log.info("[Demo-Orders] Total demo orders created: {}.", createdCount);
            }
        } catch (Exception e) {
            log.warn("[Demo-Orders] Demo order creation skipped due to error: {}", e.getMessage());
        }
    }
}
