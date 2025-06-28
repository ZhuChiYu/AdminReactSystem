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
import { redisUtils } from '@/config/redis';

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

    // 构建查询条件 - 显示所有用户，包括没有角色的用户
    const where: any = {};

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
      // 转换状态值：字符串转换为整数
      if (status === 'active' || status === '1') {
        where.status = 1;
      } else if (status === 'inactive' || status === '0') {
        where.status = 0;
      } else {
        where.status = Number.parseInt(status as string);
      }
    }

    try {
      // 获取总数 - 排除超级管理员
      const total = await prisma.user.count({
        where: {
          ...where,
          // 排除超级管理员用户
          NOT: {
            userRoles: {
              some: {
                role: {
                  roleCode: 'super_admin'
                }
              }
            }
          }
        }
      });

      // 获取员工列表 - 排除超级管理员
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
        where: {
          ...where,
          // 排除超级管理员用户
          NOT: {
            userRoles: {
              some: {
                role: {
                  roleCode: 'super_admin'
                }
              }
            }
          }
        }
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
        gender: employee.gender === 1 ? 'male' : employee.gender === 2 ? 'female' : null,
        id: employee.id,
        idCard: employee.idCard,
        nickName: employee.nickName,
        phone: employee.phone,
        position: employee.position,
        roleNames: employee.userRoles.length > 0 ? employee.userRoles.map(ur => ur.role.roleName) : ['未分配角色'],
        roles:
          employee.userRoles.length > 0
            ? employee.userRoles.map(ur => ({
                code: ur.role.roleCode,
                name: ur.role.roleName
              }))
            : [{ code: 'no_role', name: '未分配角色' }],
        status: employee.status === 1 ? 'active' : employee.status === 0 ? 'inactive' : 'active',
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
          '姓名*': 'nickName', // 支持带*的必需字段
          家庭住址: 'address',
          工作微信号: 'wechat',
          性别: 'gender',
          手机号: 'phone',
          状态: 'status',
          用户名: 'userName',
          '用户名*': 'userName', // 支持带*的必需字段
          职位: 'position',
          身份证号: 'idCard',
          邮箱: 'email',
          银行卡号: 'bankCard'
        };

        // 验证必需字段
        const requiredFields = ['用户名*', '姓名*']; // 带*标记的必需字段
        const hasRequiredFields = requiredFields.every(
          field => headers.includes(field) || headers.includes(field.replace('*', ''))
        );

        if (!hasRequiredFields) {
          const missingFields = requiredFields.filter(
            field => !headers.includes(field) && !headers.includes(field.replace('*', ''))
          );
          return res.status(400).json({
            code: 400,
            data: null,
            message: `Excel文件缺少必需字段: ${missingFields.join(', ')} (标有*号的字段为必需)`
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
            if (!userData.userName || !userData.nickName) {
              errorList.push({
                data: userData,
                error: '缺少必需字段：用户名或姓名',
                row: rowIndex
              });
              continue;
            }

            // 数据类型转换和验证
            if (userData.gender) {
              if (userData.gender === '男' || userData.gender === 'male') {
                userData.gender = 1;
              } else if (userData.gender === '女' || userData.gender === 'female') {
                userData.gender = 2;
              } else {
                userData.gender = 0; // 未知
              }
            } else {
              userData.gender = 0; // 默认未知
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

            // 确保phone和tim字段为字符串类型
            if (userData.phone) {
              userData.phone = String(userData.phone);
            }

            if (userData.tim) {
              userData.tim = String(userData.tim);
            }

            if (userData.status) {
              userData.status = userData.status === '启用' ? 1 : userData.status === '禁用' ? 0 : 1;
            } else {
              userData.status = 1; // 默认启用 (1=active, 0=inactive)
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
            if (userData.email) {
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
            }

            // 生成默认密码
            const defaultPassword = '123456';
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            // 处理邮箱字段 - 如果没有邮箱，生成一个默认邮箱
            if (!userData.email) {
              userData.email = `${userData.userName}@company.com`;
            }

            // 创建用户
            const newUser = await prisma.user.create({
              data: {
                ...userData,
                createdAt: new Date(),
                password: hashedPassword,
                updatedAt: new Date()
              }
            });

            // 分配默认角色（可选）
            const employeeRole = await prisma.role.findUnique({
              where: { roleCode: 'employee' }
            });

            // 角色分配改为可选，失败也不影响用户创建
            if (employeeRole) {
              try {
                await prisma.userRole.create({
                  data: {
                    roleId: employeeRole.id,
                    userId: newUser.id
                  }
                });
              } catch (roleError) {
                // 角色分配失败不影响用户创建
                console.log('角色分配失败，但用户创建成功');
              }
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
          code: 0,
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

  // 调试：检查导入的用户状态
  async debugImportedUsers(req: Request, res: Response) {
    try {
      const importedUsernames = ['luojingwen', 'longjianzhen', 'wangxu'];

      const users = await prisma.user.findMany({
        include: {
          userRoles: {
            include: {
              role: true
            }
          }
        },
        where: {
          userName: {
            in: importedUsernames
          }
        }
      });

      const result = users.map(user => ({
        createdAt: user.createdAt,
        email: user.email,
        gender: user.gender,
        hasRoles: user.userRoles.length > 0,
        id: user.id,
        nickName: user.nickName,
        roles: user.userRoles.map(ur => ({
          code: ur.role.roleCode,
          id: ur.role.id,
          name: ur.role.roleName
        })),
        status: user.status,
        userName: user.userName
      }));

      res.json({
        code: 0,
        data: {
          foundUsers: result.length,
          missingUsers: importedUsernames.filter(username => !result.some(user => user.userName === username)),
          users: result
        },
        message: '调试信息获取成功'
      });
    } catch (error) {
      console.error('调试导入用户失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '调试失败'
      });
    }
  }

  // 修复没有角色的用户
  async fixUsersWithoutRoles(req: Request, res: Response) {
    try {
      // 查找所有没有角色的用户
      const usersWithoutRoles = await prisma.user.findMany({
        include: {
          userRoles: true
        },
        where: {
          userRoles: {
            none: {}
          }
        }
      });

      console.log(`找到 ${usersWithoutRoles.length} 个没有角色的用户`);

      // 获取默认角色
      const defaultRole = await prisma.role.findFirst({
        where: {
          roleCode: {
            in: ['employee', 'consultant', 'hr_specialist']
          }
        }
      });

      if (!defaultRole) {
        return res.status(400).json({
          code: 400,
          data: null,
          message: '未找到可分配的角色'
        });
      }

      const results = [];
      for (const user of usersWithoutRoles) {
        const userRole = await prisma.userRole.create({
          data: {
            roleId: defaultRole.id,
            userId: user.id
          }
        });

        results.push({
          assignedRole: defaultRole.roleCode,
          nickName: user.nickName,
          userId: user.id,
          userName: user.userName
        });
      }

      res.json({
        code: 0,
        data: {
          assignedRole: defaultRole.roleCode,
          fixedUsersCount: results.length,
          users: results
        },
        message: '角色分配修复完成'
      });
    } catch (error) {
      console.error('修复用户角色失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '修复失败'
      });
    }
  }

  // 为用户分配角色
  async assignRoleToUser(req: Request, res: Response) {
    try {
      const { roleCode, userId } = req.body;

      if (!userId || !roleCode) {
        return res.status(400).json({
          code: 400,
          data: null,
          message: '用户ID和角色代码不能为空'
        });
      }

      // 检查用户是否存在
      const user = await prisma.user.findUnique({
        where: { id: Number(userId) }
      });

      if (!user) {
        return res.status(404).json({
          code: 404,
          data: null,
          message: '用户不存在'
        });
      }

      // 检查角色是否存在
      const role = await prisma.role.findUnique({
        where: { roleCode }
      });

      if (!role) {
        return res.status(404).json({
          code: 404,
          data: null,
          message: '角色不存在'
        });
      }

      // 检查是否已经分配了该角色
      const existingUserRole = await prisma.userRole.findFirst({
        where: {
          roleId: role.id,
          userId: Number(userId)
        }
      });

      if (existingUserRole) {
        return res.status(400).json({
          code: 400,
          data: null,
          message: '用户已拥有该角色'
        });
      }

      // 分配角色
      const userRole = await prisma.userRole.create({
        data: {
          roleId: role.id,
          userId: Number(userId)
        }
      });

      res.json({
        code: 0,
        data: {
          nickName: user.nickName,
          roleCode: role.roleCode,
          roleName: role.roleName,
          userId: user.id,
          userName: user.userName
        },
        message: '角色分配成功'
      });
    } catch (error) {
      console.error('分配角色失败:', error);
      res.status(500).json({
        code: 500,
        data: null,
        message: '分配角色失败'
      });
    }
  }

  // 下载导入模板
  async downloadTemplate(req: Request, res: Response) {
    try {
      // 创建模板数据
      const templateData = [
        [
          '用户名*', // 必需
          '姓名*', // 必需
          '邮箱', // 可选
          '手机号', // 可选
          '性别', // 可选
          '职位', // 可选
          '家庭住址', // 可选
          '银行卡号', // 可选
          '身份证号', // 可选
          '工作微信号', // 可选
          'TIM号', // 可选
          '合同年限', // 可选
          '合同开始时间', // 可选
          '合同结束时间', // 可选
          '状态' // 可选
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
          '', // 空邮箱示例
          '', // 空手机示例
          '女',
          '', // 空职位示例
          '', // 空地址示例
          '', // 空银行卡示例
          '', // 空身份证示例
          '', // 空微信示例
          '', // 空TIM示例
          '', // 空合同年限示例
          '', // 空合同开始时间示例
          '', // 空合同结束时间示例
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
      const {
        address,
        avatar,
        bankCard,
        contractEndDate,
        contractStartDate,
        contractYears,
        department,
        email,
        gender,
        idCard,
        nickName,
        phone,
        roles,
        status,
        tim,
        userName,
        wechat
      } = req.body;

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
      if (userName) updateData.userName = userName;
      if (nickName) updateData.nickName = nickName;
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (address !== undefined) updateData.address = address;
      if (bankCard !== undefined) updateData.bankCard = bankCard;
      if (idCard !== undefined) updateData.idCard = idCard;
      if (wechat !== undefined) updateData.wechat = wechat;
      if (tim !== undefined) updateData.tim = tim;
      if (contractYears !== undefined) updateData.contractYears = contractYears;
      if (contractStartDate !== undefined) updateData.contractStartDate = contractStartDate ? new Date(contractStartDate) : null;
      if (contractEndDate !== undefined) updateData.contractEndDate = contractEndDate ? new Date(contractEndDate) : null;

      // 处理性别转换
      if (gender !== undefined) {
        if (gender === 'male' || gender === 1) {
          updateData.gender = 1;
        } else if (gender === 'female' || gender === 2) {
          updateData.gender = 2;
        } else {
          updateData.gender = 0; // 未知
        }
      }

      // 处理状态转换
      if (status !== undefined) {
        if (status === 'active' || status === '1' || status === 1) {
          updateData.status = 1;
        } else if (status === 'inactive' || status === '0' || status === 0) {
          updateData.status = 0;
        }
      }

      // 部门信息只有超级管理员可以修改
      if (department && req.user && req.user.roles.includes('super_admin')) {
        updateData.position = department;
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

      // 处理角色更新（只有管理员可以修改角色）
      if (roles && req.user && (req.user.roles.includes('super_admin') || req.user.roles.includes('admin'))) {
        // 删除现有角色
        await prisma.userRole.deleteMany({
          where: { userId: Number.parseInt(id) }
        });

        // 分配新角色
        if (Array.isArray(roles)) {
          // 获取所有要分配的角色
          const rolesToAssign = await prisma.role.findMany({
            where: {
              roleCode: {
                in: roles
              }
            }
          });

          // 创建用户角色关联
          if (rolesToAssign.length > 0) {
            await prisma.userRole.createMany({
              data: rolesToAssign.map(role => ({
                roleId: role.id,
                userId: Number.parseInt(id)
              }))
            });
          }
        }

        // 重新获取用户信息（包含更新后的角色）
        const userWithUpdatedRoles = await prisma.user.findUnique({
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

        if (userWithUpdatedRoles) {
          // 返回更新后的用户信息（排除敏感信息）
          const { password: _, ...userWithoutPassword } = userWithUpdatedRoles;

          logger.info(`用户资料更新成功: ${userWithUpdatedRoles.userName}`, {
            updatedBy: req.user?.id,
            updatedFields: [...Object.keys(updateData), 'roles'],
            userId: userWithUpdatedRoles.id
          });

          return res.json(createSuccessResponse(userWithoutPassword, '个人资料更新成功', req.path));
        }
      }

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

  /** 修改密码 */
  async changePassword(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { newPassword, oldPassword } = req.body;
      const currentUser = (req as any).user;

      // 记录请求信息
      logger.info('修改密码请求:', {
        currentUserId: currentUser?.id,
        targetUserId: id,
        userRoles: currentUser?.roles
      });

      if (!id || isNaN(Number(id))) {
        return res.status(400).json(createErrorResponse(400, '无效的用户ID', null, req.path));
      }

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
        include: {
          userRoles: {
            include: {
              role: true
            }
          }
        },
        where: { id: Number(id) }
      });

      if (!user) {
        logger.warn('用户不存在:', { targetUserId: id });
        return res.status(404).json(createErrorResponse(404, '用户不存在', null, req.path));
      }

      // 检查权限 - 用户只能修改自己的密码，或者管理员可以修改其他用户的密码
      const canChangePassword =
        currentUser &&
        (currentUser.id === Number(id) ||
          currentUser.roles?.includes('super_admin') ||
          currentUser.roles?.includes('admin'));

      if (!canChangePassword) {
        logger.warn('无权修改密码:', {
          currentUserId: currentUser?.id,
          targetUserId: id,
          userRoles: currentUser?.roles
        });
        return res.status(403).json(createErrorResponse(403, '没有权限修改此用户密码', null, req.path));
      }

      // 如果是用户修改自己的密码，需要验证旧密码
      if (currentUser && currentUser.id === Number(id)) {
        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
          logger.warn('旧密码错误:', { userId: id });
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
        where: { id: Number(id) }
      });

      // 清除用户缓存，确保下次访问时重新从数据库获取信息
      try {
        await redisUtils.del(`user:${id}`);
        logger.info('用户缓存已清除:', { userId: id });
      } catch (cacheError) {
        // 缓存清除失败不应该影响密码修改的成功
        logger.warn('清除用户缓存失败:', { userId: id, error: cacheError });
      }

      logger.info('用户密码修改成功:', {
        updatedBy: currentUser?.id,
        userId: user.id,
        userName: user.userName
      });

      res.json(createSuccessResponse(null, '密码修改成功', req.path));
    } catch (error: any) {
      logger.error('修改用户密码失败:', {
        error: error.message,
        stack: error.stack,
        userId: req.params.id
      });
      res.status(500).json(createErrorResponse(500, '修改用户密码失败', null, req.path));
    }
  }

  /** 删除用户 */
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = Number.parseInt(id);

      if (!userId) {
        return res.status(400).json(createErrorResponse(400, '用户ID无效', null, req.path));
      }

      // 检查用户是否存在
      const user = await prisma.user.findUnique({
        include: {
          userRoles: {
            include: {
              role: true
            }
          },
          createdCustomers: true
        },
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json(createErrorResponse(404, '用户不存在', null, req.path));
      }

      // 检查是否为超级管理员，不允许删除
      const isSuperAdmin = user.userRoles.some(ur => ur.role.roleCode === 'super_admin');
      if (isSuperAdmin) {
        return res.status(403).json(createErrorResponse(403, '不允许删除超级管理员', null, req.path));
      }

      // 检查权限：只有超级管理员或管理员可以删除用户
      if (req.user && !req.user.roles.includes('super_admin') && !req.user.roles.includes('admin')) {
        return res.status(403).json(createErrorResponse(403, '没有权限删除用户', null, req.path));
      }

      // 开始事务处理删除操作
      await prisma.$transaction(async (tx) => {
        // 处理用户创建的客户数据 - 将createdById设置为null
        if (user.createdCustomers.length > 0) {
          await tx.customer.updateMany({
            where: { createdById: userId },
            data: { createdById: null }
          });
          logger.info(`处理了 ${user.createdCustomers.length} 个客户的创建者关联`);
        }

        // 删除用户的角色关联
        await tx.userRole.deleteMany({
          where: { userId }
        });

        // 删除用户
        await tx.user.delete({
          where: { id: userId }
        });
      });

      logger.info(`用户删除成功: ${user.userName}`, {
        deletedBy: req.user?.id,
        deletedUserId: userId,
        affectedCustomers: user.createdCustomers.length
      });

      res.json(
        createSuccessResponse(
          {
            deletedNickName: user.nickName,
            deletedUserId: userId,
            deletedUserName: user.userName,
            affectedCustomers: user.createdCustomers.length
          },
          '用户删除成功',
          req.path
        )
      );
    } catch (error: any) {
      logger.error('删除用户失败:', error);
      res.status(500).json(createErrorResponse(500, '删除用户失败', null, req.path));
    }
  }

  /** 批量删除用户 */
  async batchDeleteUsers(req: Request, res: Response) {
    try {
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json(createErrorResponse(400, '用户ID列表不能为空', null, req.path));
      }

      // 检查权限：只有超级管理员或管理员可以批量删除用户
      if (req.user && !req.user.roles.includes('super_admin') && !req.user.roles.includes('admin')) {
        return res.status(403).json(createErrorResponse(403, '没有权限批量删除用户', null, req.path));
      }

      const parsedUserIds = userIds.map(id => Number.parseInt(id)).filter(id => !isNaN(id));

      if (parsedUserIds.length === 0) {
        return res.status(400).json(createErrorResponse(400, '无效的用户ID列表', null, req.path));
      }

      // 查找要删除的用户，检查是否包含超级管理员
      const usersToDelete = await prisma.user.findMany({
        include: {
          userRoles: {
            include: {
              role: true
            }
          },
          createdCustomers: true
        },
        where: {
          id: { in: parsedUserIds }
        }
      });

      // 过滤掉超级管理员
      const superAdmins = usersToDelete.filter(user => user.userRoles.some(ur => ur.role.roleCode === 'super_admin'));

      const deletableUsers = usersToDelete.filter(
        user => !user.userRoles.some(ur => ur.role.roleCode === 'super_admin')
      );

      if (superAdmins.length > 0) {
        const superAdminNames = superAdmins.map(user => user.nickName).join(', ');

        if (deletableUsers.length === 0) {
          return res
            .status(403)
            .json(createErrorResponse(403, `不允许删除超级管理员：${superAdminNames}`, null, req.path));
        }
      }

      const deletableUserIds = deletableUsers.map(user => user.id);

      if (deletableUserIds.length === 0) {
        return res.status(400).json(createErrorResponse(400, '没有可删除的用户', null, req.path));
      }

      // 统计受影响的客户数量
      const totalAffectedCustomers = deletableUsers.reduce((total, user) => total + user.createdCustomers.length, 0);

      // 使用事务批量删除用户
      const result = await prisma.$transaction(async (tx) => {
        // 处理用户创建的客户数据 - 将createdById设置为null
        if (totalAffectedCustomers > 0) {
          await tx.customer.updateMany({
            where: { createdById: { in: deletableUserIds } },
            data: { createdById: null }
          });
          logger.info(`处理了 ${totalAffectedCustomers} 个客户的创建者关联`);
        }

        // 删除用户的角色关联
        await tx.userRole.deleteMany({
          where: {
            userId: { in: deletableUserIds }
          }
        });

        // 批量删除用户
        const deleteResult = await tx.user.deleteMany({
          where: {
            id: { in: deletableUserIds }
          }
        });

        return {
          deletedCount: deleteResult.count,
          deletedUsers: deletableUsers.map(user => ({
            id: user.id,
            nickName: user.nickName,
            userName: user.userName,
            affectedCustomers: user.createdCustomers.length
          })),
          skippedSuperAdmins: superAdmins.map(user => ({
            id: user.id,
            nickName: user.nickName,
            userName: user.userName
          })),
          totalAffectedCustomers
        };
      });

      let message = `成功删除 ${result.deletedCount} 个用户`;
      if (superAdmins.length > 0) {
        message += `，跳过 ${superAdmins.length} 个超级管理员`;
      }
      if (totalAffectedCustomers > 0) {
        message += `，处理了 ${totalAffectedCustomers} 个客户关联`;
      }

      logger.info('批量删除用户成功', {
        deletedBy: req.user?.id,
        deletedCount: result.deletedCount,
        skippedSuperAdmins: superAdmins.length,
        totalAffectedCustomers
      });

      res.json(createSuccessResponse(result, message, req.path));
    } catch (error: any) {
      logger.error('批量删除用户失败:', error);
      res.status(500).json(createErrorResponse(500, '批量删除用户失败', null, req.path));
    }
  }

  /** 获取员工-管理员关系列表 */
  async getEmployeeManagerRelations(req: Request, res: Response) {
    const { current = 1, size = 10 } = req.query;

    const page = Number(current);
    const pageSize = Number(size);
    const skip = (page - 1) * pageSize;

    try {
      // 获取总数
      const total = await prisma.employeeManagerRelation.count();

      // 获取关系列表
      const relations = await prisma.employeeManagerRelation.findMany({
        include: {
          assignedBy: {
            select: {
              id: true,
              nickName: true
            }
          },
          employee: {
            select: {
              id: true,
              nickName: true
            }
          },
          manager: {
            select: {
              id: true,
              nickName: true
            }
          }
        },
        orderBy: {
          assignedTime: 'desc'
        },
        skip,
        take: pageSize
      });

      // 格式化返回数据
      const records = relations.map(relation => ({
        assignedById: relation.assignedById,
        assignedByName: relation.assignedBy.nickName,
        assignedTime: relation.assignedTime.toISOString().split('T')[0],
        employeeId: relation.employeeId,
        employeeName: relation.employee.nickName,
        id: relation.id,
        managerId: relation.managerId,
        managerName: relation.manager.nickName,
        remark: relation.remark
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
      logger.error('获取员工-管理员关系列表失败:', error);
      res.status(500).json(createErrorResponse(500, '获取关系列表失败', null, req.path));
    }
  }

  /** 分配员工给管理员 */
  async assignEmployeesToManager(req: Request, res: Response) {
    const { employeeIds, managerId, remark } = req.body;
    const assignedById = req.user!.id;

    try {
      // 验证输入
      if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json(createErrorResponse(400, '请选择要分配的员工', null, req.path));
      }

      if (!managerId) {
        return res.status(400).json(createErrorResponse(400, '请选择管理员', null, req.path));
      }

      // 验证管理员是否存在且有管理权限
      const manager = await prisma.user.findFirst({
        include: {
          userRoles: {
            include: {
              role: true
            }
          }
        },
        where: {
          id: managerId
        }
      });

      if (!manager) {
        return res.status(400).json(createErrorResponse(400, '管理员不存在', null, req.path));
      }

      // 检查是否有管理权限
      const hasManagerRole = manager.userRoles.some(
        ur => ur.role.roleCode === 'admin' || ur.role.roleCode === 'super_admin'
      );

      if (!hasManagerRole) {
        return res.status(400).json(createErrorResponse(400, '用户没有管理权限', null, req.path));
      }

      // 验证员工是否存在
      const employees = await prisma.user.findMany({
        where: {
          id: {
            in: employeeIds.map(Number)
          }
        }
      });

      if (employees.length !== employeeIds.length) {
        return res.status(400).json(createErrorResponse(400, '部分员工不存在', null, req.path));
      }

      // 检查是否已经存在关系
      const existingRelations = await prisma.employeeManagerRelation.findMany({
        where: {
          employeeId: {
            in: employeeIds.map(Number)
          }
        }
      });

      if (existingRelations.length > 0) {
        const existingEmployeeIds = existingRelations.map(r => r.employeeId);
        const existingEmployees = employees.filter(emp => existingEmployeeIds.includes(emp.id));
        const names = existingEmployees.map(emp => emp.nickName).join(', ');
        return res
          .status(400)
          .json(createErrorResponse(400, `员工 ${names} 已经有管理员，请先取消现有关系`, null, req.path));
      }

      // 创建关系
      const relations = await Promise.all(
        employeeIds.map(employeeId =>
          prisma.employeeManagerRelation.create({
            data: {
              assignedById,
              employeeId: Number(employeeId),
              managerId,
              remark: remark || null
            }
          })
        )
      );

      res.json(createSuccessResponse(relations, '分配成功', req.path));
    } catch (error) {
      logger.error('分配员工给管理员失败:', error);
      res.status(500).json(createErrorResponse(500, '分配失败', null, req.path));
    }
  }

  /** 取消员工管理关系 */
  async removeEmployeeManagerRelation(req: Request, res: Response) {
    const { id } = req.params;

    try {
      // 验证关系是否存在
      const relation = await prisma.employeeManagerRelation.findUnique({
        where: {
          id: Number(id)
        }
      });

      if (!relation) {
        return res.status(404).json(createErrorResponse(404, '关系不存在', null, req.path));
      }

      // 删除关系
      await prisma.employeeManagerRelation.delete({
        where: {
          id: Number(id)
        }
      });

      res.json(createSuccessResponse(null, '取消分配成功', req.path));
    } catch (error) {
      logger.error('取消员工管理关系失败:', error);
      res.status(500).json(createErrorResponse(500, '取消分配失败', null, req.path));
    }
  }

  /** 获取当前管理员管理的员工列表 */
  async getManagedEmployees(req: Request, res: Response) {
    const managerId = req.user!.id;
    const { current = 1, size = 10 } = req.query;

    const page = Number(current);
    const pageSize = Number(size);
    const skip = (page - 1) * pageSize;

    try {
      // 如果是超级管理员，返回所有员工
      const userRoles = await prisma.userRole.findMany({
        include: {
          role: true
        },
        where: {
          userId: managerId
        }
      });

      const isSuperAdmin = userRoles.some(ur => ur.role.roleCode === 'super_admin');

      let where: any = {};

      if (!isSuperAdmin) {
        // 管理员只能看到分配给自己管理的员工
        const managedRelations = await prisma.employeeManagerRelation.findMany({
          where: {
            managerId
          }
        });

        const managedEmployeeIds = managedRelations.map(r => r.employeeId);

        if (managedEmployeeIds.length === 0) {
          // 如果没有管理任何员工，返回空列表
          return res.json(
            createSuccessResponse(
              {
                current: page,
                pages: 0,
                records: [],
                size: pageSize,
                total: 0
              },
              '查询成功',
              req.path
            )
          );
        }

        where = {
          id: {
            in: managedEmployeeIds
          }
        };
      }

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
        gender: employee.gender === 1 ? 'male' : employee.gender === 2 ? 'female' : null,
        id: employee.id,
        idCard: employee.idCard,
        nickName: employee.nickName,
        phone: employee.phone,
        position: employee.position,
        roleNames: employee.userRoles.length > 0 ? employee.userRoles.map(ur => ur.role.roleName) : ['未分配角色'],
        roles:
          employee.userRoles.length > 0
            ? employee.userRoles.map(ur => ({
                code: ur.role.roleCode,
                name: ur.role.roleName
              }))
            : [{ code: 'no_role', name: '未分配角色' }],
        status: employee.status === 1 ? 'active' : employee.status === 0 ? 'inactive' : 'active',
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
      logger.error('获取管理的员工列表失败:', error);
      res.status(500).json(createErrorResponse(500, '获取管理的员工列表失败', null, req.path));
    }
  }
}

export const userController = new UserController();
