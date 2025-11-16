/* eslint-disable no-console */

import { NextRequest, NextResponse } from 'next/server';

import { AdminConfig, AdminConfigResult } from '@/backend/lib/admin.types';
import { clearConfigCache, getConfig } from '@/backend/lib/config';
import { db } from '@/backend/lib/db';
import { 
  validateAuth, 
  createErrorResponse, 
  createSuccessResponse,
  handleApiError 
} from '@/backend/lib/api-utils';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';
  if (storageType === 'localstorage') {
    return createErrorResponse('不支持本地存储进行管理员配置', 400);
  }

  // 验证用户认证
  const authValidation = validateAuth(request);
  if (!authValidation.success) {
    return createErrorResponse(authValidation.error!, authValidation.status);
  }

  try {
    const config = await getConfig();
    const username = authValidation.authInfo!.username;
    
    // 确定用户角色
    let role: 'owner' | 'admin';
    if (username === process.env.USERNAME) {
      role = 'owner';
    } else {
      const user = config.UserConfig.Users.find((u) => u.username === username);
      if (user && user.role === 'admin' && !user.banned) {
        role = 'admin';
      } else {
        return createErrorResponse('你是管理员吗你就访问？', 401);
      }
    }

    const result: AdminConfigResult = {
      Role: role,
      Config: config,
    };

    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error, 'AdminConfig.GET');
  }
}

export async function POST(request: NextRequest) {
  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';
  if (storageType === 'localstorage') {
    return createErrorResponse('不支持本地存储进行管理员配置', 400);
  }

  // 验证用户认证
  const authValidation = validateAuth(request);
  if (!authValidation.success) {
    return createErrorResponse(authValidation.error!, authValidation.status);
  }
  const username = authValidation.authInfo!.username;

  // 只有站长可以修改配置
  if (username !== process.env.USERNAME) {
    return createErrorResponse('只有站长可以修改配置', 403);
  }

  try {
    const newConfig: AdminConfig = await request.json();
    
    // 保存新配置
    await db.saveAdminConfig(newConfig);
    
    // 清除缓存，强制下次重新从数据库读取
    clearConfigCache();
    
    return createSuccessResponse({ success: true });
  } catch (error) {
    return handleApiError(error, 'AdminConfig.POST');
  }
}
