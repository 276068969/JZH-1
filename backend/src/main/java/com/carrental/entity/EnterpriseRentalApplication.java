package com.carrental.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("enterprise_rental_applications")
public class EnterpriseRentalApplication {
    @TableId(type = IdType.AUTO)
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

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
