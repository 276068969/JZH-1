package com.carrental.dto;

import com.carrental.entity.Vehicle;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class RecommendDTO {
    private Vehicle vehicle;
    private BigDecimal score;
    private String reason;

    public RecommendDTO() {
    }

    public RecommendDTO(Vehicle vehicle, BigDecimal score, String reason) {
        this.vehicle = vehicle;
        this.score = score;
        this.reason = reason;
    }
}
