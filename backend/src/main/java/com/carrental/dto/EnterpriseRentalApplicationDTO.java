package com.carrental.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class EnterpriseRentalApplicationDTO {
    private Long id;
    private Long userId;
    private LocalDate plannedStartDate;
    private LocalDate plannedEndDate;
    private String vehiclePreference;
    private Integer estimatedQuantity;
    private String contactName;
    private String contactPhone;
    private String contactEmail;
    private String businessPurpose;
    private String specialRequirements;
    private String status;
    private String reviewComment;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
