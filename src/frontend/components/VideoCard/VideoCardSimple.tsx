'use client';

import Image from 'next/image';
import Link from 'next/link';

interface VideoCardSimpleProps {
  id: string;
  title: string;
  cover?: string;
  remarks?: string;
  source: string;
}

export const VideoCardSimple = ({ id, title, cover, remarks, source }: VideoCardSimpleProps) => {
  return (
    <Link href={`/play?id=${id}&source=${source}`}>
      <div className='group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all'>
        <div className='relative aspect-[2/3]'>
          {cover ? (
            <Image src={cover} alt={title} fill className='object-cover group-hover:scale-110 transition-transform' />
          ) : (
            <div className='w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center'>
              <span className='text-gray-400'>暂无封面</span>
            </div>
          )}
          {remarks && <div className='absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded'>{remarks}</div>}
        </div>
        <div className='p-3'>
          <h3 className='text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2'>{title}</h3>
        </div>
      </div>
    </Link>
  );
};
