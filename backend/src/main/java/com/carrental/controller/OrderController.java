package com.carrental.controller;

import com.carrental.dto.OrderDTO;
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

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> params) {
        try {
            Long vehicleId = Long.valueOf(params.get("vehicleId").toString());
            String startDate = params.get("startDate").toString();
            String endDate = params.get("endDate").toString();
            Double totalPrice = Double.valueOf(params.get("totalPrice").toString());

            Order order = orderService.createOrder(1L, vehicleId, startDate, endDate, totalPrice);

            Map<String, Object> response = new HashMap<>();
            response.put("code", 200);
            response.put("message", "订单创建成功");
            response.put("data", order);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 500);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping
    public ResponseEntity<?> getOrders() {
        List<OrderDTO> orders = orderService.getUserOrderDTOs(1L);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", orders);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", "订单已取消");

        return ResponseEntity.ok(response);
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
}
