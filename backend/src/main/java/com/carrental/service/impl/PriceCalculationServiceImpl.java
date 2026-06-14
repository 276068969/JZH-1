package com.carrental.service.impl;

import com.carrental.dto.PriceCalculationResultVO;
import com.carrental.entity.Vehicle;
import com.carrental.service.PriceCalculationService;
import com.carrental.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class PriceCalculationServiceImpl implements PriceCalculationService {

    @Autowired
    private VehicleService vehicleService;

    private static final BigDecimal ENTERPRISE_DISCOUNT_RATE = new BigDecimal("0.90");
    private static final BigDecimal LONG_TERM_7_RATE = new BigDecimal("0.95");
    private static final BigDecimal LONG_TERM_30_RATE = new BigDecimal("0.90");

    @Override
    public PriceCalculationResultVO calculate(Long vehicleId, LocalDateTime startDate, LocalDateTime endDate, String userType) {
        Vehicle vehicle = vehicleService.getVehicleById(vehicleId);
        if (vehicle == null) {
            throw new RuntimeException("车辆不存在");
        }

        long rentalDays = ChronoUnit.DAYS.between(startDate.toLocalDate(), endDate.toLocalDate()) + 1;
        if (rentalDays <= 0) {
            throw new RuntimeException("租期天数必须大于0");
        }

        BigDecimal dailyPrice = vehicle.getPrice();
        BigDecimal basePrice = dailyPrice.multiply(BigDecimal.valueOf(rentalDays));

        List<PriceCalculationResultVO.DiscountDetail> discounts = new ArrayList<>();
        BigDecimal totalDiscount = BigDecimal.ZERO;

        if (rentalDays >= 30) {
            BigDecimal discountAmount = basePrice.multiply(BigDecimal.ONE.subtract(LONG_TERM_30_RATE));
            discounts.add(PriceCalculationResultVO.DiscountDetail.builder()
                    .name("长租优惠（30天及以上）")
                    .type("long_term")
                    .rate(LONG_TERM_30_RATE)
                    .amount(discountAmount.setScale(2, RoundingMode.HALF_UP))
                    .build());
            totalDiscount = totalDiscount.add(discountAmount);
        } else if (rentalDays >= 7) {
            BigDecimal discountAmount = basePrice.multiply(BigDecimal.ONE.subtract(LONG_TERM_7_RATE));
            discounts.add(PriceCalculationResultVO.DiscountDetail.builder()
                    .name("长租优惠（7天及以上）")
                    .type("long_term")
                    .rate(LONG_TERM_7_RATE)
                    .amount(discountAmount.setScale(2, RoundingMode.HALF_UP))
                    .build());
            totalDiscount = totalDiscount.add(discountAmount);
        }

        if ("enterprise".equals(userType)) {
            BigDecimal priceAfterLongTerm = basePrice.subtract(totalDiscount);
            BigDecimal discountAmount = priceAfterLongTerm.multiply(BigDecimal.ONE.subtract(ENTERPRISE_DISCOUNT_RATE));
            discounts.add(PriceCalculationResultVO.DiscountDetail.builder()
                    .name("企业用户折扣")
                    .type("enterprise")
                    .rate(ENTERPRISE_DISCOUNT_RATE)
                    .amount(discountAmount.setScale(2, RoundingMode.HALF_UP))
                    .build());
            totalDiscount = totalDiscount.add(discountAmount);
        }

        totalDiscount = totalDiscount.setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalPrice = basePrice.subtract(totalDiscount).setScale(2, RoundingMode.HALF_UP);

        List<PriceCalculationResultVO.FeeItem> feeItems = new ArrayList<>();
        feeItems.add(PriceCalculationResultVO.FeeItem.builder()
                .name("基础租车费（¥" + dailyPrice + " × " + rentalDays + "天）")
                .amount(basePrice.setScale(2, RoundingMode.HALF_UP))
                .build());
        for (PriceCalculationResultVO.DiscountDetail discount : discounts) {
            feeItems.add(PriceCalculationResultVO.FeeItem.builder()
                    .name("- " + discount.getName())
                    .amount(discount.getAmount().negate())
                    .build());
        }

        return PriceCalculationResultVO.builder()
                .vehicleId(vehicleId)
                .vehicleName(vehicle.getName())
                .dailyPrice(dailyPrice)
                .rentalDays(rentalDays)
                .basePrice(basePrice.setScale(2, RoundingMode.HALF_UP))
                .discounts(discounts)
                .totalDiscount(totalDiscount)
                .totalPrice(totalPrice)
                .feeItems(feeItems)
                .build();
    }

    @Override
    public BigDecimal calculateTotalPrice(Long vehicleId, LocalDateTime startDate, LocalDateTime endDate, String userType) {
        return calculate(vehicleId, startDate, endDate, userType).getTotalPrice();
    }

    @Override
    public BigDecimal calculateRenewPrice(Long vehicleId, LocalDateTime currentEnd, LocalDateTime newEnd, String userType) {
        Vehicle vehicle = vehicleService.getVehicleById(vehicleId);
        if (vehicle == null) {
            throw new RuntimeException("车辆不存在");
        }

        long additionalDays = ChronoUnit.DAYS.between(currentEnd.toLocalDate(), newEnd.toLocalDate());
        if (additionalDays <= 0) {
            throw new RuntimeException("续租天数必须大于0");
        }

        BigDecimal dailyPrice = vehicle.getPrice();
        BigDecimal additionalBasePrice = dailyPrice.multiply(BigDecimal.valueOf(additionalDays));

        BigDecimal totalDiscount = BigDecimal.ZERO;

        if (additionalDays >= 30) {
            BigDecimal discountAmount = additionalBasePrice.multiply(BigDecimal.ONE.subtract(LONG_TERM_30_RATE));
            totalDiscount = totalDiscount.add(discountAmount);
        } else if (additionalDays >= 7) {
            BigDecimal discountAmount = additionalBasePrice.multiply(BigDecimal.ONE.subtract(LONG_TERM_7_RATE));
            totalDiscount = totalDiscount.add(discountAmount);
        }

        if ("enterprise".equals(userType)) {
            BigDecimal priceAfterLongTerm = additionalBasePrice.subtract(totalDiscount);
            BigDecimal discountAmount = priceAfterLongTerm.multiply(BigDecimal.ONE.subtract(ENTERPRISE_DISCOUNT_RATE));
            totalDiscount = totalDiscount.add(discountAmount);
        }

        return additionalBasePrice.subtract(totalDiscount).setScale(2, RoundingMode.HALF_UP);
    }
}
