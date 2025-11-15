'use client';

interface Channel {
  name: string;
  url: string;
  logo?: string;
  group?: string;
}

interface ChannelListProps {
  channels: Channel[];
  currentChannel: number;
  onSelect: (index: number) => void;
}

export const ChannelList = ({ channels, currentChannel, onSelect }: ChannelListProps) => {
  return (
    <div className='space-y-1'>
      {channels.map((channel, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(idx)}
          className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
            idx === currentChannel
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <div className='flex items-center gap-2'>
            {channel.logo && <img src={channel.logo} alt={channel.name} className='w-8 h-8 rounded' />}
            <span className='text-sm font-medium'>{channel.name}</span>
          </div>
        </button>
      ))}
    </div>
  );
};
