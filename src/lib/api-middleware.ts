import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, ApiResponse } from './api-response';

/**
 * API中间件类型
 */
export type ApiMiddleware = (
  req: NextRequest,
  context?: any
) => Promise<NextResponse | void>;

/**
 * 组合中间件
 */
export function composeMiddleware(
  ...middlewares: ApiMiddleware[]
): ApiMiddleware {
  return async (req: NextRequest, context?: any) => {
    for (const middleware of middlewares) {
      const result = await middleware(req, context);
      if (result) {
        return result;
      }
    }
  };
}

/**
 * 认证中间件
 */
export function withAuth(
  getToken?: (req: NextRequest) => string | null
): ApiMiddleware {
  return async (req: NextRequest) => {
    const token = getToken ? getToken(req) : req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    // 这里可以添加token验证逻辑
    // const isValid = await validateToken(token);
    // if (!isValid) {
    //   return createErrorResponse('Invalid token', 401);
    // }

    // 将token信息添加到context中
    (req as any).token = token;
  };
}

/**
 * 方法限制中间件
 */
export function withMethods(allowedMethods: string[]): ApiMiddleware {
  return async (req: NextRequest) => {
    const method = req.method;
    
    if (!allowedMethods.includes(method)) {
      return createErrorResponse(`Method ${method} not allowed`, 405);
    }
  };
}

/**
 * CORS中间件
 */
export function withCors(
  origins: string[] = ['*'],
  methods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
): ApiMiddleware {
  return async (req: NextRequest) => {
    const origin = req.headers.get('origin');
    const allowedOrigin = origins.includes('*') ? '*' : 
                        origins.includes(origin || '') ? origin : 
                        origins[0];

    // 处理预检请求
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': methods.join(', '),
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // 将CORS头添加到响应中
    (req as any).corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': methods.join(', '),
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
  };
}

/**
 * 错误处理中间件
 */
export function withErrorHandler(handler: (req: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    try {
      const response = await handler(req, context);
      
      // 添加CORS头（如果存在）
      const corsHeaders = (req as any).corsHeaders;
      if (corsHeaders) {
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value as string);
        });
      }
      
      return response;
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof Error) {
        return createErrorResponse(error.message, 500);
      }
      
      return createErrorResponse('Internal server error', 500);
    }
  };
}

/**
 * 速率限制中间件（简单实现）
 */
export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 60000 // 1分钟
): ApiMiddleware {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (req: NextRequest) => {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    
    const requestData = requests.get(ip);
    
    if (!requestData || now > requestData.resetTime) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      return;
    }
    
    if (requestData.count >= maxRequests) {
      return createErrorResponse('Too many requests', 429);
    }
    
    requestData.count++;
  };
}

/**
 * 请求日志中间件
 */
export function withLogger(): ApiMiddleware {
  return async (req: NextRequest) => {
    const start = Date.now();
    const url = req.url;
    const method = req.method;
    
    // 记录请求开始
    console.log(`[${new Date().toISOString()}] ${method} ${url} - Start`);
    
    // 将结束时间记录到请求对象中
    (req as any).startTime = start;
    (req as any).logInfo = { url, method };
  };
}

/**
 * 响应日志中间件
 */
export function withResponseLogger(): ApiMiddleware {
  return async (req: NextRequest) => {
    const startTime = (req as any).startTime;
    const logInfo = (req as any).logInfo;
    
    if (startTime && logInfo) {
      const duration = Date.now() - startTime;
      console.log(
        `[${new Date().toISOString()}] ${logInfo.method} ${logInfo.url} - End (${duration}ms)`
      );
    }
  };
}