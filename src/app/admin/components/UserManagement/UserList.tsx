'use client';

import { useMemo } from 'react';
import { buttonStyles } from '../../shared/styles';
import { TVBoxTokenCell } from '@/components/TVBoxTokenManager';

interface User {
  username: string;
  role: 'user' | 'admin' | 'owner';
  banned?: boolean;
  tags?: string[];
  enabledApis?: string[];
  showAdultContent?: boolean;
  tvboxToken?: string;
  tvboxEnabledSources?: string[];
}

interface UserListProps {
  users: User[];
  currentUsername: string | null;
  role: 'owner' | 'admin' | null;
  selectedUsers: Set<string>;
  onSelectUser: (username: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onChangePassword: (username: string) => void;
  onSetAdmin: (username: string) => void;
  onRemoveAdmin: (username: string) => void;
  onBan: (username: string) => void;
  onUnban: (username: string) => void;
  onDelete: (username: string) => void;
  onConfigureApis: (user: User) => void;
  onConfigureGroup: (user: User) => void;
  onConfigureTVBox: (user: User) => void;
  isLoading: (key: string) => boolean;
}

export const UserList = ({
  users,
  currentUsername,
  role,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  onChangePassword,
  onSetAdmin,
  onRemoveAdmin,
  onBan,
  onUnban,
  onDelete,
  onConfigureApis,
  onConfigureGroup,
  onConfigureTVBox,
  isLoading,
}: UserListProps) => {
  const selectAll = useMemo(() => {
    const selectableCount = users.filter(
      (user) => role === 'owner' || (role === 'admin' && (user.role === 'user' || user.username === currentUsername))
    ).length;
    return selectedUsers.size === selectableCount && selectedUsers.size > 0;
  }, [selectedUsers.size, users, role, currentUsername]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const priority = (u: User) => {
        if (u.username === currentUsername) return 0;
        if (u.role === 'owner') return 1;
        if (u.role === 'admin') return 2;
        return 3;
      };
      return priority(a) - priority(b);
    });
  }, [users, currentUsername]);

  return (
    <div className='border border-gray-200 dark:border-gray-700 rounded-lg max-h-[28rem] overflow-y-auto overflow-x-auto relative'>
      <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
        <thead className='bg-gray-50 dark:bg-gray-900 sticky top-0 z-10'>
          <tr>
            <th className='w-4' />
            <th className='w-10 px-1 py-3 text-center'>
              {users.some((user) => role === 'owner' || (role === 'admin' && (user.role === 'user' || user.username === currentUsername))) && (
                <input
                  type='checkbox'
                  checked={selectAll}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500'
                />
              )}
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>用户名</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>角色</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>状态</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>用户组</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>采集源权限</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>TVBox Token</th>
            <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>操作</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
          {sortedUsers.map((user) => {
            const canChangePassword = user.role !== 'owner' && (role === 'owner' || (role === 'admin' && (user.role === 'user' || user.username === currentUsername)));
            const canDelete = user.username !== currentUsername && (role === 'owner' || (role === 'admin' && user.role === 'user'));
            const canOperate = user.username !== currentUsername && (role === 'owner' || (role === 'admin' && user.role === 'user'));

            return (
              <tr key={user.username} className='hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'>
                <td className='w-4' />
                <td className='w-10 px-1 py-3 text-center'>
                  {(role === 'owner' || (role === 'admin' && (user.role === 'user' || user.username === currentUsername))) && (
                    <input
                      type='checkbox'
                      checked={selectedUsers.has(user.username)}
                      onChange={(e) => onSelectUser(user.username, e.target.checked)}
                      className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500'
                    />
                  )}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>{user.username}</td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'owner' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' : user.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                    {user.role === 'owner' ? '站长' : user.role === 'admin' ? '管理员' : '普通用户'}
                  </span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <span className={`px-2 py-1 text-xs rounded-full ${!user.banned ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
                    {!user.banned ? '正常' : '已封禁'}
                  </span>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='flex items-center space-x-2'>
                    <span className='text-sm text-gray-900 dark:text-gray-100'>{user.tags && user.tags.length > 0 ? user.tags.join(', ') : '无用户组'}</span>
                    {(role === 'owner' || (role === 'admin' && (user.role === 'user' || user.username === currentUsername))) && (
                      <button onClick={() => onConfigureGroup(user)} className={buttonStyles.roundedPrimary}>配置</button>
                    )}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='flex items-center space-x-2'>
                    <span className='text-sm text-gray-900 dark:text-gray-100'>{user.enabledApis && user.enabledApis.length > 0 ? `${user.enabledApis.length} 个源` : '无限制'}</span>
                    {(role === 'owner' || (role === 'admin' && (user.role === 'user' || user.username === currentUsername))) && (
                      <button onClick={() => onConfigureApis(user)} className={buttonStyles.roundedPrimary}>配置</button>
                    )}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='flex items-center space-x-2'>
                    <TVBoxTokenCell tvboxToken={user.tvboxToken} />
                    {(role === 'owner' || (role === 'admin' && (user.role === 'user' || user.username === currentUsername))) && (
                      <button onClick={() => onConfigureTVBox(user)} className={buttonStyles.roundedPrimary}>配置</button>
                    )}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2'>
                  {canChangePassword && <button onClick={() => onChangePassword(user.username)} className={buttonStyles.roundedPrimary}>修改密码</button>}
                  {canOperate && (
                    <>
                      {user.role === 'user' && <button onClick={() => onSetAdmin(user.username)} disabled={isLoading(`setAdmin_${user.username}`)} className={buttonStyles.roundedPrimary}>设为管理</button>}
                      {user.role === 'admin' && <button onClick={() => onRemoveAdmin(user.username)} disabled={isLoading(`removeAdmin_${user.username}`)} className={buttonStyles.roundedSecondary}>取消管理</button>}
                      {user.role !== 'owner' && (!user.banned ? (
                        <button onClick={() => onBan(user.username)} disabled={isLoading(`banUser_${user.username}`)} className={buttonStyles.roundedDanger}>封禁</button>
                      ) : (
                        <button onClick={() => onUnban(user.username)} disabled={isLoading(`unbanUser_${user.username}`)} className={buttonStyles.roundedSuccess}>解封</button>
                      ))}
                    </>
                  )}
                  {canDelete && <button onClick={() => onDelete(user.username)} className={buttonStyles.roundedDanger}>删除用户</button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
