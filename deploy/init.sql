-- 创建数据库扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建数据库（如果不存在）
-- 注意：这个脚本会在容器启动时自动执行
