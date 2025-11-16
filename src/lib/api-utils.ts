/* eslint-disable no-console */

import { NextRequest } from 'next/server';
import { getAuthInfoFromCookie } from './auth';

/**
 * API通用工具函数
 */

/**
 * 验证用户认证
 */
export function validateAuth(request: NextRequest) {
  const authInfo = getAuthInfoFromCookie(request);
  if (!authInfo || !authInfo.username) {
    return {
      success: false,
      error: 'Unauthorized',
      status: 401,
      authInfo: null
    };
  }
  return {
    success: true,
    error: null,
    status: 200,
    authInfo
  };
}

/**
 * 创建标准化的错误响应
 */
export function createErrorResponse(error: string, status: number = 500) {
  return new Response(JSON.stringify({ error }), { 
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * 创建标准化的成功响应
 */
export function createSuccessResponse<T>(data: T, status: number = 200) {
  return new Response(JSON.stringify(data), { 
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * 创建带有缓存头部的响应
 */
export function createCachedResponse<T>(data: T, cacheTime: number) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
      'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
      'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
      'Netlify-Vary': 'query',
    },
  });
}

/**
 * 解析请求体
 */
export async function parseRequestBody<T = any>(request: NextRequest): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * 验证必需的参数
 */
export function validateRequiredParams(params: Record<string, any>, required: string[]): string[] {
  const missing: string[] = [];
  
  for (const param of required) {
    if (!params[param]) {
      missing.push(param);
    }
  }
  
  return missing;
}

/**
 * 创建分页响应
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total?: number
) {
  const totalPages = Math.ceil((total || data.length) / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = data.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    pagination: {
      page,
      pageSize,
      total: total || data.length,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * 重试机制装饰器
 */
export function withRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  maxRetries: number = 3,
  delay: number = 1000
) {
  return async (...args: T): Promise<R> => {
    let lastError: any;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        if (i < maxRetries) {
          console.warn(`Retry ${i + 1}/${maxRetries} after error:`, error instanceof Error ? error.message : String(error));
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError;
  };
}

/**
 * 缓存装饰器
 */
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  cacheTimeMs: number = 5 * 60 * 1000 // 5分钟默认缓存
) {
  const cache = new Map<string, { data: R; timestamp: number }>();
  
  return async (...args: T): Promise<R> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < cacheTimeMs) {
      return cached.data;
    }
    
    const data = await fn(...args);
    cache.set(key, { data, timestamp: Date.now() });
    
    return data;
  };
}

/**
 * 错误处理装饰器
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorHandler?: (error: any) => Response | void
) {
  return async (...args: T): Promise<Response> => {
    try {
      const result = await fn(...args);
      if (result instanceof Response) {
        return result;
      }
      return createSuccessResponse(result);
    } catch (error) {
      console.error('API Error:', error);
      
      if (errorHandler) {
        const handled = errorHandler(error);
        if (handled) return handled;
      }
      
      const message = error instanceof Error ? error.message : 'Internal server error';
      const status = (error as any).status || 500;
      
      return createErrorResponse(message, status);
    }
  };
}

/**
 * CORS 预检处理
 */
export function handleCors(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  const headers = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  
  return headers;
}

/**
 * 限制请求频率
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60 * 1000 // 1分钟
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const timestamps = this.requests.get(identifier)!;
    
    // 清理过期的请求记录
    const validTimestamps = timestamps.filter(time => time > windowStart);
    this.requests.set(identifier, validTimestamps);
    
    // 检查是否超过限制
    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }
    
    // 记录当前请求
    validTimestamps.push(now);
    return true;
  }
}

/**
 * 处理API错误
 */
export function handleApiError(error: unknown, defaultMessage: string = 'Internal Server Error') {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    return createErrorResponse(error.message, 500);
  }
  
  return createErrorResponse(defaultMessage, 500);
}

/**
 * 为Promise添加超时
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
}