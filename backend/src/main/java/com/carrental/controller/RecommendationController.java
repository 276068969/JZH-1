package com.carrental.controller;

import com.carrental.config.JwtAuthHelper;
import com.carrental.dto.RecommendDTO;
import com.carrental.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommend")
@CrossOrigin(origins = "*")
public class RecommendationController {

    @Autowired
    private RecommendationService recommendationService;

    @Autowired
    private JwtAuthHelper jwtAuthHelper;

    @GetMapping("/home")
    public ResponseEntity<?> recommendForHome(
            @RequestParam(required = false, defaultValue = "6") Integer limit) {
        try {
            Long userId = jwtAuthHelper.getCurrentUserId();
            if (userId == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 401);
                response.put("message", "请先登录以获取个性化推荐");
                return ResponseEntity.status(401).body(response);
            }

            List<RecommendDTO> recommendations = recommendationService.recommendForHome(userId, limit);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", recommendations);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/vehicle-detail")
    public ResponseEntity<?> recommendForVehicleDetail(
            @RequestParam Long vehicleId,
            @RequestParam(required = false, defaultValue = "4") Integer limit) {
        try {
            Long userId = jwtAuthHelper.getCurrentUserId();
            if (userId == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 401);
                response.put("message", "请先登录以获取个性化推荐");
                return ResponseEntity.status(401).body(response);
            }

            List<RecommendDTO> recommendations = recommendationService.recommendForVehicleDetail(userId, vehicleId, limit);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", recommendations);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
