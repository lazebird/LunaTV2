'use client';

import React, { useState } from 'react';

import { AdminConfig as IAdminConfig } from '@/frontend/lib/admin.types';

// 类型别名，避免循环引用
type AdminConfigType = IAdminConfig;

import { TVBoxTokenCell, TVBoxTokenModal } from '@/frontend/components/TVBoxTokenManager';
import UserManagement from '@/frontend/components/admin/UserManagement';
import UserGroupManagement from '@/frontend/components/admin/UserGroupManagement';
import UserApiConfig from '@/frontend/components/admin/UserApiConfig';

// 统一按钮样式系统
const buttonStyles = {
  primary:
    'px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors',
  success:
    'px-3 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg transition-colors',
  secondary:
    'px-3 py-1.5 text-sm font-medium bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-lg transition-colors',
};

interface UserConfigProps {
  config: AdminConfigType | null;
  role: 'owner' | 'admin' | null;
  refreshConfig: () => Promise<void>;
}

export default function UserConfig({ config, role, refreshConfig }: UserConfigProps) {
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showTVBoxTokenModal, setShowTVBoxTokenModal] = useState(false);
  const [tvboxTokenUser, setTVBoxTokenUser] = useState<{
    username: string;
    tvboxToken?: string;
    tvboxEnabledSources?: string[];
  } | null>(null);
  const [selectedTVBoxSources, setSelectedTVBoxSources] = useState<string[]>([]);

  if (!config) {
    return <div className="text-center p-8">加载中...</div>;
  }

  // 处理TVBox Token管理
  const handleManageTVBoxToken = (user: {
    username: string;
    tvboxToken?: string;
    tvboxEnabledSources?: string[];
  }) => {
    setTVBoxTokenUser(user);
    setSelectedTVBoxSources(user.tvboxEnabledSources || []);
    setShowTVBoxTokenModal(true);
  };

  const handleSaveTVBoxToken = async (username: string, token: string, enabledSources: string[]) => {
    try {
      const res = await fetch('/api/admin/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'configureTVBox',
          username,
          tvboxToken: token,
          tvboxEnabledSources: enabledSources,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `配置失败: ${res.status}`);
      }

      await refreshConfig();
      setShowTVBoxTokenModal(false);
      setTVBoxTokenUser(null);
      // 成功提示会在子组件中处理
    } catch (err) {
      console.error('TVBox配置失败:', err);
      throw err;
    }
  };

  return (
    <div className='space-y-6'>
      {/* 用户管理部分 */}
      <div>
        <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
          用户管理
        </h2>
        <div className='space-y-4'>
          <div className='flex justify-between items-center'>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              管理系统用户、权限和设置
            </p>
            <button
              onClick={() => setShowAddUserForm(!showAddUserForm)}
              className={`${buttonStyles.success}`}
            >
              {showAddUserForm ? '收起表单' : '添加用户'}
            </button>
          </div>
          
          <UserManagement
            config={config as any}
            role={role}
            refreshConfig={refreshConfig}
            onConfigureUserApis={(user) => {
              // 这里可以打开API配置模态框
              console.log('配置API权限:', user);
            }}
            onConfigureUserGroup={(user) => {
              // 这里可以打开用户组配置模态框
              console.log('配置用户组:', user);
            }}
            onManageTVBoxToken={handleManageTVBoxToken}
          />
        </div>
      </div>

      {/* 用户组管理部分 */}
      <div>
        <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
          用户组管理
        </h2>
        <div className='space-y-4'>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            创建和管理用户组，批量设置权限和访问控制
          </p>
          
          <UserGroupManagement
            config={config as any}
            role={role}
            refreshConfig={refreshConfig}
          />
        </div>
      </div>

      {/* API配置管理部分 */}
      <div>
        <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
          API权限配置
        </h2>
        <div className='space-y-4'>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            管理用户对各功能模块的API访问权限
          </p>
          
          <UserApiConfig
            config={config as any}
            role={role}
            refreshConfig={refreshConfig}
          />
        </div>
      </div>

      {/* TVBox Token管理模态框 */}
      <TVBoxTokenModal
        isOpen={showTVBoxTokenModal}
        onClose={() => {
          setShowTVBoxTokenModal(false);
          setTVBoxTokenUser(null);
          setSelectedTVBoxSources([]);
        }}
        user={tvboxTokenUser}
        selectedSources={selectedTVBoxSources}
        onSourcesChange={setSelectedTVBoxSources}
        onSave={handleSaveTVBoxToken}
      />
    </div>
  );
}