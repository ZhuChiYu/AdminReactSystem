import fs from 'node:fs';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';

import { prisma } from '@/config/database';
import { ErrorCode, NotFoundError, ValidationError, createErrorResponse, createSuccessResponse } from '@/utils/errors';
import { logger } from '@/utils/logger';

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
  /** 获取员工列表 */
  async getEmployees(req: Request, res: Response) {
    const { current = 1, department, nickName, size = 10, status, userName } = req.query;

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
        include: {
          department: true,
          userRoles: {
            include: {
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: pageSize,
        where
      });

      // 格式化返回数据
      const records = employees.map(employee => ({
        address: employee.address,
        bankCard: employee.bankCard,
        contractEndDate: employee.contractEndDate,
        contractStartDate: employee.contractStartDate,
        contractYears: employee.contractYears,
        createdAt: employee.createdAt,
        department: employee.department
          ? {
              id: employee.department.id,
              name: employee.department.name
            }
          : null,
        email: employee.email,
        gender: employee.gender,
        id: employee.id,
        idCard: employee.idCard,
        nickName: employee.nickName,
        phone: employee.phone,
        position: employee.position,
        roleNames: employee.userRoles.map(ur => ur.role.roleName),
        roles: employee.userRoles.map(ur => ur.role.roleCode),
        status: employee.status,
        tim: employee.tim,
        updatedAt: employee.updatedAt,
        userName: employee.userName,
        wechat: employee.wechat
      }));

      const pages = Math.ceil(total / pageSize);

      res.json(
        createSuccessResponse(
          {
            current: page,
            pages,
            records,
            size: pageSize,
            total
          },
          '查询成功',
          req.path
        )
      );
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
          data: null,
          message: '请上传Excel文件'
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
            data: null,
            message: 'Excel文件格式错误，至少需要包含表头和一行数据'
          });
        }

        // 解析表头
        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1);

        // 定义字段映射
        const fieldMapping: { [key: string]: string } = {
          TIM号: 'tim',
          合同年限: 'contractYears',
          合同开始时间: 'contractStartDate',
          合同结束时间: 'contractEndDate',
          姓名: 'nickName',
          家庭住址: 'address',
          工作微信号: 'wechat',
          性别: 'gender',
          手机号: 'phone',
          状态: 'status',
          用户名: 'userName',
          职位: 'position',
          身份证号: 'idCard',
          邮箱: 'email',
          银行卡号: 'bankCard'
        };

        // 验证必需字段
        const requiredFields = ['用户名', '姓名', '邮箱'];
        const missingFields = requiredFields.filter(field => !headers.includes(field));

        if (missingFields.length > 0) {
          return res.status(400).json({
            code: 400,
            data: null,
            message: `Excel文件缺少必需字段: ${missingFields.join(', ')}`
          });
        }

        const successList: any[] = [];
        const errorList: any[] = [];

        // 处理每一行数据
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i] as any[];
          const rowIndex = i + 2; // Excel行号（从2开始，因为第1行是表头）
          const userData: any = {};

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
                data: userData,
                error: '缺少必需字段：用户名、姓名或邮箱',
                row: rowIndex
              });
              continue;
            }

            // 数据类型转换和验证
            if (userData.gender) {
              userData.gender =
                userData.gender === '男' ? 'male' : userData.gender === '女' ? 'female' : userData.gender;
            }

            if (userData.contractYears) {
              userData.contractYears = Number.parseInt(userData.contractYears);
            }

            if (userData.contractStartDate) {
              userData.contractStartDate = new Date(userData.contractStartDate);
            }

            if (userData.contractEndDate) {
              userData.contractEndDate = new Date(userData.contractEndDate);
            }

            if (userData.status) {
              userData.status =
                userData.status === '启用' ? 'active' : userData.status === '禁用' ? 'inactive' : userData.status;
            } else {
              userData.status = 'active'; // 默认启用
            }

            // 检查用户名是否已存在
            const existingUser = await prisma.user.findUnique({
              where: { userName: userData.userName }
            });

            if (existingUser) {
              errorList.push({
                data: userData,
                error: `用户名 ${userData.userName} 已存在`,
                row: rowIndex
              });
              continue;
            }

            // 检查邮箱是否已存在
            const existingEmail = await prisma.user.findUnique({
              where: { email: userData.email }
            });

            if (existingEmail) {
              errorList.push({
                data: userData,
                error: `邮箱 ${userData.email} 已存在`,
                row: rowIndex
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
                createdAt: new Date(),
                password: hashedPassword,
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
                  roleCode: employeeRole.code,
                  userId: newUser.id
                }
              });
            }

            successList.push({
              data: {
                email: newUser.email,
                nickName: newUser.nickName,
                userName: newUser.userName
              },
              row: rowIndex
            });
          } catch (error) {
            errorList.push({
              data: userData,
              error: error instanceof Error ? error.message : '未知错误',
              row: rowIndex
            });
          }
        }

        // 删除临时文件
        fs.unlinkSync(filePath);

        res.json({
          code: 200,
          data: {
            errorList,
            failed: errorList.length,
            success: successList.length,
            successList,
            total: dataRows.length
          },
          message: '导入完成'
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
        data: null,
        message: error instanceof Error ? error.message : '导入失败'
      });
    }
  }

  // 下载导入模板
  async downloadTemplate(req: Request, res: Response) {
    try {
      // 创建模板数据
      const templateData = [
        [
          '用户名',
          '姓名',
          '邮箱',
          '手机号',
          '性别',
          '职位',
          '家庭住址',
          '银行卡号',
          '身份证号',
          '工作微信号',
          'TIM号',
          '合同年限',
          '合同开始时间',
          '合同结束时间',
          '状态'
        ],
        [
          'zhangsan',
          '张三',
          'zhangsan@example.com',
          '13800138000',
          '男',
          '前端开发工程师',
          '北京市朝阳区',
          '6222000000000000',
          '110101199001011234',
          'zhangsan_work',
          'zhangsan_tim',
          '3',
          '2024-01-01',
          '2027-01-01',
          '启用'
        ],
        [
          'lisi',
          '李四',
          'lisi@example.com',
          '13800138001',
          '女',
          '后端开发工程师',
          '上海市浦东新区',
          '6222000000000001',
          '110101199002021234',
          'lisi_work',
          'lisi_tim',
          '5',
          '2024-01-01',
          '2029-01-01',
          '启用'
        ]
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
        { wch: 8 }, // 性别
        { wch: 20 }, // 职位
        { wch: 30 }, // 家庭住址
        { wch: 20 }, // 银行卡号
        { wch: 20 }, // 身份证号
        { wch: 15 }, // 工作微信号
        { wch: 15 }, // TIM号
        { wch: 12 }, // 合同年限
        { wch: 15 }, // 合同开始时间
        { wch: 15 }, // 合同结束时间
        { wch: 8 } // 状态
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, '员工信息');

      // 生成Excel文件
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="employee_import_template.xlsx"');
      res.send(buffer);
    } catch (error) {
      console.error('下载模板失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '下载模板失败'
      });
    }
  }

  /** 更新用户个人资料 */
  async updateProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { avatar, department, email, phone, userName } = req.body;

      // 检查用户是否存在
      const existingUser = await prisma.user.findUnique({
        where: { id: Number.parseInt(id) }
      });

      if (!existingUser) {
        return res.status(404).json(createErrorResponse(404, '用户不存在', null, req.path));
      }

      // 检查邮箱是否已被其他用户使用
      if (email && email !== existingUser.email) {
        const emailExists = await prisma.user.findFirst({
          where: {
            email,
            id: { not: Number.parseInt(id) }
          }
        });

        if (emailExists) {
          return res.status(400).json(createErrorResponse(400, '邮箱已被其他用户使用', null, req.path));
        }
      }

      // 检查手机号是否已被其他用户使用
      if (phone && phone !== existingUser.phone) {
        const phoneExists = await prisma.user.findFirst({
          where: {
            id: { not: Number.parseInt(id) },
            phone
          }
        });

        if (phoneExists) {
          return res.status(400).json(createErrorResponse(400, '手机号已被其他用户使用', null, req.path));
        }
      }

      // 检查用户权限
      const updateData: any = {};

      // 判断用户权限 - 用户可以修改自己的资料，管理员可以修改其他用户的资料
      const canEditProfile =
        req.user &&
        (req.user.roles.includes('super_admin') ||
          req.user.roles.includes('admin') ||
          req.user.id === Number.parseInt(id)); // 用户可以修改自己的资料

      if (!canEditProfile) {
        return res.status(403).json(createErrorResponse(403, '没有权限修改此用户信息', null, req.path));
      }

      // 根据权限设置可修改的字段
      if (userName) {
        // 所有用户都可以修改用户名
        updateData.userName = userName;
      }

      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      if (avatar !== undefined) updateData.avatar = avatar; // 允许设置为空字符串

      // 部门信息只有超级管理员可以修改
      if (department && req.user.roles.includes('super_admin')) {
        // 这里可以扩展为更新部门关联
        updateData.position = department; // 暂时使用position字段存储部门信息
      }

      updateData.updatedAt = new Date();

      // 更新用户信息
      const updatedUser = await prisma.user.update({
        data: updateData,
        include: {
          department: true,
          userRoles: {
            include: {
              role: true
            }
          }
        },
        where: { id: Number.parseInt(id) }
      });

      // 返回更新后的用户信息（排除敏感信息）
      const { password: _, ...userWithoutPassword } = updatedUser;

      logger.info(`用户资料更新成功: ${updatedUser.userName}`, {
        updatedBy: req.user?.id,
        updatedFields: Object.keys(updateData),
        userId: updatedUser.id
      });

      res.json(createSuccessResponse(userWithoutPassword, '个人资料更新成功', req.path));
    } catch (error: any) {
      logger.error('更新用户资料失败:', error);
      res.status(500).json(createErrorResponse(500, '更新用户资料失败', null, req.path));
    }
  }

  /** 修改用户密码 */
  async changePassword(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { newPassword, oldPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json(createErrorResponse(400, '旧密码和新密码不能为空', null, req.path));
      }

      if (oldPassword === newPassword) {
        return res.status(400).json(createErrorResponse(400, '新密码不能与旧密码相同', null, req.path));
      }

      if (newPassword.length < 6) {
        return res.status(400).json(createErrorResponse(400, '新密码长度不能少于6位', null, req.path));
      }

      // 检查用户是否存在
      const user = await prisma.user.findUnique({
        where: { id: Number.parseInt(id) }
      });

      if (!user) {
        return res.status(404).json(createErrorResponse(404, '用户不存在', null, req.path));
      }

      // 检查权限 - 用户只能修改自己的密码，或者管理员可以修改其他用户的密码
      const canChangePassword =
        req.user &&
        (req.user.id === Number.parseInt(id) ||
          req.user.roles.includes('super_admin') ||
          req.user.roles.includes('admin'));

      if (!canChangePassword) {
        return res.status(403).json(createErrorResponse(403, '没有权限修改此用户密码', null, req.path));
      }

      // 如果是用户修改自己的密码，需要验证旧密码
      if (req.user.id === Number.parseInt(id)) {
        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
          return res.status(400).json(createErrorResponse(400, '旧密码错误', null, req.path));
        }
      }

      // 加密新密码
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // 更新密码
      await prisma.user.update({
        data: {
          password: hashedNewPassword,
          updatedAt: new Date()
        },
        where: { id: Number.parseInt(id) }
      });

      logger.info(`用户密码修改成功: ${user.userName}`, {
        updatedBy: req.user?.id,
        userId: user.id
      });

      res.json(createSuccessResponse(null, '密码修改成功', req.path));
    } catch (error: any) {
      logger.error('修改用户密码失败:', error);
      res.status(500).json(createErrorResponse(500, '修改用户密码失败', null, req.path));
    }
  }
}

export const userController = new UserController();
