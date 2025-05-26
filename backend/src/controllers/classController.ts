import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

class ClassController {
  /**
   * 获取班级列表
   */
  async getClasses(req: Request, res: Response) {
    try {
      const {
        current = 1,
        size = 10,
        name,
        categoryId,
        status
      } = req.query;

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
          where,
          skip,
          take: pageSize,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            students: {
              select: {
                id: true,
                name: true,
                company: true,
                position: true,
                phone: true,
                email: true,
                status: true
              }
            }
          }
        }),
        prisma.class.count({ where })
      ]);

      // 格式化返回数据
      const formattedClasses = classes.map(classItem => ({
        id: classItem.id,
        name: classItem.name,
        categoryId: classItem.categoryId,
        categoryName: classItem.categoryName,
        teacher: classItem.teacher,
        description: classItem.description,
        startDate: classItem.startDate.toISOString().split('T')[0],
        endDate: classItem.endDate.toISOString().split('T')[0],
        status: classItem.status,
        studentCount: classItem.students.length,
        createdAt: classItem.createdAt.toISOString().replace('T', ' ').substring(0, 19),
        updatedAt: classItem.updatedAt.toISOString().replace('T', ' ').substring(0, 19)
      }));

      const result = {
        records: formattedClasses,
        current: page,
        size: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      };

      res.json(createSuccessResponse(result, '获取班级列表成功', req.path));
    } catch (error) {
      logger.error('获取班级列表失败:', error);
      res.status(500).json(createErrorResponse(500, '获取班级列表失败', null, req.path));
    }
  }

  /**
   * 获取班级详情
   */
  async getClassById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const classItem = await prisma.class.findUnique({
        where: { id: Number(id) },
        include: {
          students: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });

      if (!classItem) {
        return res.status(404).json(createErrorResponse(404, '班级不存在', null, req.path));
      }

      // 格式化返回数据
      const formattedClass = {
        id: classItem.id,
        name: classItem.name,
        categoryId: classItem.categoryId,
        categoryName: classItem.categoryName,
        teacher: classItem.teacher,
        description: classItem.description,
        startDate: classItem.startDate.toISOString().split('T')[0],
        endDate: classItem.endDate.toISOString().split('T')[0],
        status: classItem.status,
        studentCount: classItem.students.length,
        createdAt: classItem.createdAt.toISOString().replace('T', ' ').substring(0, 19),
        updatedAt: classItem.updatedAt.toISOString().replace('T', ' ').substring(0, 19),
        students: classItem.students.map(student => ({
          id: student.id,
          name: student.name,
          company: student.company,
          position: student.position,
          phone: student.phone,
          email: student.email,
          joinDate: student.joinDate.toISOString().split('T')[0],
          attendanceRate: student.attendanceRate,
          status: student.status,
          createdAt: student.createdAt.toISOString().replace('T', ' ').substring(0, 19)
        }))
      };

      res.json(createSuccessResponse(formattedClass, '获取班级详情成功', req.path));
    } catch (error) {
      logger.error('获取班级详情失败:', error);
      res.status(500).json(createErrorResponse(500, '获取班级详情失败', null, req.path));
    }
  }

  /**
   * 创建班级
   */
  async createClass(req: Request, res: Response) {
    try {
      const {
        name,
        categoryId,
        categoryName,
        teacher,
        description,
        startDate,
        endDate,
        students = []
      } = req.body;

      // 验证必填字段
      if (!name || !categoryId || !categoryName || !teacher || !startDate || !endDate) {
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
          name,
          categoryId: Number(categoryId),
          categoryName,
          teacher,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status,
          studentCount: students.length,
          students: {
            create: students.map((student: any) => ({
              name: student.name,
              company: student.company || '',
              position: student.position || '',
              phone: student.phone || '',
              email: student.email || '',
              joinDate: new Date(student.joinDate || startDate),
              attendanceRate: student.attendanceRate || 100,
              status: student.status || 1
            }))
          }
        },
        include: {
          students: true
        }
      });

      res.json(createSuccessResponse(newClass, '创建班级成功', req.path));
    } catch (error) {
      logger.error('创建班级失败:', error);
      res.status(500).json(createErrorResponse(500, '创建班级失败', null, req.path));
    }
  }

  /**
   * 更新班级
   */
  async updateClass(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        categoryId,
        categoryName,
        teacher,
        description,
        startDate,
        endDate
      } = req.body;

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
        where: { id: Number(id) },
        data: {
          name,
          categoryId: Number(categoryId),
          categoryName,
          teacher,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status
        },
        include: {
          students: true
        }
      });

      res.json(createSuccessResponse(updatedClass, '更新班级成功', req.path));
    } catch (error) {
      logger.error('更新班级失败:', error);
      res.status(500).json(createErrorResponse(500, '更新班级失败', null, req.path));
    }
  }

  /**
   * 删除班级
   */
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
