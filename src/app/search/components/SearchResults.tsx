'use client';

interface SearchResult {
  vod_id: string;
  vod_name: string;
  vod_pic?: string;
  vod_remarks?: string;
  source: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export const SearchResults = ({ results, isLoading, onLoadMore, hasMore }: SearchResultsProps) => {
  if (isLoading && results.length === 0) {
    return <div className='text-center py-12 text-gray-500'>搜索中...</div>;
  }

  if (results.length === 0) {
    return <div className='text-center py-12 text-gray-500'>暂无结果</div>;
  }

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'>
        {results.map((result, idx) => (
          <div key={`${result.source}-${result.vod_id}-${idx}`} className='bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow'>
            <div className='aspect-[2/3] bg-gray-200 dark:bg-gray-700' />
            <div className='p-2'>
              <h3 className='text-sm font-medium line-clamp-2'>{result.vod_name}</h3>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className='text-center'>
          <button onClick={onLoadMore} disabled={isLoading} className='px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg'>
            {isLoading ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  );
};
