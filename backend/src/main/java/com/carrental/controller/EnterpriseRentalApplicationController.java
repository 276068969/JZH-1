package com.carrental.controller;

import com.carrental.config.JwtAuthHelper;
import com.carrental.dto.EnterpriseRentalApplicationDTO;
import com.carrental.entity.EnterpriseRentalApplication;
import com.carrental.entity.User;
import com.carrental.service.EnterpriseRentalApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enterprise-rental")
@CrossOrigin(origins = "*")
public class EnterpriseRentalApplicationController {

    @Autowired
    private EnterpriseRentalApplicationService applicationService;

    @Autowired
    private JwtAuthHelper jwtAuthHelper;

    @PostMapping("/apply")
    public ResponseEntity<?> createApplication(@RequestBody Map<String, Object> params) {
        try {
            User user = jwtAuthHelper.getCurrentUserRequired();

            if (!"enterprise".equals(user.getUserType())) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 403);
                response.put("message", "仅企业用户可提交长租申请");
                return ResponseEntity.status(403).body(response);
            }

            EnterpriseRentalApplication application = applicationService.createApplication(user.getId(), params);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "申请提交成功");
            response.put("data", application);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            if (e.getMessage().contains("未登录")) {
                response.put("code", 401);
                response.put("message", e.getMessage());
                return ResponseEntity.status(401).body(response);
            }
            response.put("code", 500);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/applications")
    public ResponseEntity<?> getApplications() {
        try {
            User user = jwtAuthHelper.getCurrentUserRequired();

            if (!"enterprise".equals(user.getUserType())) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 403);
                response.put("message", "仅企业用户可查看长租申请");
                return ResponseEntity.status(403).body(response);
            }

            List<EnterpriseRentalApplicationDTO> applications = applicationService.getUserApplications(user.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", applications);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            if (e.getMessage().contains("未登录")) {
                response.put("code", 401);
                response.put("message", e.getMessage());
                return ResponseEntity.status(401).body(response);
            }
            response.put("code", 500);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/applications/{id}")
    public ResponseEntity<?> getApplicationDetail(@PathVariable Long id) {
        try {
            User user = jwtAuthHelper.getCurrentUserRequired();

            if (!"enterprise".equals(user.getUserType())) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 403);
                response.put("message", "仅企业用户可查看长租申请");
                return ResponseEntity.status(403).body(response);
            }

            EnterpriseRentalApplicationDTO application = applicationService.getApplicationDetail(id, user.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", application);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            if (e.getMessage().contains("未登录")) {
                response.put("code", 401);
                response.put("message", e.getMessage());
                return ResponseEntity.status(401).body(response);
            }
            response.put("code", 500);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
}
