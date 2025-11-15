export function LoadingSpinner({ message = '加载中...' }: { message?: string }) {
  return (
    <div className='flex justify-center items-center py-8'>
      <div className='flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50 shadow-md'>
        <div className='animate-spin rounded-full h-5 w-5 border-2 border-blue-300 border-t-blue-600 dark:border-blue-700 dark:border-t-blue-400'></div>
        <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
          {message}
        </span>
      </div>
    </div>
  );
}
