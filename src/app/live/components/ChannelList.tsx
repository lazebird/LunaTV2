import { Heart, Radio, Tv } from 'lucide-react';
import { LiveChannel } from '../types';

interface ChannelListProps {
  channels: LiveChannel[];
  favorites: string[];
  selectedChannel?: LiveChannel;
  onChannelSelect: (channel: LiveChannel) => void;
  onToggleFavorite: (channelId: string) => void;
  isLoading?: boolean;
}

export function ChannelList({
  channels,
  favorites,
  selectedChannel,
  onChannelSelect,
  onToggleFavorite,
  isLoading = false,
}: ChannelListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Tv className="w-12 h-12 mb-2 opacity-50" />
        <p>暂无频道</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {channels.map((channel) => (
        <div
          key={channel.id}
          className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
            selectedChannel?.id === channel.id
              ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
          }`}
          onClick={() => onChannelSelect(channel)}
        >
          {/* 频道Logo */}
          <div className="flex-shrink-0 mr-3">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-10 h-10 rounded object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${channel.logo ? 'hidden' : ''}`}>
              <Radio className="w-5 h-5 text-gray-500" />
            </div>
          </div>

          {/* 频道信息 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {channel.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {channel.group}
            </p>
          </div>

          {/* 收藏按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(channel.id);
            }}
            className="ml-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label={favorites.includes(channel.id) ? '取消收藏' : '添加收藏'}
          >
            <Heart
              className={`w-5 h-5 ${
                favorites.includes(channel.id)
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-400'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}