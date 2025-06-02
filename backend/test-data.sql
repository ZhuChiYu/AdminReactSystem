-- 插入测试数据脚本

-- 部门数据
INSERT INTO departments (name, code, level, sort, status, created_at, updated_at) VALUES
('技术部', 'TECH', 1, 1, 1, NOW(), NOW()),
('产品部', 'PRODUCT', 1, 2, 1, NOW(), NOW()),
('市场部', 'MARKETING', 1, 3, 1, NOW(), NOW()),
('人事部', 'HR', 1, 4, 1, NOW(), NOW()),
('财务部', 'FINANCE', 1, 5, 1, NOW(), NOW());

-- 角色数据
INSERT INTO roles (role_name, role_code, status, sort, remark, created_at, updated_at) VALUES
('超级管理员', 'super_admin', 1, 1, '系统超级管理员，拥有所有权限', NOW(), NOW()),
('管理员', 'admin', 1, 2, '普通管理员，拥有大部分权限', NOW(), NOW()),
('员工', 'employee', 1, 3, '普通员工', NOW(), NOW()),
('讲师', 'teacher', 1, 4, '课程讲师', NOW(), NOW());

-- 用户数据（密码：123456）
INSERT INTO users (user_name, nick_name, email, phone, password, gender, status, department_id, position, created_at, updated_at) VALUES
('admin', '系统管理员', 'admin@example.com', '13800138000', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 1, 1, '系统管理员', NOW(), NOW()),
('zhangsan', '张三', 'zhangsan@example.com', '13800138001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 1, 1, '高级工程师', NOW(), NOW()),
('lisi', '李四', 'lisi@example.com', '13800138002', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 1, 2, '产品经理', NOW(), NOW()),
('wangwu', '王五', 'wangwu@example.com', '13800138003', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2, 1, 3, '市场专员', NOW(), NOW()),
('zhaoliu', '赵六', 'zhaoliu@example.com', '13800138004', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2, 1, 4, 'HR专员', NOW(), NOW());

-- 用户角色关联
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1), -- admin为超级管理员
(2, 2), -- zhangsan为管理员
(3, 3), -- lisi为员工
(4, 3), -- wangwu为员工
(5, 3); -- zhaoliu为员工

-- 课程分类
INSERT INTO course_categories (name, code, description, sort, status, created_at, updated_at) VALUES
('技术培训', 'TECH_TRAINING', '技术相关培训课程', 1, 1, NOW(), NOW()),
('管理培训', 'MGMT_TRAINING', '管理技能培训课程', 2, 1, NOW(), NOW()),
('营销培训', 'MARKETING_TRAINING', '营销技能培训课程', 3, 1, NOW(), NOW()),
('通用技能', 'GENERAL_SKILLS', '通用技能培训课程', 4, 1, NOW(), NOW());

-- 课程数据
INSERT INTO courses (course_name, course_code, category_id, instructor, description, duration, price, original_price, max_students, start_date, end_date, location, status, created_at, updated_at) VALUES
('React开发实战', 'REACT001', 1, '张三', 'React前端开发从入门到精通', 5, 2999.00, 3999.00, 30, '2024-12-01', '2024-12-05', '北京市海淀区', 1, NOW(), NOW()),
('Python数据分析', 'PYTHON001', 1, '李四', 'Python数据分析与机器学习', 7, 3999.00, 4999.00, 25, '2024-12-10', '2024-12-16', '上海市浦东新区', 1, NOW(), NOW()),
('项目管理精要', 'PM001', 2, '王五', '项目管理方法论与实践', 3, 1999.00, 2999.00, 40, '2024-12-15', '2024-12-17', '深圳市南山区', 1, NOW(), NOW()),
('数字营销策略', 'MARKETING001', 3, '赵六', '数字化时代的营销策略与实施', 4, 2499.00, 3499.00, 35, '2024-12-20', '2024-12-23', '广州市天河区', 1, NOW(), NOW());

-- 会议室数据
INSERT INTO meeting_rooms (name, capacity, location, equipment, status, created_at, updated_at) VALUES
('会议室A', 10, '1楼101室', '["投影仪", "白板", "音响"]', 1, NOW(), NOW()),
('会议室B', 20, '2楼201室', '["投影仪", "白板", "音响", "视频会议"]', 1, NOW(), NOW()),
('会议室C', 50, '3楼301室', '["投影仪", "白板", "音响", "视频会议", "话筒"]', 1, NOW(), NOW()),
('会议室D', 8, '1楼102室', '["投影仪", "白板"]', 1, NOW(), NOW());

