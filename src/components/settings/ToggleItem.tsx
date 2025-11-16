'use client';

import { ToggleItemProps } from './types';
import { Toggle } from './Toggle';

export function ToggleItem({ title, description, checked, onChange, disabled = false }: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between">
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
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}