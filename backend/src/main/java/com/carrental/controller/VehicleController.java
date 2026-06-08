package com.carrental.controller;

import com.carrental.entity.Vehicle;
import com.carrental.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "*")
public class VehicleController {

    @Autowired
    private VehicleService vehicleService;

    @GetMapping
    public ResponseEntity<?> getVehicles() {
        List<Vehicle> vehicles = vehicleService.getAvailableVehicles();

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", vehicles);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getVehicle(@PathVariable Long id) {
        Vehicle vehicle = vehicleService.getVehicleById(id);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", vehicle);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/locations")
    public ResponseEntity<?> getVehicleLocations() {
        List<Vehicle> vehicles = vehicleService.getAvailableVehicles();

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", vehicles);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchVehicles(@RequestParam String keyword) {
        List<Vehicle> vehicles = vehicleService.searchVehicles(keyword);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", vehicles);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/compare")
    public ResponseEntity<?> compareVehicles(@RequestBody Map<String, List<Long>> request) {
        List<Long> ids = request.get("ids");
        if (ids == null || ids.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("message", "请选择至少一辆车进行对比");
            return ResponseEntity.badRequest().body(response);
        }
        if (ids.size() > 3) {
            Map<String, Object> response = new HashMap<>();
            response.put("code", 400);
            response.put("message", "最多只能对比3辆车");
            return ResponseEntity.badRequest().body(response);
        }

        List<Vehicle> vehicles = vehicleService.getVehiclesByIds(ids);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", vehicles);

        return ResponseEntity.ok(response);
    }
}
