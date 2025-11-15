'use client';

interface Release {
  title: string;
  date: string;
  poster?: string;
  type: 'movie' | 'tv';
}

interface CalendarGridProps {
  releases: Release[];
  onSelect?: (release: Release) => void;
}

export const CalendarGrid = ({ releases, onSelect }: CalendarGridProps) => {
  const groupedByDate = releases.reduce((acc, release) => {
    const date = release.date.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(release);
    return acc;
  }, {} as Record<string, Release[]>);

  return (
    <div className='space-y-6'>
      {Object.entries(groupedByDate).map(([date, items]) => (
        <div key={date}>
          <h3 className='text-lg font-bold text-gray-900 dark:text-gray-100 mb-3'>
            {new Date(date).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </h3>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
            {items.map((release, idx) => (
              <button
                key={idx}
                onClick={() => onSelect?.(release)}
                className='text-left bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow'
              >
                <div className='aspect-[2/3] bg-gray-200 dark:bg-gray-700' />
                <div className='p-2'>
                  <h4 className='text-sm font-medium line-clamp-2'>{release.title}</h4>
                  <span className='text-xs text-gray-500'>{release.type === 'movie' ? '电影' : '电视剧'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
