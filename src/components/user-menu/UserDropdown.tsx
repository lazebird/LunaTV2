'use client';

import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Bell,
  Calendar,
  ExternalLink,
  Heart,
  KeyRound,
  LogOut,
  PlayCircle,
  Settings,
  Shield,
  Tv,
  User,
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
      icon: User,
      label: '个人中心',
      href: '/profile',
      show: data.isLoggedIn,
    },
    {
      icon: PlayCircle,
      label: '播放统计',
      href: '/play-stats',
      show: data.isLoggedIn,
      badge: data.playRecords.length > 0 ? data.playRecords.length : undefined,
    },
    {
      icon: Heart,
      label: '我的收藏',
      href: '/favorites',
      show: data.isLoggedIn,
      badge: data.favorites.length > 0 ? data.favorites.length : undefined,
    },
    {
      icon: Calendar,
      label: '上映日历',
      href: '/release-calendar',
      show: true,
    },
    {
      icon: Tv,
      label: '直播',
      href: '/live',
      show: true,
    },
    {
      icon: Bell,
      label: '更新通知',
      href: '#',
      show: data.isLoggedIn,
      onClick: handleMarkAllAsViewed,
    },
    {
      icon: BarChart3,
      label: '数据统计',
      href: '/admin/stats',
      show: data.isAdmin,
    },
    {
      icon: Settings,
      label: '系统设置',
      href: '/admin',
      show: data.isAdmin,
    },
    {
      icon: KeyRound,
      label: 'API密钥',
      href: '/admin/user-tvbox-token',
      show: data.isOwner,
    },
    {
      icon: Shield,
      label: '安全中心',
      href: '/tvbox-security',
      show: data.isOwner,
    },
    {
      icon: ExternalLink,
      label: '项目主页',
      href: 'https://github.com/lazebird/LunaTV2',
      show: true,
      external: true,
    },
    {
      icon: LogOut,
      label: '退出登录',
      href: '#',
      show: data.isLoggedIn,
      onClick: handleLogout,
      danger: true,
    },
  ];

  const visibleItems = menuItems.filter(item => item.show);

  return (
    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
      {/* 用户信息 */}
      {data.isLoggedIn && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {data.username}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {data.isOwner ? '所有者' : data.isAdmin ? '管理员' : '用户'}
          </p>
        </div>
      )}

      {/* 菜单项 */}
      {visibleItems.map((item, index) => {
        const Icon = item.icon;
        
        return (
          <a
            key={index}
            href={item.href}
            onClick={(e) => {
              if (item.onClick) {
                e.preventDefault();
                item.onClick();
              }
              if (!item.external) {
                onClose();
              }
            }}
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noopener noreferrer' : undefined}
            className={`flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4 mr-3" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                {item.badge}
              </span>
            )}
          </a>
        );
      })}

      {/* 版本信息 */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 mt-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          版本: {CURRENT_VERSION}
        </p>
        {data.updateStatus && data.updateStatus.hasUpdate && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            有新版本可用
          </p>
        )}
      </div>
    </div>
  );
}