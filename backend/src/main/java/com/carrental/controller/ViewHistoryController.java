package com.carrental.controller;

import com.carrental.config.JwtAuthHelper;
import com.carrental.entity.Vehicle;
import com.carrental.service.VehicleService;
import com.carrental.service.ViewHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/view-history")
@CrossOrigin(origins = "*")
public class ViewHistoryController {

    @Autowired
    private ViewHistoryService viewHistoryService;

    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private JwtAuthHelper jwtAuthHelper;

    @PostMapping
    public ResponseEntity<?> addViewHistory(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = jwtAuthHelper.getCurrentUserId();
            if (userId == null) {
                response.put("code", 401);
                response.put("message", "未登录或登录已过期");
                return ResponseEntity.status(401).body(response);
            }

            Long vehicleId = request.get("vehicleId") != null
                    ? Long.valueOf(request.get("vehicleId").toString())
                    : null;
            String sourcePage = request.get("sourcePage") != null
                    ? request.get("sourcePage").toString()
                    : "unknown";

            if (vehicleId == null) {
                response.put("code", 400);
                response.put("message", "车辆ID不能为空");
                return ResponseEntity.badRequest().body(response);
            }

            boolean success = viewHistoryService.addViewHistory(userId, vehicleId, sourcePage);
            if (success) {
                response.put("code", 200);
                response.put("message", "记录成功");
            } else {
                response.put("code", 500);
                response.put("message", "记录失败");
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("message", "服务器异常：" + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping
    public ResponseEntity<?> getRecentViewedVehicles(
            @RequestParam(required = false, defaultValue = "20") Integer limit) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = jwtAuthHelper.getCurrentUserId();
            if (userId == null) {
                response.put("code", 401);
                response.put("message", "未登录或登录已过期");
                return ResponseEntity.status(401).body(response);
            }

            List<Long> vehicleIds = viewHistoryService.getRecentViewedVehicleIds(userId, limit);
            List<Vehicle> vehicles = new ArrayList<>();
            if (!vehicleIds.isEmpty()) {
                vehicles = vehicleService.getVehiclesByIds(vehicleIds);
                Map<Long, Vehicle> vehicleMap = new HashMap<>();
                for (Vehicle v : vehicles) {
                    vehicleMap.put(v.getId(), v);
                }
                List<Vehicle> sortedVehicles = new ArrayList<>();
                for (Long id : vehicleIds) {
                    Vehicle v = vehicleMap.get(id);
                    if (v != null) {
                        sortedVehicles.add(v);
                    }
                }
                vehicles = sortedVehicles;
            }

            response.put("code", 200);
            response.put("data", vehicles);
            response.put("vehicleIds", vehicleIds);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("message", "服务器异常：" + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/ids")
    public ResponseEntity<?> getRecentViewedIds(
            @RequestParam(required = false, defaultValue = "50") Integer limit) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = jwtAuthHelper.getCurrentUserId();
            if (userId == null) {
                response.put("code", 401);
                response.put("message", "未登录或登录已过期");
                return ResponseEntity.status(401).body(response);
            }

            List<Long> vehicleIds = viewHistoryService.getRecentViewedVehicleIds(userId, limit);

            response.put("code", 200);
            response.put("data", vehicleIds);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("message", "服务器异常：" + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
}
