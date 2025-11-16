/* eslint-disable @typescript-eslint/no-explicit-any, no-console, @typescript-eslint/no-non-null-assertion,react-hooks/exhaustive-deps,@typescript-eslint/no-empty-function */

'use client';

import {
  closestCenter,
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle,
  ChevronDown,
  Database,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  GripVertical,
  HardDrive,
  Radio,
  RotateCcw,
  Send,
  Settings,
  Shield,
  Sparkles,
  TestTube,
  Upload,
  Users,
  Video,
  Youtube,
} from 'lucide-react';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { AdminConfig, AdminConfigResult } from '@/lib/admin.types';
import { getAuthInfoFromBrowserCookie } from '@/lib/auth';

import AIRecommendConfig from '@/components/AIRecommendConfig';
import CacheManager from '@/components/CacheManager';
import CategoryConfig from '@/components/admin/CategoryConfig';
import ConfigFileComponent from '@/components/admin/ConfigFileComponent';
import DataMigration from '@/components/DataMigration';
import ImportExportModal from '@/components/ImportExportModal';
import LiveSourceConfig from '@/components/admin/LiveSourceConfig';
import NetDiskConfig from '@/components/admin/NetDiskConfig';
import PageLayout from '@/components/PageLayout';
import SiteConfigComponent from '@/components/admin/SiteConfigComponent';
import SourceTestModule from '@/components/SourceTestModule';
import { TelegramAuthConfig } from '@/components/TelegramAuthConfig';
import TVBoxSecurityConfig from '@/components/TVBoxSecurityConfig';
import {
  TVBoxTokenCell,
  TVBoxTokenModal,
} from '@/components/TVBoxTokenManager';
import UserConfig from '@/components/admin/UserConfig';
import VideoSourceConfig from '@/components/admin/VideoSourceConfig';
import YouTubeConfig from '@/components/YouTubeConfig';

// 统一按钮样式系统
const buttonStyles = {
  // 主要操作按钮（蓝色）- 用于配置、设置、确认等
  primary:
    'px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors',
  // 成功操作按钮（绿色）- 用于添加、启用、保存等
  success:
    'px-3 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg transition-colors',
  // 危险操作按钮（红色）- 用于删除、禁用、重置等
  danger:
    'px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-colors',
  // 次要操作按钮（灰色）- 用于取消、关闭等
  secondary:
    'px-3 py-1.5 text-sm font-medium bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-lg transition-colors',
  // 警告操作按钮（黄色）- 用于批量禁用等
  warning:
    'px-3 py-1.5 text-sm font-medium bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white rounded-lg transition-colors',
  // 小尺寸主要按钮
  primarySmall:
    'px-2 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md transition-colors',
  // 小尺寸成功按钮
  successSmall:
    'px-2 py-1 text-xs font-medium bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-md transition-colors',
  // 小尺寸危险按钮
  dangerSmall:
    'px-2 py-1 text-xs font-medium bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-md transition-colors',
  // 小尺寸次要按钮
  secondarySmall:
    'px-2 py-1 text-xs font-medium bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-md transition-colors',
  // 小尺寸警告按钮
  warningSmall:
    'px-2 py-1 text-xs font-medium bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white rounded-md transition-colors',
  // 圆角小按钮（用于表格操作）
  roundedPrimary:
    'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 dark:text-blue-200 transition-colors',
  roundedSuccess:
    'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-900/60 dark:text-green-200 transition-colors',
  roundedDanger:
    'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-200 transition-colors',
  roundedSecondary:
    'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700/40 dark:hover:bg-gray-700/60 dark:text-gray-200 transition-colors',
  roundedWarning:
    'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:hover:bg-yellow-900/60 dark:text-yellow-200 transition-colors',
  roundedPurple:
    'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 dark:text-purple-200 transition-colors',
  // 禁用状态
  disabled:
    'px-3 py-1.5 text-sm font-medium bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white rounded-lg transition-colors',
  disabledSmall:
    'px-2 py-1 text-xs font-medium bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white rounded-md transition-colors',
  // 开关按钮样式
  toggleOn: 'bg-green-600 dark:bg-green-600',
  toggleOff: 'bg-gray-200 dark:bg-gray-700',
  toggleThumb: 'bg-white',
  toggleThumbOn: 'translate-x-6',
  toggleThumbOff: 'translate-x-1',
  // 快速操作按钮样式
  quickAction:
    'px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors',
};

