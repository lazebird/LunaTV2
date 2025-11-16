import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { PlaybackState } from '../types';

export function useLivePlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [state, setState] = useState<PlaybackState>({
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [qualityLevels, setQualityLevels] = useState<Array<{ height: number; label: string }>>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);

  // 初始化HLS
  const initializePlayer = useCallback((url: string) => {
    if (!videoRef.current) return;

    // 清理之前的实例
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // 检查是否支持HLS
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      
      hls.loadSource(url);
      hls.attachMedia(videoRef.current);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels.map((level, index) => ({
          height: level.height,
          label: `${level.height}p`,
        }));
        setQualityLevels(levels);
        setState(prev => ({ ...prev, isLoading: false }));
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('网络错误，请检查网络连接');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('媒体错误，无法播放');
              break;
            default:
              setError('播放出错');
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari原生支持
      videoRef.current.src = url;
      setState(prev => ({ ...prev, isLoading: false }));
    } else {
      setError('浏览器不支持HLS播放');
    }
  }, []);

  // 播放/暂停
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (state.isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [state.isPlaying]);

  // 设置音量
  const setVolume = useCallback((volume: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.volume = volume;
    setState(prev => ({ ...prev, volume, isMuted: volume === 0 }));
  }, []);

  // 静音切换
  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !videoRef.current.muted;
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  // 设置画质
  const setQuality = useCallback((levelIndex: number) => {
    if (!hlsRef.current) return;
    
    hlsRef.current.currentLevel = levelIndex;
    setCurrentQuality(levelIndex);
  }, []);

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    if (!videoRef.current) return;
    
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  // 跳转到指定时间
  const seekTo = useCallback((time: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = time;
  }, []);

  // 监听视频元素事件
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setState(prev => ({ ...prev, isPlaying: true }));
    const handlePause = () => setState(prev => ({ ...prev, isPlaying: false }));
    const handleTimeUpdate = () => setState(prev => ({ ...prev, currentTime: video.currentTime }));
    const handleLoadedMetadata = () => setState(prev => ({ ...prev, duration: video.duration }));
    const handleVolumeChange = () => setState(prev => ({ 
      ...prev, 
      volume: video.volume,
      isMuted: video.muted 
    }));

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  // 清理资源
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    state,
    error,
    qualityLevels,
    currentQuality,
    initializePlayer,
    togglePlay,
    setVolume,
    toggleMute,
    setQuality,
    toggleFullscreen,
    seekTo,
  };
}