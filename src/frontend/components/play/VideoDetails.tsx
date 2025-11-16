'use client';

import { useState, useEffect } from 'react';
import { ClientCache } from '@/frontend/lib/client-cache';
import { getDoubanDetails } from '@/frontend/lib/douban.client';

// bangumi ID检测（3-6位数字）
const isBangumiId = (id: number): boolean => {
  const length = id.toString().length;
  return id > 0 && length >= 3 && length <= 6;
};

// bangumi缓存配置
const BANGUMI_CACHE_EXPIRE = 4 * 60 * 60 * 1000; // 4小时，和douban详情一致

// bangumi缓存工具函数（统一存储）
const getBangumiCache = async (id: number) => {
  try {
    const cacheKey = `bangumi-details-${id}`;
    // 优先从统一存储获取
    const cached = await ClientCache.get(cacheKey);
    if (cached) return cached;
    
    // 兜底：从localStorage获取（兼容性）
    if (typeof localStorage !== 'undefined') {
      const localCached = localStorage.getItem(cacheKey);
      if (localCached) {
        const { data, expire } = JSON.parse(localCached);
        if (Date.now() <= expire) {
          return data;
        }
        localStorage.removeItem(cacheKey);
      }
    }
    
    return null;
  } catch (e) {
    console.warn('获取Bangumi缓存失败:', e);
    return null;
  }
};

const setBangumiCache = async (id: number, data: any) => {
  try {
    const cacheKey = `bangumi-details-${id}`;
    const expireSeconds = Math.floor(BANGUMI_CACHE_EXPIRE / 1000); // 转换为秒
    
    // 主要存储：统一存储
    await ClientCache.set(cacheKey, data, expireSeconds);
    
    // 兜底存储：localStorage（兼容性）
    if (typeof localStorage !== 'undefined') {
      try {
        const cacheData = {
          data,
          expire: Date.now() + BANGUMI_CACHE_EXPIRE,
          created: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (e) {
        // localStorage可能满了，忽略错误
      }
    }
  } catch (e) {
    console.warn('设置Bangumi缓存失败:', e);
  }
};

// 获取bangumi详情（带缓存）
const fetchBangumiDetails = async (bangumiId: number) => {
  // 检查缓存
  const cached = await getBangumiCache(bangumiId);
  if (cached) {
    console.log(`Bangumi详情缓存命中: ${bangumiId}`);
    return cached;
  }

  try {
    const response = await fetch(`https://api.bgm.tv/v0/subjects/${bangumiId}`);
    if (response.ok) {
      const bangumiData = await response.json();
      
      // 保存到缓存
      await setBangumiCache(bangumiId, bangumiData);
      console.log(`Bangumi详情已缓存: ${bangumiId}`);
      
      return bangumiData;
    }
  } catch (error) {
    console.log('Failed to fetch bangumi details:', error);
  }
  return null;
};

// 视频详情Hook
export const useVideoDetails = (
  videoDoubanId: number,
  detail: any,
  shortdramaId: string
) => {
  // 豆瓣详情状态
  const [movieDetails, setMovieDetails] = useState<any>(null);
  const [loadingMovieDetails, setLoadingMovieDetails] = useState(false);

  // bangumi详情状态
  const [bangumiDetails, setBangumiDetails] = useState<any>(null);
  const [loadingBangumiDetails, setLoadingBangumiDetails] = useState(false);

  // 短剧详情状态（用于显示简介等信息）
  const [shortdramaDetails, setShortdramaDetails] = useState<any>(null);
  const [loadingShortdramaDetails, setLoadingShortdramaDetails] = useState(false);

  // 加载详情（豆瓣或bangumi）
  useEffect(() => {
    const loadMovieDetails = async () => {
      if (!videoDoubanId || videoDoubanId === 0 || detail?.source === 'shortdrama') {
        return;
      }

      // 检测是否为bangumi ID
      if (isBangumiId(videoDoubanId)) {
        // 加载bangumi详情
        if (loadingBangumiDetails || bangumiDetails) {
          return;
        }
        
        setLoadingBangumiDetails(true);
        try {
          const bangumiData = await fetchBangumiDetails(videoDoubanId);
          if (bangumiData) {
            setBangumiDetails(bangumiData);
          }
        } catch (error) {
          console.error('Failed to load bangumi details:', error);
        } finally {
          setLoadingBangumiDetails(false);
        }
      } else {
        // 加载豆瓣详情
        if (loadingMovieDetails || movieDetails) {
          return;
        }
        
        setLoadingMovieDetails(true);
        try {
          const response = await getDoubanDetails(videoDoubanId.toString());
          if (response.code === 200 && response.data) {
            setMovieDetails(response.data);
          }
        } catch (error) {
          console.error('Failed to load movie details:', error);
        } finally {
          setLoadingMovieDetails(false);
        }
      }
    };

    loadMovieDetails();
  }, [videoDoubanId, loadingMovieDetails, movieDetails, loadingBangumiDetails, bangumiDetails, detail?.source]);

  // 加载短剧详情（仅用于显示简介等信息，不影响源搜索）
  useEffect(() => {
    const loadShortdramaDetails = async () => {
      if (!shortdramaId || loadingShortdramaDetails || shortdramaDetails) {
        return;
      }

      setLoadingShortdramaDetails(true);
      try {
        const response = await fetch(`/api/shortdrama/detail?id=${shortdramaId}&episode=1`);
        if (response.ok) {
          const data = await response.json();
          setShortdramaDetails(data);
        }
      } catch (error) {
        console.error('Failed to load shortdrama details:', error);
      } finally {
        setLoadingShortdramaDetails(false);
      }
    };

    loadShortdramaDetails();
  }, [shortdramaId, loadingShortdramaDetails, shortdramaDetails]);

  return {
    movieDetails,
    loadingMovieDetails,
    bangumiDetails,
    loadingBangumiDetails,
    shortdramaDetails,
    loadingShortdramaDetails,
  };
};