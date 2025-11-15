interface User {
  username: string;
  role: 'user' | 'admin' | 'owner';
  banned?: boolean;
  tags?: string[];
  enabledApis?: string[];
  tvboxToken?: string;
}

interface UserListProps {
  users: User[];
  currentUsername: string | null;
  role: 'owner' | 'admin' | null;
  onBan: (username: string) => void;
  onUnban: (username: string) => void;
  onSetAdmin: (username: string) => void;
  onRemoveAdmin: (username: string) => void;
  onChangePassword: (username: string) => void;
  onDelete: (username: string) => void;
  onConfigureApis: (user: User) => void;
  onConfigureGroup: (user: User) => void;
  onConfigureTVBox: (user: User) => void;
  loading: Record<string, boolean>;
}

export function UserList({
  users,
  currentUsername,
  role,
  onBan,
  onUnban,
  onSetAdmin,
  onRemoveAdmin,
  onChangePassword,
  onDelete,
  onConfigureApis,
  onConfigureGroup,
  onConfigureTVBox,
  loading,
}: UserListProps) {
  const sortedUsers = [...users].sort((a, b) => {
    const priority = (u: User) => {
      if (u.username === currentUsername) return 0;
      if (u.role === 'owner') return 1;
      if (u.role === 'admin') return 2;
      return 3;
    };
    return priority(a) - priority(b);
  });

  return (
    <div className='border border-gray-200 dark:border-gray-700 rounded-lg max-h-[28rem] overflow-y-auto'>
      <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
        <thead className='bg-gray-50 dark:bg-gray-900 sticky top-0 z-10'>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>用户名</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>角色</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>状态</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>用户组</th>
            <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>操作</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
          {sortedUsers.map((user) => {
            const canChangePassword = user.role !== 'owner' && (role === 'owner' || (role === 'admin' && (user.role === 'user' || user.username === currentUsername)));
            const canDelete = user.username !== currentUsername && (role === 'owner' || (role === 'admin' && user.role === 'user'));
            const canOperate = user.username !== currentUsername && (role === 'owner' || (role === 'admin' && user.role === 'user'));

            return (
              <tr key={user.username} className='hover:bg-gray-50 dark:hover:bg-gray-800'>
                <td className='px-6 py-4 text-sm text-gray-900 dark:text-gray-100'>{user.username}</td>
                <td className='px-6 py-4'>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'owner' ? 'bg-yellow-100 text-yellow-800' :
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role === 'owner' ? '站长' : user.role === 'admin' ? '管理员' : '普通用户'}
                  </span>
                </td>
                <td className='px-6 py-4'>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    !user.banned ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {!user.banned ? '正常' : '已封禁'}
                  </span>
                </td>
                <td className='px-6 py-4 text-sm'>
                  {user.tags?.join(', ') || '无'}
                  <button onClick={() => onConfigureGroup(user)} className='ml-2 text-blue-600 hover:text-blue-800'>配置</button>
                </td>
                <td className='px-6 py-4 text-right space-x-2'>
                  {canChangePassword && (
                    <button onClick={() => onChangePassword(user.username)} className='text-blue-600 hover:text-blue-800 text-sm'>修改密码</button>
                  )}
                  {canOperate && (
                    <>
                      {user.role === 'user' && (
                        <button onClick={() => onSetAdmin(user.username)} disabled={loading[`setAdmin_${user.username}`]} className='text-purple-600 hover:text-purple-800 text-sm'>设为管理</button>
                      )}
                      {user.role === 'admin' && (
                        <button onClick={() => onRemoveAdmin(user.username)} disabled={loading[`removeAdmin_${user.username}`]} className='text-gray-600 hover:text-gray-800 text-sm'>取消管理</button>
                      )}
                      {!user.banned ? (
                        <button onClick={() => onBan(user.username)} disabled={loading[`banUser_${user.username}`]} className='text-red-600 hover:text-red-800 text-sm'>封禁</button>
                      ) : (
                        <button onClick={() => onUnban(user.username)} disabled={loading[`unbanUser_${user.username}`]} className='text-green-600 hover:text-green-800 text-sm'>解封</button>
                      )}
                    </>
                  )}
                  {canDelete && (
                    <button onClick={() => onDelete(user.username)} className='text-red-600 hover:text-red-800 text-sm'>删除</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
