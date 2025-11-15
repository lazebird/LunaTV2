'use client';

import { buttonStyles } from '../../shared/styles';
import { SiteConfig } from '../../shared/types';

interface SiteSettingsProps {
  config: SiteConfig;
  onChange: (field: keyof SiteConfig, value: any) => void;
  onSave: () => void;
  isLoading: boolean;
}

export const SiteSettings = ({ config, onChange, onSave, isLoading }: SiteSettingsProps) => {
  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>站点名称</label>
          <input type='text' value={config.SiteName} onChange={(e) => onChange('SiteName', e.target.value)} className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100' />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>搜索最大页数</label>
          <input type='number' min='1' max='50' value={config.SearchDownstreamMaxPage} onChange={(e) => onChange('SearchDownstreamMaxPage', parseInt(e.target.value))} className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100' />
        </div>
      </div>
      <div>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>站点公告</label>
        <textarea rows={3} value={config.Announcement} onChange={(e) => onChange('Announcement', e.target.value)} className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100' />
      </div>
      <div className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg'>
        <div>
          <div className='font-medium text-gray-900 dark:text-gray-100'>流式搜索</div>
          <div className='text-sm text-gray-600 dark:text-gray-400'>启用实时搜索结果输出</div>
        </div>
        <button type='button' onClick={() => onChange('FluidSearch', !config.FluidSearch)} className={`relative inline-flex h-6 w-11 items-center rounded-full ${config.FluidSearch ? buttonStyles.toggleOn : buttonStyles.toggleOff}`}>
          <span className={`inline-block h-4 w-4 rounded-full ${buttonStyles.toggleThumb} transition-transform ${config.FluidSearch ? buttonStyles.toggleThumbOn : buttonStyles.toggleThumbOff}`} />
        </button>
      </div>
      <div className='flex justify-end'>
        <button onClick={onSave} disabled={isLoading} className={isLoading ? buttonStyles.disabled : buttonStyles.primary}>{isLoading ? '保存中...' : '保存配置'}</button>
      </div>
    </div>
  );
};
