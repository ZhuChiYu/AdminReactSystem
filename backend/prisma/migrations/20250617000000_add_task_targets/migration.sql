-- 修改 employee_targets 表结构
ALTER TABLE employee_targets
  DROP COLUMN target_amount,
  ADD COLUMN consult_target INT DEFAULT 0,
  ADD COLUMN follow_up_target INT DEFAULT 0,
  ADD COLUMN develop_target INT DEFAULT 0,
  ADD COLUMN register_target INT DEFAULT 0;
