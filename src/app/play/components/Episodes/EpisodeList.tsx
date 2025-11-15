'use client';

import { Episode } from '../../shared/types';

interface EpisodeListProps {
  episodes: Episode[];
  currentEpisode: number;
  onSelect: (index: number) => void;
}

export const EpisodeList = ({ episodes, currentEpisode, onSelect }: EpisodeListProps) => {
  return (
    <div className='grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2'>
      {episodes.map((ep, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(idx)}
          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
            idx === currentEpisode
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {ep.name}
        </button>
      ))}
    </div>
  );
};
