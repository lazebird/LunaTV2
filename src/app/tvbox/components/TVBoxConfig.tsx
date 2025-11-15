'use client';

interface TVBoxConfigProps {
  apiUrl: string;
  token?: string;
  onCopy: () => void;
}

export const TVBoxConfig = ({ apiUrl, token, onCopy }: TVBoxConfigProps) => {
  const fullUrl = token ? `${apiUrl}?token=${token}` : apiUrl;

  return (
    <div className='p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
      <h2 className='text-xl font-bold text-gray-900 dark:text-gray-100 mb-4'>TVBox配置</h2>
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>配置地址</label>
          <div className='flex gap-2'>
            <input
              type='text'
              value={fullUrl}
              readOnly
              className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
            />
            <button onClick={onCopy} className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'>
              复制
            </button>
          </div>
        </div>
        {token && (
          <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
            <p className='text-sm text-blue-800 dark:text-blue-300'>
              ⚠️ 此配置包含您的专属Token，请勿分享给他人
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