-- 会议数据
INSERT INTO meetings (title, description, start_time, end_time, room_id, location, meeting_type, organizer_id, agenda, approval_status, created_at, updated_at) VALUES
('每周技术分享', '团队技术分享会议', '2024-12-02 14:00:00', '2024-12-02 16:00:00', 1, '会议室A', '技术分享', 2, '["技术分享1", "技术分享2", "讨论"]', 2, NOW(), NOW()),
('产品需求评审', '新产品功能需求评审会议', '2024-12-03 09:00:00', '2024-12-03 11:00:00', 2, '会议室B', '产品评审', 3, '["需求介绍", "技术评估", "资源分配"]', 2, NOW(), NOW()),
('年度总结会议', '2024年工作总结与2025年规划', '2024-12-25 09:00:00', '2024-12-25 17:00:00', 3, '会议室C', '年度总结', 1, '["年度总结", "明年规划", "团建活动"]', 1, NOW(), NOW());

-- 会议参与者
INSERT INTO meeting_participants (meeting_id, user_id, role, status, created_at) VALUES
(1, 2, 'organizer', 2, NOW()),
(1, 1, 'participant', 2, NOW()),
(1, 3, 'participant', 1, NOW()),
(2, 3, 'organizer', 2, NOW()),
(2, 1, 'participant', 2, NOW()),
(2, 2, 'participant', 2, NOW()),
(3, 1, 'organizer', 2, NOW()),
(3, 2, 'participant', 1, NOW()),
(3, 3, 'participant', 1, NOW()),
(3, 4, 'participant', 1, NOW()),
(3, 5, 'participant', 1, NOW());

-- 财务记录数据
INSERT INTO financial_records (type, category, amount, description, record_date, created_by_id, status, created_at, updated_at) VALUES
(1, '课程收入', 29990.00, 'React开发实战课程收入', '2024-11-30', 1, 1, NOW(), NOW()),
(1, '课程收入', 39990.00, 'Python数据分析课程收入', '2024-11-30', 1, 1, NOW(), NOW()),
(2, '办公费用', 5000.00, '办公用品采购', '2024-11-29', 1, 1, NOW(), NOW()),
(2, '差旅费', 3200.00, '出差费用报销', '2024-11-28', 2, 1, NOW(), NOW());

-- 班级数据
INSERT INTO classes (name, category_id, category_name, teacher, description, start_date, end_date, status, student_count, created_at, updated_at) VALUES
('React开发班级01期', 1, '技术培训', '张三', 'React前端开发培训班第一期', '2024-12-01', '2024-12-05', 1, 25, NOW(), NOW()),
('Python数据分析02期', 1, '技术培训', '李四', 'Python数据分析培训班第二期', '2024-12-10', '2024-12-16', 0, 20, NOW(), NOW()),
('项目管理精英班', 2, '管理培训', '王五', '项目管理精英培训班', '2024-12-15', '2024-12-17', 0, 15, NOW(), NOW());

-- 班级学员数据
INSERT INTO class_students (class_id, name, company, position, phone, email, join_date, attendance_rate, status, created_at, updated_at) VALUES
(1, '陈小明', '阿里巴巴', '前端工程师', '13800001001', 'chenxm@alibaba.com', '2024-12-01', 100, 1, NOW(), NOW()),
(1, '刘小红', '腾讯', 'UI设计师', '13800001002', 'liuxh@tencent.com', '2024-12-01', 95, 1, NOW(), NOW()),
(1, '王小强', '百度', '产品经理', '13800001003', 'wangxq@baidu.com', '2024-12-01', 90, 1, NOW(), NOW()),
(2, '李小花', '京东', '数据分析师', '13800001004', 'lixh@jd.com', '2024-12-10', 100, 1, NOW(), NOW()),
(2, '张小军', '美团', '算法工程师', '13800001005', 'zhangxj@meituan.com', '2024-12-10', 88, 1, NOW(), NOW()),
(3, '赵小丽', '华为', '项目经理', '13800001006', 'zhaoxl@huawei.com', '2024-12-15', 100, 1, NOW(), NOW());
