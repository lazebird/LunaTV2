'use client';

import { PlaySource } from '../../shared/types';

interface SourceSelectorProps {
  sources: PlaySource[];
  currentSource: number;
  onSelect: (index: number) => void;
}

export const SourceSelector = ({ sources, currentSource, onSelect }: SourceSelectorProps) => {
  if (sources.length <= 1) return null;

  return (
    <div className='flex items-center gap-2 mb-4'>
      <span className='text-sm text-gray-600 dark:text-gray-400'>播放源:</span>
      <div className='flex gap-2'>
        {sources.map((source, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              idx === currentSource
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {source.name}
          </button>
        ))}
      </div>
    </div>
  );
};
