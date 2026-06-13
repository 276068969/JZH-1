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
            ensureTestAccount("admin", "admin123", "admin@carrental.com", "13800138000", "enterprise");
            ensureTestAccount("test", "test123", "test@carrental.com", "13900139000", "personal");
            log.info("[Test-Account] Test accounts verification completed.");
        } catch (Exception e) {
            log.warn("[Test-Account] Initialization skipped due to error: {}", e.getMessage());
        }
    }

    private void ensureTestAccount(String username, String rawPassword, String email, String phone, String userType) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        User existingUser = userMapper.selectOne(wrapper);

        if (existingUser == null) {
            log.info("[Test-Account] Creating test account: {}", username);
            User user = new User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setEmail(email);
            user.setPhone(phone);
            user.setUserType(userType);
            user.setCreateTime(LocalDateTime.now());
            user.setUpdateTime(LocalDateTime.now());
            userMapper.insert(user);
            log.info("[Test-Account] Test account '{}' created successfully.", username);
        } else {
            if (!passwordEncoder.matches(rawPassword, existingUser.getPassword())) {
                log.info("[Test-Account] Password mismatch for '{}', resetting to default.", username);
                existingUser.setPassword(passwordEncoder.encode(rawPassword));
                existingUser.setUpdateTime(LocalDateTime.now());
                userMapper.updateById(existingUser);
                log.info("[Test-Account] Test account '{}' password reset successfully.", username);
            } else {
                log.info("[Test-Account] Test account '{}' is up to date.", username);
            }
        }
    }
}
