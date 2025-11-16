import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  deleteFavorite,
  deletePlayRecord,
  generateStorageKey,
  isFavorited,
  saveFavorite,
  subscribeToDataUpdates,
} from '@/lib/db.client';
import { useLongPress } from '@/hooks/useLongPress';

import { VideoCardContent } from './video-card/VideoCardContent';
import { VideoCardActions } from './video-card/VideoCardActions';
import MobileActionSheet from '@/components/MobileActionSheet';

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
    delay: 500,
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
        await saveFavorite(source, id, title, poster, dynamicEpisodes);
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
      const { savePlayRecord } = await import('@/lib/db.client');
      await savePlayRecord(source, id, {
        title,
        poster,
        episodes: dynamicEpisodes,
        source_name,
        year,
        type,
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
          title={title}
        >
          <VideoCardActions
            id={id}
            source={source}
            title={title}
            from={from}
            onDelete={onDelete}
            onPlay={handlePlay}
            onToggleFavorite={handleToggleFavorite}
            favorited={favorited}
            origin={origin}
          />
        </MobileActionSheet>
      )}
    </div>
  );
});

VideoCard.displayName = 'VideoCard';

export default memo(VideoCard);