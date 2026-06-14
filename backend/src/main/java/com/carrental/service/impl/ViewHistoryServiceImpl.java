package com.carrental.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.carrental.entity.ViewHistory;
import com.carrental.mapper.ViewHistoryMapper;
import com.carrental.service.ViewHistoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ViewHistoryServiceImpl extends ServiceImpl<ViewHistoryMapper, ViewHistory> implements ViewHistoryService {

    private static final Logger log = LoggerFactory.getLogger(ViewHistoryServiceImpl.class);

    @Override
    public boolean addViewHistory(Long userId, Long vehicleId, String sourcePage) {
        try {
            LambdaQueryWrapper<ViewHistory> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(ViewHistory::getUserId, userId)
                    .eq(ViewHistory::getVehicleId, vehicleId)
                    .eq(ViewHistory::getDeleted, 0);

            ViewHistory existing = this.getOne(wrapper);
            if (existing != null) {
                existing.setViewTime(LocalDateTime.now());
                existing.setSourcePage(sourcePage);
                return this.updateById(existing);
            } else {
                ViewHistory history = new ViewHistory();
                history.setUserId(userId);
                history.setVehicleId(vehicleId);
                history.setSourcePage(sourcePage);
                history.setViewTime(LocalDateTime.now());
                return this.save(history);
            }
        } catch (Exception e) {
            log.error("添加浏览记录失败 userId:{}, vehicleId:{}, sourcePage:{}", userId, vehicleId, sourcePage, e);
            return false;
        }
    }

    @Override
    public List<Long> getRecentViewedVehicleIds(Long userId, Integer limit) {
        if (limit == null || limit <= 0) {
            limit = 20;
        }
        try {
            return this.baseMapper.findRecentViewedVehicleIds(userId, limit);
        } catch (Exception e) {
            log.error("获取最近浏览车辆ID列表失败 userId:{}", userId, e);
            return List.of();
        }
    }

    @Override
    public void updateViewTime(Long userId, Long vehicleId) {
        try {
            LambdaQueryWrapper<ViewHistory> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(ViewHistory::getUserId, userId)
                    .eq(ViewHistory::getVehicleId, vehicleId)
                    .eq(ViewHistory::getDeleted, 0);

            ViewHistory history = this.getOne(wrapper);
            if (history != null) {
                history.setViewTime(LocalDateTime.now());
                this.updateById(history);
            }
        } catch (Exception e) {
            log.error("更新浏览时间失败 userId:{}, vehicleId:{}", userId, vehicleId, e);
        }
    }
}
