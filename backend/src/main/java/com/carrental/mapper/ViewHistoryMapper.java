package com.carrental.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.carrental.entity.ViewHistory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ViewHistoryMapper extends BaseMapper<ViewHistory> {

    @Select("SELECT DISTINCT vehicle_id FROM view_history " +
            "WHERE user_id = #{userId} AND deleted = 0 " +
            "ORDER BY view_time DESC LIMIT #{limit}")
    List<Long> findRecentViewedVehicleIds(@Param("userId") Long userId, @Param("limit") Integer limit);

    @Select("SELECT COUNT(*) FROM view_history " +
            "WHERE user_id = #{userId} AND vehicle_id = #{vehicleId} AND deleted = 0")
    Long countByUserIdAndVehicleId(@Param("userId") Long userId, @Param("vehicleId") Long vehicleId);
}
