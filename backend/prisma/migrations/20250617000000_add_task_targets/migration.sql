-- 修改 employee_targets 表结构
ALTER TABLE employee_targets
  DROP COLUMN target_amount,
  ADD COLUMN consult_target INT DEFAULT 0 COMMENT '咨询任务目标数量',
  ADD COLUMN follow_up_target INT DEFAULT 0 COMMENT '回访任务目标数量',
  ADD COLUMN develop_target INT DEFAULT 0 COMMENT '开发任务目标数量',
  ADD COLUMN register_target INT DEFAULT 0 COMMENT '报名任务目标数量';
