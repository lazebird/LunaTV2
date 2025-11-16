/**
 * 标准化的API响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: number;
  timestamp?: number;
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  code: number = 200
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    code,
    timestamp: Date.now(),
  };
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  error: string,
  code: number = 500,
  data?: any
): ApiResponse {
  return {
    success: false,
    error,
    code,
    data,
    timestamp: Date.now(),
  };
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 创建分页响应
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number,
  message?: string
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    success: true,
    data,
    message,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    timestamp: Date.now(),
  };
}

/**
 * API错误类
 */
export class ApiError extends Error {
  public code: number;
  public data?: any;

  constructor(message: string, code: number = 500, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.data = data;
  }
}

/**
 * 处理API错误
 */
export function handleApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 500);
  }

  return new ApiError('Unknown error', 500);
}

/**
 * 验证响应格式
 */
export function validateApiResponse<T>(
  response: any
): response is ApiResponse<T> {
  return (
    response &&
    typeof response === 'object' &&
    'success' in response &&
    typeof response.success === 'boolean'
  );
}

/**
 * 从响应中提取数据
 */
export function extractResponseData<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new ApiError(response.error || 'Request failed', response.code);
  }
  
  if (!response.data) {
    throw new ApiError('No data in response', 404);
  }
  
  return response.data;
}