'use client';

interface UserProfileProps {
  username: string;
  role: 'user' | 'admin' | 'owner';
  level?: number;
}

export const UserProfile = ({ username, role, level }: UserProfileProps) => {
  const getRoleName = () => {
    switch (role) {
      case 'owner': return '站长';
      case 'admin': return '管理员';
      default: return '用户';
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
      <div className='flex items-center gap-3'>
        <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg'>
          {username.charAt(0).toUpperCase()}
        </div>
        <div className='flex-1'>
          <h3 className='text-lg font-bold text-gray-900 dark:text-gray-100'>{username}</h3>
          <div className='flex items-center gap-2 mt-1'>
            <span className={`px-2 py-0.5 text-xs rounded-full ${getRoleColor()}`}>{getRoleName()}</span>
            {level !== undefined && <span className='text-xs text-gray-600 dark:text-gray-400'>Lv.{level}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
