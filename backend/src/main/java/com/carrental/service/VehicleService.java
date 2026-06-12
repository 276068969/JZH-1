package com.carrental.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.carrental.dto.VehicleSearchRequest;
import com.carrental.entity.Vehicle;

import java.util.List;
import java.util.Map;

public interface VehicleService extends IService<Vehicle> {
    List<Vehicle> getAvailableVehicles();
    Vehicle getVehicleById(Long id);
    List<Vehicle> searchVehicles(String keyword);
    List<Vehicle> searchVehicles(VehicleSearchRequest request);
    List<Vehicle> getVehiclesByIds(List<Long> ids);
    boolean updateAvailable(Long vehicleId, Boolean available);
    Map<String, Object> getFilterOptions();
}
