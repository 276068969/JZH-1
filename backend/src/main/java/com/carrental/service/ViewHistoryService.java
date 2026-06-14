package com.carrental.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.carrental.entity.ViewHistory;

import java.util.List;

public interface ViewHistoryService extends IService<ViewHistory> {
    boolean addViewHistory(Long userId, Long vehicleId, String sourcePage);
    List<Long> getRecentViewedVehicleIds(Long userId, Integer limit);
    void updateViewTime(Long userId, Long vehicleId);
}
