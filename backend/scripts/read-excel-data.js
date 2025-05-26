const XLSX = require('xlsx');
const path = require('path');

// Excel文件路径
const customerExcelPath = '/Users/zhuchiyu/Library/Containers/com.tencent.xinWeChat/Data/Library/Application Support/com.tencent.xinWeChat/2.0b4.0.9/4db5b98d5a1913e089d853e4285cc840/Message/MessageTemp/578c4368f87cdaade6e0491319c5bab5/File/客户列表.xlsx';
const employeeExcelPath = '/Users/zhuchiyu/Library/Containers/com.tencent.xinWeChat/Data/Library/Application Support/com.tencent.xinWeChat/2.0b4.0.9/4db5b98d5a1913e089d853e4285cc840/Message/MessageTemp/578c4368f87cdaade6e0491319c5bab5/File/员工列表.xlsx';

console.log('开始读取Excel文件...\n');

// 读取客户列表
try {
  const customerWorkbook = XLSX.readFile(customerExcelPath);
  const customerSheetName = customerWorkbook.SheetNames[0];
  const customerWorksheet = customerWorkbook.Sheets[customerSheetName];
  const customerData = XLSX.utils.sheet_to_json(customerWorksheet);

  console.log('=== 客户列表数据 ===');
  console.log('总数:', customerData.length);
  console.log('列名:', Object.keys(customerData[0] || {}));
  console.log('前3条数据:');
  console.log(JSON.stringify(customerData.slice(0, 3), null, 2));
  console.log('\n');
} catch (error) {
  console.error('读取客户列表失败:', error.message);
}

// 读取员工列表
try {
  const employeeWorkbook = XLSX.readFile(employeeExcelPath);
  const employeeSheetName = employeeWorkbook.SheetNames[0];
  const employeeWorksheet = employeeWorkbook.Sheets[employeeSheetName];
  const employeeData = XLSX.utils.sheet_to_json(employeeWorksheet);

  console.log('=== 员工列表数据 ===');
  console.log('总数:', employeeData.length);
  console.log('列名:', Object.keys(employeeData[0] || {}));
  console.log('前3条数据:');
  console.log(JSON.stringify(employeeData.slice(0, 3), null, 2));
  console.log('\n');
} catch (error) {
  console.error('读取员工列表失败:', error.message);
}
