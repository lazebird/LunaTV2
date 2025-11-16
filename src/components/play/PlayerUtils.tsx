'use client';

import { useRef, useEffect, useState } from 'react';
import * as dbClient from '../../lib/db.client';
import { ClientCache } from '../../lib/client-cache';

// 播放记录相关Hook
export const usePlayRecord = (
  currentSource: string,
  currentId: string,
  videoTitle: string,
  detail: any,
  currentEpisodeIndex: number,
  searchTitle: string,
  availableSourcesRef: React.MutableRefObject<any[]>,
  artPlayerRef: React.MutableRefObject<any>,
  currentEpisodeIndexRef: React.MutableRefObject<number>,
  videoTitleRef: React.MutableRefObject<string>,
  detailRef: React.MutableRefObject<any>,
  currentSourceRef: React.MutableRefObject<string>,
  currentIdRef: React.MutableRefObject<string>
) => {
  // 播放进度保存相关
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number>(0);

  // 保存播放进度
  const saveCurrentPlayProgress = async () => {
    if (
      !artPlayerRef.current ||
      !currentSourceRef.current ||
      !currentIdRef.current ||
      !videoTitleRef.current ||
      !detailRef.current?.source_name
    ) {
      return;
    }

    const player = artPlayerRef.current;
    const currentTime = player.currentTime || 0;
    const duration = player.duration || 0;

    // 如果播放时间太短（少于5秒）或者视频时长无效，不保存
    if (currentTime < 1 || !duration) {
      return;
    }

    try {
      // 动态导入数据库函数以避免SSR问题
      const {
        getAllPlayRecords,
        savePlayRecord,
        generateStorageKey
      } = dbClient;

      // 获取现有播放记录以保持原始集数
      const existingRecord = await getAllPlayRecords().then(records => {
        const key = generateStorageKey(currentSourceRef.current, currentIdRef.current);
        return records[key];
      }).catch(() => null);

      const currentTotalEpisodes = detailRef.current?.episodes.length || 1;

      // 尝试从换源列表中获取更准确的 remarks（搜索接口比详情接口更可能有 remarks）
      const sourceFromList = availableSourcesRef.current?.find(
        s => s.source === currentSourceRef.current && s.id === currentIdRef.current
      );
      const remarksToSave = sourceFromList?.remarks || detailRef.current?.remarks;

      await savePlayRecord(currentSourceRef.current, currentIdRef.current, {
        title: videoTitleRef.current,
        source_name: detailRef.current?.source_name || '',
        year: detailRef.current?.year,
        cover: detailRef.current?.poster || '',
        index: currentEpisodeIndexRef.current + 1, // 转换为1基索引
        total_episodes: currentTotalEpisodes,
        // 🔑 关键：不要在这里设置 original_episodes
        // 让 savePlayRecord 自己处理：
        // - 首次保存时会自动设置为 total_episodes
        // - 后续保存时会从数据库读取并保持不变
        // - 只有当用户看了新集数时才会更新
        // 这样避免了播放器传入错误的 original_episodes（可能是更新后的值）
        original_episodes: existingRecord?.original_episodes, // 只传递已有值，不自动填充
        play_time: Math.floor(currentTime),
        total_time: Math.floor(duration),
        save_time: Date.now(),
        search_title: searchTitle,
        remarks: remarksToSave, // 优先使用搜索结果的 remarks，因为详情接口可能没有
      });

      lastSaveTimeRef.current = Date.now();
      console.log('播放进度已保存:', {
        title: videoTitleRef.current,
        episode: currentEpisodeIndexRef.current + 1,
        year: detailRef.current?.year,
        progress: `${Math.floor(currentTime)}/${Math.floor(duration)}`,
      });
    } catch (err) {
      console.error('保存播放进度失败:', err);
    }
  };

  // 进入页面时直接获取播放记录
  useEffect(() => {
    // 仅在初次挂载时检查播放记录
    const initFromHistory = async () => {
      if (!currentSource || !currentId) return;

      try {
        const { getAllPlayRecords, generateStorageKey } = dbClient;
        const allRecords = await getAllPlayRecords();
        const key = generateStorageKey(currentSource, currentId);
        const record = allRecords[key];

        if (record) {
          const targetIndex = record.index - 1;
          const targetTime = record.play_time;

          // 更新当前选集索引
          if (targetIndex !== currentEpisodeIndex) {
            // 这里需要通过回调函数更新索引，因为hook不能直接修改state
            console.log(`从播放记录恢复：集数 ${targetIndex + 1}，进度 ${targetTime}s`);
            // 由于在hook中无法直接更新state，我们返回信息让父组件处理
            return { targetIndex, targetTime };
          }
        }
      } catch (err) {
        console.error('读取播放记录失败:', err);
      }
    };

    initFromHistory();
  }, [currentSource, currentId]);

  // 页面生命周期事件处理
  useEffect(() => {
    // 页面即将卸载时保存播放进度和清理资源
    const handleBeforeUnload = () => {
      saveCurrentPlayProgress();
    };

    // 页面可见性变化时保存播放进度
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveCurrentPlayProgress();
      }
    };

    // 添加事件监听器
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // 清理事件监听器
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // 清理定时器
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [currentEpisodeIndex, detail, artPlayerRef.current]);

  return {
    saveCurrentPlayProgress,
    lastSaveTimeRef,
  };
};

