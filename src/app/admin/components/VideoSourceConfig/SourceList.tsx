'use client';

import { useMemo } from 'react';
import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { buttonStyles } from '../../shared/styles';
import { DataSource } from '../../shared/types';

interface SourceListProps {
  sources: DataSource[];
  selectedSources: Set<string>;
  onSelectSource: (key: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onToggleEnable: (key: string) => void;
  onToggleAdult: (key: string, isAdult: boolean) => void;
  onDelete: (key: string) => void;
  isLoading: (key: string) => boolean;
  validationResults?: Array<{ key: string; status: string; message: string }>;
}

const DraggableRow = ({ source, selected, onSelect, onToggleEnable, onToggleAdult, onDelete, isLoading, validationStatus }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: source.key });
  const style = { transform: CSS.Transform.toString(transform), transition } as React.CSSProperties;

  return (
    <tr ref={setNodeRef} style={style} className='hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors select-none'>
      <td className='px-2 py-4 cursor-grab text-gray-400' style={{ touchAction: 'none' }} {...attributes} {...listeners}><GripVertical size={16} /></td>
      <td className='px-2 py-4 text-center'><input type='checkbox' checked={selected} onChange={(e) => onSelect(source.key, e.target.checked)} className='w-4 h-4 text-blue-600 rounded' /></td>
      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100'>{source.name}</td>
      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100'>{source.key}</td>
      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 max-w-[12rem] truncate' title={source.api}>{source.api}</td>
      <td className='px-6 py-4 whitespace-nowrap'><span className={`px-2 py-1 text-xs rounded-full ${!source.disabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{!source.disabled ? '启用中' : '已禁用'}</span></td>
      <td className='px-6 py-4 whitespace-nowrap text-center'>
        <button onClick={() => onToggleAdult(source.key, !source.is_adult)} className={`relative inline-flex h-6 w-11 items-center rounded-full ${source.is_adult ? 'bg-gradient-to-r from-red-600 to-pink-600' : 'bg-gray-200'}`}>
          <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${source.is_adult ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </td>
      <td className='px-6 py-4 whitespace-nowrap text-right text-sm space-x-2'>
        <button onClick={() => onToggleEnable(source.key)} disabled={isLoading(`toggleSource_${source.key}`)} className={!source.disabled ? buttonStyles.roundedDanger : buttonStyles.roundedSuccess}>{!source.disabled ? '禁用' : '启用'}</button>
        {source.from !== 'config' && <button onClick={() => onDelete(source.key)} className={buttonStyles.roundedSecondary}>删除</button>}
      </td>
    </tr>
  );
};

export const SourceList = ({ sources, selectedSources, onSelectSource, onSelectAll, onToggleEnable, onToggleAdult, onDelete, isLoading, validationResults }: SourceListProps) => {
  const selectAll = useMemo(() => selectedSources.size === sources.length && sources.length > 0, [selectedSources.size, sources.length]);

  return (
    <div className='border border-gray-200 dark:border-gray-700 rounded-lg h-[calc(100vh-18rem)] overflow-y-auto'>
      <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
        <thead className='bg-gray-50 dark:bg-gray-900 sticky top-0 z-10'>
          <tr>
            <th className='w-8' />
            <th className='w-12 px-2 py-3 text-center'><input type='checkbox' checked={selectAll} onChange={(e) => onSelectAll(e.target.checked)} className='w-4 h-4 text-blue-600 rounded' /></th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>名称</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>Key</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>API</th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>状态</th>
            <th className='px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>成人</th>
            <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>操作</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
          {sources.map((source) => (
            <DraggableRow key={source.key} source={source} selected={selectedSources.has(source.key)} onSelect={onSelectSource} onToggleEnable={onToggleEnable} onToggleAdult={onToggleAdult} onDelete={onDelete} isLoading={isLoading} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
