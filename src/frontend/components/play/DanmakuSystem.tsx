'use client';

import { useEffect, useRef, useState } from 'react';
import { ClientCache } from '@/frontend/lib/client-cache';

// 弹幕缓存配置
const DANMU_CACHE_DURATION = 30 * 60; // 30分钟缓存（秒）
const DANMU_CACHE_KEY_PREFIX = 'danmu-cache';

// 弹幕系统Hook
export const useDanmakuSystem = (
  videoTitle: string,
  videoYear: string, 
  videoDoubanId: number,
  currentEpisodeIndex: number,
  currentSource: string,
  externalDanmuEnabled: boolean,
  artPlayerRef: React.MutableRefObject<any>,
  isSourceChangingRef: React.MutableRefObject<boolean>
) => {
  // 弹幕加载状态管理，防止重复加载
  const danmuLoadingRef = useRef<boolean>(false);
  const lastDanmuLoadKeyRef = useRef<string>('');
  
  // 🚀 新增：弹幕操作防抖和性能优化
  const danmuOperationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const episodeSwitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const danmuPluginStateRef = useRef<any>(null); // 保存弹幕插件状态

  // 获取单个弹幕缓存
  const getDanmuCacheItem = async (key: string): Promise<{ data: any[]; timestamp: number } | null> => {
    try {
      const cacheKey = `${DANMU_CACHE_KEY_PREFIX}-${key}`;
      // 优先从统一存储获取
      const cached = await ClientCache.get(cacheKey);
      if (cached) return cached;
      
      // 兜底：从localStorage获取（兼容性）
      if (typeof localStorage !== 'undefined') {
        const oldCacheKey = 'lunatv_danmu_cache';
        const localCached = localStorage.getItem(oldCacheKey);
        if (localCached) {
          const parsed = JSON.parse(localCached);
          const cacheMap = new Map(Object.entries(parsed));
          const item = cacheMap.get(key) as { data: any[]; timestamp: number } | undefined;
          if (item && typeof item.timestamp === 'number' && Date.now() - item.timestamp < DANMU_CACHE_DURATION * 1000) {
            return item;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.warn('读取弹幕缓存失败:', error);
      return null;
    }
  };
  
  // 保存单个弹幕缓存
  const setDanmuCacheItem = async (key: string, data: any[]): Promise<void> => {
    try {
      const cacheKey = `${DANMU_CACHE_KEY_PREFIX}-${key}`;
      const cacheData = { data, timestamp: Date.now() };
      
      // 主要存储：统一存储
      await ClientCache.set(cacheKey, cacheData, DANMU_CACHE_DURATION);
      
      // 兜底存储：localStorage（兼容性，但只存储最近几个）
      if (typeof localStorage !== 'undefined') {
        try {
          const oldCacheKey = 'lunatv_danmu_cache';
          let localCache: Map<string, { data: any[]; timestamp: number }> = new Map();
          
          const existing = localStorage.getItem(oldCacheKey);
          if (existing) {
            const parsed = JSON.parse(existing);
            localCache = new Map(Object.entries(parsed)) as Map<string, { data: any[]; timestamp: number }>;
          }
          
          // 清理过期项并限制数量（最多保留10个）
          const now = Date.now();
          const validEntries = Array.from(localCache.entries())
            .filter(([, item]) => typeof item.timestamp === 'number' && now - item.timestamp < DANMU_CACHE_DURATION * 1000)
            .slice(-9); // 保留9个，加上新的共10个
            
          validEntries.push([key, cacheData]);
          
          const obj = Object.fromEntries(validEntries);
          localStorage.setItem(oldCacheKey, JSON.stringify(obj));
        } catch (e) {
          // localStorage可能满了，忽略错误
        }
      }
    } catch (error) {
      console.warn('保存弹幕缓存失败:', error);
    }
  };

  // 加载外部弹幕数据（带缓存和防重复）
  const loadExternalDanmu = async (): Promise<any[]> => {
    if (!externalDanmuEnabled) {
      console.log('外部弹幕开关已关闭');
      return [];
    }
    
    // 生成当前请求的唯一标识
    const currentVideoTitle = videoTitle;
    const currentVideoYear = videoYear; 
    const currentVideoDoubanId = videoDoubanId;
    const currentEpisodeNum = currentEpisodeIndex + 1;
    const requestKey = `${currentVideoTitle}_${currentVideoYear}_${currentVideoDoubanId}_${currentEpisodeNum}`;
    
    // 🚀 优化加载状态检测：更智能的卡住检测
    const now = Date.now();
    const loadingState = danmuLoadingRef.current as any;
    const lastLoadTime = loadingState?.timestamp || 0;
    const lastRequestKey = loadingState?.requestKey || '';
    const isStuckLoad = now - lastLoadTime > 15000; // 降低到15秒超时
    const isSameRequest = lastRequestKey === requestKey;

    // 智能重复检测：区分真正的重复和卡住的请求
    if (loadingState?.loading && isSameRequest && !isStuckLoad) {
      console.log('⏳ 弹幕正在加载中，跳过重复请求');
      return [];
    }

    // 强制重置卡住的加载状态
    if (isStuckLoad && loadingState?.loading) {
      console.warn('🔧 检测到弹幕加载超时，强制重置 (15秒)');
      danmuLoadingRef.current = false;
    }

    // 设置新的加载状态，包含更多上下文信息
    danmuLoadingRef.current = {
      loading: true,
      timestamp: now,
      requestKey,
      source: currentSource,
      episode: currentEpisodeNum
    } as any;
    lastDanmuLoadKeyRef.current = requestKey;
    
    try {
      const params = new URLSearchParams();
      
      if (currentVideoDoubanId && currentVideoDoubanId > 0) {
        params.append('douban_id', currentVideoDoubanId.toString());
      }
      if (currentVideoTitle) {
        params.append('title', currentVideoTitle);
      }
      if (currentVideoYear) {
        params.append('year', currentVideoYear);
      }
      if (currentEpisodeIndex !== null && currentEpisodeIndex >= 0) {
        params.append('episode', currentEpisodeNum.toString());
      }

      if (!params.toString()) {
        console.log('没有可用的参数获取弹幕');
        return [];
      }

      // 生成缓存键（使用state值确保准确性）
      const cacheKey = `${currentVideoTitle}_${currentVideoYear}_${currentVideoDoubanId}_${currentEpisodeNum}`;
      const now = Date.now();
      
      console.log('🔑 弹幕缓存调试信息:');
      console.log('- 缓存键:', cacheKey);
      console.log('- 当前时间:', now);
      console.log('- 视频标题:', currentVideoTitle);
      console.log('- 视频年份:', currentVideoYear);
      console.log('- 豆瓣ID:', currentVideoDoubanId);
      console.log('- 集数:', currentEpisodeNum);
      
      // 检查缓存
      console.log('🔍 检查弹幕缓存:', cacheKey);
      const cached = await getDanmuCacheItem(cacheKey);
      if (cached) {
        console.log('📦 找到缓存数据:');
        console.log('- 缓存时间:', cached.timestamp);
        console.log('- 时间差:', now - cached.timestamp, 'ms');
        console.log('- 缓存有效期:', DANMU_CACHE_DURATION * 1000, 'ms');
        console.log('- 是否过期:', (now - cached.timestamp) >= (DANMU_CACHE_DURATION * 1000));
        
        if ((now - cached.timestamp) < (DANMU_CACHE_DURATION * 1000)) {
          console.log('✅ 使用弹幕缓存数据，缓存键:', cacheKey);
          console.log('📊 缓存弹幕数量:', cached.data.length);
          return cached.data;
        }
      } else {
        console.log('❌ 未找到缓存数据');
      }

      console.log('开始获取外部弹幕，参数:', params.toString());
      const response = await fetch(`/api/danmu-external?${params}`);
      console.log('弹幕API响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('弹幕API请求失败:', response.status, errorText);
        return [];
      }

      const data = await response.json();
      console.log('外部弹幕API返回数据:', data);
      console.log('外部弹幕加载成功:', data.total || 0, '条');
      
      const finalDanmu = data.danmu || [];
      console.log('最终弹幕数据:', finalDanmu.length, '条');
      
      // 缓存结果
      console.log('💾 保存弹幕到统一存储:');
      console.log('- 缓存键:', cacheKey);
      console.log('- 弹幕数量:', finalDanmu.length);
      console.log('- 保存时间:', now);
      
      // 保存到统一存储
      await setDanmuCacheItem(cacheKey, finalDanmu);
      
      return finalDanmu;
    } catch (error) {
      console.error('加载外部弹幕失败:', error);
      console.log('弹幕加载失败，返回空结果');
      return [];
    } finally {
      // 重置加载状态
      danmuLoadingRef.current = false;
    }
  };

  // 🚀 优化的弹幕操作处理函数（防抖 + 性能优化）
  const handleDanmuOperationOptimized = (nextState: boolean, setExternalDanmuEnabled: (state: boolean) => void) => {
    // 清除之前的防抖定时器
    if (danmuOperationTimeoutRef.current) {
      clearTimeout(danmuOperationTimeoutRef.current);
    }
    
    // 立即更新UI状态（确保响应性）
    setExternalDanmuEnabled(nextState);
    
    // 同步保存到localStorage（快速操作）
    try {
      localStorage.setItem('enable_external_danmu', String(nextState));
    } catch (e) {
      console.warn('localStorage设置失败:', e);
    }
    
    // 防抖处理弹幕数据操作（避免频繁切换时的性能问题）
    danmuOperationTimeoutRef.current = setTimeout(async () => {
      try {
        if (artPlayerRef.current?.plugins?.artplayerPluginDanmuku) {
          const plugin = artPlayerRef.current.plugins.artplayerPluginDanmuku;
          
          if (nextState) {
            // 开启弹幕：使用更温和的加载方式
            console.log('🚀 优化后开启外部弹幕...');
            
            // 使用requestIdleCallback优化性能（如果可用）
            const loadDanmu = async () => {
              const externalDanmu = await loadExternalDanmu();
              // 二次确认状态，防止快速切换导致的状态不一致
              if (nextState && artPlayerRef.current?.plugins?.artplayerPluginDanmuku) {
                plugin.load(externalDanmu);
                plugin.show();
                console.log('✅ 外部弹幕已优化加载:', externalDanmu.length, '条');
                
                if (artPlayerRef.current && externalDanmu.length > 0) {
                  artPlayerRef.current.notice.show = `已加载 ${externalDanmu.length} 条弹幕`;
                }
              }
            };
            
            // 使用 requestIdleCallback 或 setTimeout 来确保不阻塞主线程
            if (typeof requestIdleCallback !== 'undefined') {
              requestIdleCallback(loadDanmu, { timeout: 1000 });
            } else {
              setTimeout(loadDanmu, 50);
            }
          } else {
            // 关闭弹幕：立即处理
            console.log('🚀 优化后关闭外部弹幕...');
            plugin.load(); // 不传参数，真正清空弹幕
            plugin.hide();
            console.log('✅ 外部弹幕已关闭');
            
            if (artPlayerRef.current) {
              artPlayerRef.current.notice.show = '外部弹幕已关闭';
            }
          }
        }
      } catch (error) {
        console.error('优化后弹幕操作失败:', error);
      }
    }, 300); // 300ms防抖延迟
  };

  // 🚀 优化的集数变化处理（防抖 + 状态保护）
  const handleEpisodeChangeDanmaku = () => {
    // 🔥 重置弹幕加载标识，确保新集数能正确加载弹幕
    lastDanmuLoadKeyRef.current = '';
    danmuLoadingRef.current = false; // 重置加载状态

    // 清除之前的集数切换定时器，防止重复执行
    if (episodeSwitchTimeoutRef.current) {
      clearTimeout(episodeSwitchTimeoutRef.current);
    }

    // 🚀 如果正在换源，跳过弹幕处理（换源会在完成后手动处理）
    if (isSourceChangingRef.current) {
      console.log('⏭️ 正在换源，跳过弹幕处理');
      return;
    }

    // 如果播放器已经存在且弹幕插件已加载，重新加载弹幕
    if (artPlayerRef.current && artPlayerRef.current.plugins?.artplayerPluginDanmuku) {
      console.log('🚀 集数变化，优化后重新加载弹幕');

      // 🔥 关键修复：立即清空当前弹幕，避免旧弹幕残留
      const plugin = artPlayerRef.current.plugins.artplayerPluginDanmuku;
      plugin.reset(); // 立即回收所有正在显示的弹幕DOM
      plugin.load(); // 不传参数，完全清空弹幕队列
      console.log('🧹 已清空旧弹幕数据');

      // 保存当前弹幕插件状态
      danmuPluginStateRef.current = {
        isHide: artPlayerRef.current.plugins.artplayerPluginDanmuku.isHide,
        isStop: artPlayerRef.current.plugins.artplayerPluginDanmuku.isStop,
        option: artPlayerRef.current.plugins.artplayerPluginDanmuku.option
      };
      
      // 使用防抖处理弹幕重新加载
      episodeSwitchTimeoutRef.current = setTimeout(async () => {
        try {
          // 确保播放器和插件仍然存在（防止快速切换时的状态不一致）
          if (!artPlayerRef.current?.plugins?.artplayerPluginDanmuku) {
            console.warn('⚠️ 集数切换后弹幕插件不存在，跳过弹幕加载');
            return;
          }
          
          const externalDanmu = await loadExternalDanmu(); // 这里会检查开关状态
          console.log('🔄 集数变化后外部弹幕加载结果:', externalDanmu);
          
          // 再次确认插件状态
          if (artPlayerRef.current?.plugins?.artplayerPluginDanmuku) {
            const plugin = artPlayerRef.current.plugins.artplayerPluginDanmuku;
            
            if (externalDanmu.length > 0) {
              console.log('✅ 向播放器插件重新加载弹幕数据:', externalDanmu.length, '条');
              plugin.load(externalDanmu);
              
              // 恢复弹幕插件的状态
              if (danmuPluginStateRef.current) {
                if (!danmuPluginStateRef.current.isHide) {
                  plugin.show();
                }
              }
              
              if (artPlayerRef.current) {
                artPlayerRef.current.notice.show = `已加载 ${externalDanmu.length} 条弹幕`;
              }
            } else {
              console.log('📭 集数变化后没有弹幕数据可加载');
              plugin.load(); // 不传参数，确保清空弹幕

              if (artPlayerRef.current) {
                artPlayerRef.current.notice.show = '暂无弹幕数据';
              }
            }
          }
        } catch (error) {
          console.error('❌ 集数变化后加载外部弹幕失败:', error);
        } finally {
          // 清理定时器引用
          episodeSwitchTimeoutRef.current = null;
        }
      }, 800); // 缩短延迟时间，提高响应性
    }
  };

  // 清理弹幕相关定时器
  const cleanupDanmakuTimers = () => {
    if (danmuOperationTimeoutRef.current) {
      clearTimeout(danmuOperationTimeoutRef.current);
      danmuOperationTimeoutRef.current = null;
    }
    
    if (episodeSwitchTimeoutRef.current) {
      clearTimeout(episodeSwitchTimeoutRef.current);
      episodeSwitchTimeoutRef.current = null;
    }
    
    // 清理弹幕状态引用
    danmuPluginStateRef.current = null;
  };

  return {
    loadExternalDanmu,
    handleDanmuOperationOptimized,
    handleEpisodeChangeDanmaku,
    cleanupDanmakuTimers,
    danmuLoadingRef,
    lastDanmuLoadKeyRef,
    danmuPluginStateRef,
  };
};