'use client';

import { buttonStyles } from '../../shared/styles';

interface UserGroup {
  name: string;
  enabledApis: string[];
  showAdultContent?: boolean;
}

interface UserGroupListProps {
  groups: UserGroup[];
  onEdit: (group: UserGroup) => void;
  onDelete: (name: string) => void;
  isLoading: (key: string) => boolean;
}

export const UserGroupList = ({ groups, onEdit, onDelete, isLoading }: UserGroupListProps) => {
  return (
    <div className='border border-gray-200 dark:border-gray-700 rounded-lg max-h-[20rem] overflow-y-auto'>
      <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
        <thead className='bg-gray-50 dark:bg-gray-900 sticky top-0 z-10'>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>用户组名称</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>可用视频源</th>
            <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>操作</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
          {groups.map((group) => (
            <tr key={group.name} className='hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'>
              <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>{group.name}</td>
              <td className='px-6 py-4 whitespace-nowrap'>
                <span className='text-sm text-gray-900 dark:text-gray-100'>{group.enabledApis?.length > 0 ? `${group.enabledApis.length} 个源` : '无限制'}</span>
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2'>
                <button onClick={() => onEdit(group)} disabled={isLoading(`userGroup_edit_${group.name}`)} className={buttonStyles.roundedPrimary}>编辑</button>
                <button onClick={() => onDelete(group.name)} className={buttonStyles.roundedDanger}>删除</button>
              </td>
            </tr>
          ))}
          {groups.length === 0 && (
            <tr>
              <td colSpan={3} className='px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400'>暂无用户组</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
