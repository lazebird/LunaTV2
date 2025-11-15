/* eslint-disable no-console */

import { NextRequest } from 'next/server';
import { getAuthInfoFromCookie } from '@/lib/auth';

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
  return Response.json({ error }, { status });
}

/**
 * 创建标准化的成功响应
 */
export function createSuccessResponse<T>(data: T, status: number = 200) {
  return Response.json(data, { status });
}

/**
 * 创建带有缓存头部的响应
 */
export function createCachedResponse<T>(data: T, cacheTime: number) {
  return Response.json(data, {
    headers: {
      'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
      'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
      'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
      'Netlify-Vary': 'query',
    },
  });
}

/**
 * 验证请求参数
 */
export function validateRequiredParams(params: Record<string, string | null>, required: string[]) {
  const missing = required.filter(key => !params[key] || params[key]!.trim() === '');
  
  if (missing.length > 0) {
    return {
      success: false,
      error: `Missing required parameters: ${missing.join(', ')}`
    };
  }
  
  return { success: true };
}

/**
 * 处理API错误的通用函数
 */
export function handleApiError(error: any, context: string) {
  console.error(`[${context}] Error:`, error);
  
  if (error.name === 'ValidationError') {
    return createErrorResponse(error.message, 400);
  }
  
  if (error.name === 'UnauthorizedError') {
    return createErrorResponse('Unauthorized', 401);
  }
  
  if (error.name === 'NotFoundError') {
    return createErrorResponse('Resource not found', 404);
  }
  
  return createErrorResponse('Internal server error', 500);
}

/**
 * 带超时的Promise包装器
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
    )
  ]);
}

/**
 * 重试函数
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries) {
        console.warn(`Retry ${i + 1}/${maxRetries} after error:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
}