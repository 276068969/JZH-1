package com.carrental.controller;

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

    @GetMapping("/home")
    public ResponseEntity<?> recommendForHome(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false, defaultValue = "6") Integer limit) {
        try {
            Long uid = userId != null ? userId : 1L;
            List<RecommendDTO> recommendations = recommendationService.recommendForHome(uid, limit);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", recommendations);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/vehicle-detail")
    public ResponseEntity<?> recommendForVehicleDetail(
            @RequestParam Long vehicleId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false, defaultValue = "4") Integer limit) {
        try {
            Long uid = userId != null ? userId : 1L;
            List<RecommendDTO> recommendations = recommendationService.recommendForVehicleDetail(uid, vehicleId, limit);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", recommendations);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
}
