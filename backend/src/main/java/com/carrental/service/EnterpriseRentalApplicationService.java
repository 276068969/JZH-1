package com.carrental.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.carrental.dto.EnterpriseRentalApplicationDTO;
import com.carrental.entity.EnterpriseRentalApplication;

import java.util.List;
import java.util.Map;

public interface EnterpriseRentalApplicationService extends IService<EnterpriseRentalApplication> {
    EnterpriseRentalApplication createApplication(Long userId, Map<String, Object> params);
    List<EnterpriseRentalApplicationDTO> getUserApplications(Long userId);
    EnterpriseRentalApplicationDTO getApplicationDetail(Long id, Long userId);
}
