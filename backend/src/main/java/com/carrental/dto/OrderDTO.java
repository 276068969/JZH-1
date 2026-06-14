package com.carrental.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class OrderDTO {
    private Long id;
    private Long userId;
    private Long vehicleId;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private BigDecimal totalPrice;
    private String status;
    private Integer renewCount;
    private LocalDateTime pickupTime;
    private String pickupNote;
    private BigDecimal pickupOdometer;
    private LocalDateTime returnTime;
    private String returnNote;
    private BigDecimal returnOdometer;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;

    private String vehicleName;
    private String vehicleType;
    private String vehicleLocation;
    private BigDecimal vehiclePrice;
    private BigDecimal vehicleRating;
    private String vehicleDescription;
}
