'use client';

import { buttonStyles } from '../../shared/styles';
import { DataSource } from '../../shared/types';

interface SourceFormProps {
  source: Partial<DataSource>;
  onChange: (field: keyof DataSource, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const SourceForm = ({ source, onChange, onSubmit, onCancel, isLoading }: SourceFormProps) => {
  return (
    <div className='p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4'>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <input type='text' placeholder='名称' value={source.name || ''} onChange={(e) => onChange('name', e.target.value)} className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100' />
        <input type='text' placeholder='Key' value={source.key || ''} onChange={(e) => onChange('key', e.target.value)} className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100' />
        <input type='text' placeholder='API 地址' value={source.api || ''} onChange={(e) => onChange('api', e.target.value)} className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100' />
        <input type='text' placeholder='Detail 地址（选填）' value={source.detail || ''} onChange={(e) => onChange('detail', e.target.value)} className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100' />
      </div>
      <div className='flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
        <label className='flex items-center space-x-2 cursor-pointer'>
          <input type='checkbox' checked={source.is_adult || false} onChange={(e) => onChange('is_adult', e.target.checked)} className='w-4 h-4 text-red-600 rounded' />
          <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>标记为成人资源 🔞</span>
        </label>
      </div>
      <div className='flex justify-end'>
        <button onClick={onCancel} className={`mr-2 ${buttonStyles.secondary}`}>取消</button>
        <button onClick={onSubmit} disabled={!source.name || !source.key || !source.api || isLoading} className={!source.name || !source.key || !source.api || isLoading ? buttonStyles.disabled : buttonStyles.success}>{isLoading ? '添加中...' : '添加'}</button>
      </div>
    </div>
  );
};
