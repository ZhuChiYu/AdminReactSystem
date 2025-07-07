import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

import { logger } from '@/utils/logger';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';

const prisma = new PrismaClient();

class ClassController {
  /** 获取班级列表 */
  async getClasses(req: Request, res: Response) {
    try {
      const { categoryId, current = 1, name, size = 10, status } = req.query;

      const page = Number(current);
      const pageSize = Number(size);
      const skip = (page - 1) * pageSize;

      // 构建查询条件
      const where: any = {};

      if (name) {
        where.name = {
          contains: String(name),
          mode: 'insensitive'
        };
      }

      if (categoryId) {
        where.categoryId = Number(categoryId);
      }

      if (status !== undefined && status !== '') {
        where.status = Number(status);
      }

      // 查询班级列表
      const [classes, total] = await Promise.all([
        prisma.class.findMany({
          include: {
            category: true,
            course: true,
            students: {
              select: {
                company: true,
                email: true,
                id: true,
                name: true,
                phone: true,
                position: true,
                status: true,
                trainingFee: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: pageSize,
          where
        }),
        prisma.class.count({ where })
      ]);

      // 格式化返回数据
      const formattedClasses = classes.map((classItem: any) => {
        const studentCount = classItem.students ? classItem.students.length : 0;

        // 计算所有学员的培训费总和
        const totalTrainingFee = classItem.students.reduce((sum: number, student: any) => {
          const fee = student.trainingFee ? Number(student.trainingFee) : 0;
          return sum + fee;
        }, 0);

        return {
          categoryId: classItem.categoryId,
          categoryName: classItem.category?.name || '',
          courseId: classItem.courseId,
          courseName: classItem.course?.courseName || '',
          coursePrice: classItem.course?.price || 0,
          createdAt: classItem.createdAt.toISOString().replace('T', ' ').substring(0, 19),
          description: classItem.description,
          endDate: classItem.endDate.toISOString().split('T')[0],
          id: classItem.id,
          name: classItem.name,
          startDate: classItem.startDate.toISOString().split('T')[0],
          status: classItem.status,
          studentCount,
          trainingFee: totalTrainingFee.toFixed(2),
          updatedAt: classItem.updatedAt.toISOString().replace('T', ' ').substring(0, 19)
        };
      });

      const result = {
        current: page,
        pages: Math.ceil(total / pageSize),
        records: formattedClasses,
        size: pageSize,
        total
      };

      res.json(createSuccessResponse(result, '获取班级列表成功', req.path));
    } catch (error) {
      logger.error('获取班级列表失败:', error);
      res.status(500).json(createErrorResponse(500, '获取班级列表失败', null, req.path));
    }
  }

  /** 获取班级详情 */
  async getClassById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user;

      // 检查用户是否为超级管理员
      const isSuperAdmin = user?.roles?.includes('super_admin');

      const classItem = await prisma.class.findUnique({
        include: {
          category: true,
          course: true,
          students: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        },
        where: { id: Number(id) }
      });

      if (!classItem) {
        return res.status(404).json(createErrorResponse(404, '班级不存在', null, req.path));
      }

      // 格式化返回数据
      const studentCount = classItem.students ? classItem.students.length : 0;

      // 计算所有学员的培训费总和
      const totalTrainingFee = classItem.students.reduce((sum: number, student: any) => {
        const fee = student.trainingFee ? Number(student.trainingFee) : 0;
        return sum + fee;
      }, 0);

      const formattedClass = {
        categoryId: classItem.categoryId,
        categoryName: classItem.category?.name || '',
        courseId: classItem.courseId,
        courseName: classItem.course?.courseName || '',
        coursePrice: classItem.course?.price || 0,
        createdAt: classItem.createdAt.toISOString().replace('T', ' ').substring(0, 19),
        description: classItem.description,
        endDate: classItem.endDate.toISOString().split('T')[0],
        id: classItem.id,
        name: classItem.name,
        startDate: classItem.startDate.toISOString().split('T')[0],
        status: classItem.status,
        studentCount,
        students: classItem.students.map((student: any) => {
          // 基础信息（所有用户都能看到）
          const basicInfo = {
            attendanceRate: student.attendanceRate,
            avatar: student.avatar,
            createdAt: student.createdAt.toISOString().replace('T', ' ').substring(0, 19),
            gender: student.gender,
            id: student.id,
            joinDate: student.joinDate.toISOString().split('T')[0],
            name: student.name,
            status: student.status,
            trainingFee: student.trainingFee ? student.trainingFee.toString() : null
          };

          // 如果是超级管理员，返回完整信息
          if (isSuperAdmin) {
            return {
              ...basicInfo,
              company: student.company,
              email: student.email,
              phone: student.phone,
              position: student.position
            };
          }

          // 普通用户只返回基础信息
          return basicInfo;
        }),
        trainingFee: totalTrainingFee.toFixed(2),
        updatedAt: classItem.updatedAt.toISOString().replace('T', ' ').substring(0, 19)
      };

      res.json(createSuccessResponse(formattedClass, '获取班级详情成功', req.path));
    } catch (error) {
      logger.error('获取班级详情失败:', error);
      res.status(500).json(createErrorResponse(500, '获取班级详情失败', null, req.path));
    }
  }

  /** 创建班级 */
  async createClass(req: Request, res: Response) {
    try {
      const { categoryId, courseId, description, endDate, name, startDate } = req.body;

      // 验证必填字段
      if (!name || !categoryId || !startDate || !endDate) {
        return res.status(400).json(createErrorResponse(400, '缺少必填字段', null, req.path));
      }

      // 计算状态
      const now = new Date();
      const start = new Date(startDate);
      const end = new Date(endDate);
      let status = 0; // 未开始
      if (now >= start && now <= end) {
        status = 1; // 进行中
      } else if (now > end) {
        status = 2; // 已结束
      }

      // 创建班级
      const newClass = await prisma.class.create({
        data: {
          categoryId: Number(categoryId),
          courseId: courseId ? Number(courseId) : null,
          description,
          endDate: new Date(endDate),
          name,
          startDate: new Date(startDate),
          status
        },
        include: {
          category: true,
          course: true,
          students: true
        }
      });

      // 格式化返回数据
      const studentCount = newClass.students ? newClass.students.length : 0;
      const coursePrice = newClass.course?.price || 0;

      const formattedClass = {
        categoryId: newClass.categoryId,
        categoryName: newClass.category?.name || '',
        courseId: newClass.courseId,
        courseName: newClass.course?.courseName || '',
        coursePrice,
        createdAt: newClass.createdAt.toISOString().replace('T', ' ').substring(0, 19),
        description: newClass.description,
        endDate: newClass.endDate.toISOString().split('T')[0],
        id: newClass.id,
        name: newClass.name,
        startDate: newClass.startDate.toISOString().split('T')[0],
        status: newClass.status,
        studentCount,
        trainingFee: (studentCount * Number(coursePrice)).toFixed(2),
        updatedAt: newClass.updatedAt.toISOString().replace('T', ' ').substring(0, 19)
      };

      res.json(createSuccessResponse(formattedClass, '创建班级成功', req.path));
    } catch (error) {
      logger.error('创建班级失败:', error);
      res.status(500).json(createErrorResponse(500, '创建班级失败', null, req.path));
    }
  }

  /** 更新班级 */
  async updateClass(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { categoryId, courseId, description, endDate, name, startDate } = req.body;

      // 检查班级是否存在
      const existingClass = await prisma.class.findUnique({
        where: { id: Number(id) }
      });

      if (!existingClass) {
        return res.status(404).json(createErrorResponse(404, '班级不存在', null, req.path));
      }

      // 计算状态
      const now = new Date();
      const start = new Date(startDate);
      const end = new Date(endDate);
      let status = 0; // 未开始
      if (now >= start && now <= end) {
        status = 1; // 进行中
      } else if (now > end) {
        status = 2; // 已结束
      }

      // 更新班级
      const updatedClass = await prisma.class.update({
        data: {
          categoryId: Number(categoryId),
          courseId: courseId ? Number(courseId) : null,
          description,
          endDate: new Date(endDate),
          name,
          startDate: new Date(startDate),
          status
        },
        include: {
          category: true,
          course: true,
          students: true
        },
        where: { id: Number(id) }
      });

      // 格式化返回数据
      const studentCount = updatedClass.students ? updatedClass.students.length : 0;
      const coursePrice = updatedClass.course?.price || 0;

      const formattedClass = {
        categoryId: updatedClass.categoryId,
        categoryName: updatedClass.category?.name || '',
        courseId: updatedClass.courseId,
        courseName: updatedClass.course?.courseName || '',
        coursePrice,
        createdAt: updatedClass.createdAt.toISOString().replace('T', ' ').substring(0, 19),
        description: updatedClass.description,
        endDate: updatedClass.endDate.toISOString().split('T')[0],
        id: updatedClass.id,
        name: updatedClass.name,
        startDate: updatedClass.startDate.toISOString().split('T')[0],
        status: updatedClass.status,
        studentCount,
        trainingFee: (studentCount * Number(coursePrice)).toFixed(2),
        updatedAt: updatedClass.updatedAt.toISOString().replace('T', ' ').substring(0, 19)
      };

      res.json(createSuccessResponse(formattedClass, '更新班级成功', req.path));
    } catch (error) {
      logger.error('更新班级失败:', error);
      res.status(500).json(createErrorResponse(500, '更新班级失败', null, req.path));
    }
  }

  /** 删除班级 */
  async deleteClass(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // 检查班级是否存在
      const existingClass = await prisma.class.findUnique({
        where: { id: Number(id) }
      });

      if (!existingClass) {
        return res.status(404).json(createErrorResponse(404, '班级不存在', null, req.path));
      }

      // 删除班级（会级联删除学员）
      await prisma.class.delete({
        where: { id: Number(id) }
      });

      res.json(createSuccessResponse(null, '删除班级成功', req.path));
    } catch (error) {
      logger.error('删除班级失败:', error);
      res.status(500).json(createErrorResponse(500, '删除班级失败', null, req.path));
    }
  }
}

export const classController = new ClassController();
