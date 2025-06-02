const fs = require('node:fs');

const XLSX = require('xlsx');

// 读取Excel文件
const workbook = XLSX.readFile('./class_data.xls');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// 将工作表转换为JSON
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('Excel数据：');
console.log(JSON.stringify(data, null, 2));

// 生成班级数据
const classData = {
  categoryId: 2,
  // 管理课程
  categoryName: '管理课程',
  createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
  description: '司库管理体系建设专业培训课程',
  endDate: '2024-06-30',
  id: 4,
  name: '司库管理体系建设：从现金管理到产业赋能',
  startDate: '2024-06-01',
  status: 1,
  // 进行中
  studentCount: data.length,
  students: data.map((row, index) => ({
    attendanceRate: 100,
    company: row['单位名称'] || row['单位'] || row['公司'] || row.Company || '未知单位',
    email: row['邮箱'] || row.Email || '',
    id: index + 1,
    joinDate: '2024-06-01',
    name: row['姓名'] || row['学员姓名'] || row.Name || `学员${index + 1}`,
    phone: String(row['电话'] || row['手机'] || row.Phone || ''),
    position: row['职务'] || row['职位'] || row.Position || '未知职位',
    status: 1
  })),
  teacher: '专业讲师'
};

console.log('\n生成的班级数据：');
console.log(JSON.stringify(classData, null, 2));

// 读取现有的班级列表
let classList = [];
try {
  const existingData = fs.readFileSync('./class_list.json', 'utf8');
  classList = JSON.parse(existingData);
} catch (error) {
  console.log('没有找到现有的班级列表文件，将创建新文件');
}

// 检查是否已存在相同名称的班级
const existingIndex = classList.findIndex(c => c.name === classData.name);
if (existingIndex >= 0) {
  classList[existingIndex] = classData;
  console.log('更新了现有班级数据');
} else {
  classList.push(classData);
  console.log('添加了新班级数据');
}

// 保存到文件
fs.writeFileSync('./class_list.json', JSON.stringify(classList, null, 2));
console.log('班级数据已保存到 class_list.json');

// 生成用于前端的数据格式
const frontendData = classList.map(classItem => ({
  categoryId: classItem.categoryId,
  categoryName: classItem.categoryName,
  createdAt: classItem.createdAt,
  description: classItem.description,
  endDate: classItem.endDate,
  id: classItem.id,
  name: classItem.name,
  startDate: classItem.startDate,
  status: classItem.status,
  studentCount: classItem.studentCount,
  teacher: classItem.teacher
}));

fs.writeFileSync('./frontend_class_data.json', JSON.stringify(frontendData, null, 2));
console.log('前端班级数据已保存到 frontend_class_data.json');
