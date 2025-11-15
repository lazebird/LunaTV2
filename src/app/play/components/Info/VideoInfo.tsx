'use client';

import Image from 'next/image';
import { VideoInfo as VideoInfoType } from '../../shared/types';

interface VideoInfoProps {
  info: VideoInfoType;
  onFavorite?: () => void;
  isFavorited?: boolean;
}

export const VideoInfo = ({ info, onFavorite, isFavorited }: VideoInfoProps) => {
  return (
    <div className='flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg'>
      {info.vod_pic && (
        <div className='relative w-32 h-48 flex-shrink-0'>
          <Image src={info.vod_pic} alt={info.vod_name} fill className='object-cover rounded-lg' />
        </div>
      )}
      <div className='flex-1'>
        <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2'>{info.vod_name}</h1>
        {info.vod_remarks && <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>{info.vod_remarks}</p>}
        {info.type_name && <span className='inline-block px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full'>{info.type_name}</span>}
        {onFavorite && (
          <button onClick={onFavorite} className='mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors'>
            {isFavorited ? '取消收藏' : '收藏'}
          </button>
        )}
      </div>
    </div>
  );
};
