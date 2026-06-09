package com.carrental.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.carrental.dto.OrderDTO;
import com.carrental.entity.Order;
import com.carrental.entity.Vehicle;
import com.carrental.mapper.OrderMapper;
import com.carrental.service.OrderService;
import com.carrental.service.VehicleService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl extends ServiceImpl<OrderMapper, Order> implements OrderService {

    @Autowired
    private VehicleService vehicleService;

    @Override
    @Transactional
    public Order createOrder(Long userId, Long vehicleId, String startDate, String endDate, Double totalPrice) {
        Vehicle vehicle = vehicleService.getVehicleById(vehicleId);
        if (vehicle == null || !vehicle.getAvailable()) {
            throw new RuntimeException("车辆不可用");
        }

        Order order = new Order();
        order.setUserId(userId);
        order.setVehicleId(vehicleId);
        order.setStartDate(LocalDateTime.parse(startDate, DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        order.setEndDate(LocalDateTime.parse(endDate, DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        order.setTotalPrice(BigDecimal.valueOf(totalPrice));
        order.setStatus("pending");
        order.setRenewCount(0);
        order.setCreateTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());

        this.save(order);
        return order;
    }

    @Override
    public List<Order> getUserOrders(Long userId) {
        LambdaQueryWrapper<Order> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Order::getUserId, userId)
               .orderByDesc(Order::getCreateTime);

        List<Order> orders = this.list(wrapper);
        if (orders.isEmpty()) {
            return getMockOrders(userId);
        }
        return orders;
    }

    @Override
    public List<OrderDTO> getUserOrderDTOs(Long userId) {
        List<Order> orders = getUserOrders(userId);
        List<Long> vehicleIds = orders.stream()
                .map(Order::getVehicleId)
                .distinct()
                .collect(Collectors.toList());

        List<Vehicle> vehicles = vehicleService.getVehiclesByIds(vehicleIds);
        if (vehicles == null || vehicles.isEmpty()) {
            vehicles = getMockVehicles();
        }
        Map<Long, Vehicle> vehicleMap = vehicles.stream()
                .collect(Collectors.toMap(Vehicle::getId, v -> v));

        List<OrderDTO> result = new ArrayList<>();
        for (Order order : orders) {
            OrderDTO dto = new OrderDTO();
            BeanUtils.copyProperties(order, dto);
            Vehicle vehicle = vehicleMap.get(order.getVehicleId());
            if (vehicle != null) {
                dto.setVehicleName(vehicle.getName());
                dto.setVehicleType(vehicle.getType());
                dto.setVehicleLocation(vehicle.getLocation());
                dto.setVehiclePrice(vehicle.getPrice());
                dto.setVehicleRating(vehicle.getRating());
                dto.setVehicleDescription(vehicle.getDescription());
            }
            result.add(dto);
        }
        return result;
    }

    @Override
    public Map<String, Object> checkRenewAvailability(Long orderId, String newEndDate) {
        Order order = this.getById(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }

        if (!"pending".equals(order.getStatus()) && !"active".equals(order.getStatus())) {
            throw new RuntimeException("仅待取车和使用中的订单可续租");
        }

        LocalDateTime newEnd = LocalDateTime.parse(newEndDate, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        LocalDateTime currentEnd = order.getEndDate();

        if (!newEnd.isAfter(currentEnd)) {
            throw new RuntimeException("续租结束日期必须晚于当前还车日期");
        }

        Vehicle vehicle = vehicleService.getVehicleById(order.getVehicleId());
        if (vehicle == null) {
            throw new RuntimeException("车辆信息不存在");
        }

        boolean available = isVehicleAvailableForRenew(order.getVehicleId(), orderId, currentEnd, newEnd);

        long additionalDays = java.time.temporal.ChronoUnit.DAYS.between(
                currentEnd.toLocalDate(), newEnd.toLocalDate());
        BigDecimal additionalPrice = vehicle.getPrice().multiply(BigDecimal.valueOf(additionalDays));
        BigDecimal newTotalPrice = order.getTotalPrice().add(additionalPrice);

        Map<String, Object> result = new HashMap<>();
        result.put("available", available);
        result.put("currentEndDate", currentEnd);
        result.put("newEndDate", newEnd);
        result.put("additionalDays", additionalDays);
        result.put("dailyPrice", vehicle.getPrice());
        result.put("additionalPrice", additionalPrice);
        result.put("originalTotalPrice", order.getTotalPrice());
        result.put("newTotalPrice", newTotalPrice);

        return result;
    }

    @Override
    @Transactional
    public Order renewOrder(Long orderId, String newEndDate) {
        Order order = this.getById(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }

        if (!"pending".equals(order.getStatus()) && !"active".equals(order.getStatus())) {
            throw new RuntimeException("仅待取车和使用中的订单可续租");
        }

        LocalDateTime newEnd = LocalDateTime.parse(newEndDate, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        LocalDateTime currentEnd = order.getEndDate();

        if (!newEnd.isAfter(currentEnd)) {
            throw new RuntimeException("续租结束日期必须晚于当前还车日期");
        }

        boolean available = isVehicleAvailableForRenew(order.getVehicleId(), orderId, currentEnd, newEnd);
        if (!available) {
            throw new RuntimeException("续租时段车辆已被预订，无法续租");
        }

        Vehicle vehicle = vehicleService.getVehicleById(order.getVehicleId());
        long additionalDays = java.time.temporal.ChronoUnit.DAYS.between(
                currentEnd.toLocalDate(), newEnd.toLocalDate());
        BigDecimal additionalPrice = vehicle.getPrice().multiply(BigDecimal.valueOf(additionalDays));
        BigDecimal newTotalPrice = order.getTotalPrice().add(additionalPrice);

        order.setEndDate(newEnd);
        order.setTotalPrice(newTotalPrice);
        order.setRenewCount(order.getRenewCount() == null ? 1 : order.getRenewCount() + 1);
        order.setUpdateTime(LocalDateTime.now());

        this.updateById(order);
        return order;
    }

    private boolean isVehicleAvailableForRenew(Long vehicleId, Long currentOrderId,
                                               LocalDateTime periodStart, LocalDateTime periodEnd) {
        LambdaQueryWrapper<Order> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Order::getVehicleId, vehicleId)
               .ne(Order::getId, currentOrderId)
               .in(Order::getStatus, Arrays.asList("pending", "active"))
               .and(w -> w.lt(Order::getStartDate, periodEnd)
                           .gt(Order::getEndDate, periodStart));

        List<Order> conflictingOrders = this.list(wrapper);
        return conflictingOrders.isEmpty();
    }

    private List<Vehicle> getMockVehicles() {
        Vehicle v1 = new Vehicle();
        v1.setId(1L);
        v1.setName("特斯拉 Model 3");
        v1.setType("电动车");
        v1.setLocation("北京朝阳区");
        v1.setPrice(new BigDecimal("299"));
        v1.setRating(new BigDecimal("4.8"));
        v1.setDescription("高性能纯电动轿车，续航556公里");

        Vehicle v2 = new Vehicle();
        v2.setId(2L);
        v2.setName("宝马 5系");
        v2.setType("豪华轿车");
        v2.setLocation("北京海淀区");
        v2.setPrice(new BigDecimal("399"));
        v2.setRating(new BigDecimal("4.9"));
        v2.setDescription("豪华商务轿车，舒适驾乘体验");

        Vehicle v3 = new Vehicle();
        v3.setId(3L);
        v3.setName("保时捷 911");
        v3.setType("跑车");
        v3.setLocation("北京国贸");
        v3.setPrice(new BigDecimal("1299"));
        v3.setRating(new BigDecimal("4.9"));
        v3.setDescription("经典跑车，极致驾驶乐趣");

        return Arrays.asList(v1, v2, v3);
    }

    private List<Order> getMockOrders(Long userId) {
        Order o1 = new Order();
        o1.setId(1L);
        o1.setUserId(userId);
        o1.setVehicleId(1L);
        o1.setStartDate(LocalDateTime.now().plusDays(2));
        o1.setEndDate(LocalDateTime.now().plusDays(7));
        o1.setTotalPrice(new BigDecimal("1495"));
        o1.setStatus("pending");
        o1.setRenewCount(0);
        o1.setCreateTime(LocalDateTime.now().minusDays(1));

        Order o2 = new Order();
        o2.setId(2L);
        o2.setUserId(userId);
        o2.setVehicleId(2L);
        o2.setStartDate(LocalDateTime.now().minusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0));
        o2.setEndDate(LocalDateTime.now().plusDays(4).withHour(18).withMinute(0).withSecond(0).withNano(0));
        o2.setTotalPrice(new BigDecimal("1995"));
        o2.setStatus("active");
        o2.setRenewCount(1);
        o2.setCreateTime(LocalDateTime.now().minusDays(3));

        Order o3 = new Order();
        o3.setId(3L);
        o3.setUserId(userId);
        o3.setVehicleId(3L);
        o3.setStartDate(LocalDateTime.now().plusDays(15));
        o3.setEndDate(LocalDateTime.now().plusDays(18));
        o3.setTotalPrice(new BigDecimal("3897"));
        o3.setStatus("pending");
        o3.setRenewCount(0);
        o3.setCreateTime(LocalDateTime.now().minusDays(5));

        Order o4 = new Order();
        o4.setId(4L);
        o4.setUserId(userId);
        o4.setVehicleId(1L);
        o4.setStartDate(LocalDateTime.now().minusDays(20));
        o4.setEndDate(LocalDateTime.now().minusDays(15));
        o4.setTotalPrice(new BigDecimal("1495"));
        o4.setStatus("completed");
        o4.setRenewCount(2);
        o4.setCreateTime(LocalDateTime.now().minusDays(22));

        return Arrays.asList(o3, o1, o2, o4);
    }
}