// 收藏相关Hook
export const useFavorite = (
  currentSource: string,
  currentId: string,
  videoTitle: string,
  detail: any,
  searchTitle: string,
  videoTitleRef: React.MutableRefObject<string>,
  detailRef: React.MutableRefObject<any>,
  currentSourceRef: React.MutableRefObject<string>,
  currentIdRef: React.MutableRefObject<string>
) => {
  const [favorited, setFavorited] = useState(false);

  // 每当 source 或 id 变化时检查收藏状态
  useEffect(() => {
    if (!currentSource || !currentId) return;
    (async () => {
      try {
        const { isFavorited } = dbClient;
        const fav = await isFavorited(currentSource, currentId);
        setFavorited(fav);
      } catch (err) {
        console.error('检查收藏状态失败:', err);
      }
    })();
  }, [currentSource, currentId]);

  // 监听收藏数据更新事件
  useEffect(() => {
    if (!currentSource || !currentId) return;

    const setupSubscription = async () => {
      const { subscribeToDataUpdates, generateStorageKey } = dbClient;
      const unsubscribe = subscribeToDataUpdates(
        'favoritesUpdated',
        (favorites: Record<string, any>) => {
          const key = generateStorageKey(currentSource, currentId);
          const isFav = !!favorites[key];
          setFavorited(isFav);
        }
      );
      return unsubscribe;
    };

    let unsubscribe: (() => void) | undefined;
    setupSubscription().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentSource, currentId]);

  // 自动更新收藏的集数信息（解决即将上映占位符数据问题）
  useEffect(() => {
    if (!detail || !favorited || !currentSource || !currentId) return;

    const updateFavoriteEpisodes = async () => {
      try {
        const { saveFavorite, getAllFavorites } = dbClient;
        const realEpisodes = detail.episodes.length || 1;

        // 获取当前收藏的数据
        const favorites = await getAllFavorites();
        const key = `${currentSource}+${currentId}`;
        const currentFavorite = favorites[key];

        // 如果收藏的集数是占位符（99）或与真实集数不同，则更新
        if (currentFavorite && (currentFavorite.total_episodes === 99 || currentFavorite.total_episodes !== realEpisodes)) {
          console.log(`🔄 更新收藏集数: ${currentFavorite.total_episodes} → ${realEpisodes}`);

          await saveFavorite(currentSource, currentId, {
            title: videoTitleRef.current || detail.title,
            source_name: detail.source_name || currentFavorite.source_name || '',
            year: detail.year || currentFavorite.year || '',
            cover: detail.poster || currentFavorite.cover || '',
            total_episodes: realEpisodes, // 更新为真实集数
            save_time: currentFavorite.save_time || Date.now(), // 保持原收藏时间
            search_title: currentFavorite.search_title || searchTitle,
          });
        }
      } catch (err) {
        console.error('自动更新收藏集数失败:', err);
      }
    };

    updateFavoriteEpisodes();
  }, [detail, favorited, currentSource, currentId, searchTitle]);

  // 切换收藏
  const handleToggleFavorite = async () => {
    if (
      !videoTitleRef.current ||
      !detailRef.current ||
      !currentSourceRef.current ||
      !currentIdRef.current
    )
      return;

    try {
      const { saveFavorite, deleteFavorite } = dbClient;
      
      if (favorited) {
        // 如果已收藏，删除收藏
        await deleteFavorite(currentSourceRef.current, currentIdRef.current);
        setFavorited(false);
      } else {
        // 如果未收藏，添加收藏
        await saveFavorite(currentSourceRef.current, currentIdRef.current, {
          title: videoTitleRef.current,
          source_name: detailRef.current?.source_name || '',
          year: detailRef.current?.year,
          cover: detailRef.current?.poster || '',
          total_episodes: detailRef.current?.episodes.length || 1,
          save_time: Date.now(),
          search_title: searchTitle,
        });
        setFavorited(true);
      }
    } catch (err) {
      console.error('切换收藏失败:', err);
    }
  };

  return {
    favorited,
    handleToggleFavorite,
  };
};

