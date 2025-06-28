import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  advanceStage,
  archiveTask,
  getMyTasks,
  getArchivedTasks,
  getProjectStatistics as getProjectStatisticsFromTask
} from '../controllers/taskController';
import {
  uploadProposal,
  confirmProposal,
  confirmTeacher,
  approveProject,
  confirmContract,
  confirmProjectCompletion,
  confirmPayment,
  getProjectStatistics
} from '../controllers/taskStageController';
import { authMiddleware } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 基础CRUD路由
/**
 * @route GET /api/tasks
 * @desc 获取项目事项列表
 * @access Private
 */
router.get('/',
  authMiddleware,
  [
    query('current').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('size').optional().isInt({ min: 1, max: 100 }).withMessage('页面大小必须在1-100之间'),
    query('keyword').optional().isString().withMessage('关键词必须是字符串'),
    query('currentStage').optional().isIn([
      'customer_inquiry', 'proposal_submission', 'teacher_confirmation',
      'project_approval', 'contract_signing', 'project_execution', 'project_settlement'
    ]).withMessage('阶段参数无效'),
    query('priority').optional().isInt({ min: 1, max: 3 }).withMessage('优先级必须是1-3'),
    query('responsiblePersonId').optional().isInt().withMessage('负责人ID必须是整数'),
    query('isArchived').optional().isBoolean().withMessage('归档状态必须是布尔值')
  ],
  getTasks
);

/**
 * @route GET /api/tasks/my
 * @desc 获取我的项目事项
 * @access Private
 */
router.get('/my',
  authMiddleware,
  [
    query('current').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('size').optional().isInt({ min: 1, max: 100 }).withMessage('页面大小必须在1-100之间'),
    query('keyword').optional().isString().withMessage('关键词必须是字符串'),
    query('currentStage').optional().isIn([
      'customer_inquiry', 'proposal_submission', 'teacher_confirmation',
      'project_approval', 'contract_signing', 'project_execution', 'project_settlement'
    ]).withMessage('阶段参数无效'),
    query('priority').optional().isInt({ min: 1, max: 3 }).withMessage('优先级必须是1-3'),
    query('responsiblePersonId').optional().isInt().withMessage('负责人ID必须是整数')
  ],
  getMyTasks
);

/**
 * @route GET /api/tasks/statistics
 * @desc 获取项目统计信息
 * @access Private
 */
router.get('/statistics',
  authMiddleware,
  getProjectStatisticsFromTask
);

/**
 * @route GET /api/tasks/archived
 * @desc 获取历史项目列表
 * @access Private
 */
router.get('/archived',
  authMiddleware,
  [
    query('current').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('size').optional().isInt({ min: 1, max: 100 }).withMessage('页面大小必须在1-100之间'),
    query('keyword').optional().isString().withMessage('关键词必须是字符串'),
    query('projectType').optional().isString().withMessage('项目类型必须是字符串'),
    query('priority').optional().isInt({ min: 1, max: 3 }).withMessage('优先级必须是1-3'),
    query('responsiblePersonId').optional().isInt().withMessage('负责人ID必须是整数'),
    query('completionTimeStart').optional().isISO8601().withMessage('开始时间格式错误'),
    query('completionTimeEnd').optional().isISO8601().withMessage('结束时间格式错误')
  ],
  getArchivedTasks
);

/**
 * @route GET /api/tasks/:id
 * @desc 获取项目事项详情
 * @access Private
 */
router.get('/:id',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }).withMessage('项目事项ID必须是正整数')
  ],
  getTaskById
);

/**
 * @route POST /api/tasks
 * @desc 创建项目事项
 * @access Private
 */
router.post('/',
  authMiddleware,
  [
    body('projectType').notEmpty().withMessage('项目类型不能为空'),
    body('projectName').notEmpty().withMessage('项目名称不能为空'),
    body('responsiblePersonId').isInt({ min: 1 }).withMessage('负责人ID必须是正整数'),
    body('consultantId').isInt({ min: 1 }).withMessage('咨询部人员ID必须是正整数'),
    body('marketManagerId').isInt({ min: 1 }).withMessage('市场部经理ID必须是正整数'),
    body('priority').optional().isInt({ min: 1, max: 3 }).withMessage('优先级必须是1-3'),
    body('startTime').isISO8601().withMessage('开始时间格式无效'),
    body('endTime').isISO8601().withMessage('结束时间格式无效'),
    body('remark').optional().isString().withMessage('备注必须是字符串')
  ],
  createTask
);

/**
 * @route PUT /api/tasks/:id
 * @desc 更新项目事项
 * @access Private
 */
