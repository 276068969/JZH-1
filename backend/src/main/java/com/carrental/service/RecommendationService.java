package com.carrental.service;

import com.carrental.dto.RecommendDTO;

import java.util.List;

public interface RecommendationService {
    List<RecommendDTO> recommendForHome(Long userId, int limit);

    List<RecommendDTO> recommendForVehicleDetail(Long userId, Long vehicleId, int limit);
}
