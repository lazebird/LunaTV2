'use client';

import { Bell, Check, X } from 'lucide-react';

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

interface UpdateNotificationsProps {
  updates: UpdateItem[];
  onMarkAsViewed: (updateIds: string[]) => void;
}

export default function UpdateNotifications({ updates, onMarkAsViewed }: UpdateNotificationsProps) {
  const unreadUpdates = updates.filter(update => !update.viewed);
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const handleMarkAsViewed = (updateKey: string) => {
    onMarkAsViewed([updateKey]);
  };

  const handleMarkAllAsViewed = () => {
    const unviewedKeys = unreadUpdates.map((_, index) => `update-${index}`);
    if (unviewedKeys.length > 0) {
      onMarkAsViewed(unviewedKeys);
    }
  };

  if (updates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>暂无更新通知</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 批量操作 */}
      {unreadUpdates.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleMarkAllAsViewed}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            全部标记已读
          </button>
        </div>
      )}
      
      {/* 通知列表 */}
      {updates.map((update, index) => {
        const isUnread = !update.viewed;
        const key = `update-${index}`;
        
        return (
          <div
            key={key}
            className={`p-3 rounded-lg border transition-all ${
              isUnread
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {update.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {update.hasNewEpisode ? `有${update.newEpisodes || 0}集新更新` : '需要继续观看'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {formatDate(update.timestamp)}
                </p>
              </div>
              
              <div className="flex items-center space-x-2 ml-3">
                {isUnread && (
                  <button
                onClick={() => handleMarkAsViewed(key)}
                className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                title="标记已读"
              >
                <Check className="w-4 h-4" />
              </button>
                )}
                <span
                  className={`w-2 h-2 rounded-full ${
                    isUnread ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  title={isUnread ? '未读' : '已读'}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}