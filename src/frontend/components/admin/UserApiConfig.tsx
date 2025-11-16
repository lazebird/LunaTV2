'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { getAuthInfoFromBrowserCookie } from '@/frontend/lib/auth';
import { AdminConfig as IAdminConfig, UserInfo as IUserInfo } from '@/frontend/lib/admin.types';

// 类型别名，避免循环引用
type AdminConfigType = IAdminConfig;

// 统一按钮样式系统
const buttonStyles = {
  primary:
    'px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors',
  success:
    'px-3 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg transition-colors',
  secondary:
    'px-3 py-1.5 text-sm font-medium bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-lg transition-colors',
  disabled:
    'px-3 py-1.5 text-sm font-medium bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white rounded-lg transition-colors',
};

// 通用弹窗组件
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'danger';
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

  React.useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (timer) {
        setTimeout(() => {
          onClose();
        }, timer);
      }
    } else {
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen, onClose, timer]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/40 mb-4'>
            <svg
              className='h-6 w-6 text-green-600 dark:text-green-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M5 13l4 4L19 7'
              />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/40 mb-4'>
            <svg
              className='h-6 w-6 text-red-600 dark:text-red-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/40 mb-4'>
            <svg
              className='h-6 w-6 text-yellow-600 dark:text-yellow-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
              />
            </svg>
          </div>
        );
      case 'danger':
        return (
          <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/40 mb-4'>
            <svg
              className='h-6 w-6 text-red-600 dark:text-red-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
              />
            </svg>
          </div>
        );
    }
    return null;
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'danger':
        return 'bg-red-50 dark:bg-red-900/20';
    }
    return 'bg-blue-50 dark:bg-blue-900/20';
  };

  if (!isOpen && !isVisible) return null;

  return createPortal(
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex min-h-screen items-center justify-center p-4 text-center sm:p-0'>
        <div
          className={`fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
        />
        <div
          className={`relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg ${
            isOpen && isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          } ${getBgColor()}`}
        >
          <div className='px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
            {getIcon()}
            <div className='mt-3 text-center sm:mt-5'>
              <h3 className='text-lg leading-6 font-medium text-gray-900 dark:text-gray-100'>
                {title}
              </h3>
              {message && (
                <div className='mt-2'>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {message}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className='bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6'>
            {showConfirm ? (
              <button
                type='button'
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                  type === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
                onClick={onClose}
              >
                确认
              </button>
            ) : null}
            <button
              type='button'
              className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600`}
              onClick={onClose}
            >
              {showConfirm ? '取消' : '关闭'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Hook for alert modal
const useAlertModal = () => {
  const [alertModal, setAlertModal] = React.useState<{
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

  const showError = (message: string, showAlert?: (config: any) => void) => {
    showAlert?.({
      type: 'error',
      title: '错误',
      message,
    });
  };

  const showSuccess = (message: string, showAlert?: (config: any) => void) => {
    showAlert?.({
      type: 'success',
      title: '成功',
      message,
    });
  };

  return { alertModal, showAlert, hideAlert, showError, showSuccess };
};

// Loading state hook
interface LoadingState {
  [key: string]: boolean;
}

const useLoadingState = () => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: loading }));
  };

  const isLoading = (key: string) => loadingStates[key] || false;

  const withLoading = async <T,>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    setLoading(key, true);
    try {
      const result = await operation();
      return result;
    } finally {
      setLoading(key, false);
    }
  };

  return { isLoading, withLoading };
};

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: IUserInfo | null;
  onSave: (username: string, apis: string[], showAdultContent: boolean) => void;
}

