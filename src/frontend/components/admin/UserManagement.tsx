'use client';

import React, { useCallback, useMemo, useState } from 'react';
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
  roundedWarning:
    'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:hover:bg-yellow-900/60 dark:text-yellow-200 transition-colors',
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

interface UserInfo {
  username: string;
  password?: string;
  role: 'user' | 'admin' | 'owner';
  enabledApis?: string[];
  tags?: string[];
  showAdultContent?: boolean;
  banned?: boolean;
  tvboxToken?: string;
  tvboxEnabledSources?: string[];
}

interface AdminConfig {
  UserConfig: {
    Users: UserInfo[];
    Tags: Array<{
      name: string;
      enabledApis: string[];
      showAdultContent?: boolean;
    }>;
  };
}

interface UserManagementProps {
  config: AdminConfigType | null;
  role: 'owner' | 'admin' | null;
  refreshConfig: () => Promise<void>;
  onConfigureUserApis: (user: IUserInfo) => void;
  onConfigureUserGroup: (user: IUserInfo) => void;
  onManageTVBoxToken: (user: IUserInfo) => void;
}

export default function UserManagement({
  config,
  role,
  refreshConfig,
  onConfigureUserApis,
  onConfigureUserGroup,
  onManageTVBoxToken,
}: UserManagementProps) {
  const { alertModal, showAlert, hideAlert, showError, showSuccess } = useAlertModal();
  const { isLoading, withLoading } = useLoadingState();
  const [showAddUserForm, setShowAddUserForm] = useState(false);

  if (!config) {
    return <div className="text-center p-8">加载中...</div>;
  }
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    userGroup: '',
  });
  const [changePasswordUser, setChangePasswordUser] = useState({
    username: '',
    password: '',
  });
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  const currentUsername = getAuthInfoFromBrowserCookie()?.username || null;

  const selectAllUsers = useMemo(() => {
    const selectableUserCount =
      config?.UserConfig?.Users?.filter(
        (user) =>
          role === 'owner' ||
          (role === 'admin' &&
            (user.role === 'user' || user.username === currentUsername))
      ).length || 0;
    return selectedUsers.size === selectableUserCount && selectedUsers.size > 0;
  }, [selectedUsers.size, config?.UserConfig?.Users, role, currentUsername]);

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) return;

    await withLoading(`addUser_${newUser.username}`, async () => {
      try {
        const res = await fetch('/api/admin/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add',
            username: newUser.username,
            password: newUser.password,
            role: 'user',
            tags: newUser.userGroup ? [newUser.userGroup] : [],
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `添加失败: ${res.status}`);
        }

        await refreshConfig();
        setNewUser({ username: '', password: '', userGroup: '' });
        setShowAddUserForm(false);
        showSuccess('用户添加成功', showAlert);
      } catch (err) {
        showError(err instanceof Error ? err.message : '添加失败', showAlert);
        throw err;
      }
    });
  };

  const handleChangePassword = async () => {
    if (!changePasswordUser.password) return;

    await withLoading(`changePassword_${changePasswordUser.username}`, async () => {
      try {
        const res = await fetch('/api/admin/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'changePassword',
            username: changePasswordUser.username,
            password: changePasswordUser.password,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `修改失败: ${res.status}`);
        }

        setChangePasswordUser({ username: '', password: '' });
        setShowChangePasswordForm(false);
        showSuccess('密码修改成功', showAlert);
      } catch (err) {
        showError(err instanceof Error ? err.message : '修改失败', showAlert);
        throw err;
      }
    });
  };

  const handleShowChangePasswordForm = (username: string) => {
    setChangePasswordUser({ username, password: '' });
    setShowChangePasswordForm(true);
  };

  const handleDeleteUser = (username: string) => {
    setDeletingUser(username);
    setShowDeleteUserModal(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;

    await withLoading(`deleteUser_${deletingUser}`, async () => {
      try {
        const res = await fetch('/api/admin/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete',
            username: deletingUser,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `删除失败: ${res.status}`);
        }

        await refreshConfig();
        setShowDeleteUserModal(false);
        setDeletingUser(null);
        showSuccess('用户删除成功', showAlert);
      } catch (err) {
        showError(err instanceof Error ? err.message : '删除失败', showAlert);
        throw err;
      }
    });
  };

  const handleBanUser = async (uname: string) => {
    await withLoading(`banUser_${uname}`, async () => {
      try {
        const res = await fetch('/api/admin/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ban', username: uname }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `操作失败: ${res.status}`);
        }

        await refreshConfig();
        showSuccess('用户封禁成功', showAlert);
      } catch (err) {
        showError(err instanceof Error ? err.message : '操作失败', showAlert);
        throw err;
      }
    });
  };

  const handleUnbanUser = async (uname: string) => {
    await withLoading(`unbanUser_${uname}`, async () => {
      try {
        const res = await fetch('/api/admin/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'unban', username: uname }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `操作失败: ${res.status}`);
        }

        await refreshConfig();
        showSuccess('用户解封成功', showAlert);
      } catch (err) {
        showError(err instanceof Error ? err.message : '操作失败', showAlert);
        throw err;
      }
    });
  };

  const handleSetAdmin = async (uname: string) => {
    await withLoading(`setAdmin_${uname}`, async () => {
      try {
        const res = await fetch('/api/admin/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'setAdmin', username: uname }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `操作失败: ${res.status}`);
        }

        await refreshConfig();
        showSuccess('管理员设置成功', showAlert);
      } catch (err) {
        showError(err instanceof Error ? err.message : '操作失败', showAlert);
        throw err;
      }
    });
  };

  const handleRemoveAdmin = async (uname: string) => {
    await withLoading(`removeAdmin_${uname}`, async () => {
      try {
        const res = await fetch('/api/admin/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'removeAdmin', username: uname }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `操作失败: ${res.status}`);
        }

        await refreshConfig();
        showSuccess('管理员移除成功', showAlert);
      } catch (err) {
        showError(err instanceof Error ? err.message : '操作失败', showAlert);
        throw err;
      }
    });
  };

  const handleSelectUser = useCallback((username: string, checked: boolean) => {
    setSelectedUsers((prev) => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(username);
      } else {
        newSelected.delete(username);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAllUsers = useCallback(
    (selectAll: boolean) => {
      const selectableUsers = config?.UserConfig?.Users?.filter(
        (user) =>
          role === 'owner' ||
          (role === 'admin' &&
            (user.role === 'user' || user.username === currentUsername))
      ) || [];

      if (selectAll) {
        setSelectedUsers(new Set(selectableUsers.map((u) => u.username)));
      } else {
        setSelectedUsers(new Set());
      }
    },
    [config?.UserConfig?.Users, role, currentUsername]
  );

  const canOperateUser = (user: UserInfo) => {
    if (role === 'owner') return true;
    if (role === 'admin') return user.role === 'user' || user.username === currentUsername;
    return false;
  };

  const sortedUsers = [...(config?.UserConfig?.Users || [])].sort((a, b) => {
    const priority = (u: UserInfo) => {
      if (u.role === 'owner') return 0;
      if (u.role === 'admin') return 1;
      return 2;
    };
    return priority(a) - priority(b) || a.username.localeCompare(b.username);
  });

  return (
    <>
      <div className='space-y-4'>
        {/* 添加用户表单 */}
        {showAddUserForm && (
          <div className='border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800'>
            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
              添加新用户
            </h3>
            <div className='space-y-4'>
              <div className='flex flex-col sm:flex-row gap-4'>
                <input
                  type='text'
                  placeholder='用户名'
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, username: e.target.value }))
                  }
                  className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
                <input
                  type='password'
                  placeholder='密码'
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
                <select
                  value={newUser.userGroup}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, userGroup: e.target.value }))
                  }
                  className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value=''>选择用户组（可选）</option>
                  {config?.UserConfig?.Tags?.map((tag) => (
                    <option key={tag.name} value={tag.name}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className='flex flex-col sm:flex-row gap-4'>
                <button
                  onClick={handleAddUser}
                  disabled={
                    !newUser.username ||
                    !newUser.password ||
                    isLoading(`addUser_${newUser.username}`)
                  }
                  className={`w-full sm:w-auto ${
                    !newUser.username ||
                    !newUser.password ||
                    isLoading(`addUser_${newUser.username}`)
                      ? buttonStyles.disabled
                      : buttonStyles.success
                  }`}
                >
                  {isLoading(`addUser_${newUser.username}`) ? '添加中...' : '添加用户'}
                </button>
                <button
                  onClick={() => {
                    setShowAddUserForm(false);
                    setNewUser({ username: '', password: '', userGroup: '' });
                  }}
                  className={`w-full sm:w-auto ${buttonStyles.secondary}`}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 修改密码表单 */}
        {showChangePasswordForm && (
          <div className='border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800'>
            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
              修改用户密码
            </h3>
            <div className='space-y-4'>
              <div className='flex flex-col sm:flex-row gap-4'>
                <input
                  type='text'
                  placeholder='用户名'
                  value={changePasswordUser.username}
                  disabled
                  className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-not-allowed'
                />
                <input
                  type='password'
                  placeholder='新密码'
                  value={changePasswordUser.password}
                  onChange={(e) =>
                    setChangePasswordUser((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
                <button
                  onClick={handleChangePassword}
                  disabled={
                    !changePasswordUser.password ||
                    isLoading(`changePassword_${changePasswordUser.username}`)
                  }
                  className={`w-full sm:w-auto ${
                    !changePasswordUser.password ||
                    isLoading(`changePassword_${changePasswordUser.username}`)
                      ? buttonStyles.disabled
                      : buttonStyles.primary
                  }`}
                >
                  {isLoading(`changePassword_${changePasswordUser.username}`)
                    ? '修改中...'
                    : '修改密码'}
                </button>
                <button
                  onClick={() => {
                    setShowChangePasswordForm(false);
                    setChangePasswordUser({ username: '', password: '' });
                  }}
                  className={`w-full sm:w-auto ${buttonStyles.secondary}`}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 用户列表 */}
        <div className='border border-gray-200 dark:border-gray-700 rounded-lg max-h-[28rem] overflow-y-auto overflow-x-auto relative'>
          <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
            <thead className='bg-gray-50 dark:bg-gray-900 sticky top-0 z-10'>
              <tr>
                <th className='w-4' />
                <th className='w-10 px-1 py-3 text-center'>
                  {(() => {
                    const hasAnyPermission = config?.UserConfig?.Users?.some(
                      (user) =>
                        role === 'owner' ||
                        (role === 'admin' &&
                          (user.role === 'user' || user.username === currentUsername))
                    );

                    return hasAnyPermission ? (
                      <input
                        type='checkbox'
                        checked={selectAllUsers}
                        onChange={(e) => handleSelectAllUsers(e.target.checked)}
                        className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'
                      />
                    ) : (
                      <div className='w-4 h-4' />
                    );
                  })()}
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  用户名
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  角色
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  状态
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  用户组
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  API权限
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  成人内容
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  TVBox
                </th>
                <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                  操作
                </th>
              </tr>
            </thead>
            <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
              {sortedUsers.map((user) => (
                <tr key={user.username} className='hover:bg-gray-50 dark:hover:bg-gray-700'>
                  <td className='w-4' />
                  <td className='w-10 px-1 py-3 text-center'>
                    {canOperateUser(user) && (
                      <input
                        type='checkbox'
                        checked={selectedUsers.has(user.username)}
                        onChange={(e) => handleSelectUser(user.username, e.target.checked)}
                        className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'
                      />
                    )}
                  </td>
                  <td className='px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                    {user.username}
                    {user.username === currentUsername && (
                      <span className='ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'>
                        当前用户
                      </span>
                    )}
                  </td>
                  <td className='px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
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
                  <td className='px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.banned
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                      }`}
                    >
                      {user.banned ? '已封禁' : '正常'}
                    </span>
                  </td>
                  <td className='px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                    {user.tags && user.tags.length > 0 ? (
                      <div className='flex flex-wrap gap-1'>
                        {user.tags.map((tag, index) => (
                          <span
                            key={index}
                            className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200'
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className='text-gray-400 dark:text-gray-500'>无</span>
                    )}
                  </td>
                  <td className='px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                    {user.enabledApis && user.enabledApis.length > 0 ? (
                      <span className='text-green-600 dark:text-green-400'>
                        {user.enabledApis.length} 个API
                      </span>
                    ) : (
                      <span className='text-gray-400 dark:text-gray-500'>无权限</span>
                    )}
                  </td>
                  <td className='px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                    {user.showAdultContent ? (
                      <span className='text-red-600 dark:text-red-400'>允许</span>
                    ) : (
                      <span className='text-gray-400 dark:text-gray-500'>禁止</span>
                    )}
                  </td>
                  <td className='px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                    {user.tvboxToken ? (
                      <span className='text-green-600 dark:text-green-400'>已配置</span>
                    ) : (
                      <span className='text-gray-400 dark:text-gray-500'>未配置</span>
                    )}
                  </td>
                  <td className='px-6 py-3 whitespace-nowrap text-right text-sm font-medium'>
                    <div className='flex justify-end space-x-2'>
                      {canOperateUser(user) && (
                        <>
                          <button
                            onClick={() => handleShowChangePasswordForm(user.username)}
                            className={`${buttonStyles.roundedPrimary}`}
                          >
                            修改密码
                          </button>
                          <button
                            onClick={() => onConfigureUserApis(user)}
                            className={`${buttonStyles.roundedPrimary}`}
                          >
                            API配置
                          </button>
                          <button
                            onClick={() => onConfigureUserGroup(user)}
                            className={`${buttonStyles.roundedPrimary}`}
                          >
                            用户组
                          </button>
                          <button
                            onClick={() => onManageTVBoxToken(user)}
                            className={`${buttonStyles.roundedPrimary}`}
                          >
                            TVBox
                          </button>
                          {user.banned ? (
                            <button
                              onClick={() => handleUnbanUser(user.username)}
                              disabled={isLoading(`unbanUser_${user.username}`)}
                              className={`${buttonStyles.roundedSuccess}`}
                            >
                              {isLoading(`unbanUser_${user.username}`) ? '解封中...' : '解封'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBanUser(user.username)}
                              disabled={isLoading(`banUser_${user.username}`)}
                              className={`${buttonStyles.roundedDanger}`}
                            >
                              {isLoading(`banUser_${user.username}`) ? '封禁中...' : '封禁'}
                            </button>
                          )}
                          {role === 'owner' && user.role !== 'owner' && (
                            <>
                              {user.role === 'admin' ? (
                                <button
                                  onClick={() => handleRemoveAdmin(user.username)}
                                  disabled={isLoading(`removeAdmin_${user.username}`)}
                                  className={`${buttonStyles.roundedWarning}`}
                                >
                                  取消管理员
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSetAdmin(user.username)}
                                  disabled={isLoading(`setAdmin_${user.username}`)}
                                  className={`${buttonStyles.roundedSuccess}`}
                                >
                                  设为管理员
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteUser(user.username)}
                                disabled={isLoading(`deleteUser_${user.username}`)}
                                className={`${buttonStyles.roundedDanger}`}
                              >
                                {isLoading(`deleteUser_${user.username}`) ? '删除中...' : '删除'}
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 批量操作 */}
        {selectedUsers.size > 0 && (
          <div className='border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800'>
            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
              批量操作 ({selectedUsers.size} 个用户)
            </h3>
            <div className='flex flex-wrap gap-2'>
              <button
                onClick={() => {
                  // TODO: 实现批量操作
                }}
                className={`${buttonStyles.primary}`}
              >
                批量设置用户组
              </button>
              <button
                onClick={() => {
                  // TODO: 实现批量操作
                }}
                className={`${buttonStyles.primary}`}
              >
                批量API配置
              </button>
              <button
                onClick={() => {
                  setSelectedUsers(new Set());
                }}
                className={`${buttonStyles.secondary}`}
              >
                取消选择
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 删除用户确认弹窗 */}
      <AlertModal
        isOpen={showDeleteUserModal}
        onClose={() => {
          setShowDeleteUserModal(false);
          setDeletingUser(null);
        }}
        type='warning'
        title='确认删除用户'
        message={`确定要删除用户 "${deletingUser}" 吗？此操作不可撤销。`}
        showConfirm={true}
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