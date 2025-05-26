# React SoybeanAdmin 数据库设计文档

## 概述

本文档详细描述了 React SoybeanAdmin 系统的数据库设计，包含用户管理、权限控制、客户管理、课程管理、班级管理、员工管理、会议管理、财务管理、报销流程等核心功能模块的数据表结构。

## 数据库设计原则

1. **规范化设计**：遵循第三范式，减少数据冗余
2. **扩展性**：预留扩展字段，支持业务发展
3. **性能优化**：合理设置索引，优化查询性能
4. **数据完整性**：设置外键约束，保证数据一致性
5. **安全性**：敏感数据加密存储，权限分级控制

## 核心数据表设计

### 1. 用户管理模块

#### 1.1 用户表 (users)

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    user_name VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    nick_name VARCHAR(100) NOT NULL COMMENT '昵称',
    password VARCHAR(255) NOT NULL COMMENT '密码(加密)',
    user_email VARCHAR(100) UNIQUE COMMENT '邮箱',
    user_phone VARCHAR(20) COMMENT '手机号',
    user_gender TINYINT DEFAULT 0 COMMENT '性别: 0-未知, 1-男, 2-女',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    manager_id BIGINT COMMENT '上级管理员ID',
    department_id BIGINT COMMENT '部门ID',
    position VARCHAR(100) COMMENT '职位',
    address TEXT COMMENT '地址',
    bank_card VARCHAR(50) COMMENT '银行卡号',
    id_card VARCHAR(18) COMMENT '身份证号',
    tim VARCHAR(100) COMMENT 'TIM账号',
    wechat VARCHAR(100) COMMENT '微信号',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    create_by BIGINT COMMENT '创建人',
    update_by BIGINT COMMENT '更新人',

    INDEX idx_user_name (user_name),
    INDEX idx_user_email (user_email),
    INDEX idx_user_phone (user_phone),
    INDEX idx_manager_id (manager_id),
    INDEX idx_department_id (department_id),
    INDEX idx_status (status)
) COMMENT '用户表';
```

#### 1.2 角色表 (roles)

```sql
CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '角色ID',
    role_code VARCHAR(50) NOT NULL UNIQUE COMMENT '角色编码',
    role_name VARCHAR(100) NOT NULL COMMENT '角色名称',
    role_desc TEXT COMMENT '角色描述',
    role_home VARCHAR(200) COMMENT '角色首页路由',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    sort_order INT DEFAULT 0 COMMENT '排序',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    create_by BIGINT COMMENT '创建人',
    update_by BIGINT COMMENT '更新人',

    INDEX idx_role_code (role_code),
    INDEX idx_status (status)
) COMMENT '角色表';
```

#### 1.3 用户角色关联表 (user_roles)

```sql
CREATE TABLE user_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    create_by BIGINT COMMENT '创建人',

    UNIQUE KEY uk_user_role (user_id, role_id),
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) COMMENT '用户角色关联表';
```

#### 1.4 权限表 (permissions)

```sql
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '权限ID',
    permission_code VARCHAR(100) NOT NULL UNIQUE COMMENT '权限编码',
    permission_name VARCHAR(100) NOT NULL COMMENT '权限名称',
    permission_type TINYINT NOT NULL COMMENT '权限类型: 1-菜单, 2-按钮, 3-数据',
    parent_id BIGINT DEFAULT 0 COMMENT '父权限ID',
    resource_url VARCHAR(500) COMMENT '资源URL',
    method VARCHAR(10) COMMENT 'HTTP方法',
    icon VARCHAR(100) COMMENT '图标',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    create_by BIGINT COMMENT '创建人',
    update_by BIGINT COMMENT '更新人',

    INDEX idx_permission_code (permission_code),
    INDEX idx_parent_id (parent_id),
    INDEX idx_status (status)
) COMMENT '权限表';
```

#### 1.5 角色权限关联表 (role_permissions)

```sql
CREATE TABLE role_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    permission_id BIGINT NOT NULL COMMENT '权限ID',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    create_by BIGINT COMMENT '创建人',

    UNIQUE KEY uk_role_permission (role_id, permission_id),
    INDEX idx_role_id (role_id),
    INDEX idx_permission_id (permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) COMMENT '角色权限关联表';
```

#### 1.6 用户权限表 (user_permissions)

```sql
CREATE TABLE user_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '权限ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    permission_type VARCHAR(50) NOT NULL COMMENT '权限类型',
    resource_id BIGINT COMMENT '资源ID(客户ID/班级ID等)',
    resource_type VARCHAR(50) COMMENT '资源类型(customer/class等)',
    granted_by BIGINT COMMENT '授权人ID',
    granted_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '授权时间',
    expiry_time TIMESTAMP COMMENT '过期时间',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',

    INDEX idx_user_id (user_id),
    INDEX idx_permission_type (permission_type),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_granted_by (granted_by),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT '用户权限表';
