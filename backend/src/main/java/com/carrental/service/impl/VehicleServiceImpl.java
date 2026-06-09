package com.carrental.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.carrental.dto.VehicleSearchRequest;
import com.carrental.entity.Vehicle;
import com.carrental.mapper.VehicleMapper;
import com.carrental.service.VehicleService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

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
        VehicleSearchRequest request = new VehicleSearchRequest();
        request.setKeyword(keyword);
        return searchVehicles(request);
    }

    @Override
    public List<Vehicle> searchVehicles(VehicleSearchRequest request) {
        LambdaQueryWrapper<Vehicle> wrapper = new LambdaQueryWrapper<>();

        if (request.getKeyword() != null && !request.getKeyword().isEmpty()) {
            wrapper.and(w -> w.like(Vehicle::getName, request.getKeyword())
                    .or()
                    .like(Vehicle::getType, request.getKeyword())
                    .or()
                    .like(Vehicle::getDescription, request.getKeyword()));
        }

        if (request.getCity() != null && !request.getCity().isEmpty()) {
            wrapper.like(Vehicle::getLocation, request.getCity());
        }

        if (request.getType() != null && !request.getType().isEmpty()) {
            wrapper.eq(Vehicle::getType, request.getType());
        }

        if (request.getMinPrice() != null) {
            wrapper.ge(Vehicle::getPrice, request.getMinPrice());
        }

        if (request.getMaxPrice() != null) {
            wrapper.le(Vehicle::getPrice, request.getMaxPrice());
        }

        if (request.getAvailable() != null) {
            wrapper.eq(Vehicle::getAvailable, request.getAvailable());
        }

        if (request.getSortBy() != null && !request.getSortBy().isEmpty()) {
            boolean isAsc = "asc".equalsIgnoreCase(request.getSortOrder());
            switch (request.getSortBy()) {
                case "price":
                    if (isAsc) {
                        wrapper.orderByAsc(Vehicle::getPrice);
                    } else {
                        wrapper.orderByDesc(Vehicle::getPrice);
                    }
                    break;
                case "rating":
                    if (isAsc) {
                        wrapper.orderByAsc(Vehicle::getRating);
                    } else {
                        wrapper.orderByDesc(Vehicle::getRating);
                    }
                    break;
                case "name":
                    if (isAsc) {
                        wrapper.orderByAsc(Vehicle::getName);
                    } else {
                        wrapper.orderByDesc(Vehicle::getName);
                    }
                    break;
                default:
                    wrapper.orderByDesc(Vehicle::getRating);
                    break;
            }
        } else {
            wrapper.orderByDesc(Vehicle::getRating);
        }

        List<Vehicle> vehicles = this.list(wrapper);
        if (vehicles.isEmpty()) {
            return filterMockVehicles(request);
        }
        return vehicles;
    }

    private List<Vehicle> filterMockVehicles(VehicleSearchRequest request) {
        List<Vehicle> allVehicles = getMockVehicles();

        return allVehicles.stream()
                .filter(v -> {
                    if (request.getKeyword() != null && !request.getKeyword().isEmpty()) {
                        String keyword = request.getKeyword().toLowerCase();
                        boolean match = v.getName().toLowerCase().contains(keyword)
                                || v.getType().toLowerCase().contains(keyword)
                                || (v.getDescription() != null && v.getDescription().toLowerCase().contains(keyword));
                        if (!match) return false;
                    }
                    if (request.getCity() != null && !request.getCity().isEmpty()) {
                        if (!v.getLocation().contains(request.getCity())) return false;
                    }
                    if (request.getType() != null && !request.getType().isEmpty()) {
                        if (!v.getType().equals(request.getType())) return false;
                    }
                    if (request.getMinPrice() != null) {
                        if (v.getPrice().compareTo(request.getMinPrice()) < 0) return false;
                    }
                    if (request.getMaxPrice() != null) {
                        if (v.getPrice().compareTo(request.getMaxPrice()) > 0) return false;
                    }
                    if (request.getAvailable() != null) {
                        if (!v.getAvailable().equals(request.getAvailable())) return false;
                    }
                    return true;
                })
                .sorted((v1, v2) -> {
                    String sortBy = request.getSortBy();
                    boolean isAsc = "asc".equalsIgnoreCase(request.getSortOrder());
                    if (sortBy == null || sortBy.isEmpty()) {
                        sortBy = "rating";
                        isAsc = false;
                    }
                    int result = 0;
                    switch (sortBy) {
                        case "price":
                            result = v1.getPrice().compareTo(v2.getPrice());
                            break;
                        case "rating":
                            result = v1.getRating().compareTo(v2.getRating());
                            break;
                        case "name":
                            result = v1.getName().compareTo(v2.getName());
                            break;
                        default:
                            result = v1.getRating().compareTo(v2.getRating());
                            break;
                    }
                    return isAsc ? result : -result;
                })
                .collect(Collectors.toList());
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

        Vehicle v4 = new Vehicle();
        v4.setId(4L);
        v4.setName("奥迪 A6L");
        v4.setType("轿车");
        v4.setPrice(new BigDecimal("359"));
        v4.setLocation("广州市天河区");
        v4.setLatitude(23.1291);
        v4.setLongitude(113.2644);
        v4.setAvailable(true);
        v4.setRating(new BigDecimal("4.7"));
        v4.setDescription("科技感十足的豪华轿车");
        v4.setSpecs("座位数:5|变速箱:自动|燃料:汽油|年份:2024");
        v4.setFeatures("虚拟座舱,矩阵LED大灯,自适应巡航,BOSE音响");

        Vehicle v5 = new Vehicle();
        v5.setId(5L);
        v5.setName("奔驰 E级");
        v5.setType("轿车");
        v5.setPrice(new BigDecimal("429"));
        v5.setLocation("深圳市南山区");
        v5.setLatitude(22.5431);
        v5.setLongitude(114.0579);
        v5.setAvailable(false);
        v5.setRating(new BigDecimal("4.9"));
        v5.setDescription("尊贵舒适的商务座驾");
        v5.setSpecs("座位数:5|变速箱:自动|燃料:汽油|年份:2024");
        v5.setFeatures("柏林之声音响,64色氛围灯,真皮座椅,后排娱乐");

        Vehicle v6 = new Vehicle();
        v6.setId(6L);
        v6.setName("大众 途观L");
        v6.setType("SUV");
        v6.setPrice(new BigDecimal("259"));
        v6.setLocation("成都市高新区");
        v6.setLatitude(30.5728);
        v6.setLongitude(104.0668);
        v6.setAvailable(true);
        v6.setRating(new BigDecimal("4.6"));
        v6.setDescription("家庭出行首选");
        v6.setSpecs("座位数:5|变速箱:自动|燃料:汽油|年份:2024");
        v6.setFeatures("大空间,全景天窗,倒车影像,定速巡航");

        Vehicle v7 = new Vehicle();
        v7.setId(7L);
        v7.setName("丰田 埃尔法");
        v7.setType("MPV");
        v7.setPrice(new BigDecimal("599"));
        v7.setLocation("北京市海淀区");
        v7.setLatitude(39.9599);
        v7.setLongitude(116.2982);
        v7.setAvailable(true);
        v7.setRating(new BigDecimal("4.8"));
        v7.setDescription("明星保姆车");
        v7.setSpecs("座位数:7|变速箱:自动|燃料:汽油|年份:2024");
        v7.setFeatures("航空座椅,电动侧滑门,后排娱乐,冰箱");

        Vehicle v8 = new Vehicle();
        v8.setId(8L);
        v8.setName("蔚来 ES8");
        v8.setType("电动车");
        v8.setPrice(new BigDecimal("499"));
        v8.setLocation("上海市静安区");
        v8.setLatitude(31.2297);
        v8.setLongitude(121.4498);
        v8.setAvailable(true);
        v8.setRating(new BigDecimal("4.7"));
        v8.setDescription("智能电动SUV");
        v8.setSpecs("座位数:6|变速箱:自动|燃料:纯电动|年份:2024");
        v8.setFeatures("换电技术,女王副驾,NOMI智能助手,自动驾驶");

        Vehicle v9 = new Vehicle();
        v9.setId(9L);
        v9.setName("奥迪 Q5L");
        v9.setType("SUV");
        v9.setPrice(new BigDecimal("379"));
        v9.setLocation("广州市越秀区");
        v9.setLatitude(23.1252);
        v9.setLongitude(113.2676);
        v9.setAvailable(true);
        v9.setRating(new BigDecimal("4.6"));
        v9.setDescription("全能城市SUV");
        v9.setSpecs("座位数:5|变速箱:自动|燃料:汽油|年份:2024");
        v9.setFeatures("quattro四驱,虚拟座舱,全景天窗,自适应巡航");

        Vehicle v10 = new Vehicle();
        v10.setId(10L);
        v10.setName("比亚迪 汉");
        v10.setType("电动车");
        v10.setPrice(new BigDecimal("239"));
        v10.setLocation("深圳市福田区");
        v10.setLatitude(22.5431);
        v10.setLongitude(114.0579);
        v10.setAvailable(true);
        v10.setRating(new BigDecimal("4.7"));
        v10.setDescription("国产旗舰电动轿车");
        v10.setSpecs("座位数:5|变速箱:自动|燃料:纯电动|年份:2024");
        v10.setFeatures("刀片电池,DiPilot智能驾驶,丹拿音响,全景天幕");

        Vehicle v11 = new Vehicle();
        v11.setId(11L);
        v11.setName("本田 奥德赛");
        v11.setType("MPV");
        v11.setPrice(new BigDecimal("329"));
        v11.setLocation("杭州市余杭区");
        v11.setLatitude(30.4175);
        v11.setLongitude(120.3046);
        v11.setAvailable(true);
        v11.setRating(new BigDecimal("4.5"));
        v11.setDescription("家用MPV首选");
        v11.setSpecs("座位数:7|变速箱:自动|燃料:汽油|年份:2024");
        v11.setFeatures("魔术门,电动座椅,倒车影像,定速巡航");

        Vehicle v12 = new Vehicle();
        v12.setId(12L);
        v12.setName("法拉利 488");
        v12.setType("跑车");
        v12.setPrice(new BigDecimal("1999"));
        v12.setLocation("北京市朝阳区");
        v12.setLatitude(39.9219);
        v12.setLongitude(116.4435);
        v12.setAvailable(false);
        v12.setRating(new BigDecimal("4.9"));
        v12.setDescription("意大利超跑，激情澎湃");
        v12.setSpecs("座位数:2|变速箱:自动|燃料:汽油|年份:2024");
        v12.setFeatures("V8双涡轮,碳陶瓷刹车,运动排气,敞篷");

        return Arrays.asList(v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12);
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
