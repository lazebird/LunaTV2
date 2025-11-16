'use client';

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
}

export const MenuButton = ({ icon, label, onClick, badge }: MenuButtonProps) => {
  return (
    <button
      onClick={onClick}
      className='relative w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
    >
      <div className='flex-shrink-0'>{icon}</div>
      <span className='flex-1 text-sm font-medium text-gray-900 dark:text-gray-100'>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className='flex-shrink-0 px-2 py-1 text-xs bg-red-600 text-white rounded-full'>{badge}</span>
      )}
    </button>
  );
};
