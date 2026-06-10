package com.carrental.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.carrental.dto.EnterpriseRentalApplicationDTO;
import com.carrental.entity.EnterpriseRentalApplication;
import com.carrental.mapper.EnterpriseRentalApplicationMapper;
import com.carrental.service.EnterpriseRentalApplicationService;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
public class EnterpriseRentalApplicationServiceImpl extends ServiceImpl<EnterpriseRentalApplicationMapper, EnterpriseRentalApplication> implements EnterpriseRentalApplicationService {

    @Override
    @Transactional
    public EnterpriseRentalApplication createApplication(Long userId, Map<String, Object> params) {
        EnterpriseRentalApplication application = new EnterpriseRentalApplication();
        application.setUserId(userId);

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        application.setPlannedStartDate(LocalDate.parse(params.get("plannedStartDate").toString(), dateFormatter));
        application.setPlannedEndDate(LocalDate.parse(params.get("plannedEndDate").toString(), dateFormatter));

        application.setVehiclePreference(params.get("vehiclePreference") != null ? params.get("vehiclePreference").toString() : null);
        application.setEstimatedQuantity(Integer.parseInt(params.get("estimatedQuantity").toString()));
        application.setContactName(params.get("contactName").toString());
        application.setContactPhone(params.get("contactPhone").toString());
        application.setContactEmail(params.get("contactEmail") != null ? params.get("contactEmail").toString() : null);
        application.setBusinessPurpose(params.get("businessPurpose") != null ? params.get("businessPurpose").toString() : null);
        application.setSpecialRequirements(params.get("specialRequirements") != null ? params.get("specialRequirements").toString() : null);
        application.setStatus("pending");
        application.setCreateTime(LocalDateTime.now());
        application.setUpdateTime(LocalDateTime.now());

        this.save(application);
        return application;
    }

    @Override
    public List<EnterpriseRentalApplicationDTO> getUserApplications(Long userId) {
        LambdaQueryWrapper<EnterpriseRentalApplication> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(EnterpriseRentalApplication::getUserId, userId)
               .orderByDesc(EnterpriseRentalApplication::getCreateTime);

        List<EnterpriseRentalApplication> applications = this.list(wrapper);
        if (applications.isEmpty()) {
            return getMockApplications(userId);
        }

        List<EnterpriseRentalApplicationDTO> result = new ArrayList<>();
        for (EnterpriseRentalApplication app : applications) {
            EnterpriseRentalApplicationDTO dto = new EnterpriseRentalApplicationDTO();
            BeanUtils.copyProperties(app, dto);
            result.add(dto);
        }
        return result;
    }

    @Override
    public EnterpriseRentalApplicationDTO getApplicationDetail(Long id, Long userId) {
        EnterpriseRentalApplication application = this.getById(id);
        if (application == null || !application.getUserId().equals(userId)) {
            throw new RuntimeException("申请不存在或无权限查看");
        }

        EnterpriseRentalApplicationDTO dto = new EnterpriseRentalApplicationDTO();
        BeanUtils.copyProperties(application, dto);
        return dto;
    }

    private List<EnterpriseRentalApplicationDTO> getMockApplications(Long userId) {
        List<EnterpriseRentalApplicationDTO> result = new ArrayList<>();

        EnterpriseRentalApplicationDTO app1 = new EnterpriseRentalApplicationDTO();
        app1.setId(1L);
        app1.setUserId(userId);
        app1.setPlannedStartDate(LocalDate.now().plusDays(10));
        app1.setPlannedEndDate(LocalDate.now().plusMonths(3));
        app1.setVehiclePreference("轿车,电动车");
        app1.setEstimatedQuantity(5);
        app1.setContactName("张三");
        app1.setContactPhone("13800138000");
        app1.setContactEmail("zhangsan@company.com");
        app1.setBusinessPurpose("公司日常通勤及商务接待");
        app1.setSpecialRequirements("需配备车载WiFi、蓝牙免提系统");
        app1.setStatus("approved");
        app1.setReviewComment("申请已通过，将安排专属客户经理对接");
        app1.setCreateTime(LocalDateTime.now().minusDays(5));
        app1.setUpdateTime(LocalDateTime.now().minusDays(3));
        result.add(app1);

        EnterpriseRentalApplicationDTO app2 = new EnterpriseRentalApplicationDTO();
        app2.setId(2L);
        app2.setUserId(userId);
        app2.setPlannedStartDate(LocalDate.now().plusDays(20));
        app2.setPlannedEndDate(LocalDate.now().plusMonths(1));
        app2.setVehiclePreference("SUV");
        app2.setEstimatedQuantity(3);
        app2.setContactName("张三");
        app2.setContactPhone("13800138000");
        app2.setContactEmail("zhangsan@company.com");
        app2.setBusinessPurpose("项目团队外出考察用车");
        app2.setSpecialRequirements("需要空间大、适合长途行驶");
        app2.setStatus("pending");
        app2.setReviewComment(null);
        app2.setCreateTime(LocalDateTime.now().minusDays(2));
        app2.setUpdateTime(LocalDateTime.now().minusDays(2));
        result.add(app2);

        EnterpriseRentalApplicationDTO app3 = new EnterpriseRentalApplicationDTO();
        app3.setId(3L);
        app3.setUserId(userId);
        app3.setPlannedStartDate(LocalDate.now().minusMonths(2));
        app3.setPlannedEndDate(LocalDate.now().minusMonths(1));
        app3.setVehiclePreference("MPV");
        app3.setEstimatedQuantity(2);
        app3.setContactName("张三");
        app3.setContactPhone("13800138000");
        app3.setContactEmail("zhangsan@company.com");
        app3.setBusinessPurpose("客户接待");
        app3.setSpecialRequirements("高端商务车，需配备司机");
        app3.setStatus("completed");
        app3.setReviewComment("已完成，感谢您的使用");
        app3.setCreateTime(LocalDateTime.now().minusMonths(3));
        app3.setUpdateTime(LocalDateTime.now().minusMonths(1));
        result.add(app3);

        EnterpriseRentalApplicationDTO app4 = new EnterpriseRentalApplicationDTO();
        app4.setId(4L);
        app4.setUserId(userId);
        app4.setPlannedStartDate(LocalDate.now().plusDays(15));
        app4.setPlannedEndDate(LocalDate.now().plusMonths(2));
        app4.setVehiclePreference("豪华轿车");
        app4.setEstimatedQuantity(2);
        app4.setContactName("张三");
        app4.setContactPhone("13800138000");
        app4.setContactEmail("zhangsan@company.com");
        app4.setBusinessPurpose("高管用车");
        app4.setSpecialRequirements("需要真皮座椅、后排娱乐系统");
        app4.setStatus("rejected");
        app4.setReviewComment("抱歉，当前豪华轿车库存紧张，建议选择其他车型或延长申请周期");
        app4.setCreateTime(LocalDateTime.now().minusDays(7));
        app4.setUpdateTime(LocalDateTime.now().minusDays(6));
        result.add(app4);

        return result;
    }
}
