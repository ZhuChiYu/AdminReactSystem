const fs = require('node:fs');
const path = require('node:path');

const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');

// Excel文件路径
const customerExcelPath =
  '/Users/zhuchiyu/Library/Containers/com.tencent.xinWeChat/Data/Library/Application Support/com.tencent.xinWeChat/2.0b4.0.9/4db5b98d5a1913e089d853e4285cc840/Message/MessageTemp/578c4368f87cdaade6e0491319c5bab5/File/客户列表.xlsx';
const employeeExcelPath =
  '/Users/zhuchiyu/Library/Containers/com.tencent.xinWeChat/Data/Library/Application Support/com.tencent.xinWeChat/2.0b4.0.9/4db5b98d5a1913e089d853e4285cc840/Message/MessageTemp/578c4368f87cdaade6e0491319c5bab5/File/员工列表.xlsx';

// 生成用户名的函数
function generateUsername(name, index) {
  // 使用姓名的拼音首字母 + 数字
  const pinyinMap = {
    何: 'he',
    刘: 'liu',
    吴: 'wu',
    周: 'zhou',
    孙: 'sun',
    建: 'jian',
    张: 'zhang',
    徐: 'xu',
    朱: 'zhu',
    李: 'li',
    杨: 'yang',
    林: 'lin',
    王: 'wang',
    珍: 'zhen',
    琴: 'qin',
    罗: 'luo',
    胡: 'hu',
    袁: 'yuan',
    赵: 'zhao',
    郭: 'guo',
    陈: 'chen',
    雯: 'wen',
    静: 'jing',
    马: 'ma',
    黄: 'huang',
    龙: 'long'
  };

  let username = '';
  for (const char of name) {
    if (pinyinMap[char]) {
      username += pinyinMap[char];
    } else {
      username += char.toLowerCase();
    }
  }

  return username + String(index).padStart(2, '0');
}

// 生成默认密码
function generatePassword() {
  return '123456'; // 统一默认密码
}

// 跟进状态映射
const followStatusMap = {
  VIP: 'vip',
  咨询: 'consult',
  已到访: 'arrived',
  已加微信: 'wechat_added',
  已报名: 'registered',
  已拒绝: 'rejected',
  新开发: 'new_develop',
  '早期25%': 'early_25',
  有效到访: 'effective_visit',
  未到访: 'not_arrived'
};

// 部门映射
const departmentMap = {
  hr: 'hr',
  marketing: 'marketing',
  sales: 'sales',
  普通用户: 'employee',
  管理员: 'admin'
};

// 角色映射
const roleMap = {
  人力专员: 'hr_specialist',
  市场经理: 'marketing_manager',
  普通用户: 'consultant',
  管理员: 'admin',
  销售经理: 'sales_manager'
};

async function processData() {

  // 读取客户数据
  let customers = [];
  try {
    const customerWorkbook = XLSX.readFile(customerExcelPath);
    const customerWorksheet = customerWorkbook.Sheets[customerWorkbook.SheetNames[0]];
    const customerData = XLSX.utils.sheet_to_json(customerWorksheet);

    customers = customerData.map((row, index) => {
      const followStatus = followStatusMap[row.__EMPTY] || 'consult';
      return {
        address: '地址信息暂无',
        // 默认级别：潜在客户
        assignedTo: null,
        company: row['单位'] || '未知公司',
        createTime: new Date().toISOString(),
        // 生成随机座机号
        email: `customer${index + 1}@${(row['单位'] || 'example').toLowerCase().replace(/\s+/g, '')}.com`,
        followNotes: row['跟进状态'] || '', // 默认来源：展会
        followStatus,
        id: index + 1,
        industry: 'education', // 默认行业：教育
        level: 'potential',
        // 生成随机手机号
        mobile: `159${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
        name: row['姓名'] || `客户${index + 1}`,
        phone: `138${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
        position: row['职务'] || '员工',
        source: 'exhibition',
        updateTime: new Date().toISOString()
      };
    });

  } catch (error) {
  }

  // 读取员工数据
  const employees = [];
  const userCredentials = [];
  try {
    const employeeWorkbook = XLSX.readFile(employeeExcelPath);
    const employeeWorksheet = employeeWorkbook.Sheets[employeeWorkbook.SheetNames[0]];
    const employeeData = XLSX.utils.sheet_to_json(employeeWorksheet);

    for (let i = 0; i < employeeData.length; i++) {
      const row = employeeData[i];
      const username = generateUsername(row['姓名'] || `员工${i + 1}`, i + 1);
      const password = generatePassword();
      const hashedPassword = await bcrypt.hash(password, 10);

      const roleType = row['序号'] === '管理员' ? 'admin' : 'consultant';
      const departmentCode = row['序号'] === '管理员' ? 'admin' : 'sales';

      const employee = {
        address: row['家庭住址'] || '地址信息暂无',
        avatar: `https://cdn.jsdelivr.net/gh/zyronon/typing-word@v2.0.2/docs/images/avatar_${(i % 7) + 1}.webp`,
        bankCard: String(row['银行卡号'] || ''),
        departmentCode,
        email: row['邮箱'] || `${username}@company.com`,
        gender: row['性别'] === '女' ? 2 : 1,
        id: i + 1,
        idCard: row['身份证号'] || null,
        nickName: row['姓名'] || `员工${i + 1}`,
        password: hashedPassword,
        phone: String(row['手机号'] || `138${String(Math.floor(Math.random() * 90000000) + 10000000)}`),
        position: row['职务'] || (roleType === 'admin' ? '管理员' : '员工'),
        roleCode: roleType,
        status: 1,
        timId: String(row['TIM号'] || ''),
        userName: username,
        wechatId: row['工作微信号'] || null
      };

      employees.push(employee);

      // 保存用户名密码信息
      userCredentials.push({
        email: employee.email,
        name: row['姓名'] || `员工${i + 1}`,
        password,
        phone: employee.phone,
        role: roleType === 'admin' ? '管理员' : '员工',
        username
      });
    }

  } catch (error) {
    console.error('❌ 处理员工数据失败:', error.message);
  }

  // 生成种子数据文件
  const seedData = {
    customers,
    employees,
    userCredentials
  };

  // 保存到JSON文件
  fs.writeFileSync(path.join(__dirname, '../data/excel-import-data.json'), JSON.stringify(seedData, null, 2), 'utf8');

  // 生成用户凭据文档
  let credentialsDoc = '# 员工登录信息\n\n';
  credentialsDoc += '| 姓名 | 用户名 | 密码 | 角色 | 邮箱 | 手机号 |\n';
  credentialsDoc += '|------|--------|------|------|------|--------|\n';

  userCredentials.forEach(cred => {
    credentialsDoc += `| ${cred.name} | ${cred.username} | ${cred.password} | ${cred.role} | ${cred.email} | ${cred.phone} |\n`;
  });

  fs.writeFileSync(path.join(__dirname, '../data/员工登录信息.md'), credentialsDoc, 'utf8');
  console.table(userCredentials);
}

// 确保data目录存在
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

processData().catch(console.error);
