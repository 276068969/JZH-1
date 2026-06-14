package com.carrental.dto;

import lombok.Data;

@Data
public class PriceCalculationRequestDTO {
    private Long vehicleId;
    private String startDate;
    private String endDate;
    private String userType;
}