// 返回顶部功能Hook
export const useBackToTop = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);

  // 返回顶部功能相关
  useEffect(() => {
    // 获取滚动位置的函数 - 专门针对 body 滚动
    const getScrollTop = () => {
      return document.body.scrollTop || 0;
    };

    // 使用 requestAnimationFrame 持续检测滚动位置
    let isRunning = false;
    const checkScrollPosition = () => {
      if (!isRunning) return;

      const scrollTop = getScrollTop();
      const shouldShow = scrollTop > 300;
      setShowBackToTop(shouldShow);

      requestAnimationFrame(checkScrollPosition);
    };

    // 启动持续检测
    isRunning = true;
    checkScrollPosition();

    // 监听 body 元素的滚动事件
    const handleScroll = () => {
      const scrollTop = getScrollTop();
      setShowBackToTop(scrollTop > 300);
    };

    document.body.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      isRunning = false; // 停止 requestAnimationFrame 循环
      // 移除 body 滚动事件监听器
      document.body.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 返回顶部功能
  const scrollToTop = () => {
    try {
      // 根据调试结果，真正的滚动容器是 document.body
      document.body.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      // 如果平滑滚动完全失败，使用立即滚动
      document.body.scrollTop = 0;
    }
  };

  return {
    showBackToTop,
    scrollToTop,
  };
};

// 内存压力检测和清理
export const useMemoryManagement = (isMobileGlobal: boolean) => {
  // 内存压力检测和清理（针对移动设备）
  const checkMemoryPressure = async () => {
    // 仅在支持performance.memory的浏览器中执行
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      try {
        const memInfo = (performance as any).memory;
        const usedJSHeapSize = memInfo.usedJSHeapSize;
        const heapLimit = memInfo.jsHeapSizeLimit;
        
        // 计算内存使用率
        const memoryUsageRatio = usedJSHeapSize / heapLimit;
        
        console.log(`内存使用情况: ${(memoryUsageRatio * 100).toFixed(2)}% (${(usedJSHeapSize / 1024 / 1024).toFixed(2)}MB / ${(heapLimit / 1024 / 1024).toFixed(2)}MB)`);
        
        // 如果内存使用超过75%，触发清理
        if (memoryUsageRatio > 0.75) {
          console.warn('内存使用过高，清理缓存...');
          
          // 清理弹幕缓存
          try {
            // ClientCache 已通过静态导入
            // 清理统一存储中的弹幕缓存
            await ClientCache.clearExpired('danmu-cache');
            
            // 兜底清理localStorage中的弹幕缓存（兼容性）
            const oldCacheKey = 'lunatv_danmu_cache';
            localStorage.removeItem(oldCacheKey);
            console.log('弹幕缓存已清理');
          } catch (e) {
            console.warn('清理弹幕缓存失败:', e);
          }
          
          // 尝试强制垃圾回收（如果可用）
          if (typeof (window as any).gc === 'function') {
            (window as any).gc();
            console.log('已触发垃圾回收');
          }
          
          return true; // 返回真表示高内存压力
        }
      } catch (error) {
        console.warn('内存检测失败:', error);
      }
    }
    return false;
  };

  // 定期内存检查（仅在移动设备上）
  useEffect(() => {
    if (!isMobileGlobal) return;
    
    const memoryCheckInterval = setInterval(() => {
      // 异步调用内存检查，不阻塞定时器
      checkMemoryPressure().catch(console.error);
    }, 30000); // 每30秒检查一次
    
    return () => {
      clearInterval(memoryCheckInterval);
    };
  }, [isMobileGlobal]);

  return {
    checkMemoryPressure,
  };
};