-- 创建员工任务目标表
CREATE TABLE IF NOT EXISTS employee_task_targets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '目标ID',
    employee_id BIGINT NOT NULL COMMENT '员工ID',
    target_year INT NOT NULL COMMENT '目标年份',
    target_month TINYINT NOT NULL COMMENT '目标月份 1-12',

    -- 四种任务类型的目标
    consult_target INT DEFAULT 0 COMMENT '咨询任务目标数量',
    follow_up_target INT DEFAULT 0 COMMENT '回访任务目标数量',
    develop_target INT DEFAULT 0 COMMENT '开发任务目标数量',
    register_target INT DEFAULT 0 COMMENT '报名任务目标数量',

    remark TEXT COMMENT '备注信息',
    manager_id BIGINT COMMENT '设置目标的管理员ID',

    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    UNIQUE KEY uk_employee_period (employee_id, target_year, target_month),
    INDEX idx_employee_id (employee_id),
    INDEX idx_target_period (target_year, target_month),
    INDEX idx_manager_id (manager_id),

    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
) COMMENT '员工任务目标表';
