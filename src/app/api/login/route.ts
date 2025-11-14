/* eslint-disable no-console,@typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

import { getConfig } from '@/lib/config';
import db from '@/lib/db';

export const runtime = 'nodejs';

// 读取存储类型环境变量，默认 file
const STORAGE_TYPE =
  (process.env.NEXT_PUBLIC_STORAGE_TYPE as
    | 'file'
    | 'localstorage'
    | 'redis'
    | 'upstash'
    | 'kvrocks'
    | 'cf-kv'
    | undefined) || 'file';

// 生成签名
async function generateSignature(
  data: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  // 导入密钥
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // 生成签名
  const signature = await crypto.subtle.sign('HMAC', key, messageData);

  // 转换为十六进制字符串
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// 生成认证Cookie（带签名）
async function generateAuthCookie(
  username?: string,
  password?: string,
  role?: 'owner' | 'admin' | 'user',
  includePassword = false
): Promise<string> {
  const authData: any = { role: role || 'user' };

  // 只在需要时包含 password
  if (includePassword && password) {
    authData.password = password;
  }

  if (username && process.env.PASSWORD) {
    authData.username = username;
    // 使用密码作为密钥对用户名进行签名
    const signature = await generateSignature(username, process.env.PASSWORD);
    authData.signature = signature;
    authData.timestamp = Date.now(); // 添加时间戳防重放攻击
    authData.loginTime = Date.now(); // 添加登入时间记录
  }

  return encodeURIComponent(JSON.stringify(authData));
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // 检查是否设置了环境变量 USERNAME 和 PASSWORD
    const envUsername = process.env.USERNAME;
    const envPassword = process.env.PASSWORD;
    console.log('环境变量检查:', { envUsername, envPassword });

    // 如果设置了环境变量，优先使用环境变量进行验证
    if (envUsername && envPassword && envUsername.trim() !== '' && envPassword.trim() !== '') {
      console.log('使用环境变量验证:', { 
        inputUsername: username, 
        inputPassword: password,
        envUsername,
        envPassword
      });
      
      if (username === envUsername && password === envPassword) {
        console.log('环境变量验证成功');
        // 验证成功，设置认证cookie
        const response = NextResponse.json({ ok: true });
        const cookieValue = await generateAuthCookie(
          username,
          password,
          'owner',
          false
        ); // 数据库模式不包含 password
        const expires = new Date();
        expires.setDate(expires.getDate() + 7); // 7天过期

        response.cookies.set('user_auth', cookieValue, {
          path: '/',
          expires,
          sameSite: 'lax', // 改为 lax 以支持 PWA
          httpOnly: false, // PWA 需要客户端可访问
          secure: false, // 根据协议自动设置
        });

        return response;
      } else {
        console.log('环境变量验证失败');
        // 环境变量验证失败，返回错误
        return NextResponse.json(
          { error: '用户名或密码错误' },
          { status: 401 }
        );
      }
    }

    // 如果没有设置环境变量，使用数据库验证
    console.log('使用数据库验证');
    const config = await getConfig();
    const user = config.UserConfig.Users.find((u) => u.username === username);
    if (user && user.banned) {
      return NextResponse.json({ error: '用户被封禁' }, { status: 401 });
    }

    // 校验用户密码
    try {
      const pass = await db.verifyUser(username, password);
      console.log('数据库验证结果:', pass);
      if (!pass) {
        return NextResponse.json(
          { error: '用户名或密码错误' },
          { status: 401 }
        );
      }

      // 验证成功，设置认证cookie
      const response = NextResponse.json({ ok: true });
      const cookieValue = await generateAuthCookie(
        username,
        password,
        user?.role || 'user',
        false
      ); // 数据库模式不包含 password
      const expires = new Date();
      expires.setDate(expires.getDate() + 7); // 7天过期

      response.cookies.set('user_auth', cookieValue, {
        path: '/',
        expires,
        sameSite: 'lax', // 改为 lax 以支持 PWA
        httpOnly: false, // PWA 需要客户端可访问
        secure: false, // 根据协议自动设置
      });

      return response;
    } catch (error) {
      console.error('数据库验证失败', error);
      return NextResponse.json(
        { error: '服务器内部错误' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('登录处理失败', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