```

### 2. 组织架构模块

#### 2.1 部门表 (departments)

```sql
CREATE TABLE departments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '部门ID',
    dept_name VARCHAR(100) NOT NULL COMMENT '部门名称',
    dept_code VARCHAR(50) UNIQUE COMMENT '部门编码',
    parent_id BIGINT DEFAULT 0 COMMENT '父部门ID',
    dept_level INT DEFAULT 1 COMMENT '部门层级',
    dept_path VARCHAR(500) COMMENT '部门路径',
    manager_id BIGINT COMMENT '部门负责人ID',
    phone VARCHAR(20) COMMENT '部门电话',
    email VARCHAR(100) COMMENT '部门邮箱',
    address TEXT COMMENT '部门地址',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    create_by BIGINT COMMENT '创建人',
    update_by BIGINT COMMENT '更新人',

    INDEX idx_dept_code (dept_code),
    INDEX idx_parent_id (parent_id),
    INDEX idx_manager_id (manager_id),
    INDEX idx_status (status)
) COMMENT '部门表';
```

#### 2.2 员工管理员关系表 (employee_manager_relations)

```sql
CREATE TABLE employee_manager_relations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '关系ID',
    employee_id BIGINT NOT NULL COMMENT '员工ID',
    manager_id BIGINT NOT NULL COMMENT '管理员ID',
    assigned_by BIGINT NOT NULL COMMENT '分配人ID',
    assigned_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-无效, 1-有效',
    remark TEXT COMMENT '备注',

    UNIQUE KEY uk_employee_manager (employee_id, manager_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_manager_id (manager_id),
    INDEX idx_assigned_by (assigned_by),
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id)
) COMMENT '员工管理员关系表';
```

### 3. 客户管理模块

#### 3.1 客户表 (customers)

```sql
CREATE TABLE customers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '客户ID',
    customer_name VARCHAR(100) NOT NULL COMMENT '客户姓名',
    company VARCHAR(200) COMMENT '公司名称',
    position VARCHAR(100) COMMENT '职位',
    phone VARCHAR(20) COMMENT '电话',
    mobile VARCHAR(20) COMMENT '手机',
    email VARCHAR(100) COMMENT '邮箱',
    wechat VARCHAR(100) COMMENT '微信号',
    qq VARCHAR(20) COMMENT 'QQ号',
    address TEXT COMMENT '地址',
    source VARCHAR(50) COMMENT '客户来源',
    industry VARCHAR(100) COMMENT '所属行业',
    customer_level TINYINT DEFAULT 1 COMMENT '客户等级: 1-普通, 2-重要, 3-VIP',
    follow_status VARCHAR(50) NOT NULL COMMENT '跟进状态',
    follow_content TEXT COMMENT '跟进内容',
    next_follow_time TIMESTAMP COMMENT '下次跟进时间',
    employee_id BIGINT COMMENT '负责员工ID',
    assigned_by BIGINT COMMENT '分配人ID',
    assigned_time TIMESTAMP COMMENT '分配时间',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    create_by BIGINT COMMENT '创建人',
    update_by BIGINT COMMENT '更新人',

    INDEX idx_customer_name (customer_name),
    INDEX idx_company (company),
    INDEX idx_phone (phone),
    INDEX idx_mobile (mobile),
    INDEX idx_employee_id (employee_id),
    INDEX idx_follow_status (follow_status),
    INDEX idx_assigned_by (assigned_by),
    FOREIGN KEY (employee_id) REFERENCES users(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id)
) COMMENT '客户表';
```

#### 3.2 客户跟进记录表 (customer_follow_records)

```sql
CREATE TABLE customer_follow_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
    customer_id BIGINT NOT NULL COMMENT '客户ID',
    follow_type VARCHAR(50) NOT NULL COMMENT '跟进方式',
    follow_content TEXT NOT NULL COMMENT '跟进内容',
    follow_result VARCHAR(50) COMMENT '跟进结果',
    next_follow_time TIMESTAMP COMMENT '下次跟进时间',
    follow_user_id BIGINT NOT NULL COMMENT '跟进人ID',
    follow_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '跟进时间',
    attachments JSON COMMENT '附件信息',

    INDEX idx_customer_id (customer_id),
    INDEX idx_follow_user_id (follow_user_id),
    INDEX idx_follow_time (follow_time),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (follow_user_id) REFERENCES users(id)
) COMMENT '客户跟进记录表';
```

#### 3.3 客户分配记录表 (customer_assignments)

```sql
CREATE TABLE customer_assignments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '分配ID',
    customer_id BIGINT NOT NULL COMMENT '客户ID',
    assigned_to_id BIGINT NOT NULL COMMENT '分配给的员工ID',
    assigned_by_id BIGINT NOT NULL COMMENT '分配人ID',
    assigned_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
    remark TEXT COMMENT '分配备注',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-已取消, 1-有效',

    INDEX idx_customer_id (customer_id),
    INDEX idx_assigned_to_id (assigned_to_id),
    INDEX idx_assigned_by_id (assigned_by_id),
    INDEX idx_assigned_time (assigned_time),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_id) REFERENCES users(id),
    FOREIGN KEY (assigned_by_id) REFERENCES users(id)
) COMMENT '客户分配记录表';
```

### 4. 课程管理模块

#### 4.1 课程分类表 (course_categories)

```sql
CREATE TABLE course_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '分类ID',
    category_name VARCHAR(100) NOT NULL COMMENT '分类名称',
    category_code VARCHAR(50) UNIQUE COMMENT '分类编码',
    parent_id BIGINT DEFAULT 0 COMMENT '父分类ID',
    category_level INT DEFAULT 1 COMMENT '分类层级',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    description TEXT COMMENT '分类描述',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    create_by BIGINT COMMENT '创建人',
    update_by BIGINT COMMENT '更新人',

    INDEX idx_category_code (category_code),
    INDEX idx_parent_id (parent_id),
    INDEX idx_status (status)
) COMMENT '课程分类表';
```

#### 4.2 课程表 (courses)

```sql
CREATE TABLE courses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '课程ID',
    course_name VARCHAR(200) NOT NULL COMMENT '课程名称',
    course_code VARCHAR(50) UNIQUE COMMENT '课程编码',
    category_id BIGINT NOT NULL COMMENT '课程分类ID',
    course_type TINYINT DEFAULT 1 COMMENT '课程类型: 1-线上, 2-线下, 3-混合',
    price DECIMAL(10,2) DEFAULT 0.00 COMMENT '课程价格',
    duration INT COMMENT '课程时长(小时)',
    max_students INT COMMENT '最大学员数',
    teacher_id BIGINT COMMENT '主讲老师ID',
    course_desc TEXT COMMENT '课程描述',
    course_outline TEXT COMMENT '课程大纲',
    prerequisites TEXT COMMENT '前置要求',
    learning_objectives TEXT COMMENT '学习目标',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-下架, 1-上架, 2-草稿',
    is_featured TINYINT DEFAULT 0 COMMENT '是否推荐: 0-否, 1-是',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    enroll_count INT DEFAULT 0 COMMENT '报名人数',
    rating DECIMAL(3,2) DEFAULT 0.00 COMMENT '评分',
    cover_image VARCHAR(500) COMMENT '封面图片',
    video_url VARCHAR(500) COMMENT '视频地址',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    create_by BIGINT COMMENT '创建人',
    update_by BIGINT COMMENT '更新人',

    INDEX idx_course_code (course_code),
    INDEX idx_category_id (category_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_status (status),
    INDEX idx_is_featured (is_featured),
    FOREIGN KEY (category_id) REFERENCES course_categories(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
) COMMENT '课程表';
```

#### 4.3 课程附件表 (course_attachments)

```sql
CREATE TABLE course_attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '附件ID',
    course_id BIGINT NOT NULL COMMENT '课程ID',
    attachment_name VARCHAR(200) NOT NULL COMMENT '附件名称',
    attachment_type VARCHAR(50) COMMENT '附件类型',
    file_size BIGINT COMMENT '文件大小(字节)',
    file_url VARCHAR(500) NOT NULL COMMENT '文件URL',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    upload_by BIGINT COMMENT '上传人',

    INDEX idx_course_id (course_id),
    INDEX idx_attachment_type (attachment_type),
    INDEX idx_status (status),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (upload_by) REFERENCES users(id)
) COMMENT '课程附件表';
```

### 5. 班级管理模块

#### 5.1 班级表 (classes)

```sql
CREATE TABLE classes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '班级ID',
    class_name VARCHAR(200) NOT NULL COMMENT '班级名称',
    class_code VARCHAR(50) UNIQUE COMMENT '班级编码',
    category_id BIGINT NOT NULL COMMENT '班级分类ID',
    teacher_id BIGINT COMMENT '班主任ID',
    max_students INT DEFAULT 50 COMMENT '最大学员数',
    current_students INT DEFAULT 0 COMMENT '当前学员数',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    class_status TINYINT DEFAULT 0 COMMENT '班级状态: 0-未开始, 1-进行中, 2-已结束',
    training_fee DECIMAL(10,2) DEFAULT 0.00 COMMENT '培训费用',
    classroom VARCHAR(100) COMMENT '教室',
    schedule TEXT COMMENT '课程安排',
    description TEXT COMMENT '班级描述',
    requirements TEXT COMMENT '入学要求',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    create_by BIGINT COMMENT '创建人',
    update_by BIGINT COMMENT '更新人',

    INDEX idx_class_code (class_code),
    INDEX idx_category_id (category_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_class_status (class_status),
    INDEX idx_start_date (start_date),
    FOREIGN KEY (category_id) REFERENCES course_categories(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
) COMMENT '班级表';
```

#### 5.2 班级学员表 (class_students)

```sql
CREATE TABLE class_students (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
    class_id BIGINT NOT NULL COMMENT '班级ID',
    student_id BIGINT NOT NULL COMMENT '学员ID',
    student_name VARCHAR(100) NOT NULL COMMENT '学员姓名',
    student_no VARCHAR(50) COMMENT '学号',
    company VARCHAR(200) COMMENT '公司',
    position VARCHAR(100) COMMENT '职位',
    phone VARCHAR(20) COMMENT '电话',
    email VARCHAR(100) COMMENT '邮箱',
    join_date DATE COMMENT '入学日期',
    graduation_date DATE COMMENT '毕业日期',
    attendance_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '出勤率',
    final_score DECIMAL(5,2) COMMENT '最终成绩',
    certificate_no VARCHAR(100) COMMENT '证书编号',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-退学, 1-在读, 2-毕业',
    enroll_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',

    UNIQUE KEY uk_class_student (class_id, student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_student_id (student_id),
    INDEX idx_student_no (student_no),
    INDEX idx_status (status),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id)
) COMMENT '班级学员表';
```

#### 5.3 班级课程表 (class_courses)

```sql
CREATE TABLE class_courses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
    class_id BIGINT NOT NULL COMMENT '班级ID',
    course_id BIGINT NOT NULL COMMENT '课程ID',
    teacher_id BIGINT COMMENT '授课老师ID',
    classroom VARCHAR(100) COMMENT '教室',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    schedule VARCHAR(200) COMMENT '上课时间',
    course_status TINYINT DEFAULT 0 COMMENT '课程状态: 0-未开始, 1-进行中, 2-已结束',
    sort_order INT DEFAULT 0 COMMENT '排序',

    UNIQUE KEY uk_class_course (class_id, course_id),
    INDEX idx_class_id (class_id),
    INDEX idx_course_id (course_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_course_status (course_status),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
) COMMENT '班级课程表';
```

#### 5.4 班级通知公告表 (class_announcements)

```sql
CREATE TABLE class_announcements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '公告ID',
    class_id BIGINT NOT NULL COMMENT '班级ID',
    title VARCHAR(200) NOT NULL COMMENT '公告标题',
    content TEXT NOT NULL COMMENT '公告内容',
    importance TINYINT DEFAULT 1 COMMENT '重要程度: 1-普通, 2-重要, 3-紧急',
    announcement_type VARCHAR(50) DEFAULT 'notice' COMMENT '公告类型',
    publish_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
    publisher_id BIGINT NOT NULL COMMENT '发布人ID',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-草稿, 1-已发布, 2-已撤回',
    read_count INT DEFAULT 0 COMMENT '阅读次数',
    attachments JSON COMMENT '附件信息',

    INDEX idx_class_id (class_id),
    INDEX idx_publisher_id (publisher_id),
    INDEX idx_publish_time (publish_time),
    INDEX idx_status (status),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (publisher_id) REFERENCES users(id)
) COMMENT '班级通知公告表';
```

### 6. 会议管理模块

#### 6.1 会议表 (meetings)

```sql
CREATE TABLE meetings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '会议ID',
    meeting_title VARCHAR(200) NOT NULL COMMENT '会议标题',
    meeting_type VARCHAR(50) NOT NULL COMMENT '会议类型',
    meeting_room VARCHAR(100) COMMENT '会议室',
    start_time TIMESTAMP NOT NULL COMMENT '开始时间',
    end_time TIMESTAMP NOT NULL COMMENT '结束时间',
    organizer_id BIGINT NOT NULL COMMENT '组织者ID',
    meeting_desc TEXT COMMENT '会议描述',
    meeting_agenda TEXT COMMENT '会议议程',
    meeting_status TINYINT DEFAULT 0 COMMENT '会议状态: 0-待审核, 1-已通过, 2-已拒绝, 3-进行中, 4-已结束',
    is_online TINYINT DEFAULT 0 COMMENT '是否线上会议: 0-否, 1-是',
    meeting_url VARCHAR(500) COMMENT '会议链接',
    meeting_password VARCHAR(50) COMMENT '会议密码',
    max_participants INT COMMENT '最大参会人数',
    is_recorded TINYINT DEFAULT 0 COMMENT '是否录制: 0-否, 1-是',
    record_url VARCHAR(500) COMMENT '录制文件地址',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    create_by BIGINT COMMENT '创建人',
    update_by BIGINT COMMENT '更新人',

    INDEX idx_organizer_id (organizer_id),
    INDEX idx_start_time (start_time),
    INDEX idx_meeting_status (meeting_status),
    INDEX idx_meeting_type (meeting_type),
    FOREIGN KEY (organizer_id) REFERENCES users(id)
) COMMENT '会议表';
```

#### 6.2 会议参与者表 (meeting_participants)

```sql
CREATE TABLE meeting_participants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
    meeting_id BIGINT NOT NULL COMMENT '会议ID',
    participant_id BIGINT NOT NULL COMMENT '参与者ID',
    participant_type TINYINT DEFAULT 1 COMMENT '参与类型: 1-必须参加, 2-可选参加, 3-旁听',
    attendance_status TINYINT DEFAULT 0 COMMENT '出席状态: 0-未确认, 1-已确认, 2-已拒绝, 3-已出席, 4-缺席',
    join_time TIMESTAMP COMMENT '加入时间',
    leave_time TIMESTAMP COMMENT '离开时间',
    remark TEXT COMMENT '备注',

    UNIQUE KEY uk_meeting_participant (meeting_id, participant_id),
    INDEX idx_meeting_id (meeting_id),
    INDEX idx_participant_id (participant_id),
    INDEX idx_attendance_status (attendance_status),
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES users(id)
) COMMENT '会议参与者表';
```

#### 6.3 会议记录表 (meeting_records)

```sql
CREATE TABLE meeting_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
    meeting_id BIGINT NOT NULL COMMENT '会议ID',
    record_title VARCHAR(200) NOT NULL COMMENT '记录标题',
    record_content TEXT NOT NULL COMMENT '会议记录内容',
    key_points TEXT COMMENT '关键要点',
    action_items TEXT COMMENT '行动项',
    decisions TEXT COMMENT '决议事项',
    next_steps TEXT COMMENT '后续步骤',
    recorder_id BIGINT NOT NULL COMMENT '记录人ID',
    record_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
    attachments JSON COMMENT '附件信息',

    INDEX idx_meeting_id (meeting_id),
    INDEX idx_recorder_id (recorder_id),
    INDEX idx_record_time (record_time),
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (recorder_id) REFERENCES users(id)
) COMMENT '会议记录表';
```

#### 6.4 会议审核表 (meeting_approvals)

```sql
CREATE TABLE meeting_approvals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '审核ID',
    meeting_id BIGINT NOT NULL COMMENT '会议ID',
    approver_id BIGINT NOT NULL COMMENT '审核人ID',
    approval_status TINYINT DEFAULT 0 COMMENT '审核状态: 0-待审核, 1-已通过, 2-已拒绝',
    approval_comment TEXT COMMENT '审核意见',
    approval_time TIMESTAMP COMMENT '审核时间',

    UNIQUE KEY uk_meeting_approver (meeting_id, approver_id),
    INDEX idx_meeting_id (meeting_id),
    INDEX idx_approver_id (approver_id),
    INDEX idx_approval_status (approval_status),
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id)
) COMMENT '会议审核表';
```

### 7. 财务管理模块

#### 7.1 财务科目表 (financial_subjects)

```sql
CREATE TABLE financial_subjects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '科目ID',
    subject_code VARCHAR(50) NOT NULL UNIQUE COMMENT '科目编码',
    subject_name VARCHAR(100) NOT NULL COMMENT '科目名称',
    parent_id BIGINT DEFAULT 0 COMMENT '父科目ID',
    subject_level INT DEFAULT 1 COMMENT '科目层级',
    subject_type TINYINT NOT NULL COMMENT '科目类型: 1-资产, 2-负债, 3-所有者权益, 4-收入, 5-费用',
    balance_direction TINYINT NOT NULL COMMENT '余额方向: 1-借方, 2-贷方',
    is_leaf TINYINT DEFAULT 1 COMMENT '是否叶子节点: 0-否, 1-是',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    sort_order INT DEFAULT 0 COMMENT '排序',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    create_by BIGINT COMMENT '创建人',
    update_by BIGINT COMMENT '更新人',

    INDEX idx_subject_code (subject_code),
    INDEX idx_parent_id (parent_id),
    INDEX idx_subject_type (subject_type),
    INDEX idx_status (status)
) COMMENT '财务科目表';
```

#### 7.2 财务凭证表 (financial_vouchers)

```sql
CREATE TABLE financial_vouchers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '凭证ID',
    voucher_no VARCHAR(50) NOT NULL UNIQUE COMMENT '凭证号',
    voucher_date DATE NOT NULL COMMENT '凭证日期',
    voucher_type VARCHAR(50) NOT NULL COMMENT '凭证类型',
    total_amount DECIMAL(15,2) NOT NULL COMMENT '凭证金额',
    summary VARCHAR(500) COMMENT '摘要',
    attachment_count INT DEFAULT 0 COMMENT '附件数量',
    voucher_status TINYINT DEFAULT 0 COMMENT '凭证状态: 0-草稿, 1-已审核, 2-已过账',
    maker_id BIGINT NOT NULL COMMENT '制单人ID',
    checker_id BIGINT COMMENT '审核人ID',
    poster_id BIGINT COMMENT '过账人ID',
    make_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '制单时间',
    check_time TIMESTAMP COMMENT '审核时间',
    post_time TIMESTAMP COMMENT '过账时间',

    INDEX idx_voucher_no (voucher_no),
    INDEX idx_voucher_date (voucher_date),
    INDEX idx_voucher_type (voucher_type),
    INDEX idx_voucher_status (voucher_status),
    INDEX idx_maker_id (maker_id),
    FOREIGN KEY (maker_id) REFERENCES users(id),
    FOREIGN KEY (checker_id) REFERENCES users(id),
    FOREIGN KEY (poster_id) REFERENCES users(id)
) COMMENT '财务凭证表';
```

#### 7.3 财务凭证明细表 (financial_voucher_details)

```sql
CREATE TABLE financial_voucher_details (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '明细ID',
    voucher_id BIGINT NOT NULL COMMENT '凭证ID',
    subject_id BIGINT NOT NULL COMMENT '科目ID',
    summary VARCHAR(500) COMMENT '摘要',
    debit_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT '借方金额',
    credit_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT '贷方金额',
    currency_code VARCHAR(10) DEFAULT 'CNY' COMMENT '币种',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000 COMMENT '汇率',
    sort_order INT DEFAULT 0 COMMENT '排序',

    INDEX idx_voucher_id (voucher_id),
    INDEX idx_subject_id (subject_id),
    FOREIGN KEY (voucher_id) REFERENCES financial_vouchers(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES financial_subjects(id)
) COMMENT '财务凭证明细表';
```

### 8. 报销管理模块

#### 8.1 报销申请表 (expense_applications)

```sql
CREATE TABLE expense_applications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '申请ID',
    application_no VARCHAR(50) NOT NULL UNIQUE COMMENT '申请单号',
    applicant_id BIGINT NOT NULL COMMENT '申请人ID',
    department_id BIGINT COMMENT '申请部门ID',
    expense_type VARCHAR(50) NOT NULL COMMENT '报销类型',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '报销总金额',
    application_reason TEXT COMMENT '申请原因',
    expense_period_start DATE COMMENT '费用期间开始',
    expense_period_end DATE COMMENT '费用期间结束',
    application_status TINYINT DEFAULT 0 COMMENT '申请状态: 0-草稿, 1-待审核, 2-审核中, 3-已通过, 4-已拒绝, 5-已支付',
    current_approver_id BIGINT COMMENT '当前审批人ID',
    payment_method VARCHAR(50) COMMENT '支付方式',
    bank_account VARCHAR(100) COMMENT '银行账户',
    payment_time TIMESTAMP COMMENT '支付时间',
    remark TEXT COMMENT '备注',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_application_no (application_no),
    INDEX idx_applicant_id (applicant_id),
    INDEX idx_department_id (department_id),
    INDEX idx_expense_type (expense_type),
    INDEX idx_application_status (application_status),
    INDEX idx_current_approver_id (current_approver_id),
    FOREIGN KEY (applicant_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (current_approver_id) REFERENCES users(id)
) COMMENT '报销申请表';
```

#### 8.2 报销明细表 (expense_items)

```sql
CREATE TABLE expense_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '明细ID',
    application_id BIGINT NOT NULL COMMENT '申请ID',
    item_name VARCHAR(200) NOT NULL COMMENT '费用项目',
    item_type VARCHAR(50) NOT NULL COMMENT '费用类型',
    expense_date DATE NOT NULL COMMENT '发生日期',
    amount DECIMAL(10,2) NOT NULL COMMENT '金额',
    description TEXT COMMENT '费用说明',
    receipt_no VARCHAR(100) COMMENT '发票号码',
    vendor VARCHAR(200) COMMENT '供应商',
    sort_order INT DEFAULT 0 COMMENT '排序',

    INDEX idx_application_id (application_id),
    INDEX idx_item_type (item_type),
    INDEX idx_expense_date (expense_date),
    FOREIGN KEY (application_id) REFERENCES expense_applications(id) ON DELETE CASCADE
) COMMENT '报销明细表';
```

#### 8.3 报销审批流程表 (expense_approval_flows)

```sql
CREATE TABLE expense_approval_flows (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '流程ID',
    application_id BIGINT NOT NULL COMMENT '申请ID',
    approver_id BIGINT NOT NULL COMMENT '审批人ID',
    approval_level INT NOT NULL COMMENT '审批层级',
    approval_status TINYINT DEFAULT 0 COMMENT '审批状态: 0-待审批, 1-已通过, 2-已拒绝, 3-已转交',
    approval_comment TEXT COMMENT '审批意见',
    approval_time TIMESTAMP COMMENT '审批时间',
    next_approver_id BIGINT COMMENT '下一审批人ID',

    INDEX idx_application_id (application_id),
    INDEX idx_approver_id (approver_id),
    INDEX idx_approval_level (approval_level),
    INDEX idx_approval_status (approval_status),
    FOREIGN KEY (application_id) REFERENCES expense_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id),
    FOREIGN KEY (next_approver_id) REFERENCES users(id)
) COMMENT '报销审批流程表';
```

#### 8.4 报销附件表 (expense_attachments)

```sql
CREATE TABLE expense_attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '附件ID',
    application_id BIGINT COMMENT '申请ID',
    item_id BIGINT COMMENT '明细ID',
    attachment_name VARCHAR(200) NOT NULL COMMENT '附件名称',
    attachment_type VARCHAR(50) COMMENT '附件类型',
    file_size BIGINT COMMENT '文件大小',
    file_url VARCHAR(500) NOT NULL COMMENT '文件URL',
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    upload_by BIGINT COMMENT '上传人',

    INDEX idx_application_id (application_id),
    INDEX idx_item_id (item_id),
    INDEX idx_upload_by (upload_by),
    FOREIGN KEY (application_id) REFERENCES expense_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES expense_items(id) ON DELETE CASCADE,
    FOREIGN KEY (upload_by) REFERENCES users(id)
) COMMENT '报销附件表';
```

### 9. 任务管理模块

#### 9.1 项目表 (projects)

```sql
CREATE TABLE projects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '项目ID',
    project_name VARCHAR(200) NOT NULL COMMENT '项目名称',
    project_code VARCHAR(50) UNIQUE COMMENT '项目编码',
    project_type VARCHAR(50) COMMENT '项目类型',
    project_desc TEXT COMMENT '项目描述',
    project_manager_id BIGINT COMMENT '项目经理ID',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    planned_budget DECIMAL(15,2) COMMENT '计划预算',
    actual_budget DECIMAL(15,2) COMMENT '实际预算',
    project_status TINYINT DEFAULT 0 COMMENT '项目状态: 0-未开始, 1-进行中, 2-已完成, 3-已暂停, 4-已取消',
    priority TINYINT DEFAULT 2 COMMENT '优先级: 1-高, 2-中, 3-低',
    progress DECIMAL(5,2) DEFAULT 0.00 COMMENT '完成进度',
    client_id BIGINT COMMENT '客户ID',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    create_by BIGINT COMMENT '创建人',
    update_by BIGINT COMMENT '更新人',

    INDEX idx_project_code (project_code),
    INDEX idx_project_manager_id (project_manager_id),
    INDEX idx_project_status (project_status),
    INDEX idx_client_id (client_id),
    FOREIGN KEY (project_manager_id) REFERENCES users(id),
    FOREIGN KEY (client_id) REFERENCES customers(id)
) COMMENT '项目表';
```

#### 9.2 任务表 (tasks)

```sql
CREATE TABLE tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '任务ID',
    task_name VARCHAR(200) NOT NULL COMMENT '任务名称',
    task_code VARCHAR(50) COMMENT '任务编码',
    project_id BIGINT COMMENT '所属项目ID',
    parent_task_id BIGINT COMMENT '父任务ID',
    task_type VARCHAR(50) NOT NULL COMMENT '任务类型',
    task_desc TEXT COMMENT '任务描述',
    assignee_id BIGINT COMMENT '负责人ID',
    reporter_id BIGINT COMMENT '报告人ID',
    start_date DATE COMMENT '开始日期',
    due_date DATE COMMENT '截止日期',
    estimated_hours DECIMAL(8,2) COMMENT '预估工时',
    actual_hours DECIMAL(8,2) COMMENT '实际工时',
    task_status TINYINT DEFAULT 0 COMMENT '任务状态: 0-未开始, 1-进行中, 2-已完成, 3-已暂停, 4-已取消',
    priority TINYINT DEFAULT 2 COMMENT '优先级: 1-高, 2-中, 3-低',
    progress DECIMAL(5,2) DEFAULT 0.00 COMMENT '完成进度',
    completion_time TIMESTAMP COMMENT '完成时间',
    target_count INT COMMENT '目标数量',
    actual_count INT DEFAULT 0 COMMENT '实际完成数量',
    follow_up_status VARCHAR(50) COMMENT '跟进状态',
    remark TEXT COMMENT '备注',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    create_by BIGINT COMMENT '创建人',
    update_by BIGINT COMMENT '更新人',

    INDEX idx_task_code (task_code),
    INDEX idx_project_id (project_id),
    INDEX idx_parent_task_id (parent_task_id),
    INDEX idx_assignee_id (assignee_id),
    INDEX idx_task_status (task_status),
    INDEX idx_task_type (task_type),
    INDEX idx_due_date (due_date),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id),
    FOREIGN KEY (assignee_id) REFERENCES users(id),
    FOREIGN KEY (reporter_id) REFERENCES users(id)
) COMMENT '任务表';
```

#### 9.3 任务日志表 (task_logs)

```sql
CREATE TABLE task_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    task_id BIGINT NOT NULL COMMENT '任务ID',
    log_type VARCHAR(50) NOT NULL COMMENT '日志类型',
    log_content TEXT NOT NULL COMMENT '日志内容',
    old_value TEXT COMMENT '原值',
    new_value TEXT COMMENT '新值',
    work_hours DECIMAL(8,2) COMMENT '工作时长',
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
    operator_id BIGINT NOT NULL COMMENT '操作人ID',

    INDEX idx_task_id (task_id),
    INDEX idx_log_type (log_type),
    INDEX idx_log_time (log_time),
    INDEX idx_operator_id (operator_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES users(id)
) COMMENT '任务日志表';
```

### 10. 系统配置模块

#### 10.1 系统配置表 (system_configs)

```sql
CREATE TABLE system_configs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
    config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    config_type VARCHAR(50) DEFAULT 'string' COMMENT '配置类型',
    config_group VARCHAR(50) COMMENT '配置分组',
    config_desc VARCHAR(500) COMMENT '配置描述',
    is_system TINYINT DEFAULT 0 COMMENT '是否系统配置: 0-否, 1-是',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    create_by BIGINT COMMENT '创建人',
    update_by BIGINT COMMENT '更新人',

    INDEX idx_config_key (config_key),
    INDEX idx_config_group (config_group),
    INDEX idx_status (status)
) COMMENT '系统配置表';
```

#### 10.2 数据字典表 (dictionaries)

```sql
CREATE TABLE dictionaries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '字典ID',
    dict_type VARCHAR(100) NOT NULL COMMENT '字典类型',
    dict_code VARCHAR(100) NOT NULL COMMENT '字典编码',
    dict_label VARCHAR(200) NOT NULL COMMENT '字典标签',
    dict_value VARCHAR(500) COMMENT '字典值',
    dict_sort INT DEFAULT 0 COMMENT '字典排序',
    css_class VARCHAR(100) COMMENT 'CSS类名',
    list_class VARCHAR(100) COMMENT '表格回显样式',
    is_default TINYINT DEFAULT 0 COMMENT '是否默认: 0-否, 1-是',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    remark TEXT COMMENT '备注',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    create_by BIGINT COMMENT '创建人',
    update_by BIGINT COMMENT '更新人',

    UNIQUE KEY uk_dict_type_code (dict_type, dict_code),
    INDEX idx_dict_type (dict_type),
    INDEX idx_status (status)
) COMMENT '数据字典表';
```

#### 10.3 操作日志表 (operation_logs)

```sql
CREATE TABLE operation_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    module VARCHAR(50) COMMENT '模块名称',
    operation_type VARCHAR(50) COMMENT '操作类型',
    operation_desc VARCHAR(500) COMMENT '操作描述',
    request_method VARCHAR(10) COMMENT '请求方法',
    request_url VARCHAR(500) COMMENT '请求URL',
    request_params TEXT COMMENT '请求参数',
    response_data TEXT COMMENT '响应数据',
    user_id BIGINT COMMENT '操作用户ID',
    user_name VARCHAR(100) COMMENT '操作用户名',
    user_ip VARCHAR(50) COMMENT '用户IP',
    user_agent TEXT COMMENT '用户代理',
    operation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    execution_time BIGINT COMMENT '执行时长(毫秒)',
    operation_status TINYINT DEFAULT 1 COMMENT '操作状态: 0-失败, 1-成功',
    error_message TEXT COMMENT '错误信息',

    INDEX idx_module (module),
    INDEX idx_operation_type (operation_type),
    INDEX idx_user_id (user_id),
    INDEX idx_operation_time (operation_time),
    INDEX idx_operation_status (operation_status)
) COMMENT '操作日志表';
```

#### 10.4 文件管理表 (file_management)

```sql
CREATE TABLE file_management (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '文件ID',
    file_name VARCHAR(200) NOT NULL COMMENT '文件名称',
    original_name VARCHAR(200) NOT NULL COMMENT '原始文件名',
    file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
    file_url VARCHAR(500) COMMENT '文件访问URL',
    file_size BIGINT NOT NULL COMMENT '文件大小(字节)',
    file_type VARCHAR(50) COMMENT '文件类型',
    mime_type VARCHAR(100) COMMENT 'MIME类型',
    file_md5 VARCHAR(32) COMMENT '文件MD5',
    storage_type VARCHAR(20) DEFAULT 'local' COMMENT '存储类型: local-本地, oss-对象存储',
    bucket_name VARCHAR(100) COMMENT '存储桶名称',
    business_type VARCHAR(50) COMMENT '业务类型',
    business_id BIGINT COMMENT '业务ID',
    upload_user_id BIGINT COMMENT '上传用户ID',
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-删除, 1-正常',

    INDEX idx_file_name (file_name),
    INDEX idx_file_md5 (file_md5),
    INDEX idx_business (business_type, business_id),
    INDEX idx_upload_user_id (upload_user_id),
    INDEX idx_upload_time (upload_time),
    INDEX idx_status (status)
) COMMENT '文件管理表';
```

## 索引优化建议

### 1. 复合索引

```sql
-- 用户查询优化
CREATE INDEX idx_users_status_dept ON users(status, department_id);
CREATE INDEX idx_users_manager_status ON users(manager_id, status);

