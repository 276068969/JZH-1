package com.carrental.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "UP");
        result.put("service", "car-rental-platform");
        result.put("timestamp", System.currentTimeMillis());

        try {
            Integer count = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            result.put("database", count != null && count == 1 ? "UP" : "DOWN");
        } catch (Exception e) {
            result.put("database", "DOWN");
            result.put("databaseError", e.getMessage());
        }

        return result;
    }
}
