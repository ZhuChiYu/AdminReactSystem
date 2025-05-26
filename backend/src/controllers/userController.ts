import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import {
  createSuccessResponse,
  createErrorResponse,
  ValidationError,
  NotFoundError,
  ErrorCode
} from '@/utils/errors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const prismaClient = new PrismaClient();

// 配置multer用于文件上传
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持Excel文件格式(.xlsx, .xls)'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

class UserController {
  /**
   * 获取员工列表
   */
  async getEmployees(req: Request, res: Response) {
    const {
      current = 1,
      size = 10,
      userName,
      nickName,
      department,
      status
    } = req.query;

    const page = Number(current);
    const pageSize = Number(size);
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: any = {
      // 包含所有角色，不排除任何角色
      userRoles: {
        some: {
          role: {
            roleCode: {
              in: ['super_admin', 'admin', 'employee', 'consultant', 'sales_manager', 'hr_specialist']
            }
          }
        }
      }
    };

    if (userName) {
      where.userName = {
        contains: userName as string,
        mode: 'insensitive'
      };
    }

    if (nickName) {
      where.nickName = {
        contains: nickName as string,
        mode: 'insensitive'
      };
    }

    if (status) {
      where.status = status as string;
    }

    try {
      // 获取总数
      const total = await prisma.user.count({ where });

      // 获取员工列表
      const employees = await prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          userRoles: {
            include: {
              role: true
            }
          },
          department: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // 格式化返回数据
      const records = employees.map(employee => ({
        id: employee.id,
        userName: employee.userName,
        nickName: employee.nickName,
        email: employee.email,
        phone: employee.phone,
        gender: employee.gender,
        status: employee.status,
        position: employee.position,
        address: employee.address,
        bankCard: employee.bankCard,
        idCard: employee.idCard,
        wechat: employee.wechat,
        tim: employee.tim,
        contractYears: employee.contractYears,
        contractStartDate: employee.contractStartDate,
        contractEndDate: employee.contractEndDate,
        department: employee.department ? {
          id: employee.department.id,
          name: employee.department.name
        } : null,
        roles: employee.userRoles.map(ur => ur.role.roleCode),
        roleNames: employee.userRoles.map(ur => ur.role.roleName),
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt
      }));

      const pages = Math.ceil(total / pageSize);

      res.json(createSuccessResponse({
        records,
        total,
        current: page,
        size: pageSize,
        pages
      }, '查询成功', req.path));

    } catch (error) {
      logger.error('获取员工列表失败:', error);
      res.status(500).json(createErrorResponse(500, '获取员工列表失败', null, req.path));
    }
  }

