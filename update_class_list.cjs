const fs = require('node:fs');

// 读取生成的前端班级数据
const frontendData = JSON.parse(fs.readFileSync('./frontend_class_data.json', 'utf8'));

// 读取现有的模拟数据（如果存在）
let existingData = [];
try {
  // 这里模拟从localStorage读取的数据结构
  existingData = [
    {
      categoryId: 1,
      categoryName: '技术培训',
      createdAt: '2024-02-15 14:30:00',
      description: '2024年春季常规课程',
      endDate: '2024-06-30',
      id: 1,
      name: '2024春季班',
      startDate: '2024-03-01',
      status: 1,
      studentCount: 30,
      teacher: '张老师'
    },
    {
      categoryId: 2,
      categoryName: '管理课程',
      createdAt: '2024-03-15 10:20:00',
      description: '2024年夏季管理课程',
      endDate: '2024-08-31',
      id: 2,
      name: '2024夏季班',
      startDate: '2024-07-01',
      status: 0,
      studentCount: 25,
      teacher: '李老师'
    },
    {
      categoryId: 3,
      categoryName: '营销课程',
      createdAt: '2023-08-10 09:15:00',
      description: '2023年秋季营销培训',
      endDate: '2023-12-31',
      id: 3,
      name: '2023秋季班',
      startDate: '2023-09-01',
      status: 2,
      studentCount: 28,
      teacher: '王老师'
    }
  ];
} catch (error) {
  console.log('使用默认数据');
}

// 合并数据 - 检查是否已存在相同名称的班级
frontendData.forEach(newClass => {
  const existingIndex = existingData.findIndex(c => c.name === newClass.name);
  if (existingIndex >= 0) {
    existingData[existingIndex] = newClass;
    console.log(`更新了班级: ${newClass.name}`);
  } else {
    existingData.push(newClass);
    console.log(`添加了新班级: ${newClass.name}`);
  }
});

// 保存合并后的数据
fs.writeFileSync('./updated_class_list.json', JSON.stringify(existingData, null, 2));

console.log('\n最终的班级列表数据：');
console.log(JSON.stringify(existingData, null, 2));

console.log('\n数据已保存到 updated_class_list.json');
console.log('请将此数据复制到班级管理页面的localStorage中');

// 生成可以直接在浏览器控制台执行的代码
const browserCode = `localStorage.setItem('classList', '${JSON.stringify(existingData).replace(/'/g, "\\'")}');`;
fs.writeFileSync('./browser_update_code.txt', browserCode);
console.log('浏览器更新代码已保存到 browser_update_code.txt');
