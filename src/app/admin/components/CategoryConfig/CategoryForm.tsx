'use client';

import { buttonStyles } from '../../shared/styles';
import { CustomCategory } from '../../shared/types';

interface CategoryFormProps {
  category: Partial<CustomCategory>;
  onChange: (field: keyof CustomCategory, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const CategoryForm = ({ category, onChange, onSubmit, onCancel, isLoading }: CategoryFormProps) => {
  return (
    <div className='p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4'>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <input type='text' placeholder='分类名称' value={category.name || ''} onChange={(e) => onChange('name', e.target.value)} className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100' />
        <select value={category.type || 'movie'} onChange={(e) => onChange('type', e.target.value as 'movie' | 'tv')} className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'>
          <option value='movie'>电影</option>
          <option value='tv'>电视剧</option>
        </select>
        <input type='text' placeholder='搜索关键词' value={category.query || ''} onChange={(e) => onChange('query', e.target.value)} className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100' />
      </div>
      <div className='flex justify-end'>
        <button onClick={onCancel} className={`mr-2 ${buttonStyles.secondary}`}>取消</button>
        <button onClick={onSubmit} disabled={!category.name || !category.query || isLoading} className={!category.name || !category.query || isLoading ? buttonStyles.disabled : buttonStyles.success}>{isLoading ? '添加中...' : '添加'}</button>
      </div>
    </div>
  );
};
