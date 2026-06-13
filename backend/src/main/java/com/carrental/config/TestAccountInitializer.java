package com.carrental.config;

import com.carrental.entity.User;
import com.carrental.mapper.UserMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Order(2)
public class TestAccountInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(TestAccountInitializer.class);

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public TestAccountInitializer(UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        try {
            ensureEnterpriseAccount("admin", "admin123", "admin@carrental.com", "13800138000");
            ensurePersonalAccount("test", "test123", "test@carrental.com", "13900139000");
            log.info("[Test-Account] Test accounts verification completed.");
        } catch (Exception e) {
            log.warn("[Test-Account] Initialization skipped due to error: {}", e.getMessage());
        }
    }

    private void ensurePersonalAccount(String username, String rawPassword, String email, String phone) {
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
        }
    }

    private void ensureEnterpriseAccount(String username, String rawPassword, String email, String phone) {
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
        }
    }
}
