/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, no-console, @next/next/no-img-element */

'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Heart, ChevronUp } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import EpisodeSelector from '@/components/EpisodeSelector';
import NetDiskSearchResults from '@/components/NetDiskSearchResults';
import PageLayout from '@/components/PageLayout';
import SkipController, { SkipSettingsButton } from '@/components/SkipController';
import { SearchResult } from '@/lib/types';
import { getVideoResolutionFromM3u8, processImageUrl } from '@/lib/utils';
import {
  fetchSourcesData,
  fetchSourceDetail,
  preferBestSource,
  checkAllKeywordsMatch,
  fullSpeedTest
} from '@/components/play/SourceManager';

// 导入拆分后的组件
import { useDanmakuSystem } from '@/components/play/DanmakuSystem';
import { usePlayerControls } from '@/components/play/PlayerControls';
import { useNetDiskSearch } from '@/components/play/NetDiskSearch';
import { useVideoDetails } from '@/components/play/VideoDetails';
import { usePlayerCore } from '@/components/play/PlayerCore';
import { usePlayRecord, useFavorite, useBackToTop, useMemoryManagement } from '@/components/play/PlayerUtils';

// 扩展 HTMLVideoElement 类型以支持 hls 属性
declare global {
  interface HTMLVideoElement {
    hls?: any;
  }
}

// Wake Lock API 类型声明
interface WakeLockSentinel {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
  removeEventListener(type: 'release', listener: () => void): void;
}

function PlayPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // -----------------------------------------------------------------------------
  // 状态变量（State）
  // -----------------------------------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState<
    'searching' | 'preferring' | 'fetching' | 'ready'
  >('searching');
  const [loadingMessage, setLoadingMessage] = useState('正在搜索播放源...');
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<SearchResult | null>(null);

  // 去广告开关（从 localStorage 继承，默认 true）
  const [blockAdEnabled, setBlockAdEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const v = localStorage.getItem('enable_blockad');
      if (v !== null) return v === 'true';
    }
    return true;
  });
  const blockAdEnabledRef = useRef(blockAdEnabled);
  useEffect(() => {
    blockAdEnabledRef.current = blockAdEnabled;
  }, [blockAdEnabled]);

  // 外部弹幕开关（从 localStorage 继承，默认全部关闭）
  const [externalDanmuEnabled, setExternalDanmuEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const v = localStorage.getItem('enable_external_danmu');
      if (v !== null) return v === 'true';
    }
    return false; // 默认关闭外部弹幕
  });
  const externalDanmuEnabledRef = useRef(externalDanmuEnabled);
  useEffect(() => {
    externalDanmuEnabledRef.current = externalDanmuEnabled;
  }, [externalDanmuEnabled]);

  // 视频基本信息
  const [videoTitle, setVideoTitle] = useState(searchParams.get('title') || '');
  const [videoYear, setVideoYear] = useState(searchParams.get('year') || '');
  const [videoCover, setVideoCover] = useState('');
  const [videoDoubanId, setVideoDoubanId] = useState(
    parseInt(searchParams.get('douban_id') || '0') || 0
  );
  
  // 当前源和ID
  const [currentSource, setCurrentSource] = useState(
    searchParams.get('source') || ''
  );
  const [currentId, setCurrentId] = useState(searchParams.get('id') || '');

  // 短剧ID（用于获取详情显示，不影响源搜索）
  const [shortdramaId] = useState(searchParams.get('shortdrama_id') || '');

  // 搜索所需信息
  const [searchTitle] = useState(searchParams.get('stitle') || '');
  const [searchType] = useState(searchParams.get('stype') || '');

  // 是否需要优选
  const [needPrefer, setNeedPrefer] = useState(
    searchParams.get('prefer') === 'true'
  );
  const needPreferRef = useRef(needPrefer);
  useEffect(() => {
    needPreferRef.current = needPrefer;
  }, [needPrefer]);
  
  // 集数相关
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);

  // 换源相关状态
  const [availableSources, setAvailableSources] = useState<SearchResult[]>([]);
  const availableSourcesRef = useRef<SearchResult[]>([]);

  // Refs
  const currentSourceRef = useRef(currentSource);
  const currentIdRef = useRef(currentId);
  const videoTitleRef = useRef(videoTitle);
  const videoYearRef = useRef(videoYear);
  const videoDoubanIdRef = useRef(videoDoubanId);
  const detailRef = useRef<SearchResult | null>(detail);
  const currentEpisodeIndexRef = useRef(currentEpisodeIndex);

  // 同步最新值到 refs
  useEffect(() => {
    currentSourceRef.current = currentSource;
    currentIdRef.current = currentId;
    detailRef.current = detail;
    currentEpisodeIndexRef.current = currentEpisodeIndex;
    videoTitleRef.current = videoTitle;
    videoYearRef.current = videoYear;
    videoDoubanIdRef.current = videoDoubanId;
    availableSourcesRef.current = availableSources;
  }, [
    currentSource,
    currentId,
    detail,
    currentEpisodeIndex,
    videoTitle,
    videoYear,
    videoDoubanId,
    availableSources,
  ]);

  // 🚀 新增：弹幕操作防抖和性能优化
  const danmuOperationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const episodeSwitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const danmuPluginStateRef = useRef<any>(null); // 保存弹幕插件状态
  const isSourceChangingRef = useRef<boolean>(false); // 标记是否正在换源
  const isEpisodeChangingRef = useRef<boolean>(false); // 标记是否正在切换集数
  const isSkipControllerTriggeredRef = useRef<boolean>(false); // 标记是否通过 SkipController 触发了下一集
  const videoEndedHandledRef = useRef<boolean>(false); // 🔥 标记当前视频的 video:ended 事件是否已经被处理过（防止多个监听器重复触发）

  // 🚀 新增：连续切换源防抖和资源管理
  const sourceSwitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSwitchRef = useRef<any>(null); // 保存待处理的切换请求
  const switchPromiseRef = useRef<Promise<void> | null>(null); // 当前切换的Promise

  // Wake Lock 相关
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // 其他状态
  const [sourceSearchLoading, setSourceSearchLoading] = useState(false);
  const [sourceSearchError, setSourceSearchError] = useState<string | null>(null);
  const [optimizationEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('enableOptimization');
      if (saved !== null) {
        try {
          return JSON.parse(saved);
        } catch {
          /* ignore */
        }
      }
    }
    return false;
  });
  const [precomputedVideoInfo, setPrecomputedVideoInfo] = useState<
    Map<string, { quality: string; loadSpeed: string; pingTime: number }>
  >(new Map());
  const [isEpisodeSelectorCollapsed, setIsEpisodeSelectorCollapsed] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoLoadingStage, setVideoLoadingStage] = useState<'initing' | 'sourceChanging'>('initing');
  const [videoUrl, setVideoUrl] = useState('');
  const [totalEpisodes, setTotalEpisodes] = useState(detail?.episodes?.length || 0);
  const resumeTimeRef = useRef<number | null>(null);
  const lastVolumeRef = useRef<number>(0.7);
  const lastPlaybackRateRef = useRef<number>(1.0);
  const [isSkipSettingOpen, setIsSkipSettingOpen] = useState(false);
  const [currentPlayTime, setCurrentPlayTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // -----------------------------------------------------------------------------
  // 使用拆分后的Hook
  // -----------------------------------------------------------------------------

  // 视频详情Hook
  const {
    movieDetails,
    loadingMovieDetails,
    bangumiDetails,
    loadingBangumiDetails,
    shortdramaDetails,
    loadingShortdramaDetails,
  } = useVideoDetails(videoDoubanId, detail, shortdramaId);

  // 网盘搜索Hook
  const {
    netdiskResults,
    netdiskLoading,
    netdiskError,
    netdiskTotal,
    handleNetDiskSearch,
  } = useNetDiskSearch();

  

  

  // 返回顶部Hook
  const {
    showBackToTop,
    scrollToTop,
  } = useBackToTop();

  // 创建播放器引用，供多个Hook共享
  const artPlayerRef = useRef<any>(null);
  const artRef = useRef<HTMLDivElement | null>(null);

  // 检测移动设备
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOSGlobal = /iPad|iPhone|iPod/i.test(userAgent) && !(window as any).MSStream;
  const isIOS13Global = isIOSGlobal || (userAgent.includes('Macintosh') && navigator.maxTouchPoints >= 1);
  const isMobileGlobal = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || isIOS13Global;

  // 清理播放器资源的统一函数
  const cleanupPlayerLocal = () => {
    if (danmuOperationTimeoutRef.current) {
      clearTimeout(danmuOperationTimeoutRef.current);
      danmuOperationTimeoutRef.current = null;
    }
    
    if (episodeSwitchTimeoutRef.current) {
      clearTimeout(episodeSwitchTimeoutRef.current);
      episodeSwitchTimeoutRef.current = null;
    }
    
    danmuPluginStateRef.current = null;
    
    if (artPlayerRef.current) {
      try {
        if (artPlayerRef.current.plugins?.artplayerPluginDanmuku) {
          const danmukuPlugin = artPlayerRef.current.plugins.artplayerPluginDanmuku;
          
          if (danmukuPlugin.worker && typeof danmukuPlugin.worker.terminate === 'function') {
            danmukuPlugin.worker.terminate();
            console.log('弹幕WebWorker已清理');
          }
          
          if (typeof danmukuPlugin.reset === 'function') {
            danmukuPlugin.reset();
          }
        }

        if (artPlayerRef.current.video.hls) {
          artPlayerRef.current.video.hls.destroy();
          console.log('HLS实例已销毁');
        }

        artPlayerRef.current.destroy(false);
        artPlayerRef.current = null;
        console.log('播放器资源已清理');
      } catch (err) {
        console.warn('清理播放器资源时出错:', err);
        artPlayerRef.current = null;
      }
    }
  };

  // 播放记录Hook
  const {
    saveCurrentPlayProgress,
    lastSaveTimeRef,
  } = usePlayRecord(
    currentSource,
    currentId,
    videoTitle,
    detail,
    currentEpisodeIndex,
    searchTitle,
    availableSourcesRef,
    artPlayerRef,
    currentEpisodeIndexRef,
    videoTitleRef,
    detailRef,
    currentSourceRef,
    currentIdRef
  );

  // 播放器核心Hook
  const {
    cleanupPlayer: cleanupPlayerCore
  } = usePlayerCore(
    Hls,
    videoUrl,
    loading,
    blockAdEnabled,
    blockAdEnabledRef,
    videoTitle,
    videoCover,
    currentEpisodeIndex,
    detail,
    totalEpisodes,
    resumeTimeRef,
    lastVolumeRef,
    lastPlaybackRateRef,
    setError,
    setIsVideoLoading,
    () => Promise.resolve([]), // loadExternalDanmu
    externalDanmuEnabledRef,
    isEpisodeChangingRef,
    () => Promise.resolve(), // requestWakeLock
    () => Promise.resolve(), // releaseWakeLock
    saveCurrentPlayProgress,
    videoEndedHandledRef,
    setCurrentPlayTime,
    setVideoDuration,
    cleanupPlayerLocal // cleanupPlayer
  );

  // 弹幕系统Hook
  const {
    loadExternalDanmu,
    handleDanmuOperationOptimized,
    handleEpisodeChangeDanmaku,
    cleanupDanmakuTimers,
    danmuLoadingRef,
    lastDanmuLoadKeyRef,
  } = useDanmakuSystem(
    videoTitle,
    videoYear,
    videoDoubanId,
    currentEpisodeIndex,
    currentSource,
    externalDanmuEnabled,
    artPlayerRef,
    isSourceChangingRef
  );

  // 收藏Hook
  const {
    favorited,
    handleToggleFavorite,
  } = useFavorite(
    currentSource,
    currentId,
    videoTitle,
    detail,
    searchTitle,
    videoTitleRef,
    detailRef,
    currentSourceRef,
    currentIdRef
  );

  // 播放器控制Hook
  const {
    handleEpisodeChange,
    handlePreviousEpisode,
    handleNextEpisode,
    cleanupPlayerTimers,
  } = usePlayerControls(
    artPlayerRef,
    currentEpisodeIndexRef,
    detailRef,
    setCurrentEpisodeIndex,
    saveCurrentPlayProgress,
    isSkipControllerTriggeredRef,
    videoEndedHandledRef
  );

  // 内存管理Hook
  const { checkMemoryPressure } = useMemoryManagement(isMobileGlobal);

  // 更新视频地址
  const updateVideoUrl = async (
    detailData: SearchResult | null,
    episodeIndex: number
  ) => {
    if (
      !detailData ||
      !detailData.episodes ||
      episodeIndex >= detailData.episodes.length
    ) {
      setVideoUrl('');
      return;
    }

    const episodeData = detailData.episodes[episodeIndex];

    // 检查是否为短剧格式
    if (episodeData && episodeData.startsWith('shortdrama:')) {
      try {
        const [, videoId, episode] = episodeData.split(':');
        const response = await fetch(
          `/api/shortdrama/parse?id=${videoId}&episode=${episode}`
        );

        if (response.ok) {
          const result = await response.json();
          const newUrl = result.url || '';
          if (newUrl !== videoUrl) {
            setVideoUrl(newUrl);
          }
        } else {
          setError('短剧解析失败');
          setVideoUrl('');
        }
      } catch (err) {
        console.error('短剧URL解析失败:', err);
        setError('短剧解析失败');
        setVideoUrl('');
      }
    } else {
      // 普通视频格式
      const newUrl = episodeData || '';
      if (newUrl !== videoUrl) {
        setVideoUrl(newUrl);
      }
    }
  };

  // 主要初始化逻辑
  useEffect(() => {
    const initAll = async () => {
      if (!currentSource && !currentId && !videoTitle && !searchTitle) {
        setError('缺少必要参数');
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadingStage(currentSource && currentId ? 'fetching' : 'searching');
      setLoadingMessage(
        currentSource && currentId
          ? '🎬 正在获取视频详情...'
          : '🔍 正在搜索播放源...'
      );

      let sourcesInfo: SearchResult[] = [];

      // 对于短剧，直接获取详情，跳过搜索
      if (currentSource === 'shortdrama' && currentId) {
        sourcesInfo = await fetchSourceDetail(currentSource, currentId);
      } else {
        // 其他情况先搜索所有视频源
        sourcesInfo = await fetchSourcesData(searchTitle || videoTitle, videoTitleRef.current, videoYearRef.current, videoDoubanIdRef.current, searchType);

        if (
          currentSource &&
          currentId &&
          !sourcesInfo.some(
            (source) => source.source === currentSource && source.id === currentId
          )
        ) {
          sourcesInfo = await fetchSourceDetail(currentSource, currentId);
        }

        // 如果有 shortdrama_id，额外添加短剧源到可用源列表
        if (shortdramaId && !currentSource && !currentId) {
          try {
            const shortdramaSource = await fetchSourceDetail('shortdrama', shortdramaId);
            if (shortdramaSource.length > 0) {
              const existingShortdrama = sourcesInfo.find(
                (s) => s.source === 'shortdrama' && s.id === shortdramaId
              );
              if (!existingShortdrama) {
                sourcesInfo.push(...shortdramaSource);
                setAvailableSources(sourcesInfo);
              }
            }
          } catch (error) {
            console.error('添加短剧源失败:', error);
          }
        }
      }
      
      if (sourcesInfo.length === 0) {
        setError('未找到匹配结果');
        setLoading(false);
        return;
      }

      let detailData: SearchResult = sourcesInfo[0];
      // 指定源和id且无需优选
      if (currentSource && currentId && !needPreferRef.current) {
        const target = sourcesInfo.find(
          (source) => source.source === currentSource && source.id === currentId
        );
        if (target) {
          detailData = target;
        } else {
          setError('未找到匹配结果');
          setLoading(false);
          return;
        }
      }

      // 未指定源和 id 或需要优选，且开启优选开关
      if (
        (!currentSource || !currentId || needPreferRef.current) &&
        optimizationEnabled
      ) {
        setLoadingStage('preferring');
        setLoadingMessage('⚡ 正在优选最佳播放源...');

        const preferResult = await preferBestSource(sourcesInfo);
        detailData = preferResult.bestSource;
        
        if (preferResult.videoInfoMap) {
          setPrecomputedVideoInfo(preferResult.videoInfoMap);
        }
      }

      console.log(detailData.source, detailData.id);

      setNeedPrefer(false);
      setCurrentSource(detailData.source);
      setCurrentId(detailData.id);
      setVideoYear(detailData.year);
      setVideoTitle(detailData.title || videoTitleRef.current);
      setVideoCover(detailData.poster);
      setVideoDoubanId(videoDoubanIdRef.current || detailData.douban_id || 0);
      setDetail(detailData);
      if (currentEpisodeIndex >= detailData.episodes.length) {
        setCurrentEpisodeIndex(0);
      }

      // 规范URL参数
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('source', detailData.source);
      newUrl.searchParams.set('id', detailData.id);
      newUrl.searchParams.set('year', detailData.year);
      newUrl.searchParams.set('title', detailData.title);
      newUrl.searchParams.delete('prefer');
      window.history.replaceState({}, '', newUrl.toString());

      setLoadingStage('ready');
      setLoadingMessage('✨ 准备就绪，即将开始播放...');

      setTimeout(() => {
        setLoading(false);
      }, 1000);
    };

    initAll();
  }, []);

  // 🚀 优化的集数变化处理（防抖 + 状态保护）
  useEffect(() => {
    if (!isSourceChangingRef.current) {
      isEpisodeChangingRef.current = true;
      isSkipControllerTriggeredRef.current = false;
      videoEndedHandledRef.current = false;
      console.log('🔄 开始切换集数，重置自动跳过标志');
    }

    updateVideoUrl(detail, currentEpisodeIndex);
    handleEpisodeChangeDanmaku();
  }, [detail, currentEpisodeIndex]);

  // 🚀 优化的换源处理（防连续点击）
  const handleSourceChange = async (
    newSource: string,
    newId: string,
    newTitle: string
  ) => {
    try {
      if (isSourceChangingRef.current) {
        console.log('⏸️ 正在换源中，忽略重复点击');
        return;
      }

      isSourceChangingRef.current = true;
      setVideoLoadingStage('sourceChanging');
      setIsVideoLoading(true);

      // 清理弹幕相关状态
      if (danmuOperationTimeoutRef.current) {
        clearTimeout(danmuOperationTimeoutRef.current);
        danmuOperationTimeoutRef.current = null;
      }
      if (episodeSwitchTimeoutRef.current) {
        clearTimeout(episodeSwitchTimeoutRef.current);
        episodeSwitchTimeoutRef.current = null;
      }

      // 清空弹幕状态
      if (artPlayerRef.current?.plugins?.artplayerPluginDanmuku) {
        const plugin = artPlayerRef.current.plugins.artplayerPluginDanmuku;
        try {
          if (typeof plugin.reset === 'function') {
            plugin.reset();
          }
          if (typeof plugin.load === 'function') {
            plugin.load();
          }
          if (typeof plugin.hide === 'function') {
            plugin.hide();
          }
          console.log('🧹 换源时已清空旧弹幕数据');
        } catch (error) {
          console.warn('清空弹幕时出错，但继续换源:', error);
        }
      }

      const currentPlayTime = artPlayerRef.current?.currentTime || 0;
      console.log('换源前当前播放时间:', currentPlayTime);

      // 清除前一个历史记录
      if (currentSourceRef.current && currentIdRef.current) {
        try {
          const dbClient = require('@/lib/db.client');
          const { deletePlayRecord } = dbClient;
          await deletePlayRecord(currentSourceRef.current, currentIdRef.current);
          console.log('已清除前一个播放记录');
        } catch (err) {
          console.error('清除播放记录失败:', err);
        }
      }

      const newDetail = availableSources.find(
        (source) => source.source === newSource && source.id === newId
      );
      if (!newDetail) {
        setError('未找到匹配结果');
        return;
      }

      let targetIndex = currentEpisodeIndex;
      if (!newDetail.episodes || targetIndex >= newDetail.episodes.length) {
        targetIndex = 0;
      }

      if (targetIndex !== currentEpisodeIndex) {
        resumeTimeRef.current = 0;
      } else if ((!resumeTimeRef.current || resumeTimeRef.current === 0) && currentPlayTime > 1) {
        resumeTimeRef.current = currentPlayTime;
      }

      // 更新URL参数
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('source', newSource);
      newUrl.searchParams.set('id', newId);
      newUrl.searchParams.set('year', newDetail.year);
      window.history.replaceState({}, '', newUrl.toString());

      setVideoTitle(newDetail.title || newTitle);
      setVideoYear(newDetail.year);
      setVideoCover(newDetail.poster);
      setVideoDoubanId(videoDoubanIdRef.current || newDetail.douban_id || 0);
      setCurrentSource(newSource);
      setCurrentId(newId);
      setDetail(newDetail);
      setCurrentEpisodeIndex(targetIndex);

      setTimeout(async () => {
        isSourceChangingRef.current = false;
        // 换源后的弹幕加载逻辑...
      }, 1000);

    } catch (err) {
      isSourceChangingRef.current = false;
      setIsVideoLoading(false);
      setError(err instanceof Error ? err.message : '换源失败');
    }
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanupDanmakuTimers();
      if (sourceSwitchTimeoutRef.current) {
        clearTimeout(sourceSwitchTimeoutRef.current);
      }
      isSourceChangingRef.current = false;
      switchPromiseRef.current = null;
      pendingSwitchRef.current = null;
      cleanupPlayerLocal();
    };
  }, []);

  // Wake Lock 函数
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('Wake Lock 已启用');
      }
    } catch (err) {
      console.warn('Wake Lock 请求失败:', err);
    }
  };

  const releaseWakeLock = async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Wake Lock 已释放');
      }
    } catch (err) {
      console.warn('Wake Lock 释放失败:', err);
    }
  };

  // FavoriteIcon 组件
  const FavoriteIcon = ({ filled }: { filled: boolean }) => {
    if (filled) {
      return (
        <svg
          className='h-7 w-7'
          viewBox='0 0 24 24'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
            fill='#ef4444'
            stroke='#ef4444'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      );
    }
    return (
      <Heart className='h-7 w-7 stroke-[1] text-gray-600 dark:text-gray-300' />
    );
  };

  // Loading 状态
  if (loading) {
    return (
      <PageLayout activePath='/play'>
        <div className='flex items-center justify-center min-h-screen bg-transparent'>
          <div className='text-center max-w-md mx-auto px-6'>
            <div className='relative mb-8'>
              <div className='relative mx-auto w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300'>
                <div className='text-white text-4xl'>
                  {loadingStage === 'searching' && '🔍'}
                  {loadingStage === 'preferring' && '⚡'}
                  {loadingStage === 'fetching' && '🎬'}
                  {loadingStage === 'ready' && '✨'}
                </div>
                <div className='absolute -inset-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl opacity-20 animate-spin'></div>
              </div>
            </div>
            <div className='mb-6 w-80 mx-auto'>
              <div className='flex justify-center space-x-2 mb-4'>
                <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  loadingStage === 'searching' || loadingStage === 'fetching'
                    ? 'bg-green-500 scale-125'
                    : loadingStage === 'preferring' || loadingStage === 'ready'
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                }`}></div>
                <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  loadingStage === 'preferring'
                    ? 'bg-green-500 scale-125'
                    : loadingStage === 'ready'
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                }`}></div>
                <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  loadingStage === 'ready'
                    ? 'bg-green-500 scale-125'
                    : 'bg-gray-300'
                }`}></div>
              </div>
              <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden'>
                <div className='h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-1000 ease-out' style={{
                  width: loadingStage === 'searching' || loadingStage === 'fetching'
                    ? '33%'
                    : loadingStage === 'preferring'
                      ? '66%'
                      : '100%',
                }}></div>
              </div>
            </div>
            <div className='space-y-2'>
              <p className='text-xl font-semibold text-gray-800 dark:text-gray-200 animate-pulse'>
                {loadingMessage}
              </p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Error 状态
  if (error) {
    return (
      <PageLayout activePath='/play'>
        <div className='flex items-center justify-center min-h-screen bg-transparent'>
          <div className='text-center max-w-md mx-auto px-6'>
            <div className='relative mb-8'>
              <div className='relative mx-auto w-24 h-24 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300'>
                <div className='text-white text-4xl'>😵</div>
                <div className='absolute -inset-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl opacity-20 animate-pulse'></div>
              </div>
            </div>
            <div className='space-y-4 mb-8'>
              <h2 className='text-2xl font-bold text-gray-800 dark:text-gray-200'>
                哎呀，出现了一些问题
              </h2>
              <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
                <p className='text-red-600 dark:text-red-400 font-medium'>{error}</p>
              </div>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                请检查网络连接或尝试刷新页面
              </p>
            </div>
            <div className='space-y-3'>
              <button
                onClick={() =>
                  videoTitle
                    ? router.push(`/search?q=${encodeURIComponent(videoTitle)}`)
                    : router.back()
                }
                className='w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl'
              >
                {videoTitle ? '🔍 返回搜索' : '← 返回上页'}
              </button>
              <button
                onClick={() => window.location.reload()}
                className='w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200'
              >
                🔄 重新尝试
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // 主界面
  return (
    <PageLayout activePath='/play'>
      <div className='flex flex-col gap-3 py-4 px-5 lg:px-[3rem] 2xl:px-20'>
        {/* 第一行：影片标题 */}
        <div className='py-1'>
          <h1 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
            {videoTitle || '影片标题'}
            {totalEpisodes > 1 && (
              <span className='text-gray-500 dark:text-gray-400'>
                {` > ${detail?.episodes_titles?.[currentEpisodeIndex] || `第 ${currentEpisodeIndex + 1} 集`}`}
              </span>
            )}
          </h1>
        </div>

        {/* 第二行：播放器和选集 */}
        <div className='space-y-2'>
          {/* 折叠控制 */}
          <div className='flex justify-end items-center'>
            <button
              onClick={() => setIsEpisodeSelectorCollapsed(!isEpisodeSelectorCollapsed)}
              className='hidden lg:flex group relative items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200'
              title={isEpisodeSelectorCollapsed ? '显示选集面板' : '隐藏选集面板'}
            >
              <svg
                className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                  isEpisodeSelectorCollapsed ? 'rotate-180' : 'rotate-0'
                }`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M9 5l7 7-7 7'
                />
              </svg>
              <span className='text-xs font-medium text-gray-600 dark:text-gray-300'>
                {isEpisodeSelectorCollapsed ? '显示' : '隐藏'}
              </span>
              <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full transition-all duration-200 ${
                isEpisodeSelectorCollapsed
                  ? 'bg-orange-400 animate-pulse'
                  : 'bg-green-400'
              }`}></div>
            </button>
          </div>

          <div className={`grid gap-4 lg:h-[500px] xl:h-[650px] 2xl:h-[750px] transition-all duration-300 ease-in-out ${
            isEpisodeSelectorCollapsed
              ? 'grid-cols-1'
              : 'grid-cols-1 md:grid-cols-4'
          }`}>
            {/* 播放器 */}
            <div className={`h-full transition-all duration-300 ease-in-out rounded-xl border border-white/0 dark:border-white/30 ${
              isEpisodeSelectorCollapsed ? 'col-span-1' : 'md:col-span-3'
            }`}>
              <div className='relative w-full h-[300px] lg:h-full'>
                <div
                  ref={artRef}
                  className='bg-black w-full h-full rounded-xl overflow-hidden shadow-lg'
                ></div>

                {/* 跳过设置按钮 */}
                {currentSource && currentId && (
                  <div className='absolute top-4 right-4 z-10'>
                    <button
                      onClick={() => setIsSkipSettingOpen(true)}
                      className='group flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-xl border border-white/30 hover:border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.18)] hover:scale-105 transition-all duration-300 ease-out'
                      title='跳过设置'
                    >
                      <svg
                        className='w-5 h-5 text-white drop-shadow-lg group-hover:rotate-90 transition-all duration-300'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'
                        />
                      </svg>
                      <span className='text-sm font-medium text-white drop-shadow-lg transition-all duration-300 hidden sm:inline'>
                        跳过设置
                      </span>
                    </button>
                  </div>
                )}

                {/* SkipController 组件 */}
                {currentSource && currentId && detail?.title && (
                  <SkipController
                    source={currentSource}
                    id={currentId}
                    title={detail.title}
                    episodeIndex={currentEpisodeIndex}
                    artPlayerRef={artPlayerRef}
                    currentTime={currentPlayTime}
                    duration={videoDuration}
                    isSettingMode={isSkipSettingOpen}
                    onSettingModeChange={setIsSkipSettingOpen}
                    onNextEpisode={handleNextEpisode}
                  />
                )}

                {/* 换源加载蒙层 */}
                {isVideoLoading && (
                  <div className='absolute inset-0 bg-black/85 backdrop-blur-sm rounded-xl flex items-center justify-center z-[500] transition-all duration-300'>
                    <div className='text-center max-w-md mx-auto px-6'>
                      <div className='relative mb-8'>
                        <div className='relative mx-auto w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300'>
                          <div className='text-white text-4xl'>🎬</div>
                          <div className='absolute -inset-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl opacity-20 animate-spin'></div>
                        </div>
                      </div>
                      <div className='space-y-2'>
                        <p className='text-xl font-semibold text-white animate-pulse'>
                          {videoLoadingStage === 'sourceChanging'
                            ? '🔄 切换播放源...'
                            : '🔄 视频加载中...'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 选集和换源 */}
            <div className={`h-[300px] lg:h-full md:overflow-hidden transition-all duration-300 ease-in-out ${
              isEpisodeSelectorCollapsed
                ? 'md:col-span-1 lg:hidden lg:opacity-0 lg:scale-95'
                : 'md:col-span-1 lg:opacity-100 lg:scale-100'
            }`}>
              <EpisodeSelector
                totalEpisodes={totalEpisodes}
                episodes_titles={detail?.episodes_titles || []}
                value={currentEpisodeIndex + 1}
                onChange={handleEpisodeChange}
                onSourceChange={handleSourceChange}
                currentSource={currentSource}
                currentId={currentId}
                videoTitle={searchTitle || videoTitle}
                availableSources={availableSources.filter(source => {
                  if (!source.episodes || source.episodes.length < 1) return false;
                  if (detail && detail.episodes && detail.episodes.length > 0) {
                    const currentEpisodes = detail.episodes.length;
                    const sourceEpisodes = source.episodes.length;
                    const tolerance = Math.max(5, Math.ceil(currentEpisodes * 0.3));
                    return Math.abs(sourceEpisodes - currentEpisodes) <= tolerance;
                  }
                  return true;
                })}
                sourceSearchLoading={sourceSearchLoading}
                sourceSearchError={sourceSearchError}
                precomputedVideoInfo={precomputedVideoInfo}
              />
            </div>
          </div>
        </div>

        {/* 详情展示 */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {/* 文字区 */}
          <div className='md:col-span-3'>
            <div className='p-6 flex flex-col min-h-0'>
              {/* 标题和按钮 */}
              <div className='mb-4 flex-shrink-0'>
                <div className='flex flex-col md:flex-row md:items-center gap-3'>
                  <h1 className='text-2xl md:text-3xl font-bold tracking-wide text-center md:text-left bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-gray-100 dark:via-gray-200 dark:to-gray-100 bg-clip-text text-transparent'>
                    {videoTitle || '影片标题'}
                  </h1>
                  <div className='flex items-center justify-center md:justify-start gap-2 flex-wrap'>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite();
                      }}
                      className='group relative flex-shrink-0 transition-all duration-300 hover:scale-110'
                    >
                      <div className='absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-full opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-300'></div>
                      <FavoriteIcon filled={favorited} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!netdiskResults && !netdiskLoading && videoTitle) {
                          handleNetDiskSearch(videoTitle);
                        }
                        setTimeout(() => {
                          const element = document.getElementById('netdisk-section');
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                      className='group relative flex-shrink-0 transition-all duration-300 hover:scale-105'
                    >
                      <div className='absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300'></div>
                      <div className='relative flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300'>
                        📁
                        {netdiskLoading ? (
                          <span className='flex items-center gap-1'>
                            <span className='inline-block h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin'></span>
                            搜索中...
                          </span>
                        ) : netdiskTotal > 0 ? (
                          <span>{netdiskTotal}个资源</span>
                        ) : (
                          <span>网盘资源</span>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* 关键信息行 */}
              <div className='flex flex-wrap items-center gap-3 text-base mb-4 opacity-80 flex-shrink-0'>
                {detail?.class && String(detail.class) !== '0' && (
                  <span className='text-green-600 font-semibold'>{detail.class}</span>
                )}
                {(detail?.year || videoYear) && <span>{detail?.year || videoYear}</span>}
                {detail?.source_name && (
                  <span className='border border-gray-500/60 px-2 py-[1px] rounded'>
                    {detail.source_name}
                  </span>
                )}
                {detail?.type_name && <span>{detail.type_name}</span>}
              </div>

              {/* 详细信息 */}
              {currentSource !== 'shortdrama' && videoDoubanId !== 0 && detail && detail.source !== 'shortdrama' && (
                <div className='mb-4 flex-shrink-0'>
                  {/* 加载状态 */}
                  {(loadingMovieDetails || loadingBangumiDetails) && !movieDetails && !bangumiDetails && (
                    <div className='animate-pulse'>
                      <div className='h-4 bg-gray-300 rounded w-64 mb-2'></div>
                      <div className='h-4 bg-gray-300 rounded w-48'></div>
                    </div>
                  )}
                  
                  {/* Bangumi详情 */}
                  {bangumiDetails && (
                    <div className='space-y-2 text-sm'>
                      {bangumiDetails.rating?.score && parseFloat(bangumiDetails.rating.score) > 0 && (
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold text-gray-700 dark:text-gray-300'>Bangumi评分: </span>
                          <div className='flex items-center group'>
                            <span className='relative text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 dark:from-pink-400 dark:via-rose-400 dark:to-pink-400 font-bold text-lg transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_2px_8px_rgba(236,72,153,0.5)]'>
                              {bangumiDetails.rating.score}
                            </span>
                            <div className='flex ml-2 gap-0.5'>
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-4 h-4 transition-all duration-300 ${
                                    i < Math.floor(parseFloat(bangumiDetails.rating.score) / 2)
                                      ? 'text-pink-500 drop-shadow-[0_0_4px_rgba(236,72,153,0.5)] group-hover:scale-110'
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                  fill='currentColor'
                                  viewBox='0 0 20 20'
                                >
                                  <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                </svg>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {/* 其他Bangumi信息... */}
                    </div>
                  )}

                  {/* 豆瓣详情 */}
                  {movieDetails && (
                    <div className='space-y-2 text-sm'>
                      {movieDetails.rate && movieDetails.rate !== "0" && parseFloat(movieDetails.rate) > 0 && (
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold text-gray-700 dark:text-gray-300'>豆瓣评分: </span>
                          <div className='flex items-center group'>
                            <span className='relative text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-amber-600 to-yellow-600 dark:from-yellow-400 dark:via-amber-400 dark:to-yellow-400 font-bold text-lg transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]'>
                              {movieDetails.rate}
                            </span>
                            <div className='flex ml-2 gap-0.5'>
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-4 h-4 transition-all duration-300 ${
                                    i < Math.floor(parseFloat(movieDetails.rate) / 2)
                                      ? 'text-yellow-500 drop-shadow-[0_0_4px_rgba(234,179,8,0.5)] group-hover:scale-110'
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                  fill='currentColor'
                                  viewBox='0 0 20 20'
                                >
                                  <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                </svg>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {/* 其他豆瓣信息... */}
                    </div>
                  )}
                </div>
              )}

              {/* 短剧详细信息 */}
              {(detail?.source === 'shortdrama' || shortdramaDetails) && (
                <div className='mb-4 flex-shrink-0'>
                  <div className='space-y-2 text-sm'>
                    {((detail?.source === 'shortdrama' && detail?.episodes && detail.episodes.length > 0) ||
                      (shortdramaDetails?.episodes && shortdramaDetails.episodes.length > 0)) && (
                      <div className='flex flex-wrap gap-2'>
                        <span className='relative group bg-gradient-to-r from-blue-500/90 to-indigo-500/90 dark:from-blue-600/90 dark:to-indigo-600/90 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105'>
                          <span className='absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-0 group-hover:opacity-20 blur transition-opacity duration-300'></span>
                          <span className='relative'>共{(shortdramaDetails?.episodes || detail?.episodes)?.length}集</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 剧情简介 */}
              {(shortdramaDetails?.desc || detail?.desc || bangumiDetails?.summary) && (
                <div
                  className='mt-0 text-base leading-relaxed opacity-90 overflow-y-auto pr-2 flex-1 min-h-0 scrollbar-hide'
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {shortdramaDetails?.desc || bangumiDetails?.summary || detail?.desc}
                </div>
              )}
              
              {/* 网盘资源区域 */}
              <div id="netdisk-section" className='mt-6'>
                <div className='border-t border-gray-200 dark:border-gray-700 pt-6'>
                  <div className='mb-4'>
                    <h3 className='text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2'>
                      📁 网盘资源
                      {netdiskLoading && (
                        <span className='inline-block align-middle'>
                          <span className='inline-block h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin'></span>
                        </span>
                      )}
                      {netdiskTotal > 0 && (
                        <span className='inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'>
                          {netdiskTotal} 个资源
                        </span>
                      )}
                    </h3>
                    {videoTitle && !netdiskLoading && !netdiskResults && (
                      <p className='text-sm text-gray-500 dark:text-gray-400 mt-2'>
                        点击上方"📁 网盘资源"按钮开始搜索
                      </p>
                    )}
                    {videoTitle && !netdiskLoading && (netdiskResults || netdiskError) && (
                      <p className='text-sm text-gray-500 dark:text-gray-400 mt-2'>
                        搜索关键词：{videoTitle}
                      </p>
                    )}
                  </div>
                  
                  <NetDiskSearchResults
                    results={netdiskResults}
                    loading={netdiskLoading}
                    error={netdiskError}
                    total={netdiskTotal}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 封面展示 */}
          <div className='hidden md:block md:col-span-1 md:order-first'>
            <div className='pl-0 py-4 pr-6'>
              <div className='group relative bg-gray-300 dark:bg-gray-700 aspect-[2/3] flex items-center justify-center rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]'>
                {(videoCover || bangumiDetails?.images?.large) ? (
                  <>
                    <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10'
                      style={{
                        background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.15) 55%, transparent 70%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2.5s ease-in-out infinite',
                      }}
                    />
                    <img
                      src={processImageUrl(bangumiDetails?.images?.large || videoCover)}
                      alt={videoTitle}
                      className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>
                    {videoDoubanId !== 0 && (
                      <a
                        href={
                          bangumiDetails
                            ? `https://bgm.tv/subject/${videoDoubanId.toString()}`
                            : `https://movie.douban.com/subject/${videoDoubanId.toString()}`
                        }
                        target='_blank'
                        rel='noopener noreferrer'
                        className='absolute top-3 left-3 z-20'
                      >
                        <div className={`relative ${bangumiDetails ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600' : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'} text-white text-xs font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:scale-110 group/link`}>
                          <div className={`absolute inset-0 ${bangumiDetails ? 'bg-pink-400' : 'bg-green-400'} rounded-full opacity-0 group-hover/link:opacity-30 blur transition-opacity duration-300`}></div>
                          <svg
                            width='18'
                            height='18'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            className='relative z-10'
                          >
                            <path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'></path>
                            <path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'></path>
                          </svg>
                        </div>
                      </a>
                    )}
                  </>
                ) : (
                  <span className='text-gray-600 dark:text-gray-400'>封面图片</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 返回顶部悬浮按钮 */}
      <button
        onClick={scrollToTop}
        className={`fixed z-[500] w-12 h-12 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out flex items-center justify-center group relative overflow-hidden ${
          showBackToTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{
          position: 'fixed',
          right: '1.5rem',
          bottom: typeof window !== 'undefined' && window.innerWidth < 768 ? '5rem' : '1.5rem',
          left: 'auto'
        }}
        aria-label='返回顶部'
      >
        <div className='absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 group-hover:from-green-600 group-hover:via-emerald-600 group-hover:to-teal-600 transition-all duration-300'></div>
        <div className='absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-50 blur-md transition-all duration-300'></div>
        <div className='absolute inset-0 rounded-full border-2 border-white/30 animate-ping group-hover:opacity-0 transition-opacity duration-300'></div>
        <ChevronUp className='w-6 h-6 text-white relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1' />
      </button>
    </PageLayout>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlayPageClient />
    </Suspense>
  );
}