-- 客户查询优化
CREATE INDEX idx_customers_employee_status ON customers(employee_id, follow_status);
CREATE INDEX idx_customers_assigned_time ON customers(assigned_by, assigned_time);

-- 任务查询优化
CREATE INDEX idx_tasks_assignee_status ON tasks(assignee_id, task_status);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, task_status);

-- 会议查询优化
CREATE INDEX idx_meetings_organizer_time ON meetings(organizer_id, start_time);
CREATE INDEX idx_meetings_status_time ON meetings(meeting_status, start_time);

-- 报销查询优化
CREATE INDEX idx_expense_applicant_status ON expense_applications(applicant_id, application_status);
CREATE INDEX idx_expense_approver_status ON expense_approval_flows(approver_id, approval_status);
```

### 2. 分区表建议

```sql
-- 操作日志按月分区
ALTER TABLE operation_logs PARTITION BY RANGE (YEAR(operation_time)*100 + MONTH(operation_time)) (
    PARTITION p202401 VALUES LESS THAN (202402),
    PARTITION p202402 VALUES LESS THAN (202403),
    -- ... 继续添加分区
    PARTITION p_max VALUES LESS THAN MAXVALUE
);

-- 任务日志按季度分区
ALTER TABLE task_logs PARTITION BY RANGE (YEAR(log_time)*100 + QUARTER(log_time)) (
    PARTITION p2024q1 VALUES LESS THAN (202402),
    PARTITION p2024q2 VALUES LESS THAN (202403),
    -- ... 继续添加分区
    PARTITION p_max VALUES LESS THAN MAXVALUE
);
```

## 数据初始化脚本

### 1. 基础角色数据

```sql
INSERT INTO roles (role_code, role_name, role_desc, status) VALUES
('super_admin', '超级管理员', '系统超级管理员，拥有所有权限', 1),
('admin', '管理员', '系统管理员，拥有大部分管理权限', 1),
('manager', '经理', '部门经理，拥有部门管理权限', 1),
('employee', '员工', '普通员工，拥有基础操作权限', 1),
('teacher', '教师', '课程教师，拥有教学相关权限', 1),
('student', '学员', '培训学员，拥有学习相关权限', 1);
```

### 2. 基础权限数据

```sql
INSERT INTO permissions (permission_code, permission_name, permission_type, status) VALUES
('system:user:view', '查看用户', 2, 1),
('system:user:add', '添加用户', 2, 1),
('system:user:edit', '编辑用户', 2, 1),
('system:user:delete', '删除用户', 2, 1),
('system:role:view', '查看角色', 2, 1),
('system:role:add', '添加角色', 2, 1),
('system:role:edit', '编辑角色', 2, 1),
('system:role:delete', '删除角色', 2, 1),
('customer:view', '查看客户', 2, 1),
('customer:add', '添加客户', 2, 1),
('customer:edit', '编辑客户', 2, 1),
('customer:delete', '删除客户', 2, 1),
('customer:assign', '分配客户', 2, 1),
('course:view', '查看课程', 2, 1),
('course:add', '添加课程', 2, 1),
('course:edit', '编辑课程', 2, 1),
('course:delete', '删除课程', 2, 1),
('class:view', '查看班级', 2, 1),
('class:add', '添加班级', 2, 1),
('class:edit', '编辑班级', 2, 1),
('class:delete', '删除班级', 2, 1),
('meeting:view', '查看会议', 2, 1),
('meeting:add', '添加会议', 2, 1),
('meeting:edit', '编辑会议', 2, 1),
('meeting:delete', '删除会议', 2, 1),
('expense:view', '查看报销', 2, 1),
('expense:add', '添加报销', 2, 1),
('expense:edit', '编辑报销', 2, 1),
('expense:approve', '审批报销', 2, 1);
```

### 3. 基础部门数据

```sql
INSERT INTO departments (dept_name, dept_code, parent_id, dept_level, status) VALUES
('总公司', 'ROOT', 0, 1, 1),
('技术部', 'TECH', 1, 2, 1),
('市场部', 'MARKET', 1, 2, 1),
('销售部', 'SALES', 1, 2, 1),
('人力资源部', 'HR', 1, 2, 1),
('财务部', 'FINANCE', 1, 2, 1),
('行政部', 'ADMIN', 1, 2, 1);
```

### 4. 基础数据字典

```sql
INSERT INTO dictionaries (dict_type, dict_code, dict_label, dict_value, dict_sort, status) VALUES
('user_gender', '0', '未知', '0', 1, 1),
('user_gender', '1', '男', '1', 2, 1),
('user_gender', '2', '女', '2', 3, 1),
('user_status', '0', '禁用', '0', 1, 1),
('user_status', '1', '启用', '1', 2, 1),
('follow_status', 'consult', '咨询', 'consult', 1, 1),
('follow_status', 'wechat_added', '已加微信', 'wechat_added', 2, 1),
('follow_status', 'registered', '已报名', 'registered', 3, 1),
('follow_status', 'arrived', '已实到', 'arrived', 4, 1),
('follow_status', 'new_develop', '新开发', 'new_develop', 5, 1),
('follow_status', 'early_25', '早25客户', 'early_25', 6, 1),
('follow_status', 'effective_visit', '有效回访', 'effective_visit', 7, 1),
('follow_status', 'not_arrived', '未实到', 'not_arrived', 8, 1),
('follow_status', 'rejected', '未通过', 'rejected', 9, 1),
('follow_status', 'vip', '大客户', 'vip', 10, 1);
```

## 性能优化建议

### 1. 查询优化

- 使用合适的索引策略
- 避免全表扫描
- 合理使用分页查询
- 优化复杂查询语句

### 2. 存储优化

- 合理设置字段类型和长度
- 使用适当的存储引擎
- 定期清理历史数据
- 实施数据归档策略

### 3. 缓存策略

- 使用Redis缓存热点数据
- 实施查询结果缓存
- 配置合理的缓存过期时间
- 实现缓存更新机制

### 4. 监控告警

- 监控数据库性能指标
- 设置慢查询告警
- 监控存储空间使用
- 实施备份恢复策略

## 总结

本数据库设计文档涵盖了React SoybeanAdmin系统的所有核心功能模块，包括：

1. **用户权限管理**：完整的RBAC权限控制体系
2. **组织架构管理**：部门、员工、管理关系
3. **客户关系管理**：客户信息、跟进记录、分配管理
4. **教育培训管理**：课程、班级、学员管理
5. **会议管理**：会议安排、参与者、记录管理
6. **财务管理**：科目、凭证、明细管理
7. **报销管理**：申请、审批、流程管理
8. **任务项目管理**：项目、任务、日志管理
9. **系统配置**：配置、字典、日志、文件管理

设计遵循了数据库规范化原则，考虑了性能优化、扩展性和数据完整性，为系统的稳定运行提供了坚实的数据基础。
