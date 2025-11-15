'use client';

import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { buttonStyles } from '../../shared/styles';
import { CustomCategory } from '../../shared/types';

const DraggableRow = ({ category, onToggle, onDelete, isLoading }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `${category.query}:${category.type}` });
  const style = { transform: CSS.Transform.toString(transform), transition } as React.CSSProperties;

  return (
    <tr ref={setNodeRef} style={style} className='hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors select-none'>
      <td className='px-2 py-4 cursor-grab text-gray-400' style={{ touchAction: 'none' }} {...attributes} {...listeners}><GripVertical size={16} /></td>
      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100'>{category.name || '-'}</td>
      <td className='px-6 py-4 whitespace-nowrap'><span className={`px-2 py-1 text-xs rounded-full ${category.type === 'movie' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{category.type === 'movie' ? '电影' : '电视剧'}</span></td>
      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 max-w-[12rem] truncate' title={category.query}>{category.query}</td>
      <td className='px-6 py-4 whitespace-nowrap'><span className={`px-2 py-1 text-xs rounded-full ${!category.disabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{!category.disabled ? '启用中' : '已禁用'}</span></td>
      <td className='px-6 py-4 whitespace-nowrap text-right text-sm space-x-2'>
        <button onClick={() => onToggle(category.query, category.type)} disabled={isLoading(`toggleCategory_${category.query}_${category.type}`)} className={!category.disabled ? buttonStyles.roundedDanger : buttonStyles.roundedSuccess}>{!category.disabled ? '禁用' : '启用'}</button>
        {category.from !== 'config' && <button onClick={() => onDelete(category.query, category.type)} className={buttonStyles.roundedSecondary}>删除</button>}
      </td>
    </tr>
  );
};

interface CategoryListProps {
  categories: CustomCategory[];
  onToggle: (query: string, type: 'movie' | 'tv') => void;
  onDelete: (query: string, type: 'movie' | 'tv') => void;
  isLoading: (key: string) => boolean;
}

export const CategoryList = ({ categories, onToggle, onDelete, isLoading }: CategoryListProps) => {
  return (
    <div className='border border-gray-200 dark:border-gray-700 rounded-lg max-h-[28rem] overflow-y-auto'>
      <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
        <thead className='bg-gray-50 dark:bg-gray-900 sticky top-0 z-10'>
          <tr>
            <th className='w-8' />
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>分类名称</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>类型</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>搜索关键词</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>状态</th>
            <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>操作</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
          {categories.map((category) => <DraggableRow key={`${category.query}:${category.type}`} category={category} onToggle={onToggle} onDelete={onDelete} isLoading={isLoading} />)}
        </tbody>
      </table>
    </div>
  );
};
