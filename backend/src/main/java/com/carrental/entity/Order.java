package com.carrental.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("orders")
public class Order {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long vehicleId;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private BigDecimal totalPrice;

    private String status;

    private Integer renewCount;

    private LocalDateTime pickupTime;

    private String pickupNote;

    private BigDecimal pickupOdometer;

    private LocalDateTime returnTime;

    private String returnNote;

    private BigDecimal returnOdometer;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
