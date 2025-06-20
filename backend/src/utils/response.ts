/** 创建成功响应 */
export function createSuccessResponse<T = any>(data: T, message: string = '操作成功', path: string = '') {
  return {
    code: 0,
    data,
    message,
    path,
    timestamp: Date.now()
  };
}

/** 创建错误响应 */
export function createErrorResponse(code: number, message: string, data: any = null, path: string = '') {
  return {
    code,
    data,
    message,
    path,
    timestamp: Date.now()
  };
}
