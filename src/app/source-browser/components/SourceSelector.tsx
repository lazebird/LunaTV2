'use client';

interface Source {
  key: string;
  name: string;
  api: string;
}

interface SourceSelectorProps {
  sources: Source[];
  selectedSource: string;
  onSelect: (key: string) => void;
}

export const SourceSelector = ({ sources, selectedSource, onSelect }: SourceSelectorProps) => {
  return (
    <div className='flex flex-wrap gap-2'>
      {sources.map((source) => (
        <button
          key={source.key}
          onClick={() => onSelect(source.key)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedSource === source.key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {source.name}
        </button>
      ))}
    </div>
  );
};
