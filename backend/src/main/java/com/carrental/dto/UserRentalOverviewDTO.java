package com.carrental.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class UserRentalOverviewDTO {
    private BigDecimal totalSpent;
    private Integer totalOrderCount;
    private Integer activeOrderCount;
    private Integer completedOrderCount;
    private LocalDateTime lastOrderTime;
    private String preferredVehicleType;
    private Integer preferredVehicleTypeCount;
}