router.put('/:id',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }).withMessage('项目事项ID必须是正整数'),
    body('projectType').optional().notEmpty().withMessage('项目类型不能为空'),
    body('projectName').optional().notEmpty().withMessage('项目名称不能为空'),
    body('responsiblePersonId').optional().isInt({ min: 1 }).withMessage('负责人ID必须是正整数'),
    body('executorId').optional().isInt({ min: 1 }).withMessage('执行人ID必须是正整数'),
    body('consultantId').optional().isInt({ min: 1 }).withMessage('咨询部人员ID必须是正整数'),
    body('marketManagerId').optional().isInt({ min: 1 }).withMessage('市场部经理ID必须是正整数'),
    body('priority').optional().isInt({ min: 1, max: 3 }).withMessage('优先级必须是1-3'),
    body('startTime').optional().isISO8601().withMessage('开始时间格式无效'),
    body('endTime').optional().isISO8601().withMessage('结束时间格式无效'),
    body('remark').optional().isString().withMessage('备注必须是字符串')
  ],
  updateTask
);

/**
 * @route DELETE /api/tasks/:id
 * @desc 删除项目事项
 * @access Private
 */
router.delete('/:id',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }).withMessage('项目事项ID必须是正整数')
  ],
  deleteTask
);

// 阶段操作路由
/**
 * @route POST /api/tasks/advance-stage
 * @desc 推进项目到下一阶段
 * @access Private
 */
router.post('/advance-stage',
  authMiddleware,
  [
    body('taskId').isInt({ min: 1 }).withMessage('项目事项ID必须是正整数'),
    body('comment').optional().isString().withMessage('备注必须是字符串'),
    body('operatorId').isInt({ min: 1 }).withMessage('操作员ID必须是正整数')
  ],
  advanceStage
);

/**
 * @route POST /api/tasks/upload-proposal
 * @desc 上传方案附件
 * @access Private
 */
router.post('/upload-proposal',
  authMiddleware,
  [
    body('taskId').isInt({ min: 1 }).withMessage('项目事项ID必须是正整数'),
    body('attachmentIds').isArray().withMessage('附件ID列表必须是数组'),
    body('comment').optional().isString().withMessage('备注必须是字符串')
  ],
  uploadProposal
);

/**
 * @route POST /api/tasks/confirm-proposal
 * @desc 确认客户同意方案
 * @access Private
 */
router.post('/confirm-proposal',
  authMiddleware,
  [
    body('taskId').isInt({ min: 1 }).withMessage('项目事项ID必须是正整数'),
    body('approved').isBoolean().withMessage('审批结果必须是布尔值'),
    body('comment').optional().isString().withMessage('备注必须是字符串')
  ],
  confirmProposal
);

/**
 * @route POST /api/tasks/confirm-teacher
 * @desc 确认授课老师
 * @access Private
 */
router.post('/confirm-teacher',
  authMiddleware,
  [
    body('taskId').isInt({ min: 1 }).withMessage('项目事项ID必须是正整数'),
    body('teacherInfo').isObject().withMessage('师资信息必须是对象'),
    body('comment').optional().isString().withMessage('备注必须是字符串')
  ],
  confirmTeacher
);

/**
 * @route POST /api/tasks/:id/approve
 * @desc 项目审批
 * @access Private
 */
router.post('/:id/approve',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }).withMessage('项目事项ID必须是正整数'),
    body('approved').isBoolean().withMessage('审批结果必须是布尔值'),
    body('comment').optional().isString().withMessage('备注必须是字符串')
  ],
  (req: Request, res: Response, next: NextFunction) => {
    req.body.taskId = req.params.id;
    next();
  },
  approveProject
);

/**
 * @route POST /api/tasks/:id/confirm-contract
 * @desc 确认合同签订
 * @access Private
 */
router.post('/:id/confirm-contract',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }).withMessage('项目事项ID必须是正整数'),
    body('signed').isBoolean().withMessage('签订状态必须是布尔值'),
    body('comment').optional().isString().withMessage('备注必须是字符串')
  ],
  (req: Request, res: Response, next: NextFunction) => {
    req.body.taskId = req.params.id;
    next();
  },
  confirmContract
);

/**
 * @route POST /api/tasks/:id/confirm-completion
 * @desc 确认项目完成
 * @access Private
 */
router.post('/:id/confirm-completion',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }).withMessage('项目事项ID必须是正整数'),
    body('completed').isBoolean().withMessage('完成状态必须是布尔值'),
    body('comment').optional().isString().withMessage('备注必须是字符串')
  ],
  (req: Request, res: Response, next: NextFunction) => {
    req.body.taskId = req.params.id;
    next();
  },
  confirmProjectCompletion
);

/**
 * @route POST /api/tasks/:id/confirm-payment
 * @desc 确认收款
 * @access Private
 */
router.post('/:id/confirm-payment',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }).withMessage('项目事项ID必须是正整数'),
    body('received').isBoolean().withMessage('收款状态必须是布尔值'),
    body('amount').optional().isNumeric().withMessage('金额必须是数字'),
    body('comment').optional().isString().withMessage('备注必须是字符串')
  ],
  (req: Request, res: Response, next: NextFunction) => {
    req.body.taskId = req.params.id;
    next();
  },
  confirmPayment
);

/**
 * @route POST /api/tasks/:id/archive
 * @desc 归档项目到历史
 * @access Private
 */
router.post('/:id/archive',
  authMiddleware,
  [
    param('id').isInt({ min: 1 }).withMessage('项目事项ID必须是正整数')
  ],
  archiveTask
);

export default router;
