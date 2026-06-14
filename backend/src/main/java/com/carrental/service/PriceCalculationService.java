package com.carrental.service;

import com.carrental.dto.PriceCalculationResultVO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface PriceCalculationService {
    PriceCalculationResultVO calculate(Long vehicleId, LocalDateTime startDate, LocalDateTime endDate, String userType);

    BigDecimal calculateTotalPrice(Long vehicleId, LocalDateTime startDate, LocalDateTime endDate, String userType);

    BigDecimal calculateRenewPrice(Long vehicleId, LocalDateTime currentEnd, LocalDateTime newEnd, String userType);
}
