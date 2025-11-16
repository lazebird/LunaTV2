import { ExternalLink, Link, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VideoCardActionsProps {
  id?: string;
  source?: string;
  title?: string;
  from: 'playrecord' | 'favorite' | 'search' | 'douban';
  onDelete?: () => void;
  onPlay?: () => void;
  onToggleFavorite?: () => void;
  favorited?: boolean;
  origin?: 'vod' | 'live';
}

export function VideoCardActions({
  id,
  source,
  title,
  from,
  onDelete,
  onPlay,
  onToggleFavorite,
  favorited,
  origin = 'vod',
}: VideoCardActionsProps) {
  const router = useRouter();

  const handlePlay = () => {
    if (onPlay) {
      onPlay();
    } else if (id && source) {
      const url = origin === 'live' 
        ? `/live?channel=${encodeURIComponent(id)}`
        : `/play?source=${encodeURIComponent(source)}&id=${encodeURIComponent(id)}`;
      router.push(url);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      onDelete();
      return;
    }

    if (!id || !source) return;

    try {
      if (from === 'favorite') {
        const { deleteFavorite } = require('@/frontend/lib/db.client');
        await deleteFavorite(source, id);
      } else if (from === 'playrecord') {
        const { deletePlayRecord } = await import('@/frontend/lib/db.client');
        await deletePlayRecord(source, id);
      }
      
      // 触发页面刷新或状态更新
      window.dispatchEvent(new CustomEvent('dataUpdated'));
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleShare = () => {
    if (!id || !source || !title) return;

    const url = `${window.location.origin}/play?source=${encodeURIComponent(source)}&id=${encodeURIComponent(id)}`;
    
    if (navigator.share) {
      navigator.share({
        title,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      // 可以显示提示
    }
  };

  const handleExternalLink = () => {
    if (!id || !source) return;
    
    const url = `/play?source=${encodeURIComponent(source)}&id=${encodeURIComponent(id)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex items-center space-x-2">
      {/* 播放按钮 */}
      <button
        onClick={handlePlay}
        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        title="播放"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6.3 2.841A1.5 1.5 0 004.5 4.11v11.78a1.5 1.5 0 002.8-1.27l7.5-5.89a1.5 1.5 0 000-2.24l-7.5-5.89z" />
        </svg>
      </button>

      {/* 收藏按钮 */}
      {onToggleFavorite && (
        <button
          onClick={onToggleFavorite}
          className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          title={favorited ? '取消收藏' : '添加收藏'}
        >
          <svg
            className={`w-4 h-4 ${favorited ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
          </svg>
        </button>
      )}

      {/* 分享按钮 */}
      <button
        onClick={handleShare}
        className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        title="分享"
      >
        <Link className="w-4 h-4 text-gray-500" />
      </button>

      {/* 外部链接按钮 */}
      <button
        onClick={handleExternalLink}
        className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        title="在新窗口打开"
      >
        <ExternalLink className="w-4 h-4 text-gray-500" />
      </button>

      {/* 删除按钮 */}
      {(from === 'playrecord' || from === 'favorite') && (
        <button
          onClick={handleDelete}
          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
          title="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}