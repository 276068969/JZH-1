package com.carrental.controller;

import com.carrental.dto.VehicleSearchRequest;
import com.carrental.entity.Vehicle;
import com.carrental.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
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
    public ResponseEntity<?> getVehicleLocations(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortOrder,
            @RequestParam(required = false) Double userLat,
            @RequestParam(required = false) Double userLng,
            @RequestParam(required = false) Integer seats,
            @RequestParam(required = false) String fuel,
            @RequestParam(required = false) String transmission) {
        VehicleSearchRequest request = new VehicleSearchRequest();
        request.setKeyword(keyword);
        request.setCity(city);
        request.setType(type);
        request.setMinPrice(minPrice);
        request.setMaxPrice(maxPrice);
        request.setAvailable(available != null ? available : true);
        request.setSortBy(sortBy);
        request.setSortOrder(sortOrder);
        request.setUserLatitude(userLat);
        request.setUserLongitude(userLng);
        request.setSeats(seats);
        request.setFuel(fuel);
        request.setTransmission(transmission);

        List<Vehicle> vehicles = vehicleService.searchVehicles(request);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", vehicles);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchVehicles(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortOrder,
            @RequestParam(required = false) Double userLat,
            @RequestParam(required = false) Double userLng,
            @RequestParam(required = false) Integer seats,
            @RequestParam(required = false) String fuel,
            @RequestParam(required = false) String transmission) {
        VehicleSearchRequest request = new VehicleSearchRequest();
        request.setKeyword(keyword);
        request.setCity(city);
        request.setType(type);
        request.setMinPrice(minPrice);
        request.setMaxPrice(maxPrice);
        request.setAvailable(available);
        request.setSortBy(sortBy);
        request.setSortOrder(sortOrder);
        request.setUserLatitude(userLat);
        request.setUserLongitude(userLng);
        request.setSeats(seats);
        request.setFuel(fuel);
        request.setTransmission(transmission);

        List<Vehicle> vehicles = vehicleService.searchVehicles(request);

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", vehicles);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/filter-options")
    public ResponseEntity<?> getFilterOptions() {
        Map<String, Object> options = vehicleService.getFilterOptions();

        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("data", options);

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
