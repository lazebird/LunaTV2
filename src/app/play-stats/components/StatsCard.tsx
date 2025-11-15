'use client';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

export const StatsCard = ({ title, value, icon, color = 'blue' }: StatsCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm text-gray-600 dark:text-gray-400'>{title}</p>
          <p className='text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2'>{value}</p>
        </div>
        {icon && <div className='text-gray-400'>{icon}</div>}
      </div>
    </div>
  );
};
