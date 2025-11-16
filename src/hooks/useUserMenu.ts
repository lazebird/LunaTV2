import { useEffect, useState } from 'react';
import { getAuthInfoFromBrowserCookie } from '@/lib/auth';
import { checkForUpdates } from '@/lib/version_check';
import {
  getCachedWatchingUpdates,
  getDetailedWatchingUpdates,
  subscribeToWatchingUpdatesEvent,
  checkWatchingUpdates,
  markUpdatesAsViewed,
  type WatchingUpdate,
} from '@/lib/watching-updates';

// Extended type for individual update items
interface UpdateItem {
  id: string;
  viewed: boolean;
  timestamp: number;
  title: string;
  source_name: string;
  year: string;
  cover: string;
  sourceKey: string;
  videoId: string;
  currentEpisode: number;
  totalEpisodes: number;
  hasNewEpisode: boolean;
  hasContinueWatching: boolean;
  newEpisodes?: number;
  remainingEpisodes?: number;
  latestEpisodes?: number;
  remarks?: string;
}
import {
  getAllPlayRecords,
  forceRefreshPlayRecordsCache,
  type PlayRecord,
} from '@/lib/db.client';
import type { Favorite } from '@/lib/types';

interface AuthInfo {
  username?: string;
  role?: 'owner' | 'admin' | 'user';
}

export interface UserMenuData {
  authInfo: AuthInfo | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  username: string;
  playRecords: PlayRecord[];
  recentRecords: PlayRecord[];
  favorites: Favorite[];
  watchingUpdates: UpdateItem[];
  hasUnreadUpdates: boolean;
  updateStatus: any;
  isLoading: boolean;
}

export function useUserMenu() {
  const [data, setData] = useState<UserMenuData>({
    authInfo: null,
    isLoggedIn: false,
    isAdmin: false,
    isOwner: false,
    username: '',
    playRecords: [],
    recentRecords: [],
    favorites: [],
    watchingUpdates: [],
    hasUnreadUpdates: false,
    updateStatus: null,
    isLoading: true,
  });

  const loadData = async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true }));

      // 获取认证信息
      const authInfo = getAuthInfoFromBrowserCookie();
      const isLoggedIn = !!authInfo?.username;
      const isAdmin = authInfo?.role === 'admin' || authInfo?.role === 'owner';
      const isOwner = authInfo?.role === 'owner';
      const username = authInfo?.username || '';

      let playRecords: PlayRecord[] = [];
      let favorites: Favorite[] = [];
      let watchingUpdates: UpdateItem[] = [];

      if (isLoggedIn) {
        // 并行加载数据
        const [recordsResult, updatesResult] = await Promise.allSettled([
          getAllPlayRecords(),
          getDetailedWatchingUpdates(),
        ]);

        if (recordsResult.status === 'fulfilled') {
          playRecords = Object.values(recordsResult.value);
          favorites = Object.values(recordsResult.value).filter(
            record => record.total_episodes > 0
          ) as Favorite[];
        }

        if (updatesResult.status === 'fulfilled') {
          // Convert the single WatchingUpdate object to an array of update items
          const update = updatesResult.value;
          if (update && update.updatedSeries) {
            watchingUpdates = update.updatedSeries.map((series, index) => ({
              ...series,
              id: `update-${index}`,
              viewed: false, // Default to not viewed
              timestamp: update.timestamp
            }));
          }
        }
      }

      const recentRecords = playRecords
        .sort((a, b) => b.save_time - a.save_time)
        .slice(0, 5);

      const hasUnreadUpdates = watchingUpdates.some(update => update.viewed === false);

      // 检查更新
      const updateStatus = await checkForUpdates();

      setData({
        authInfo,
        isLoggedIn,
        isAdmin,
        isOwner,
        username,
        playRecords,
        recentRecords,
        favorites,
        watchingUpdates,
        hasUnreadUpdates,
        updateStatus,
        isLoading: false,
      });
    } catch (error) {
      console.error('加载用户菜单数据失败:', error);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToWatchingUpdatesEvent(() => {
      loadData();
    });

    return unsubscribe;
  }, []);

  const refreshData = async () => {
    await forceRefreshPlayRecordsCache();
    await checkWatchingUpdates();
    await loadData();
  };

  const handleMarkUpdatesAsViewed = async (updateKeys: string[]) => {
    try {
      markUpdatesAsViewed(); // This doesn't take any arguments
      await loadData();
    } catch (error) {
      console.error('标记更新失败:', error);
    }
  };

  return {
    data,
    refreshData,
    markUpdatesAsViewed,
  };
}