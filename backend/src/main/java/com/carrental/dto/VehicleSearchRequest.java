package com.carrental.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class VehicleSearchRequest {
    private String keyword;
    private String city;
    private String type;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Boolean available;
    private String sortBy;
    private String sortOrder;
    private Double userLatitude;
    private Double userLongitude;
    private Integer seats;
    private String fuel;
    private String transmission;
}
