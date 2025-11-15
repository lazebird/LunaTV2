'use client';

interface PlayRecord {
  vod_name: string;
  vod_pic?: string;
  episode: number;
  lastPlayedAt: string;
}

interface RecentPlayListProps {
  records: PlayRecord[];
  maxItems?: number;
}

export const RecentPlayList = ({ records, maxItems = 10 }: RecentPlayListProps) => {
  const displayRecords = records.slice(0, maxItems);

  return (
    <div className='space-y-2'>
      {displayRecords.map((record, idx) => (
        <div key={idx} className='flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'>
          <div className='w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0' />
          <div className='flex-1 min-w-0'>
            <h4 className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate'>{record.vod_name}</h4>
            <p className='text-xs text-gray-600 dark:text-gray-400 mt-1'>第{record.episode}集</p>
            <p className='text-xs text-gray-500 dark:text-gray-500 mt-1'>{new Date(record.lastPlayedAt).toLocaleString()}</p>
          </div>
        </div>
      ))}
      {displayRecords.length === 0 && (
        <div className='text-center py-8 text-gray-500'>暂无播放记录</div>
      )}
    </div>
  );
};
