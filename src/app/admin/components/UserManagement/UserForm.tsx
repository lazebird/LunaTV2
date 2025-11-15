'use client';

import { buttonStyles } from '../../shared/styles';

interface UserFormProps {
  username: string;
  password: string;
  userGroup: string;
  userGroups: Array<{ name: string; enabledApis: string[] }>;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onUserGroupChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const UserForm = ({
  username,
  password,
  userGroup,
  userGroups,
  onUsernameChange,
  onPasswordChange,
  onUserGroupChange,
  onSubmit,
  onCancel,
  isLoading,
}: UserFormProps) => {
  return (
    <div className='mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700'>
      <div className='space-y-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <input
            type='text'
            placeholder='用户名'
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent'
          />
          <input
            type='password'
            placeholder='密码'
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent'
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>用户组（可选）</label>
          <select
            value={userGroup}
            onChange={(e) => onUserGroupChange(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent'
          >
            <option value=''>无用户组（无限制）</option>
            {userGroups.map((group) => (
              <option key={group.name} value={group.name}>
                {group.name} ({group.enabledApis && group.enabledApis.length > 0 ? `${group.enabledApis.length} 个源` : '无限制'})
              </option>
            ))}
          </select>
        </div>
        <div className='flex justify-end space-x-2'>
          <button onClick={onCancel} className={buttonStyles.secondary}>取消</button>
          <button
            onClick={onSubmit}
            disabled={!username || !password || isLoading}
            className={!username || !password || isLoading ? buttonStyles.disabled : buttonStyles.success}
          >
            {isLoading ? '添加中...' : '添加'}
          </button>
        </div>
      </div>
    </div>
  );
};
