// 自定义API错误类
export class ApiError extends Error {
  public statusCode: number;
  public code: number;
  public isOperational: boolean;

  constructor(statusCode: number, message: string, code?: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || statusCode;
    this.isOperational = isOperational;

    // 确保错误堆栈正确
    Error.captureStackTrace(this, this.constructor);
  }
}

// 业务错误类
export class BusinessError extends ApiError {
  constructor(message: string, code = 2000) {
    super(400, message, code);
  }
}

// 验证错误类
export class ValidationError extends ApiError {
  public details: any;

  constructor(message: string, details?: any) {
    super(400, message, 1001);
    this.details = details;
  }
}

// 认证错误类
export class AuthError extends ApiError {
  constructor(message: string) {
    super(401, message, 1002);
  }
}

// 权限错误类
export class PermissionError extends ApiError {
  constructor(message: string) {
    super(403, message, 1003);
  }
}

// 资源不存在错误类
export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(404, message, 1004);
  }
}

// 重复数据错误类
export class DuplicateError extends ApiError {
  constructor(message: string) {
    super(409, message, 1005);
  }
}

// 错误码枚举
export enum ErrorCode {
  SUCCESS = 0,                    // 成功
  SYSTEM_ERROR = 1000,           // 系统错误
  PARAM_ERROR = 1001,            // 参数错误
  AUTH_ERROR = 1002,             // 认证错误
  PERMISSION_ERROR = 1003,       // 权限错误
  NOT_FOUND = 1004,             // 资源不存在
  DUPLICATE_ERROR = 1005,        // 重复数据
  BUSINESS_ERROR = 2000,         // 业务错误

  // 用户相关错误
  USER_NOT_EXIST = 2001,         // 用户不存在
  USER_PASSWORD_ERROR = 2002,    // 密码错误
  USER_DISABLED = 2003,          // 用户已禁用
  TOKEN_INVALID = 2004,          // Token无效
  TOKEN_EXPIRED = 2005,          // Token已过期

  // 客户相关错误
  CUSTOMER_NOT_EXIST = 3001,     // 客户不存在
  CUSTOMER_ASSIGNED = 3002,      // 客户已分配

  // 课程相关错误
  COURSE_NOT_EXIST = 4001,       // 课程不存在
  CLASS_FULL = 4002,             // 班级已满

  // 会议相关错误
  MEETING_CONFLICT = 5001,       // 会议冲突
  MEETING_APPROVED = 5002,       // 会议已审核

  // 财务相关错误
  EXPENSE_SUBMITTED = 6001,      // 报销已提交
  EXPENSE_APPROVED = 6002,       // 报销已审批
}

// 错误消息映射
export const ErrorMessages: Record<number, string> = {
  [ErrorCode.SUCCESS]: '操作成功',
  [ErrorCode.SYSTEM_ERROR]: '系统错误',
  [ErrorCode.PARAM_ERROR]: '参数错误',
  [ErrorCode.AUTH_ERROR]: '认证失败',
  [ErrorCode.PERMISSION_ERROR]: '权限不足',
  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.DUPLICATE_ERROR]: '数据重复',
  [ErrorCode.BUSINESS_ERROR]: '业务错误',

  [ErrorCode.USER_NOT_EXIST]: '用户不存在',
  [ErrorCode.USER_PASSWORD_ERROR]: '用户名或密码错误',
  [ErrorCode.USER_DISABLED]: '用户已被禁用',
  [ErrorCode.TOKEN_INVALID]: '认证令牌无效',
  [ErrorCode.TOKEN_EXPIRED]: '认证令牌已过期',

  [ErrorCode.CUSTOMER_NOT_EXIST]: '客户不存在',
  [ErrorCode.CUSTOMER_ASSIGNED]: '客户已被分配',

  [ErrorCode.COURSE_NOT_EXIST]: '课程不存在',
  [ErrorCode.CLASS_FULL]: '班级人数已满',

  [ErrorCode.MEETING_CONFLICT]: '会议时间冲突',
  [ErrorCode.MEETING_APPROVED]: '会议已审核，无法修改',

  [ErrorCode.EXPENSE_SUBMITTED]: '报销单已提交，无法修改',
  [ErrorCode.EXPENSE_APPROVED]: '报销单已审批，无法修改',
};

// 创建标准化错误响应
export const createErrorResponse = (
  code: number,
  message?: string,
  data?: any,
  path?: string
) => {
  return {
    code,
    message: message || ErrorMessages[code] || '未知错误',
    data: data || null,
    timestamp: Date.now(),
    path: path || '',
  };
};

// 创建成功响应
export const createSuccessResponse = <T>(
  data?: T,
  message = '操作成功',
  path?: string
) => {
  return {
    code: ErrorCode.SUCCESS,
    message,
    data: data || null,
    timestamp: Date.now(),
    path: path || '',
  };
};

// 创建分页响应
export const createPageResponse = <T>(
  records: T[],
  total: number,
  current: number,
  size: number,
  message = '查询成功',
  path?: string
) => {
  return {
    code: ErrorCode.SUCCESS,
    message,
    data: {
      records,
      total,
      current,
      size,
      pages: Math.ceil(total / size),
    },
    timestamp: Date.now(),
    path: path || '',
  };
};

// 错误处理工具函数
export const errorUtils = {
  // 判断是否为操作性错误
  isOperationalError: (error: Error): boolean => {
    if (error instanceof ApiError) {
      return error.isOperational;
    }
    return false;
  },

  // 获取错误状态码
  getStatusCode: (error: Error): number => {
    if (error instanceof ApiError) {
      return error.statusCode;
    }
    return 500;
  },

  // 获取错误代码
  getErrorCode: (error: Error): number => {
    if (error instanceof ApiError) {
      return error.code;
    }
    return ErrorCode.SYSTEM_ERROR;
  },

  // 格式化Prisma错误
  formatPrismaError: (error: any): ApiError => {
    if (error.code === 'P2002') {
      // 唯一约束违反
      const field = error.meta?.target?.[0] || '字段';
      return new DuplicateError(`${field}已存在`);
    }

    if (error.code === 'P2025') {
      // 记录不存在
      return new NotFoundError('记录不存在');
    }

    if (error.code === 'P2003') {
      // 外键约束违反
      return new BusinessError('关联数据不存在');
    }

    if (error.code === 'P2014') {
      // 关联记录被引用
      return new BusinessError('数据被其他记录引用，无法删除');
    }

    // 其他Prisma错误
    return new ApiError(500, '数据库操作失败', ErrorCode.SYSTEM_ERROR);
  },

  // 格式化Joi验证错误
  formatJoiError: (error: any): ValidationError => {
    const details = error.details?.map((detail: any) => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value,
    }));

    return new ValidationError('参数验证失败', details);
  },
};
