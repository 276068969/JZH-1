package com.carrental.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.carrental.dto.OrderDTO;
import com.carrental.dto.UserRentalOverviewDTO;
import com.carrental.entity.Order;

import java.util.List;
import java.util.Map;

public interface OrderService extends IService<Order> {
    Order createOrder(Long userId, Long vehicleId, String startDate, String endDate, Double totalPrice);
    List<Order> getUserOrders(Long userId);
    List<OrderDTO> getUserOrderDTOs(Long userId);
    Map<String, Object> checkRenewAvailability(Long orderId, String newEndDate);
    Order renewOrder(Long orderId, String newEndDate);
    Order cancelOrder(Long orderId, Long userId);
    void refreshOrderStatus(Order order);
    void refreshAllPendingOrders();
    UserRentalOverviewDTO getUserRentalOverview(Long userId);

    Order confirmPickup(Long orderId, Long userId, String pickupNote, Double pickupOdometer);
    Order confirmReturn(Long orderId, Long userId, String returnNote, Double returnOdometer);
}
