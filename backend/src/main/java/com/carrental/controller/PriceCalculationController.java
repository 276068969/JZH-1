package com.carrental.controller;

import com.carrental.config.JwtAuthHelper;
import com.carrental.dto.PriceCalculationRequestDTO;
import com.carrental.dto.PriceCalculationResultVO;
import com.carrental.entity.User;
import com.carrental.service.PriceCalculationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/price")
@CrossOrigin(origins = "*")
public class PriceCalculationController {

    @Autowired
    private PriceCalculationService priceCalculationService;

    @Autowired
    private JwtAuthHelper jwtAuthHelper;

    @PostMapping("/calculate")
    public ResponseEntity<?> calculatePrice(@RequestBody PriceCalculationRequestDTO request) {
        try {
            String userType = request.getUserType();
            if (userType == null || userType.isEmpty()) {
                User currentUser = jwtAuthHelper.getCurrentUser();
                if (currentUser != null) {
                    userType = currentUser.getUserType();
                } else {
                    userType = "personal";
                }
            }

            LocalDateTime startDate = LocalDateTime.parse(request.getStartDate(), DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            LocalDateTime endDate = LocalDateTime.parse(request.getEndDate(), DateTimeFormatter.ofPattern("yyyy-MM-dd"));

            if (!endDate.isAfter(startDate) && !endDate.equals(startDate)) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 400);
                response.put("message", "结束日期不能早于开始日期");
                return ResponseEntity.ok(response);
            }

            PriceCalculationResultVO result = priceCalculationService.calculate(
                    request.getVehicleId(), startDate, endDate, userType);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "价格试算成功");
            response.put("data", result);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/calculate")
    public ResponseEntity<?> calculatePriceGet(
            @RequestParam Long vehicleId,
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false) String userType) {
        try {
            if (userType == null || userType.isEmpty()) {
                User currentUser = jwtAuthHelper.getCurrentUser();
                if (currentUser != null) {
                    userType = currentUser.getUserType();
                } else {
                    userType = "personal";
                }
            }

            LocalDateTime start = LocalDateTime.parse(startDate, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            LocalDateTime end = LocalDateTime.parse(endDate, DateTimeFormatter.ofPattern("yyyy-MM-dd"));

            if (!end.isAfter(start) && !end.equals(start)) {
                Map<String, Object> response = new HashMap<>();
                response.put("code", 400);
                response.put("message", "结束日期不能早于开始日期");
                return ResponseEntity.ok(response);
            }

            PriceCalculationResultVO result = priceCalculationService.calculate(
                    vehicleId, start, end, userType);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "价格试算成功");
            response.put("data", result);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
}
