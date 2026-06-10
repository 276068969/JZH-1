package com.carrental.config;

import com.carrental.entity.User;
import com.carrental.mapper.UserMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;

@Component
public class JwtAuthHelper {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserMapper userMapper;

    public Long getCurrentUserId() {
        String username = getCurrentUsername();
        if (username == null) {
            return null;
        }
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        User user = userMapper.selectOne(wrapper);
        return user != null ? user.getId() : null;
    }

    public Long getCurrentUserIdRequired() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            throw new RuntimeException("未登录或登录已过期，请重新登录");
        }
        return userId;
    }

    public String getCurrentUsername() {
        HttpServletRequest request = getCurrentRequest();
        if (request == null) {
            return null;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            return null;
        }

        return jwtUtil.getUsernameFromToken(token);
    }

    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attrs != null ? attrs.getRequest() : null;
    }
}
