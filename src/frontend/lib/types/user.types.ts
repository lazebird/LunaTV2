/**
 * 共享用户类型定义
 */

export interface User {
  username: string;
  role: 'admin' | 'user';
  group?: string;
  createdAt?: number;
  lastLogin?: number;
  loginCount?: number;
  level?: number;
}

export interface UserSession {
  username: string;
  role: 'admin' | 'user';
  expiresAt: number;
}

export interface UserGroup {
  name: string;
  permissions: string[];
  allowedSources?: string[];
}
