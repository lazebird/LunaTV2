'use client';

import { SettingsSectionProps } from './types';

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </h4>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}