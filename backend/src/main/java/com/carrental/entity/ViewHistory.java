package com.carrental.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("view_history")
public class ViewHistory {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long vehicleId;

    private String sourcePage;

    private LocalDateTime viewTime;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
