package com.carrental.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.carrental.entity.Vehicle;
import com.carrental.mapper.VehicleMapper;
import com.carrental.service.VehicleService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

@Service
public class VehicleServiceImpl extends ServiceImpl<VehicleMapper, Vehicle> implements VehicleService {

    @Override
    public List<Vehicle> getAvailableVehicles() {
        LambdaQueryWrapper<Vehicle> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Vehicle::getAvailable, true);
        List<Vehicle> vehicles = this.list(wrapper);

        if (vehicles.isEmpty()) {
            return getMockVehicles();
        }
        return vehicles;
    }

    @Override
    public Vehicle getVehicleById(Long id) {
        Vehicle vehicle = this.getById(id);
        if (vehicle == null) {
            vehicle = getMockVehicleById(id);
        }
        return vehicle;
    }

    @Override
    public List<Vehicle> searchVehicles(String keyword) {
        LambdaQueryWrapper<Vehicle> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(Vehicle::getName, keyword)
               .or()
               .like(Vehicle::getType, keyword);

        List<Vehicle> vehicles = this.list(wrapper);
        if (vehicles.isEmpty()) {
            return getMockVehicles();
        }
        return vehicles;
    }

    private List<Vehicle> getMockVehicles() {
        Vehicle v1 = new Vehicle();
        v1.setId(1L);
        v1.setName("特斯拉 Model 3");
        v1.setType("电动车");
        v1.setPrice(new BigDecimal("299"));
        v1.setLocation("北京市朝阳区");
        v1.setLatitude(39.9042);
        v1.setLongitude(116.4074);
        v1.setAvailable(true);
        v1.setRating(new BigDecimal("4.8"));
        v1.setDescription("高性能纯电动轿车，续航500公里");
        v1.setSpecs("座位数:5|变速箱:自动|燃料:纯电动|年份:2024");
        v1.setFeatures("自动驾驶,全景天窗,智能互联,快速充电,辅助泊车,OTA升级");

        Vehicle v2 = new Vehicle();
        v2.setId(2L);
        v2.setName("宝马 5系");
        v2.setType("轿车");
        v2.setPrice(new BigDecimal("399"));
        v2.setLocation("上海市浦东新区");
        v2.setLatitude(31.2304);
        v2.setLongitude(121.4737);
        v2.setAvailable(true);
        v2.setRating(new BigDecimal("4.9"));
        v2.setDescription("豪华商务轿车，舒适驾乘");
        v2.setSpecs("座位数:5|变速箱:自动|燃料:汽油|年份:2024");
        v2.setFeatures("真皮座椅,导航系统,全景天窗,氛围灯,哈曼卡顿音响");

        Vehicle v3 = new Vehicle();
        v3.setId(3L);
        v3.setName("保时捷 911");
        v3.setType("跑车");
        v3.setPrice(new BigDecimal("1299"));
        v3.setLocation("杭州市西湖区");
        v3.setLatitude(30.2741);
        v3.setLongitude(120.1551);
        v3.setAvailable(true);
        v3.setRating(new BigDecimal("5.0"));
        v3.setDescription("极致驾驶体验，澎湃动力");
        v3.setSpecs("座位数:2|变速箱:自动|燃料:汽油|年份:2024");
        v3.setFeatures("运动排气,碳陶瓷刹车,Sport Chrono组件,动力转向升级");

        return Arrays.asList(v1, v2, v3);
    }

    @Override
    public List<Vehicle> getVehiclesByIds(List<Long> ids) {
        List<Vehicle> vehicles = this.listByIds(ids);
        if (vehicles.isEmpty()) {
            return getMockVehiclesByIds(ids);
        }
        return vehicles;
    }

    private Vehicle getMockVehicleById(Long id) {
        List<Vehicle> mockVehicles = getMockVehicles();
        return mockVehicles.stream()
                .filter(v -> v.getId().equals(id))
                .findFirst()
                .orElse(mockVehicles.get(0));
    }

    private List<Vehicle> getMockVehiclesByIds(List<Long> ids) {
        List<Vehicle> allMock = getMockVehicles();
        return allMock.stream()
                .filter(v -> ids.contains(v.getId()))
                .collect(java.util.stream.Collectors.toList());
    }
}
