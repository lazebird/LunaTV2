/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */
'use client';

/**
 * 仅在浏览器端使用的数据库工具，目前基于 localStorage 实现。
 * 之所以单独拆分文件，是为了避免在客户端 bundle 中引入 `fs`, `path` 等 Node.js 内置模块，
 * 从而解决诸如 "Module not found: Can't resolve 'fs'" 的问题。
 *
 * 功能：
 * 1. 获取全部播放记录（getAllPlayRecords）。
 * 2. 保存播放记录（savePlayRecord）。
 * 3. 数据库存储模式下的混合缓存策略，提升用户体验。
 *
 * 如后续需要在客户端读取收藏等其它数据，可按同样方式在此文件中补充实现。
 */

import { getAuthInfoFromBrowserCookie } from './auth';
import type { PlayRecord, SkipSegment, EpisodeSkipConfig } from './types';
import { forceClearWatchingUpdatesCache } from './watching-updates';

// 重新导出所有模块
export * from './db/play-records';
export * from './db/favorites';
export * from './db/search-history';
export * from './db/user-stats';
export * from './db/skip-configs';

// 为了兼容性，导出一些特定函数
export { getAllSearchHistory as getSearchHistory } from './db/search-history';

// 创建 forceRefreshPlayRecordsCache 函数
export async function forceRefreshPlayRecordsCache(): Promise<void> {
  // 清理缓存，下次使用时会重新加载
  if (typeof window !== 'undefined') {
    localStorage.removeItem('lunatv_play_records_v2');
  }
}

// 重新导出类型以保持API兼容性
export type { PlayRecord, SkipSegment, EpisodeSkipConfig } from './types';

// 为了向后兼容，保留UserStats类型别名
export type { UserPlayStat as UserStats } from './types';

// 全局错误触发函数
function triggerGlobalError(message: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('globalError', {
        detail: { message },
      })
    );
  }
}

// 获取当前用户ID
export function getCurrentUserId(): string {
  try {
    const authInfo = getAuthInfoFromBrowserCookie();
    return authInfo?.username || 'anonymous';
  } catch (error) {
    console.error('获取用户ID失败:', error);
    return 'anonymous';
  }
}

// 清理过期数据
export async function cleanupExpiredData(): Promise<void> {
  try {
    // 清理过期的搜索历史
    const { cleanupExpiredSearchHistory } = await import('./db/search-history');
    await cleanupExpiredSearchHistory();
    
    // 清理过期的缓存
    const { ClientCache } = await import('./client-cache');
    await ClientCache.clearExpired('danmu-cache');
    
    console.log('过期数据清理完成');
  } catch (error) {
    console.error('清理过期数据失败:', error);
  }
}

// 导出数据（用于备份）
export async function exportUserData(): Promise<{
  playRecords: Record<string, PlayRecord>;
  favorites: Record<string, any>;
  searchHistory: any[];
  userStats: any;
  skipConfigs: Record<string, EpisodeSkipConfig>;
}> {
  try {
    const [
      { getAllPlayRecords },
      { getAllFavorites },
      { getAllSearchHistory },
      { getUserStats },
      { getAllSkipConfigs },
    ] = await Promise.all([
      import('./db/play-records'),
      import('./db/favorites'),
      import('./db/search-history'),
      import('./db/user-stats'),
      import('./db/skip-configs'),
    ]);

    const [playRecords, favorites, searchHistory, userStats, skipConfigs] = await Promise.all([
      getAllPlayRecords(),
      getAllFavorites(),
      getAllSearchHistory(),
      getUserStats(),
      getAllSkipConfigs(),
    ]);

    return {
      playRecords,
      favorites,
      searchHistory,
      userStats,
      skipConfigs,
    };
  } catch (error) {
    console.error('导出用户数据失败:', error);
    throw error;
  }
}

// 导入数据（用于恢复）
export async function importUserData(data: {
  playRecords?: Record<string, PlayRecord>;
  favorites?: Record<string, any>;
  searchHistory?: any[];
  userStats?: any;
  skipConfigs?: Record<string, EpisodeSkipConfig>;
}): Promise<void> {
  try {
    if (!data) return;

    const imports = [];

    if (data.playRecords) {
      imports.push(
        import('./db/play-records').then(({ clearAllPlayRecords }) => clearAllPlayRecords())
          .then(() => {
            const promises = Object.entries(data.playRecords!).map(([key, record]) => {
              const [source, id] = key.split('+');
              return import('./db/play-records').then(({ savePlayRecord }) =>
                savePlayRecord(source, id, record)
              );
            });
            return Promise.all(promises);
          })
      );
    }

    if (data.favorites) {
      imports.push(
        import('./db/favorites').then(({ clearAllFavorites }) => clearAllFavorites())
          .then(() => {
            const promises = Object.entries(data.favorites!).map(([key, favorite]) => {
              const [source, id] = key.split('+');
              return import('./db/favorites').then(({ saveFavorite }) =>
                saveFavorite(source, id, favorite)
              );
            });
            return Promise.all(promises);
          })
      );
    }

    if (data.searchHistory) {
      imports.push(
        import('./db/search-history').then(({ clearSearchHistory }) => clearSearchHistory())
          .then(() => {
            const promises = data.searchHistory!.map(item =>
              import('./db/search-history').then(({ addSearchHistory }) =>
                addSearchHistory(item.query, item.type, item.resultCount)
              )
            );
            return Promise.all(promises);
          })
      );
    }

    if (data.userStats) {
      imports.push(
        import('./db/user-stats').then(({ updateUserStats }) =>
          updateUserStats(data.userStats!)
        )
      );
    }

    if (data.skipConfigs) {
      imports.push(
        Promise.all(
          Object.entries(data.skipConfigs!).map(([key, config]) =>
            import('./db/skip-configs').then(({ saveSkipConfig }) =>
              saveSkipConfig(key, config)
            )
          )
        )
      );
    }

    await Promise.all(imports);
    console.log('用户数据导入完成');
  } catch (error) {
    console.error('导入用户数据失败:', error);
    throw error;
  }
}

// 重置所有数据
export async function resetAllData(): Promise<void> {
  try {
    const [
      { clearAllPlayRecords },
      { clearAllFavorites },
      { clearSearchHistory },
      { resetUserStats },
      { clearAllSkipConfigs },
    ] = await Promise.all([
      import('./db/play-records'),
      import('./db/favorites'),
      import('./db/search-history'),
      import('./db/user-stats'),
      import('./db/skip-configs'),
    ]);

    await Promise.all([
      clearAllPlayRecords(),
      clearAllFavorites(),
      clearSearchHistory(),
      resetUserStats(),
      clearAllSkipConfigs(),
    ]);

    // 清理缓存
    await cleanupExpiredData();
    forceClearWatchingUpdatesCache();

    console.log('所有数据已重置');
  } catch (error) {
    console.error('重置数据失败:', error);
    throw error;
  }
}