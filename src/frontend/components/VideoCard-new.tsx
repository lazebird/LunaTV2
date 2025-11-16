import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  deleteFavorite,
  deletePlayRecord,
  generateStorageKey,
  isFavorited,
  saveFavorite,
  subscribeToDataUpdates,
} from '@/frontend/lib/db.client';
import { useLongPress } from '@/frontend/hooks/useLongPress';

import { VideoCardContent } from './video-card/VideoCardContent';
import { VideoCardActions } from './video-card/VideoCardActions';
import MobileActionSheet from '@/frontend/components/MobileActionSheet';

export interface VideoCardProps {
  id?: string;
  source?: string;
  title?: string;
  query?: string;
  poster?: string;
  episodes?: number;
  source_name?: string;
  source_names?: string[];
  progress?: number;
  year?: string;
  from: 'playrecord' | 'favorite' | 'search' | 'douban';
  currentEpisode?: number;
  douban_id?: number;
  onDelete?: () => void;
  rate?: string;
  type?: string;
  isBangumi?: boolean;
  isAggregate?: boolean;
  origin?: 'vod' | 'live';
  remarks?: string;
  releaseDate?: string;
}

export type VideoCardHandle = {
  setEpisodes: (episodes?: number) => void;
  setSourceNames: (names?: string[]) => void;
  setDoubanId: (id?: number) => void;
};

const VideoCard = forwardRef<VideoCardHandle, VideoCardProps>(function VideoCard(
  {
    id,
    title = '',
    query = '',
    poster = '',
    episodes,
    source,
    source_name,
    source_names,
    progress = 0,
    year,
    from,
    currentEpisode,
    douban_id,
    onDelete,
    rate,
    type = '',
    isBangumi = false,
    isAggregate = false,
    origin = 'vod',
    remarks,
    releaseDate,
  }: VideoCardProps,
  ref
) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

  // 可外部修改的可控字段
  const [dynamicEpisodes, setDynamicEpisodes] = useState<number | undefined>(episodes);
  const [dynamicSourceNames, setDynamicSourceNames] = useState<string[] | undefined>(source_names);
  const [dynamicDoubanId, setDynamicDoubanId] = useState<number | undefined>(douban_id);

  // 长按处理
  const longPressProps = useLongPress({
    onLongPress: () => {
      if (window.innerWidth < 768) {
        setShowMobileActions(true);
      }
    },
  });

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    setEpisodes: setDynamicEpisodes,
    setSourceNames: setDynamicSourceNames,
    setDoubanId: setDynamicDoubanId,
  }));

  // 初始化收藏状态
  useEffect(() => {
    const checkFavorite = async () => {
      if (source && id) {
        const isFav = await isFavorited(source, id);
        setFavorited(isFav);
      }
    };
    
    checkFavorite();
  }, [source, id]);

  // 监听数据更新
  useEffect(() => {
    const unsubscribe = subscribeToDataUpdates('favoritesUpdated', () => {
      if (source && id) {
        isFavorited(source, id).then(setFavorited);
      }
    });

    return unsubscribe;
  }, [source, id]);

  // 处理图片加载
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoaded(false);
  }, []);

  // 切换收藏
  const handleToggleFavorite = useCallback(async () => {
    if (!source || !id || isLoading) return;

    setIsLoading(true);
    try {
      if (favorited) {
        await deleteFavorite(source, id);
      } else {
        await saveFavorite(source, id, {
          source_name: source_name || '',
          total_episodes: dynamicEpisodes || episodes || 0,
          title,
          year: year || '',
          cover: poster,
          save_time: Date.now(),
        });
      }
      setFavorited(!favorited);
      
      // 触发数据更新事件
      window.dispatchEvent(new CustomEvent('favoritesUpdated'));
    } catch (error) {
      console.error('收藏操作失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [source, id, title, poster, dynamicEpisodes, favorited, isLoading]);

  // 点击播放
  const handlePlay = useCallback(() => {
    if (!id || !source) return;

    const url = origin === 'live' 
      ? `/live?channel=${encodeURIComponent(id)}`
      : `/play?source=${encodeURIComponent(source)}&id=${encodeURIComponent(id)}`;
    
    router.push(url);
  }, [id, source, origin, router]);

  // 处理点击
  const handleClick = useCallback(() => {
    if (window.innerWidth >= 768) {
      handlePlay();
    }
  }, [handlePlay]);

  // 更新播放记录
  const updatePlayRecord = useCallback(async () => {
    if (!source || !id) return;

    try {
      const { savePlayRecord } = require('@/frontend/lib/db.client');
      await savePlayRecord(source, id, {
        title,
        cover: poster,
        index: currentEpisode || 0,
        total_episodes: dynamicEpisodes || episodes || 0,
        source_name: source_name || '',
        year: year || '',
        play_time: 0,
        total_time: 0,
        save_time: Date.now(),
        search_title: title,
        remarks,
      });
    } catch (error) {
      console.error('更新播放记录失败:', error);
    }
  }, [source, id, title, poster, dynamicEpisodes, source_name, year, type, remarks]);

  // 播放时更新记录
  useEffect(() => {
    if (from === 'playrecord') {
      updatePlayRecord();
    }
  }, [from, updatePlayRecord]);

  return (
    <div {...longPressProps}>
      <VideoCardContent
        title={title}
        poster={poster}
        episodes={dynamicEpisodes}
        currentEpisode={currentEpisode}
        progress={progress}
        year={year}
        rate={rate}
        type={type}
        remarks={remarks}
        releaseDate={releaseDate}
        imageLoaded={imageLoaded}
        onImageLoad={handleImageLoad}
        onImageError={handleImageError}
        favorited={favorited}
        onToggleFavorite={handleToggleFavorite}
        onClick={handleClick}
      />

      {/* 移动端操作面板 */}
      {showMobileActions && (
        <MobileActionSheet
          isOpen={showMobileActions}
          onClose={() => setShowMobileActions(false)}
          title={title || ''}
          poster={poster}
          actions={[
            {
              id: 'play',
              label: '播放',
              icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>,
              onClick: handlePlay,
            },
            {
              id: 'favorite',
              label: favorited ? '取消收藏' : '添加收藏',
              icon: <svg className={`w-5 h-5 ${favorited ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>,
              onClick: handleToggleFavorite,
            },
            {
              id: 'share',
              label: '分享',
              icon: <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
              onClick: () => {
                if (navigator.share && id && source) {
                  navigator.share({
                    title: title,
                    url: `${window.location.origin}/play?source=${encodeURIComponent(source)}&id=${encodeURIComponent(id)}`,
                  });
                }
              },
            },
            ...(from === 'playrecord' || from === 'favorite' ? [{
              id: 'delete',
              label: '删除',
              icon: <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
              onClick: async () => {
                if (onDelete) {
                  onDelete();
                } else if (id && source) {
                  try {
                    if (from === 'favorite') {
                      const { deleteFavorite } = await import('@/frontend/lib/db.client');
                      await deleteFavorite(source, id);
                    } else if (from === 'playrecord') {
                      const { deletePlayRecord } = await import('@/frontend/lib/db.client');
                      await deletePlayRecord(source, id);
                    }
                    setShowMobileActions(false);
                  } catch (error) {
                    console.error('删除失败:', error);
                  }
                }
              },
              color: 'danger' as const,
            }] : []),
          ]}
          origin={origin}
        />
      )}
    </div>
  );
});

VideoCard.displayName = 'VideoCard';

export default memo(VideoCard);