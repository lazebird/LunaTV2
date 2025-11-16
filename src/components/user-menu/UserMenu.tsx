'use client';

import { useState } from 'react';
import { ChevronDown, User } from 'lucide-react';
import { useUserMenu } from '@/hooks/useUserMenu';
import UserDropdown from '@/components/user-menu/UserDropdown';
import RecentPlays from '@/components/user-menu/RecentPlays';
import UpdateNotifications from '@/components/user-menu/UpdateNotifications';
import { VersionPanel } from '@/components/VersionPanel';

function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'updates'>('recent');
  const { data, refreshData, markUpdatesAsViewed } = useUserMenu();

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  return (
    <div className="relative">
      {/* 用户按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </div>
        {data.username && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
            {data.username}
          </span>
        )}
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {/* 更新通知徽章 */}
      {data.hasUnreadUpdates && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      )}

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleClose}
          />

          {/* 菜单内容 */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            {/* 标签页 */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('recent')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === 'recent'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                最近播放
              </button>
              <button
                onClick={() => setActiveTab('updates')}
                className={`flex-1 px-4 py-2 text-sm font-medium relative ${
                  activeTab === 'updates'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                更新通知
                {data.hasUnreadUpdates && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>

            {/* 标签页内容 */}
            <div className="max-h-96 overflow-y-auto">
              {activeTab === 'recent' && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      最近播放
                    </h3>
                    <button
                      onClick={handleRefresh}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      刷新
                    </button>
                  </div>
                  <RecentPlays records={data.recentRecords} />
                </div>
              )}

              {activeTab === 'updates' && (
                <div className="p-4">
                  <UpdateNotifications
                    updates={data.watchingUpdates}
                    onMarkAsViewed={markUpdatesAsViewed}
                  />
                </div>
              )}
            </div>

            {/* 用户下拉菜单 */}
            <UserDropdown
              data={data}
              onClose={handleClose}
              onMarkUpdatesAsViewed={markUpdatesAsViewed}
            />
          </div>
        </>
      )}

      {/* 版本更新面板 */}
      <VersionPanel isOpen={false} onClose={() => {}} />
    </div>
  );
}

export default UserMenu;