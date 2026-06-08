package com.carrental.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.carrental.entity.Vehicle;

import java.util.List;

public interface VehicleService extends IService<Vehicle> {
    List<Vehicle> getAvailableVehicles();
    Vehicle getVehicleById(Long id);
    List<Vehicle> searchVehicles(String keyword);
    List<Vehicle> getVehiclesByIds(List<Long> ids);
}
