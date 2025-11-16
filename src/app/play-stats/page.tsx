'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUp } from 'lucide-react';

import { getAuthInfoFromBrowserCookie } from '@/frontend/lib/auth';
import { PlayRecord } from '@/frontend/lib/types';
import { getAllPlayRecords } from '@/frontend/lib/db.client';
import {
  getCachedWatchingUpdates,
  getDetailedWatchingUpdates,
  checkWatchingUpdates,
  markUpdatesAsViewed,
  forceClearWatchingUpdatesCache,
  type WatchingUpdate,
} from '@/frontend/lib/watching-updates';

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

import PageLayout from '@/frontend/components/PageLayout';
import VideoCard from '@/frontend/components/VideoCard';
import StatsOverview from '@/frontend/components/play-stats/StatsOverview';
import PlayRecordsList from '@/frontend/components/play-stats/PlayRecordsList';
import WatchTimeChart from '@/frontend/components/play-stats/WatchTimeChart';

// 返回顶部组件
const BackToTop = ({ show }: { show: boolean }) => {
  if (!show) return null;
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      aria-label="返回顶部"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
};

function PlayStatsPage() {
  const router = useRouter();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<PlayRecord[]>([]);
  const [watchingUpdates, setWatchingUpdates] = useState<UpdateItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<'stats' | 'history' | 'updates'>('stats');
  const [loginCount, setLoginCount] = useState(0);

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 加载播放记录
      const allRecords = await getAllPlayRecords();
      const recordsArray = Object.values(allRecords);
      setRecords(recordsArray);

      // 加载观看更新
      const updates = await getDetailedWatchingUpdates();
      if (updates && updates.updatedSeries) {
        const updateItems = updates.updatedSeries.map((series, index) => ({
          ...series,
          id: `update-${index}`,
          viewed: false,
          timestamp: updates.timestamp
        }));
        setWatchingUpdates(updateItems);
      } else {
        setWatchingUpdates([]);
      }

      // 获取登录次数（这里简化处理，实际可能需要从其他地方获取）
      const authInfo = getAuthInfoFromBrowserCookie();
      setLoginCount(recordsArray.length);
    } catch (err) {
      console.error('加载数据失败:', err);
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 标记更新为已查看
  const handleMarkAsViewed = async () => {
    try {
      // Mark all updates as viewed in the local state
      setWatchingUpdates(prev => prev.map(update => ({ ...update, viewed: true })));
      // Also mark as viewed in the watching-updates system
      markUpdatesAsViewed();
      await loadData(); // 重新加载数据
    } catch (err) {
      console.error('标记失败:', err);
    }
  };

  // 检查更新
  const handleCheckUpdates = async () => {
    try {
      await checkWatchingUpdates();
      await loadData(); // 重新加载数据
    } catch (err) {
      console.error('检查更新失败:', err);
    }
  };

  // 清理缓存
  const handleClearCache = async () => {
    try {
      forceClearWatchingUpdatesCache();
      await loadData(); // 重新加载数据
    } catch (err) {
      console.error('清理缓存失败:', err);
    }
  };

  // 加载状态
  if (loading) {
    return (
      <PageLayout activePath="/play-stats">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">加载中...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // 错误状态
  if (error) {
    return (
      <PageLayout activePath="/play-stats">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-600 mb-4">⚠️</div>
            <p className="text-gray-900 dark:text-gray-100 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout activePath="/play-stats">
      <div className="space-y-6 py-4 px-5 lg:px-[3rem] 2xl:px-20">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            观看统计
          </h1>
          
          <div className="flex space-x-2">
            <button
              onClick={handleCheckUpdates}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              检查更新
            </button>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              清理缓存
            </button>
          </div>
        </div>

        {/* 标签页 */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedTab('stats')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'stats'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              统计概览
            </button>
            <button
              onClick={() => setSelectedTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'history'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              观看历史
            </button>
            <button
              onClick={() => setSelectedTab('updates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'updates'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              更新通知
              {watchingUpdates.some(u => !u.viewed) && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  新
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* 标签页内容 */}
        {selectedTab === 'stats' && (
          <div className="space-y-6">
            <StatsOverview records={records} loginCount={loginCount} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WatchTimeChart records={records} />
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  快速操作
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/favorites')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    查看收藏
                  </button>
                  <button
                    onClick={() => router.push('/search')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    搜索影片
                  </button>
                  <button
                    onClick={() => router.push('/release-calendar')}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    上映日历
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'history' && (
          <PlayRecordsList records={records.slice(0, 50)} />
        )}

        {selectedTab === 'updates' && (
          <div className="space-y-4">
            {watchingUpdates.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                暂无更新通知
              </div>
            ) : (
              watchingUpdates.map((update) => (
                <div
                  key={update.id}
                  className={`p-4 rounded-lg border ${
                    update.viewed
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {update.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {update.hasNewEpisode ? `有${update.newEpisodes || 0}集新更新` : '需要继续观看'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {new Date(update.timestamp).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    {!update.viewed && (
                      <button
                        onClick={handleMarkAsViewed}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        标记已读
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {watchingUpdates.some(u => !u.viewed) && (
              <div className="flex justify-center">
                <button
                  onClick={handleMarkAsViewed}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  全部标记已读
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <BackToTop show={showBackToTop} />
    </PageLayout>
  );
}

export default PlayStatsPage;