// 通用弹窗组件
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning';
  title: string;
  message?: string;
  timer?: number;
  showConfirm?: boolean;
}

const AlertModal = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  timer,
  showConfirm = false,
}: AlertModalProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (timer) {
        setTimeout(() => {
          onClose();
        }, timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, timer, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className='w-8 h-8 text-green-500' />;
      case 'error':
        return <AlertCircle className='w-8 h-8 text-red-500' />;
      case 'warning':
        return <AlertTriangle className='w-8 h-8 text-yellow-500' />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return createPortal(
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full border ${getBgColor()} transition-all duration-200 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
      >
        <div className='p-6 text-center'>
          <div className='flex justify-center mb-4'>{getIcon()}</div>

          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
            {title}
          </h3>

          {message && (
            <p className='text-gray-600 dark:text-gray-400 mb-4'>{message}</p>
          )}

          {showConfirm && (
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium ${buttonStyles.primary}`}
            >
              确定
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// 弹窗状态管理
const useAlertModal = () => {
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message?: string;
    timer?: number;
    showConfirm?: boolean;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
  });

  const showAlert = (config: Omit<typeof alertModal, 'isOpen'>) => {
    setAlertModal({ ...config, isOpen: true });
  };

  const hideAlert = () => {
    setAlertModal((prev) => ({ ...prev, isOpen: false }));
  };

  return { alertModal, showAlert, hideAlert };
};

// 统一弹窗方法（必须在首次使用前定义）
const showError = (message: string, showAlert?: (config: any) => void) => {
  if (showAlert) {
    showAlert({ type: 'error', title: '错误', message, showConfirm: true });
  } else {
    console.error(message);
  }
};

const showSuccess = (message: string, showAlert?: (config: any) => void) => {
  if (showAlert) {
    showAlert({ type: 'success', title: '成功', message, timer: 2000 });
  } else {
    console.log(message);
  }
};

// 通用加载状态管理系统
interface LoadingState {
  [key: string]: boolean;
}

const useLoadingState = () => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: loading }));
  };

  const isLoading = (key: string) => loadingStates[key] || false;

  const withLoading = async (
    key: string,
    operation: () => Promise<any>
  ): Promise<any> => {
    setLoading(key, true);
    try {
      const result = await operation();
      return result;
    } finally {
      setLoading(key, false);
    }
  };

  return { loadingStates, setLoading, isLoading, withLoading };
};

// 新增站点配置类型
interface SiteConfig {
  SiteName: string;
  Announcement: string;
  SearchDownstreamMaxPage: number;
  SiteInterfaceCacheTime: number;
  DoubanProxyType: string;
  DoubanProxy: string;
  DoubanImageProxyType: string;
  DoubanImageProxy: string;
  DisableYellowFilter: boolean;
  ShowAdultContent: boolean;
  FluidSearch: boolean;
  // TMDB配置
  TMDBApiKey?: string;
  TMDBLanguage?: string;
  EnableTMDBActorSearch?: boolean;
}

// 视频源数据类型
interface DataSource {
  name: string;
  key: string;
  api: string;
  detail?: string;
  disabled?: boolean;
  from: 'config' | 'custom';
  is_adult?: boolean;
}

// 直播源数据类型
interface LiveDataSource {
  name: string;
  key: string;
  url: string;
  ua?: string;
  epg?: string;
  channelNumber?: number;
  disabled?: boolean;
  from: 'config' | 'custom';
}

// 自定义分类数据类型
interface CustomCategory {
  name?: string;
  type: 'movie' | 'tv';
  query: string;
  disabled?: boolean;
  from: 'config' | 'custom';
}












function AdminPageClient() {
  const { alertModal, showAlert, hideAlert } = useAlertModal();
  const { isLoading, withLoading } = useLoadingState();
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'owner' | 'admin' | null>(null);
  const [showResetConfigModal, setShowResetConfigModal] = useState(false);
  const [expandedTabs, setExpandedTabs] = useState<{ [key: string]: boolean }>({
    userConfig: false,
    videoSource: false,
    sourceTest: false,
    liveSource: false,
    siteConfig: false,
    categoryConfig: false,
    netdiskConfig: false,
    aiRecommendConfig: false,
    youtubeConfig: false,
    tvboxSecurityConfig: false,
    telegramAuthConfig: false,
    configFile: false,
    cacheManager: false,
    dataMigration: false,
  });

  // 当前激活的菜单项
  const [activeMenu, setActiveMenu] = useState<string>('siteConfig');

  // 初始化时默认激活第一个菜单项
  useEffect(() => {
    // 根据角色确定第一个可用的菜单项
    const firstMenu = role === 'owner' ? 'configFile' : 'siteConfig';
    setActiveMenu(firstMenu);
    setExpandedTabs((prev) => ({ ...prev, [firstMenu]: true }));
  }, [role]);

  // 获取管理员配置
  // showLoading 用于控制是否在请求期间显示整体加载骨架。
  const fetchConfig = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const response = await fetch(`/api/admin/config`);

      if (!response.ok) {
        const data = (await response.json()) as any;
        throw new Error(`获取配置失败: ${data.error}`);
      }

      const data = (await response.json()) as AdminConfigResult;
      setConfig(data.Config);
      setRole(data.Role);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '获取配置失败';
      showError(msg, showAlert);
      setError(msg);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // 首次加载时显示骨架
    fetchConfig(true);
  }, [fetchConfig]);

  // 切换标签展开状态和激活菜单
  const toggleTab = (tabKey: string) => {
    // 先关闭所有标签，再打开选中的标签
    setExpandedTabs((prev) => {
      const newTabs = Object.keys(prev).reduce((acc, key) => {
        acc[key] = key === tabKey;
        return acc;
      }, {} as { [key: string]: boolean });
      return newTabs;
    });
    // 设置当前激活的菜单
    setActiveMenu(tabKey);
  };

  // 新增: 重置配置处理函数
  const handleResetConfig = () => {
    setShowResetConfigModal(true);
  };

  const handleConfirmResetConfig = async () => {
    await withLoading('resetConfig', async () => {
      try {
        const response = await fetch(`/api/admin/reset`);
        if (!response.ok) {
          throw new Error(`重置失败: ${response.status}`);
        }
        showSuccess('重置成功，请刷新页面！', showAlert);
        await fetchConfig();
        setShowResetConfigModal(false);
      } catch (err) {
        showError(err instanceof Error ? err.message : '重置失败', showAlert);
        throw err;
      }
    });
  };

  if (loading) {
    return (
      <PageLayout activePath='/admin'>
        <div className='-mt-6 md:mt-0'>
          <div className='max-w-[95%] mx-auto'>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8'>
              管理员设置
            </h1>
            <div className='space-y-6'>
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className='relative h-24 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-xl overflow-hidden'
                >
                  <div className='absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent'></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    // 错误已通过弹窗展示，此处直接返回空
    return null;
  }

  return (
    <PageLayout activePath='/admin'>
      <div className='flex h-full'>
        {/* 左侧菜单 */}
        <div className='w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto'>
          <div className='p-4'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
              管理员设置
            </h2>
            <nav className='space-y-1'>
              {/* 配置文件 - 仅站长可见 */}
              {role === 'owner' && (
                <button
                  onClick={() => toggleTab('configFile')}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeMenu === 'configFile'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                  }`}
                >
                  <FileText size={18} />
                  配置文件
                </button>
              )}

              {/* 站点配置 */}
              <button
                onClick={() => toggleTab('siteConfig')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeMenu === 'siteConfig'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                }`}
              >
                <Settings size={18} />
                站点配置
              </button>

              {/* 用户配置 */}
              <button
                onClick={() => toggleTab('userConfig')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeMenu === 'userConfig'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                }`}
              >
                <Users size={18} />
                用户配置
              </button>

              {/* 视频源配置 */}
              <button
                onClick={() => toggleTab('videoSource')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeMenu === 'videoSource'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                }`}
              >
                <Video size={18} />
                视频源配置
              </button>

              {/* 源检测 */}
              <button
                onClick={() => toggleTab('sourceTest')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeMenu === 'sourceTest'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                }`}
              >
                <TestTube size={18} />
                源检测
              </button>

              {/* 直播源配置 */}
              <button
                onClick={() => toggleTab('liveSource')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeMenu === 'liveSource'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                }`}
              >
                <Radio size={18} />
                直播源配置
              </button>

              {/* 自定义分类 */}
              <button
                onClick={() => toggleTab('categoryConfig')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeMenu === 'categoryConfig'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                }`}
              >
                <FolderOpen size={18} />
                自定义分类
              </button>

              {/* 网盘搜索配置 */}
              <button
                onClick={() => toggleTab('netdiskConfig')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeMenu === 'netdiskConfig'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                }`}
              >
                <HardDrive size={18} />
                网盘搜索配置
              </button>

              {/* AI推荐配置 */}
              <button
                onClick={() => toggleTab('aiRecommendConfig')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeMenu === 'aiRecommendConfig'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                }`}
              >
                <Sparkles size={18} />
                AI推荐配置
              </button>

              {/* YouTube配置 */}
              <button
                onClick={() => toggleTab('youtubeConfig')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeMenu === 'youtubeConfig'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                }`}
              >
                <Youtube size={18} />
                YouTube配置
              </button>

              {/* TVBox安全配置 */}
              <button
                onClick={() => toggleTab('tvboxSecurityConfig')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeMenu === 'tvboxSecurityConfig'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                }`}
              >
                <Shield size={18} />
                TVBox安全配置
              </button>

              {/* Telegram认证配置 */}
              <button
                onClick={() => toggleTab('telegramAuthConfig')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeMenu === 'telegramAuthConfig'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                }`}
              >
                <Send size={18} />
                Telegram认证配置
              </button>

              {/* 缓存管理 - 仅站长可见 */}
              {role === 'owner' && (
                <button
                  onClick={() => toggleTab('cacheManager')}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeMenu === 'cacheManager'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                  }`}
                >
                  <Database size={18} />
                  缓存管理
                </button>
              )}

              {/* 数据迁移 - 仅站长可见 */}
              {role === 'owner' && (
                <button
                  onClick={() => toggleTab('dataMigration')}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeMenu === 'dataMigration'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                  }`}
                >
                  <Database size={18} />
                  数据迁移
                </button>
              )}

              {/* 重置配置 - 仅站长可见 */}
              {role === 'owner' && (
                <div className='pt-4 mt-4 border-t border-gray-200 dark:border-gray-700'>
                  <button
                    onClick={handleResetConfig}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${buttonStyles.dangerSmall}`}
                  >
                    <RotateCcw size={18} />
                    重置配置
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className='flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900'>
          <div className='p-6'>
            {/* 系统信息 */}
            <div className='mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                系统信息
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-600 dark:text-gray-400'>存储方案:</span>
                  <span className='px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 rounded-md font-medium'>
                    {(window as any).RUNTIME_CONFIG?.STORAGE_TYPE || 'localstorage'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-600 dark:text-gray-400'>当前角色:</span>
                  <span className='px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 rounded-md font-medium'>
                    {role === 'owner' ? '所有者' : role === 'admin' ? '管理员' : '用户'}
                  </span>
                </div>
              </div>
            </div>
            {/* 配置文件标签 - 仅站长可见 */}
            {role === 'owner' && activeMenu === 'configFile' && (
              <div className='mb-6'>
                <ConfigFileComponent
                  config={config}
                  refreshConfig={fetchConfig}
                />
              </div>
            )}

            {/* 站点配置标签 */}
            {activeMenu === 'siteConfig' && (
              <div className='mb-6'>
                <SiteConfigComponent
                  config={config}
                  refreshConfig={fetchConfig}
                />
              </div>
            )}

            {/* 用户配置标签 */}
            {activeMenu === 'userConfig' && (
              <div className='mb-6'>
                <UserConfig
                  config={config}
                  role={role}
                  refreshConfig={fetchConfig}
                />
              </div>
            )}

            {/* 视频源配置标签 */}
            {activeMenu === 'videoSource' && (
              <div className='mb-6'>
                <VideoSourceConfig
                  config={config}
                  refreshConfig={fetchConfig}
                />
              </div>
            )}

            {/* 源检测标签 */}
            {activeMenu === 'sourceTest' && (
              <div className='mb-6'>
                <SourceTestModule />
              </div>
            )}

            {/* 直播源配置标签 */}
            {activeMenu === 'liveSource' && (
              <div className='mb-6'>
                <LiveSourceConfig config={config} refreshConfig={fetchConfig} />
              </div>
            )}

            {/* 自定义分类标签 */}
            {activeMenu === 'categoryConfig' && (
              <div className='mb-6'>
                <CategoryConfig config={config} refreshConfig={fetchConfig} />
              </div>
            )}

            {/* 网盘搜索配置标签 */}
            {activeMenu === 'netdiskConfig' && (
              <div className='mb-6'>
                <NetDiskConfig config={config} refreshConfig={fetchConfig} />
              </div>
            )}

            {/* AI推荐配置标签 */}
            {activeMenu === 'aiRecommendConfig' && (
              <div className='mb-6'>
                <AIRecommendConfig
                  config={config}
                  refreshConfig={fetchConfig}
                />
              </div>
            )}

            {/* YouTube配置标签 */}
            {activeMenu === 'youtubeConfig' && (
              <div className='mb-6'>
                <YouTubeConfig config={config} refreshConfig={fetchConfig} />
              </div>
            )}

            {/* TVBox安全配置标签 */}
            {activeMenu === 'tvboxSecurityConfig' && (
              <div className='mb-6'>
                <TVBoxSecurityConfig
                  config={config}
                  refreshConfig={fetchConfig}
                />
              </div>
            )}

            {/* Telegram认证配置标签 */}
            {activeMenu === 'telegramAuthConfig' && (
              <div className='mb-6'>
                <TelegramAuthConfig
                  config={
                    config?.TelegramAuthConfig || {
                      enabled: false,
                      botToken: '',
                      botUsername: '',
                      autoRegister: false,
                      buttonSize: 'medium',
                      showAvatar: false,
                      requestWriteAccess: false,
                    }
                  }
                  onSave={async (newConfig) => {
                    // 更新配置
                    const updatedConfig = {
                      ...config,
                      TelegramAuthConfig: newConfig,
                    };
                    const resp = await fetch('/api/admin/config', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ telegramAuthConfig: newConfig }),
                    });
                    if (!resp.ok) {
                      throw new Error(`保存失败: ${resp.status}`);
                    }
                    await fetchConfig();
                  }}
                />
              </div>
            )}

            {/* 缓存管理标签 - 仅站长可见 */}
            {role === 'owner' && activeMenu === 'cacheManager' && (
              <div className='mb-6'>
                <CacheManager />
              </div>
            )}

            {/* 数据迁移标签 - 仅站长可见 */}
            {role === 'owner' && activeMenu === 'dataMigration' && (
              <div className='mb-6'>
                <DataMigration onRefreshConfig={fetchConfig} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 通用弹窗组件 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        timer={alertModal.timer}
        showConfirm={alertModal.showConfirm}
      />

      {/* 重置配置确认弹窗 */}
      {showResetConfigModal &&
        createPortal(
          <div
            className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'
            onClick={() => setShowResetConfigModal(false)}
          >
            <div
              className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
                    确认重置配置
                  </h3>
                  <button
                    onClick={() => setShowResetConfigModal(false)}
                    className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
                  >
                    <svg
                      className='w-6 h-6'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M6 18L18 6M6 6l12 12'
                      />
                    </svg>
                  </button>
                </div>

                <div className='mb-6'>
                  <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <svg
                        className='w-5 h-5 text-yellow-600 dark:text-yellow-400'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                      </svg>
                      <span className='text-sm font-medium text-yellow-800 dark:text-yellow-300'>
                        ⚠️ 危险操作警告
                      </span>
                    </div>
                    <p className='text-sm text-yellow-700 dark:text-yellow-400'>
                      此操作将重置用户封禁和管理员设置、自定义视频源，站点配置将重置为默认值，是否继续？
                    </p>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className='flex justify-end space-x-3'>
                  <button
                    onClick={() => setShowResetConfigModal(false)}
                    className={`px-6 py-2.5 text-sm font-medium ${buttonStyles.secondary}`}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmResetConfig}
                    disabled={isLoading('resetConfig')}
                    className={`px-6 py-2.5 text-sm font-medium ${
                      isLoading('resetConfig')
                        ? buttonStyles.disabled
                        : buttonStyles.danger
                    }`}
                  >
                    {isLoading('resetConfig') ? '重置中...' : '确认重置'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </PageLayout>
  );
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminPageClient />
    </Suspense>
  );
}