function ApiConfigModal({ isOpen, onClose, user, onSave }: ApiConfigModalProps) {
  const [selectedApis, setSelectedApis] = useState<string[]>([]);
  const [selectedShowAdultContent, setSelectedShowAdultContent] = useState(false);

  React.useEffect(() => {
    if (user) {
      setSelectedApis(user.enabledApis || []);
      setSelectedShowAdultContent(user.showAdultContent || false);
    }
  }, [user]);

  const availableApis = [
    { id: 'douban', name: '豆瓣', description: '电影和电视剧信息' },
    { id: 'bangumi', name: 'Bangumi', description: '动漫番剧信息' },
    { id: 'shortdrama', name: '短剧', description: '短剧内容' },
    { id: 'netdisk', name: '网盘', description: '网盘搜索功能' },
    { id: 'live', name: '直播', description: '直播源管理' },
    { id: 'tvbox', name: 'TVBox', description: 'TVBox配置' },
    { id: 'ai', name: 'AI推荐', description: 'AI智能推荐' },
    { id: 'source', name: '播放源', description: '播放源管理' },
  ];

  const handleSave = () => {
    if (user) {
      onSave(user.username, selectedApis, selectedShowAdultContent);
      onClose();
    }
  };

  if (!isOpen || !user) return null;

  return createPortal(
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex min-h-screen items-center justify-center p-4 text-center sm:p-0'>
        <div
          className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity'
          onClick={onClose}
        />
        <div className='relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl'>
          <div className='px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
            <h3 className='text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4'>
              配置用户 API 权限 - {user.username}
            </h3>
            
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  API 权限
                </label>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  {availableApis.map((api) => (
                    <label
                      key={api.id}
                      className='flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                    >
                      <input
                        type='checkbox'
                        checked={selectedApis.includes(api.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedApis([...selectedApis, api.id]);
                          } else {
                            setSelectedApis(selectedApis.filter((a) => a !== api.id));
                          }
                        }}
                        className='mt-0.5 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'
                      />
                      <div>
                        <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                          {api.name}
                        </div>
                        <div className='text-xs text-gray-500 dark:text-gray-400'>
                          {api.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={selectedShowAdultContent}
                    onChange={(e) => setSelectedShowAdultContent(e.target.checked)}
                    className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'
                  />
                  <span className='text-sm text-gray-700 dark:text-gray-300'>
                    允许访问成人内容
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div className='bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6'>
            <button
              type='button'
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${buttonStyles.primary}`}
              onClick={handleSave}
            >
              保存配置
            </button>
            <button
              type='button'
              className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600`}
              onClick={onClose}
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface UserApiConfigProps {
  config: AdminConfigType | null;
  role: 'owner' | 'admin' | null;
  refreshConfig: () => Promise<void>;
}

export default function UserApiConfig({
  config,
  role,
  refreshConfig,
}: UserApiConfigProps) {
  const { alertModal, showAlert, hideAlert, showError, showSuccess } = useAlertModal();
  const { isLoading, withLoading } = useLoadingState();
  const [showConfigureApisModal, setShowConfigureApisModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUserInfo | null>(null);

  if (!config) {
    return <div className="text-center p-8">加载中...</div>;
  }

  const handleConfigureUserApis = (user: IUserInfo) => {
    setSelectedUser(user);
    setShowConfigureApisModal(true);
  };

  const handleSaveUserApis = async (username: string, apis: string[], showAdultContent: boolean) => {
    await withLoading(`saveApis_${username}`, async () => {
      try {
        const res = await fetch('/api/admin/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'configureApis',
            username,
            enabledApis: apis,
            showAdultContent,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `配置失败: ${res.status}`);
        }

        await refreshConfig();
        showSuccess('API配置保存成功', showAlert);
      } catch (err) {
        showError(err instanceof Error ? err.message : '配置失败', showAlert);
        throw err;
      }
    });
  };

  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  };

  return (
    <>
      <div className='space-y-4'>
        <div className='border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
          <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
            <thead className='bg-gray-50 dark:bg-gray-900'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  用户名
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  角色
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  API权限
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  成人内容
                </th>
                <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  操作
                </th>
              </tr>
            </thead>
            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
              {config?.UserConfig?.Users?.map((user) => (
                <tr key={user.username} className='hover:bg-gray-50 dark:hover:bg-gray-700'>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                    {user.username}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'owner'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200'
                          : user.role === 'admin'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-200'
                      }`}
                    >
                      {user.role === 'owner' ? '所有者' : user.role === 'admin' ? '管理员' : '用户'}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                    {user.enabledApis && user.enabledApis.length > 0 ? (
                      <div className='flex flex-wrap gap-1'>
                        {user.enabledApis.map((api) => (
                          <span
                            key={api}
                            className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                          >
                            {api}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className='text-gray-400 dark:text-gray-500'>无权限</span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                    {user.showAdultContent ? (
                      <span className='text-red-600 dark:text-red-400'>允许</span>
                    ) : (
                      <span className='text-gray-400 dark:text-gray-500'>禁止</span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                    <button
                      onClick={() => handleConfigureUserApis(user)}
                      disabled={isLoading(`saveApis_${user.username}`)}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 dark:text-blue-200 transition-colors ${
                        isLoading(`saveApis_${user.username}`) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isLoading(`saveApis_${user.username}`) ? '保存中...' : '配置API'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ApiConfigModal
        isOpen={showConfigureApisModal}
        onClose={() => {
          setShowConfigureApisModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSave={handleSaveUserApis}
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        timer={alertModal.timer}
        showConfirm={alertModal.showConfirm}
      />
    </>
  );
}