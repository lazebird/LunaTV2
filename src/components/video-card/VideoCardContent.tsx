import { Heart, PlayCircleIcon, Star } from 'lucide-react';
import Image from 'next/image';
import { processImageUrl } from '@/lib/utils';
import { ImagePlaceholder } from '@/components/ImagePlaceholder';

interface VideoCardContentProps {
  title: string;
  poster: string;
  episodes?: number;
  currentEpisode?: number;
  progress?: number;
  year?: string;
  rate?: string;
  type?: string;
  remarks?: string;
  releaseDate?: string;
  imageLoaded: boolean;
  onImageLoad: () => void;
  onImageError: () => void;
  favorited: boolean;
  onToggleFavorite: () => void;
  onClick: () => void;
}

export function VideoCardContent({
  title,
  poster,
  episodes,
  currentEpisode,
  progress = 0,
  year,
  rate,
  type,
  remarks,
  releaseDate,
  imageLoaded,
  onImageLoad,
  onImageError,
  favorited,
  onToggleFavorite,
  onClick,
}: VideoCardContentProps) {
  const posterUrl = processImageUrl(poster);
  const isCompleted = episodes && currentEpisode && currentEpisode >= episodes;

  return (
    <div className="relative group cursor-pointer" onClick={onClick}>
      {/* 海报 */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
        {!imageLoaded && (
          <ImagePlaceholder />
        )}
        
        <Image
          src={posterUrl}
          alt={title}
          fill
          className={`object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={onImageLoad}
          onError={onImageError}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />

        {/* 播放按钮 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-black/50 rounded-full p-3">
            <PlayCircleIcon className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* 进度条 */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}

        {/* 收藏按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute top-2 right-2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <Heart
            className={`w-4 h-4 ${
              favorited ? 'fill-red-500 text-red-500' : 'text-white'
            }`}
          />
        </button>

        {/* 集数/状态标签 */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {episodes && (
            <span className="px-2 py-1 text-xs bg-black/50 text-white rounded">
              {isCompleted ? '已完结' : `${currentEpisode || 0}/${episodes}`}
            </span>
          )}
          
          {type && (
            <span className="px-2 py-1 text-xs bg-blue-500/80 text-white rounded">
              {type}
            </span>
          )}
        </div>
      </div>

      {/* 信息 */}
      <div className="mt-2 space-y-1">
        {/* 标题 */}
        <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
          {title}
        </h3>

        {/* 元信息 */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            {year && <span>{year}</span>}
            {rate && (
              <div className="flex items-center">
                <Star className="w-3 h-3 text-yellow-500 mr-1" />
                <span>{rate}</span>
              </div>
            )}
          </div>
          
          {remarks && (
            <span className="text-xs text-orange-500">{remarks}</span>
          )}
        </div>

        {/* 上映日期 */}
        {releaseDate && (
          <div className="text-xs text-gray-400">
            上映: {new Date(releaseDate).toLocaleDateString('zh-CN')}
          </div>
        )}
      </div>
    </div>
  );
}