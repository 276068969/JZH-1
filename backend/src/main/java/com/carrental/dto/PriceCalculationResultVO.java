package com.carrental.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class PriceCalculationResultVO {
    private Long vehicleId;
    private String vehicleName;
    private BigDecimal dailyPrice;
    private long rentalDays;
    private BigDecimal basePrice;
    private List<DiscountDetail> discounts;
    private BigDecimal totalDiscount;
    private BigDecimal totalPrice;
    private List<FeeItem> feeItems;

    @Data
    @Builder
    public static class DiscountDetail {
        private String name;
        private String type;
        private BigDecimal rate;
        private BigDecimal amount;
    }

    @Data
    @Builder
    public static class FeeItem {
        private String name;
        private BigDecimal amount;
    }
}
