package com.carrental.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.carrental.dto.RecommendDTO;
import com.carrental.entity.Order;
import com.carrental.entity.User;
import com.carrental.entity.Vehicle;
import com.carrental.mapper.OrderMapper;
import com.carrental.mapper.UserMapper;
import com.carrental.service.RecommendationService;
import com.carrental.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RecommendationServiceImpl implements RecommendationService {

    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private OrderMapper orderMapper;

    @Autowired
    private UserMapper userMapper;

    private static final BigDecimal TYPE_MATCH_WEIGHT = new BigDecimal("30");
    private static final BigDecimal PRICE_AFFINITY_WEIGHT = new BigDecimal("25");
    private static final BigDecimal RATING_WEIGHT = new BigDecimal("15");
    private static final BigDecimal USER_TYPE_WEIGHT = new BigDecimal("20");
    private static final BigDecimal HISTORY_BONUS_WEIGHT = new BigDecimal("10");

    @Override
    public List<RecommendDTO> recommendForHome(Long userId, int limit) {
        List<Vehicle> candidates = vehicleService.getAvailableVehicles();
        UserContext ctx = buildUserContext(userId);
        return rankVehicles(candidates, ctx, null, limit);
    }

    @Override
    public List<RecommendDTO> recommendForVehicleDetail(Long userId, Long vehicleId, int limit) {
        List<Vehicle> candidates = vehicleService.getAvailableVehicles();
        Vehicle current = vehicleService.getVehicleById(vehicleId);
        candidates = candidates.stream()
                .filter(v -> !v.getId().equals(vehicleId))
                .collect(Collectors.toList());
        UserContext ctx = buildUserContext(userId);
        return rankVehicles(candidates, ctx, current, limit);
    }

    private UserContext buildUserContext(Long userId) {
        UserContext ctx = new UserContext();

        if (userId == null) {
            return ctx;
        }

        User user = userMapper.selectById(userId);
        if (user != null) {
            ctx.userType = user.getUserType();
        }

        LambdaQueryWrapper<Order> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Order::getUserId, userId)
               .orderByDesc(Order::getCreateTime);
        List<Order> orders = orderMapper.selectList(wrapper);

        if (orders != null && !orders.isEmpty()) {
            Map<String, Integer> typeFreq = new HashMap<>();
            BigDecimal totalSpend = BigDecimal.ZERO;
            Set<Long> rentedIds = new HashSet<>();
            Map<Long, Integer> vehicleFreq = new HashMap<>();

            for (Order order : orders) {
                rentedIds.add(order.getVehicleId());
                vehicleFreq.merge(order.getVehicleId(), 1, Integer::sum);

                Vehicle ov = vehicleService.getVehicleById(order.getVehicleId());
                if (ov != null) {
                    typeFreq.merge(ov.getType(), 1, Integer::sum);
                }
                if (order.getTotalPrice() != null) {
                    totalSpend = totalSpend.add(order.getTotalPrice());
                }
            }

            ctx.typeFrequency = typeFreq;
            ctx.avgSpendPerOrder = totalSpend.divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP);
            ctx.rentedVehicleIds = rentedIds;
            ctx.vehicleFrequency = vehicleFreq;
            ctx.orderCount = orders.size();
        }

        return ctx;
    }

    private List<RecommendDTO> rankVehicles(List<Vehicle> candidates, UserContext ctx, Vehicle current, int limit) {
        List<RecommendDTO> results = new ArrayList<>();

        for (Vehicle v : candidates) {
            BigDecimal score = BigDecimal.ZERO;
            List<String> reasons = new ArrayList<>();

            BigDecimal typeScore = calcTypeScore(v, ctx);
            score = score.add(TYPE_MATCH_WEIGHT.multiply(typeScore));
            if (typeScore.compareTo(BigDecimal.valueOf(0.5)) > 0) {
                if (ctx.typeFrequency != null && ctx.typeFrequency.containsKey(v.getType())) {
                    reasons.add("您常租" + v.getType() + "车型");
                }
            }

            BigDecimal priceScore = calcPriceScore(v, ctx);
            score = score.add(PRICE_AFFINITY_WEIGHT.multiply(priceScore));
            if (priceScore.compareTo(BigDecimal.valueOf(0.6)) > 0 && ctx.avgSpendPerOrder != null) {
                reasons.add("价格符合您的消费习惯");
            }

            BigDecimal ratingScore = calcRatingScore(v);
            score = score.add(RATING_WEIGHT.multiply(ratingScore));

            BigDecimal userTypeScore = calcUserTypeScore(v, ctx);
            score = score.add(USER_TYPE_WEIGHT.multiply(userTypeScore));
            if (userTypeScore.compareTo(BigDecimal.valueOf(0.5)) > 0 && ctx.userType != null) {
                if ("enterprise".equals(ctx.userType)) {
                    reasons.add("适合商务出行");
                } else if ("personal".equals(ctx.userType)) {
                    reasons.add("适合个人出行");
                }
            }

            BigDecimal historyScore = calcHistoryScore(v, ctx);
            score = score.add(HISTORY_BONUS_WEIGHT.multiply(historyScore));

            if (current != null) {
                BigDecimal similarity = calcSimilarityToCurrent(v, current);
                score = score.add(new BigDecimal("10").multiply(similarity));
                if (similarity.compareTo(BigDecimal.valueOf(0.5)) > 0) {
                    reasons.add("与当前车辆风格相近");
                }
            }

            String reason = reasons.isEmpty() ? "综合评分推荐" : String.join("，", reasons);
            results.add(new RecommendDTO(v, score.setScale(2, RoundingMode.HALF_UP), reason));
        }

        results.sort(Comparator.comparing(RecommendDTO::getScore).reversed());

        if (limit > 0 && results.size() > limit) {
            results = results.subList(0, limit);
        }

        return results;
    }

    private BigDecimal calcTypeScore(Vehicle v, UserContext ctx) {
        if (ctx.typeFrequency == null || ctx.typeFrequency.isEmpty()) {
            return BigDecimal.valueOf(0.5);
        }
        int count = ctx.typeFrequency.getOrDefault(v.getType(), 0);
        int total = ctx.typeFrequency.values().stream().mapToInt(Integer::intValue).sum();
        return BigDecimal.valueOf(count).divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP);
    }

    private BigDecimal calcPriceScore(Vehicle v, UserContext ctx) {
        if (ctx.avgSpendPerOrder == null || ctx.orderCount == 0) {
            return BigDecimal.valueOf(0.5);
        }
        BigDecimal estimatedDailyBudget = ctx.avgSpendPerOrder.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);
        BigDecimal diff = v.getPrice().subtract(estimatedDailyBudget).abs();
        BigDecimal maxDiff = estimatedDailyBudget.multiply(new BigDecimal("2"));
        if (maxDiff.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ONE;
        }
        BigDecimal ratio = BigDecimal.ONE.subtract(diff.divide(maxDiff, 4, RoundingMode.HALF_UP));
        return ratio.max(BigDecimal.ZERO);
    }

    private BigDecimal calcRatingScore(Vehicle v) {
        if (v.getRating() == null) {
            return BigDecimal.valueOf(0.5);
        }
        return v.getRating().divide(new BigDecimal("5"), 4, RoundingMode.HALF_UP);
    }

    private BigDecimal calcUserTypeScore(Vehicle v, UserContext ctx) {
        if (ctx.userType == null) {
            return BigDecimal.valueOf(0.5);
        }
        String type = v.getType();
        switch (ctx.userType) {
            case "enterprise":
                if ("轿车".equals(type) || "MPV".equals(type)) return BigDecimal.ONE;
                if ("SUV".equals(type) || "电动车".equals(type)) return new BigDecimal("0.7");
                return new BigDecimal("0.3");
            case "personal":
                if ("电动车".equals(type) || "SUV".equals(type)) return BigDecimal.ONE;
                if ("轿车".equals(type) || "MPV".equals(type)) return new BigDecimal("0.7");
                return new BigDecimal("0.3");
            default:
                return BigDecimal.valueOf(0.5);
        }
    }

    private BigDecimal calcHistoryScore(Vehicle v, UserContext ctx) {
        if (ctx.rentedVehicleIds == null || ctx.rentedVehicleIds.isEmpty()) {
            return BigDecimal.ZERO;
        }
        if (ctx.rentedVehicleIds.contains(v.getId())) {
            return new BigDecimal("0.8");
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal calcSimilarityToCurrent(Vehicle v, Vehicle current) {
        BigDecimal score = BigDecimal.ZERO;

        if (v.getType().equals(current.getType())) {
            score = score.add(new BigDecimal("0.5"));
        }

        BigDecimal priceDiff = v.getPrice().subtract(current.getPrice()).abs();
        BigDecimal maxPrice = current.getPrice().multiply(new BigDecimal("2"));
        if (maxPrice.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal priceSimilarity = BigDecimal.ONE.subtract(priceDiff.divide(maxPrice, 4, RoundingMode.HALF_UP));
            score = score.add(new BigDecimal("0.3").multiply(priceSimilarity.max(BigDecimal.ZERO)));
        }

        if (v.getLocation() != null && current.getLocation() != null) {
            String vCity = extractCity(v.getLocation());
            String cCity = extractCity(current.getLocation());
            if (vCity.equals(cCity)) {
                score = score.add(new BigDecimal("0.2"));
            }
        }

        return score.min(BigDecimal.ONE);
    }

    private String extractCity(String location) {
        if (location == null) return "";
        int idx = location.indexOf("市");
        if (idx > 0) {
            return location.substring(0, idx + 1);
        }
        return location;
    }

    private static class UserContext {
        String userType;
        Map<String, Integer> typeFrequency;
        BigDecimal avgSpendPerOrder;
        Set<Long> rentedVehicleIds;
        Map<Long, Integer> vehicleFrequency;
        int orderCount;
    }
}
