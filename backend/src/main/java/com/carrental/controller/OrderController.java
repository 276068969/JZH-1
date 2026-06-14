package com.carrental.controller;

import com.carrental.config.JwtAuthHelper;
import com.carrental.dto.OrderDTO;
import com.carrental.dto.UserRentalOverviewDTO;
import com.carrental.entity.Order;
import com.carrental.service.OrderService;
import com.carrental.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private JwtAuthHelper jwtAuthHelper;

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> params) {
        try {
            Long userId = jwtAuthHelper.getCurrentUserIdRequired();

            Long vehicleId = Long.valueOf(params.get("vehicleId").toString());
            String startDate = params.get("startDate").toString();
            String endDate = params.get("endDate").toString();

            Order order = orderService.createOrder(userId, vehicleId, startDate, endDate);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "订单创建成功");
            response.put("data", order);

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

    @GetMapping("/overview")
    public ResponseEntity<?> getUserRentalOverview() {
        try {
            Long userId = jwtAuthHelper.getCurrentUserIdRequired();

            UserRentalOverviewDTO overview = orderService.getUserRentalOverview(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", overview);

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

    @GetMapping
    public ResponseEntity<?> getOrders() {
        try {
            Long userId = jwtAuthHelper.getCurrentUserIdRequired();

            List<OrderDTO> orders = orderService.getUserOrderDTOs(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("data", orders);

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

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        try {
            Long userId = jwtAuthHelper.getCurrentUserIdRequired();

            Order order = orderService.cancelOrder(id, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "订单已取消");
            response.put("data", order);

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

    @PostMapping("/{id}/renew/check")
    public ResponseEntity<?> checkRenewAvailability(@PathVariable Long id, @RequestBody Map<String, Object> params) {
        try {
            String newEndDate = params.get("newEndDate").toString();
            Map<String, Object> result = orderService.checkRenewAvailability(id, newEndDate);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "查询成功");
            response.put("data", result);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/{id}/renew")
    public ResponseEntity<?> renewOrder(@PathVariable Long id, @RequestBody Map<String, Object> params) {
        try {
            String newEndDate = params.get("newEndDate").toString();
            Order order = orderService.renewOrder(id, newEndDate);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "续租成功");
            response.put("data", order);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/{id}/pickup")
    public ResponseEntity<?> confirmPickup(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> params) {
        try {
            Long userId = jwtAuthHelper.getCurrentUserIdRequired();

            String pickupNote = params != null && params.get("pickupNote") != null ? params.get("pickupNote").toString() : null;
            Double pickupOdometer = params != null && params.get("pickupOdometer") != null ? Double.valueOf(params.get("pickupOdometer").toString()) : null;

            Order order = orderService.confirmPickup(id, userId, pickupNote, pickupOdometer);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "取车确认成功");
            response.put("data", order);

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

    @PostMapping("/{id}/return")
    public ResponseEntity<?> confirmReturn(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> params) {
        try {
            Long userId = jwtAuthHelper.getCurrentUserIdRequired();

            String returnNote = params != null && params.get("returnNote") != null ? params.get("returnNote").toString() : null;
            Double returnOdometer = params != null && params.get("returnOdometer") != null ? Double.valueOf(params.get("returnOdometer").toString()) : null;

            Order order = orderService.confirmReturn(id, userId, returnNote, returnOdometer);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "还车确认成功");
            response.put("data", order);

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
}
