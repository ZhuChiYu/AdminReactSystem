-- 清空班级学员数据
DELETE FROM class_students;

-- 重置班级的学员数量
UPDATE classes SET student_count = 0;

-- 重置自增ID
ALTER SEQUENCE class_students_id_seq RESTART WITH 1;
