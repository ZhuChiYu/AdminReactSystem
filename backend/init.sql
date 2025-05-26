-- 创建数据库扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建索引函数
CREATE OR REPLACE FUNCTION create_updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建业务状态枚举类型
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'locked');
CREATE TYPE gender_type AS ENUM ('unknown', 'male', 'female');
CREATE TYPE customer_level AS ENUM ('normal', 'important', 'vip');
CREATE TYPE follow_status AS ENUM ('consult', 'wechat_added', 'registered', 'arrived', 'new_develop', 'early_25', 'effective_visit', 'not_arrived', 'rejected', 'vip');
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE meeting_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE participant_status AS ENUM ('pending', 'accepted', 'declined', 'tentative');
CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance');

-- 创建初始数据
COMMENT ON DATABASE soybean_admin IS 'SoyBean Admin Management System Database';

-- 设置默认权限
GRANT ALL PRIVILEGES ON DATABASE soybean_admin TO soybean;
