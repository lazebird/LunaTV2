import React, { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { getAuthInfoFromBrowserCookie } from '@/frontend/lib/auth';
import { AdminConfig as IAdminConfig } from '@/frontend/lib/admin.types';

// 类型别名，避免循环引用
type AdminConfigType = IAdminConfig;

// 统一按钮样式系统
const buttonStyles = {
  primary:
    'px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors',
  success:
    'px-3 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg transition-colors',
  danger:
    'px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-colors',
  secondary:
    'px-3 py-1.5 text-sm font-medium bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-lg transition-colors',
  disabled:
    'px-3 py-1.5 text-sm font-medium bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white rounded-lg transition-colors',
  roundedPrimary:
    'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 dark:text-blue-200 transition-colors',
  roundedSuccess:
    'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-900/60 dark:text-green-200 transition-colors',
  roundedDanger:
    'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-200 transition-colors',
  roundedSecondary:
    'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700/40 dark:hover:bg-gray-700/60 dark:text-gray-200 transition-colors',
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

interface UserGroupManagementProps {
  config: AdminConfigType | null;
  role: 'owner' | 'admin' | null;
  refreshConfig: () => Promise<void>;
}

export default function UserGroupManagement({
  config,
  role,
  refreshConfig,
}: UserGroupManagementProps) {
  const { alertModal, showAlert, hideAlert, showError, showSuccess } = useAlertModal();
  const { isLoading, withLoading } = useLoadingState();
  const [showAddUserGroupForm, setShowAddUserGroupForm] = useState(false);
  const [showEditUserGroupForm, setShowEditUserGroupForm] = useState(false);
  const [newUserGroup, setNewUserGroup] = useState({
    name: '',
    enabledApis: [] as string[],
    showAdultContent: false,
  });

  if (!config) {
    return <div className="text-center p-8">加载中...</div>;
  }

  const handleAddUserGroup = async () => {
    if (!newUserGroup.name.trim()) return;

    await withLoading('addUserGroup', async () => {
      try {
        const res = await fetch('/api/admin/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'userGroup',
            groupAction: 'add',
            groupName: newUserGroup.name,
            enabledApis: newUserGroup.enabledApis,
            showAdultContent: newUserGroup.showAdultContent,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || '添加失败');
        }

        await refreshConfig();
        setNewUserGroup({ name: '', enabledApis: [], showAdultContent: false });
        setShowAddUserGroupForm(false);
        showSuccess('用户组添加成功', showAlert);
      } catch (err) {
        showError(err instanceof Error ? err.message : '添加失败', showAlert);
      }
    });
  };

  return (
    <div className='space-y-4'>
      {showAddUserGroupForm && (
        <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow'>
          <h3 className='text-lg font-medium mb-4'>添加用户组</h3>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                用户组名称
              </label>
              <input
                type='text'
                value={newUserGroup.name}
                onChange={(e) => setNewUserGroup({ ...newUserGroup, name: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white'
                placeholder='输入用户组名称'
              />
            </div>
            <div className='flex justify-end space-x-2'>
              <button
                onClick={() => setShowAddUserGroupForm(false)}
                className='px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg'
              >
                取消
              </button>
              <button
                onClick={handleAddUserGroup}
                disabled={isLoading('addUserGroup')}
                className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50'
              >
                {isLoading('addUserGroup') ? '添加中...' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100'>
          用户组列表
        </h3>
        <button
          onClick={() => setShowAddUserGroupForm(true)}
          className={buttonStyles.primary}
        >
          添加用户组
        </button>
      </div>

      <div className='bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50 dark:bg-gray-700'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  用户组名称
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  用户数量
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  成人内容
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  操作
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 dark:divide-gray-600'>
              {config?.UserConfig?.Tags?.map((group) => (
                <tr key={group.name}>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                    {group.name}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                    {config?.UserConfig?.Users?.filter((user) => user.tags?.includes(group.name)).length || 0}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                    {group.showAdultContent ? (
                      <span className='text-red-600 dark:text-red-400'>允许</span>
                    ) : (
                      <span className='text-gray-400'>禁止</span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                    <button className='text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3'>
                      编辑
                    </button>
                    <button className='text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        showConfirm={alertModal.showConfirm}
      />
    </div>
  );
}