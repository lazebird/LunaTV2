/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */
'use client';

import { getAuthInfoFromBrowserCookie } from '../auth';
import type { PlayRecord, SkipSegment, EpisodeSkipConfig } from '../types';
import { forceClearWatchingUpdatesCache } from '../watching-updates';

// 重新导出所有模块
export * from './favorite';
export * from './play-records';
export * from './playRecord';
export * from './search-history';
export * from './skip-configs';
export * from './user-stats';
export * from './user';

// 重新导出类型以保持API兼容性
export type { PlayRecord, SkipSegment, EpisodeSkipConfig } from '../types';

// 为了向后兼容，保留UserStats类型别名
export type { UserPlayStat as UserStats } from '../types';

// 清理过期数据
export async function cleanupExpiredData() {
  try {
    // 清理过期的搜索历史
    const { cleanupExpiredSearchHistory } = await import('./search-history');
    await cleanupExpiredSearchHistory();
    
    // 清理过期的缓存
    // 缓存清理由各个代理路由自行处理
    
    console.log('过期数据清理完成');
  } catch (error) {
    console.error('清理过期数据失败:', error);
  }
}

// 批量导入数据
export async function importData(data: any) {
  if (!data) return;

  const imports = [];

  if (data.playRecords) {
    imports.push(
      import('./play-records').then(({ clearAllPlayRecords }) => clearAllPlayRecords())
        .then(() => {
          const promises = Object.entries(data.playRecords!).map(([key, record]) => {
            const [source, id] = key.split('+');
            return import('./play-records').then(({ savePlayRecord }) =>
              savePlayRecord(source, id, record as any)
            );
          });
          return Promise.all(promises);
        })
    );
  }

  if (data.favorites) {
    imports.push(
      import('./favorites').then(({ clearAllFavorites }) => clearAllFavorites())
        .then(() => {
          const promises = Object.entries(data.favorites!).map(([key, item]) => {
            const [source, id] = key.split('+');
            return import('./favorites').then(({ saveFavorite }) =>
              saveFavorite(source, id, item as any)
            );
          });
          return Promise.all(promises);
        })
    );
  }

  if (data.searchHistory) {
    // clearAllSearchHistory not implemented
    imports.push(
      Promise.resolve().then(() => {
        const promises = data.searchHistory!.map((item: any) =>
          import('./search-history').then(({ addSearchHistory }) => {
            return addSearchHistory(item.query, item.type, item.resultCount);
          })
        );
        return Promise.all(promises);
      })
    );
  }

  if (data.userStats) {
    imports.push(
      import('./user-stats').then(({ updateUserStats }) => {
        return updateUserStats(data.userStats!);
      })
    );
  }

  if (data.skipConfigs) {
    const { clearAllSkipConfigs } = await import('./skip-configs');
    imports.push(clearAllSkipConfigs());
    
    const promises = Object.entries(data.skipConfigs!).map(([key, config]) =>
      import('./skip-configs').then(({ saveSkipConfig }) =>
        saveSkipConfig(key, config as any)
      )
    );
    imports.push(Promise.all(promises));
  }

  await Promise.all(imports);
}

// 保存播放记录
export async function savePlayRecord(
  source: string,
  id: string,
  record: Omit<PlayRecord, 'source' | 'id'>
) {
  const { savePlayRecord } = await import('./play-records');
  return savePlayRecord(source, id, record);
}

// 保存收藏
export async function saveFavorite(
  source: string,
  id: string,
  item: any
) {
  const { saveFavorite } = await import('./favorites');
  return saveFavorite(source, id, item);
}

// 保存搜索历史
export async function saveSearchHistory(
  query: string,
  type?: string,
  resultCount?: number
) {
  const { addSearchHistory } = await import('./search-history');
  return addSearchHistory(query, type as any, resultCount);
}

// 保存用户统计
export async function saveUserStats(stats: any) {
  const { updateUserStats } = await import('./user-stats');
  return updateUserStats(stats);
}

// 保存跳过配置
export async function saveSkipConfig(
  key: string,
  config: EpisodeSkipConfig
) {
  const { saveSkipConfig } = await import('./skip-configs');
  return saveSkipConfig(key, config);
}