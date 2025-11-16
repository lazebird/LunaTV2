import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, ApiResponse } from './api-response';
import { composeMiddleware, withErrorHandler, withMethods, withCors, withLogger, withResponseLogger } from './api-middleware';

/**
 * API路由配置
 */
export interface ApiRouteConfig {
  methods?: string[];
  cors?: {
    origins?: string[];
    methods?: string[];
  };
  auth?: {
    required?: boolean;
    getToken?: (req: NextRequest) => string | null;
  };
  rateLimit?: {
    maxRequests?: number;
    windowMs?: number;
  };
  logging?: boolean;
}

/**
 * 创建API路由处理器
 */
export function createApiRoute<T = any>(
  handler: (req: NextRequest, context?: any) => Promise<T>,
  config: ApiRouteConfig = {}
) {
  const {
    methods = ['GET', 'POST', 'PUT', 'DELETE'],
    cors: { origins = ['*'], methods: corsMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] } = {},
    auth = { required: false },
    rateLimit = {},
    logging = true,
  } = config;

  // 构建中间件链
  const middlewares = [];

  // 添加日志中间件
  if (logging) {
    middlewares.push(withLogger());
  }

  // 添加CORS中间件
  middlewares.push(withCors(origins, corsMethods));

  // 添加方法限制
  middlewares.push(withMethods(methods));

  // 添加认证中间件
  if (auth.required) {
    const { withAuth } = require('./api-middleware');
    middlewares.push(withAuth(auth.getToken));
  }

  // 添加速率限制
  if (rateLimit.maxRequests) {
    const { withRateLimit } = require('./api-middleware');
    middlewares.push(withRateLimit(rateLimit.maxRequests, rateLimit.windowMs));
  }

  // 添加响应日志
  if (logging) {
    middlewares.push(withResponseLogger());
  }

  // 组合所有中间件
  const middleware = composeMiddleware(...middlewares);

  // 包装处理器
  const wrappedHandler = withErrorHandler(async (req: NextRequest, context?: any) => {
    // 执行中间件
    const middlewareResult = await middleware(req, context);
    if (middlewareResult) {
      return middlewareResult;
    }

    // 执行处理器
    const data = await handler(req, context);

    // 返回成功响应
    return NextResponse.json(
      createSuccessResponse(data)
    );
  });

  return wrappedHandler;
}

/**
 * 创建GET路由
 */
export function createGetRoute<T = any>(
  handler: (req: NextRequest, context?: any) => Promise<T>,
  config: Omit<ApiRouteConfig, 'methods'> = {}
) {
  return createApiRoute(handler, { ...config, methods: ['GET'] });
}

/**
 * 创建POST路由
 */
export function createPostRoute<T = any>(
  handler: (req: NextRequest, context?: any) => Promise<T>,
  config: Omit<ApiRouteConfig, 'methods'> = {}
) {
  return createApiRoute(handler, { ...config, methods: ['POST'] });
}

/**
 * 创建PUT路由
 */
export function createPutRoute<T = any>(
  handler: (req: NextRequest, context?: any) => Promise<T>,
  config: Omit<ApiRouteConfig, 'methods'> = {}
) {
  return createApiRoute(handler, { ...config, methods: ['PUT'] });
}

/**
 * 创建DELETE路由
 */
export function createDeleteRoute<T = any>(
  handler: (req: NextRequest, context?: any) => Promise<T>,
  config: Omit<ApiRouteConfig, 'methods'> = {}
) {
  return createApiRoute(handler, { ...config, methods: ['DELETE'] });
}

/**
 * 创建多方法路由
 */
export function createMultiMethodRoute<T = any>(
  handlers: Record<string, (req: NextRequest, context?: any) => Promise<T>>,
  config: ApiRouteConfig = {}
) {
  return createApiRoute(async (req: NextRequest, context?: any) => {
    const method = req.method;
    const handler = handlers[method];
    
    if (!handler) {
      throw new Error(`Method ${method} not supported`);
    }
    
    return await handler(req, context);
  }, config);
}

/**
 * 解析请求体
 */
export async function parseRequestBody<T = any>(req: NextRequest): Promise<T> {
  try {
    const contentType = req.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await req.json();
    }
    
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      const result: any = {};
      params.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData();
      const result: any = {};
      formData.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }
    
    // 默认尝试JSON解析
    return await req.json();
  } catch (error) {
    throw new Error('Invalid request body');
  }
}

/**
 * 获取查询参数
 */
export function getQueryParams(req: NextRequest): Record<string, string> {
  const { searchParams } = new URL(req.url);
  const params: Record<string, string> = {};
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
}

/**
 * 获取路径参数
 */
export function getPathParams(
  req: NextRequest,
  pattern: string
): Record<string, string> {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);
  
  const params: Record<string, string> = {};
  
  patternParts.forEach((part, index) => {
    if (part.startsWith(':') && pathParts[index]) {
      const paramName = part.substring(1);
      params[paramName] = pathParts[index];
    }
  });
  
  return params;
}