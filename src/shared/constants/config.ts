/**
 * 共享配置常量
 */

export const STORAGE_TYPES = {
  FILESYSTEM: 'filesystem',
  REDIS: 'redis',
  KVROCKS: 'kvrocks',
  UPSTASH: 'upstash',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const MEDIA_ORIGINS = {
  VOD: 'vod',
  LIVE: 'live',
  SHORTDRAMA: 'shortdrama',
} as const;

export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 7200, // 2 hours
} as const;
