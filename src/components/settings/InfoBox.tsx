'use client';

import { InfoBoxProps } from './types';

export function InfoBox({ children, type = 'blue' }: InfoBoxProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  };

  return (
    <div className={`text-xs text-gray-500 dark:text-gray-400 p-3 rounded-lg border ${colorClasses[type]}`}>
      {children}
    </div>
  );
}