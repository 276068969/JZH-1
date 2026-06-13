package com.carrental.controller;

import com.carrental.config.JwtAuthHelper;
import com.carrental.dto.RegisterRequestDTO;
import com.carrental.dto.RegisterResponseVO;
import com.carrental.entity.User;
import com.carrental.exception.BusinessException;
import com.carrental.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtAuthHelper jwtAuthHelper;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDTO request) {
        try {
            RegisterResponseVO response = userService.register(request);
            if (Boolean.TRUE.equals(response.getSuccess())) {
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
        } catch (BusinessException e) {
            RegisterResponseVO err = RegisterResponseVO.builder()
                .code(e.getCode())
                .success(false)
                .message(e.getMessage())
                .build();
            HttpStatus status = e.getCode() >= 500
                ? HttpStatus.INTERNAL_SERVER_ERROR
                : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(err);
        } catch (Exception e) {
            RegisterResponseVO err = RegisterResponseVO.builder()
                .code(500)
                .success(false)
                .message("服务器异常：" + e.getMessage())
                .build();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> params) {
        try {
            String username = params.get("username");
            String password = params.get("password");

            String token = userService.login(username, password);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "登录成功");
            response.put("token", token);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            User user = jwtAuthHelper.getCurrentUser();
            if (user == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 401);
                response.put("message", "未登录或登录已过期");
                return ResponseEntity.status(401).body(response);
            }

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("username", user.getUsername());
            userInfo.put("email", user.getEmail());
            userInfo.put("phone", user.getPhone());
            userInfo.put("userType", user.getUserType());
            userInfo.put("idCard", maskIdCard(user.getIdCard()));
            userInfo.put("licenseNumber", maskLicense(user.getLicenseNumber()));
            userInfo.put("companyName", user.getCompanyName());
            userInfo.put("creditCode", maskCreditCode(user.getCreditCode()));
            userInfo.put("legalPersonName", user.getLegalPersonName());
            userInfo.put("profileComplete", user.getProfileComplete());

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", userInfo);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    private static String maskIdCard(String id) {
        if (id == null || id.length() < 8) return id;
        return id.substring(0, 6) + "********" + id.substring(id.length() - 4);
    }

    private static String maskLicense(String lic) {
        if (lic == null || lic.length() < 6) return lic;
        return lic.substring(0, 3) + "****" + lic.substring(lic.length() - 2);
    }

    private static String maskCreditCode(String code) {
        if (code == null || code.length() < 10) return code;
        return code.substring(0, 6) + "********" + code.substring(code.length() - 4);
    }
}