  // 导入员工数据
  async importEmployees(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          code: 400,
          message: '请上传Excel文件',
          data: null
        });
      }

      const filePath = req.file.path;

      try {
        // 读取Excel文件
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // 将工作表转换为JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          return res.status(400).json({
            code: 400,
            message: 'Excel文件格式错误，至少需要包含表头和一行数据',
            data: null
          });
        }

        // 解析表头
        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1);

        // 定义字段映射
        const fieldMapping: { [key: string]: string } = {
          '用户名': 'userName',
          '姓名': 'nickName',
          '邮箱': 'email',
          '手机号': 'phone',
          '性别': 'gender',
          '职位': 'position',
          '家庭住址': 'address',
          '银行卡号': 'bankCard',
          '身份证号': 'idCard',
          '工作微信号': 'wechat',
          'TIM号': 'tim',
          '合同年限': 'contractYears',
          '合同开始时间': 'contractStartDate',
          '合同结束时间': 'contractEndDate',
          '状态': 'status'
        };

        // 验证必需字段
        const requiredFields = ['用户名', '姓名', '邮箱'];
        const missingFields = requiredFields.filter(field => !headers.includes(field));

        if (missingFields.length > 0) {
          return res.status(400).json({
            code: 400,
            message: `Excel文件缺少必需字段: ${missingFields.join(', ')}`,
            data: null
          });
        }

        const successList: any[] = [];
        const errorList: any[] = [];

        // 处理每一行数据
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i] as any[];
          const rowIndex = i + 2; // Excel行号（从2开始，因为第1行是表头）
          let userData: any = {};

          try {
            // 映射字段
            headers.forEach((header, index) => {
              const fieldName = fieldMapping[header];
              if (fieldName && row[index] !== undefined && row[index] !== '') {
                userData[fieldName] = row[index];
              }
            });

            // 验证必需字段
            if (!userData.userName || !userData.nickName || !userData.email) {
              errorList.push({
                row: rowIndex,
                data: userData,
                error: '缺少必需字段：用户名、姓名或邮箱'
              });
              continue;
            }

            // 数据类型转换和验证
            if (userData.gender) {
              userData.gender = userData.gender === '男' ? 'male' :
                               userData.gender === '女' ? 'female' : userData.gender;
            }

            if (userData.contractYears) {
              userData.contractYears = parseInt(userData.contractYears);
            }

            if (userData.contractStartDate) {
              userData.contractStartDate = new Date(userData.contractStartDate);
            }

            if (userData.contractEndDate) {
              userData.contractEndDate = new Date(userData.contractEndDate);
            }

            if (userData.status) {
              userData.status = userData.status === '启用' ? 'active' :
                               userData.status === '禁用' ? 'inactive' : userData.status;
            } else {
              userData.status = 'active'; // 默认启用
            }

            // 检查用户名是否已存在
            const existingUser = await prisma.user.findUnique({
              where: { userName: userData.userName }
            });

            if (existingUser) {
              errorList.push({
                row: rowIndex,
                data: userData,
                error: `用户名 ${userData.userName} 已存在`
              });
              continue;
            }

            // 检查邮箱是否已存在
            const existingEmail = await prisma.user.findUnique({
              where: { email: userData.email }
            });

            if (existingEmail) {
              errorList.push({
                row: rowIndex,
                data: userData,
                error: `邮箱 ${userData.email} 已存在`
              });
              continue;
            }

            // 生成默认密码
            const defaultPassword = '123456';
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            // 创建用户
            const newUser = await prisma.user.create({
              data: {
                ...userData,
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });

            // 分配默认角色（员工角色）
            const employeeRole = await prisma.role.findUnique({
              where: { code: 'employee' }
            });

            if (employeeRole) {
              await prisma.userRole.create({
                data: {
                  userId: newUser.id,
                  roleCode: employeeRole.code
                }
              });
            }

            successList.push({
              row: rowIndex,
              data: {
                userName: newUser.userName,
                nickName: newUser.nickName,
                email: newUser.email
              }
            });

          } catch (error) {
            errorList.push({
              row: rowIndex,
              data: userData,
              error: error instanceof Error ? error.message : '未知错误'
            });
          }
        }

        // 删除临时文件
        fs.unlinkSync(filePath);

        res.json({
          code: 200,
          message: '导入完成',
          data: {
            total: dataRows.length,
            success: successList.length,
            failed: errorList.length,
            successList,
            errorList
          }
        });

      } catch (error) {
        // 删除临时文件
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        throw error;
      }

    } catch (error) {
      console.error('导入员工数据失败:', error);
      res.status(500).json({
        code: 500,
        message: error instanceof Error ? error.message : '导入失败',
        data: null
      });
    }
  }

  // 下载导入模板
  async downloadTemplate(req: Request, res: Response) {
    try {
      // 创建模板数据
      const templateData = [
        ['用户名', '姓名', '邮箱', '手机号', '性别', '职位', '家庭住址', '银行卡号', '身份证号', '工作微信号', 'TIM号', '合同年限', '合同开始时间', '合同结束时间', '状态'],
        ['zhangsan', '张三', 'zhangsan@example.com', '13800138000', '男', '前端开发工程师', '北京市朝阳区', '6222000000000000', '110101199001011234', 'zhangsan_work', 'zhangsan_tim', '3', '2024-01-01', '2027-01-01', '启用'],
        ['lisi', '李四', 'lisi@example.com', '13800138001', '女', '后端开发工程师', '上海市浦东新区', '6222000000000001', '110101199002021234', 'lisi_work', 'lisi_tim', '5', '2024-01-01', '2029-01-01', '启用']
      ];

      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(templateData);

      // 设置列宽
      worksheet['!cols'] = [
        { wch: 15 }, // 用户名
        { wch: 10 }, // 姓名
        { wch: 25 }, // 邮箱
        { wch: 15 }, // 手机号
        { wch: 8 },  // 性别
        { wch: 20 }, // 职位
        { wch: 30 }, // 家庭住址
        { wch: 20 }, // 银行卡号
        { wch: 20 }, // 身份证号
        { wch: 15 }, // 工作微信号
        { wch: 15 }, // TIM号
        { wch: 12 }, // 合同年限
        { wch: 15 }, // 合同开始时间
        { wch: 15 }, // 合同结束时间
        { wch: 8 }   // 状态
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, '员工信息');

      // 生成Excel文件
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="employee_import_template.xlsx"');
      res.send(buffer);

    } catch (error) {
      console.error('下载模板失败:', error);
      res.status(500).json({
        code: 500,
        message: '下载模板失败',
        data: null
      });
    }
  }
}

export const userController = new UserController();

