package com.carrental.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.carrental.dto.OrderDTO;
import com.carrental.entity.Order;

import java.util.List;

public interface OrderService extends IService<Order> {
    Order createOrder(Long userId, Long vehicleId, String startDate, String endDate, Double totalPrice);
    List<Order> getUserOrders(Long userId);
    List<OrderDTO> getUserOrderDTOs(Long userId);
}
