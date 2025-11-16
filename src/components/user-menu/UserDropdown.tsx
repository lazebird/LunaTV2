'use client';

import { useRouter } from 'next/navigation';
import {
  Bell,
  Calendar,
  ChartColumn,
  CirclePlay,
  Heart,
  LogOut,
  Shield,
  Tv,
  Settings,
} from 'lucide-react';

import { CURRENT_VERSION } from '@/lib/version';
import type { UserMenuData } from '@/hooks/useUserMenu';

interface UserDropdownProps {
  data: UserMenuData;
  onClose: () => void;
  onMarkUpdatesAsViewed: (updateIds: string[]) => void;
}

export default function UserDropdown({ data, onClose, onMarkUpdatesAsViewed }: UserDropdownProps) {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = 'auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    router.push('/login');
    onClose();
  };

  const handleMarkAllAsViewed = () => {
    const unviewedKeys = data.watchingUpdates
      .filter((_, index) => !_.viewed)
      .map((_, index) => `update-${index}`);
    if (unviewedKeys.length > 0) {
      onMarkUpdatesAsViewed(unviewedKeys);
    }
  };

  const menuItems = [
    {
      icon: Settings,
      label: '本地设置',
      href: '#',
      show: true,
      onClick: () => {
        // 打开本地设置弹窗
        const userMenuElement = document.querySelector('[data-user-menu]');
        if (userMenuElement) {
          // 通过自定义事件通知父组件打开设置弹窗
          const event = new CustomEvent('openSettings');
          userMenuElement.dispatchEvent(event);
        }
      },
    },
    {
      icon: Bell,
      label: '更新提醒',
      href: '#',
      show: data.isLoggedIn,
      onClick: () => {
        // 切换到更新通知标签
        if (typeof window !== 'undefined') {
          const userMenuElement = document.querySelector('[data-user-menu]');
          if (userMenuElement) {
            (userMenuElement as any).setActiveTab?.('updates');
          }
        }
      },
    },
    {
      icon: CirclePlay,
      label: '继续观看',
      href: '#',
      show: data.isLoggedIn && data.playRecords.length > 0,
      onClick: () => {
        // 切换到最近播放标签
        if (typeof window !== 'undefined') {
          const userMenuElement = document.querySelector('[data-user-menu]');
          if (userMenuElement) {
            (userMenuElement as any).setActiveTab?.('recent');
          }
        }
      },
    },
    {
      icon: Heart,
      label: '我的收藏',
      href: '/favorites',
      show: data.isLoggedIn,
    },
    {
      icon: Shield,
      label: '管理面板',
      href: '/admin',
      show: data.isOwner || data.isAdmin,
    },
    {
      icon: ChartColumn,
      label: '播放统计',
      href: '/play-stats',
      show: data.isLoggedIn,
    },
    {
      icon: Calendar,
      label: '上映日程',
      href: '/release-calendar',
      show: true,
    },
    {
      icon: Tv,
      label: 'TVBox 配置',
      href: '/tvbox',
      show: true,
    },
    {
      icon: LogOut,
      label: '登出',
      href: '#',
      show: data.isLoggedIn,
      onClick: handleLogout,
      danger: true,
    },
  ];

  const visibleItems = menuItems.filter(item => item.show);

  return (
    <div className="p-2">
      {/* 用户信息 */}
      {data.isLoggedIn && (
        <div className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/50">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">当前用户</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                {data.isOwner ? '站长' : data.isAdmin ? '管理员' : '用户'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                {data.username}
              </div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500">
                数据存储：{(window as any).RUNTIME_CONFIG?.STORAGE_TYPE || 'localstorage'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 菜单项 */}
      <div className="py-1">
        {visibleItems.map((item, index) => {
          const Icon = item.icon;
          
          return (
            <button
              key={index}
              onClick={(e) => {
                if (item.onClick) {
                  item.onClick();
                }
                if (item.href && item.href !== '#') {
                  window.location.href = item.href;
                }
                onClose();
              }}
              className={`w-full px-3 py-2 text-left flex items-center gap-2.5 transition-colors text-sm relative ${
                item.danger 
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 分隔线 */}
      <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>

      {/* 版本信息 */}
      <button className="w-full px-3 py-2 text-center flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-xs">
        <div className="flex items-center gap-1">
          <span className="font-mono">v{CURRENT_VERSION}</span>
          <div className="w-2 h-2 rounded-full -translate-y-2 bg-green-400"></div>
        </div>
      </button>
    </div>
  );
}