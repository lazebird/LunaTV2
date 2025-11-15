'use client';

import { buttonStyles } from '../../shared/styles';

interface PasswordFormProps {
  username: string;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const PasswordForm = ({ username, password, onPasswordChange, onSubmit, onCancel, isLoading }: PasswordFormProps) => {
  return (
    <div className='mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700'>
      <h5 className='text-sm font-medium text-blue-800 dark:text-blue-300 mb-3'>修改用户密码</h5>
      <div className='flex flex-col sm:flex-row gap-4 sm:gap-3'>
        <input type='text' value={username} disabled className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-not-allowed' />
        <input type='password' placeholder='新密码' value={password} onChange={(e) => onPasswordChange(e.target.value)} className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500' />
        <button onClick={onSubmit} disabled={!password || isLoading} className={`w-full sm:w-auto ${!password || isLoading ? buttonStyles.disabled : buttonStyles.primary}`}>{isLoading ? '修改中...' : '修改密码'}</button>
        <button onClick={onCancel} className={`w-full sm:w-auto ${buttonStyles.secondary}`}>取消</button>
      </div>
    </div>
  );
};
