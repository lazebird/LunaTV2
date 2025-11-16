import { useState } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  Pause, 
  Play, 
  Volume2, 
  VolumeX,
  Settings,
  Tv
} from 'lucide-react';
import { PlaybackState } from '../types';

interface PlayerControlsProps {
  state: PlaybackState;
  qualityLevels: Array<{ height: number; label: string }>;
  currentQuality: number;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onSetVolume: (volume: number) => void;
  onSetQuality: (level: number) => void;
  onToggleFullscreen: () => void;
  onSeek: (time: number) => void;
  channelName?: string;
}

export function PlayerControls({
  state,
  qualityLevels,
  currentQuality,
  onTogglePlay,
  onToggleMute,
  onSetVolume,
  onSetQuality,
  onToggleFullscreen,
  onSeek,
  channelName,
}: PlayerControlsProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSetVolume(parseFloat(e.target.value));
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
      {/* 频道名称 */}
      {channelName && (
        <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-lg">
          <div className="flex items-center space-x-2">
            <Tv className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">{channelName}</span>
          </div>
        </div>
      )}

      {/* 进度条 */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 text-white text-xs">
          <span>{formatTime(state.currentTime)}</span>
          <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all"
              style={{ width: `${(state.currentTime / state.duration) * 100 || 0}%` }}
            />
          </div>
          <span>{formatTime(state.duration)}</span>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center justify-between">
        {/* 左侧控制 */}
        <div className="flex items-center space-x-3">
          {/* 播放/暂停 */}
          <button
            onClick={onTogglePlay}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            aria-label={state.isPlaying ? '暂停' : '播放'}
          >
            {state.isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white" />
            )}
          </button>

          {/* 音量控制 */}
          <div className="relative">
            <button
              onClick={onToggleMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              aria-label={state.isMuted ? '取消静音' : '静音'}
            >
              {state.isMuted || state.volume === 0 ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>

            {/* 音量滑块 */}
            {showVolumeSlider && (
              <div
                className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-black/80 p-2 rounded-lg"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={state.volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1"
                />
              </div>
            )}
          </button>
        </div>

        {/* 右侧控制 */}
        <div className="flex items-center space-x-3">
          {/* 画质选择 */}
          {qualityLevels.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                aria-label="画质设置"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>

              {showQualityMenu && (
                <div className="absolute bottom-12 right-0 bg-black/80 p-2 rounded-lg min-w-[100px]">
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        onSetQuality(-1);
                        setShowQualityMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1 text-xs text-white hover:bg-white/20 rounded ${
                        currentQuality === -1 ? 'bg-white/10' : ''
                      }`}
                    >
                      自动
                    </button>
                    {qualityLevels.map((level, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          onSetQuality(index);
                          setShowQualityMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1 text-xs text-white hover:bg-white/20 rounded ${
                          currentQuality === index ? 'bg-white/10' : ''
                        }`}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 全屏 */}
          <button
            onClick={onToggleFullscreen}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            aria-label="全屏"
          >
            <Maximize2 className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}