/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */
'use client';

// 收藏类型
export interface Favorite {
  title: string;
  source_name: string;
  year: string;
  cover: string;
  total_episodes: number;
  save_time: number;
  search_title?: string;
  origin?: 'vod' | 'live';
  releaseDate?: string;
  remarks?: string;
}

// 收藏存储键
const FAVORITES_KEY = 'lunatv_favorites_v2';

// 生成存储键
export function generateFavoriteKey(source: string, id: string): string {
  return `${source}+${id}`;
}

// 获取所有收藏
export async function getAllFavorites(): Promise<Record<string, Favorite>> {
  try {
    if (typeof window === 'undefined') return {};
    
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) return {};
    
    const favorites = JSON.parse(stored);
    return typeof favorites === 'object' && favorites !== null ? favorites : {};
  } catch (error) {
    console.error('获取收藏失败:', error);
    return {};
  }
}

// 保存收藏
export async function saveFavorite(
  source: string,
  id: string,
  favorite: Omit<Favorite, 'save_time'> & { save_time?: number }
): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    
    const allFavorites = await getAllFavorites();
    const key = generateFavoriteKey(source, id);
    
    allFavorites[key] = {
      ...favorite,
      save_time: favorite.save_time || Date.now(),
    };
    
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(allFavorites));
  } catch (error) {
    console.error('保存收藏失败:', error);
    throw error;
  }
}

// 删除收藏
export async function deleteFavorite(source: string, id: string): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    
    const allFavorites = await getAllFavorites();
    const key = generateFavoriteKey(source, id);
    
    if (allFavorites[key]) {
      delete allFavorites[key];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(allFavorites));
    }
  } catch (error) {
    console.error('删除收藏失败:', error);
    throw error;
  }
}

// 检查是否已收藏
export async function isFavorited(source: string, id: string): Promise<boolean> {
  try {
    const allFavorites = await getAllFavorites();
    const key = generateFavoriteKey(source, id);
    return !!allFavorites[key];
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    return false;
  }
}

// 清空所有收藏
export async function clearAllFavorites(): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(FAVORITES_KEY);
  } catch (error) {
    console.error('清空收藏失败:', error);
    throw error;
  }
}

// 获取单个收藏
export async function getFavorite(source: string, id: string): Promise<Favorite | null> {
  try {
    const allFavorites = await getAllFavorites();
    const key = generateFavoriteKey(source, id);
    return allFavorites[key] || null;
  } catch (error) {
    console.error('获取收藏失败:', error);
    return null;
  }
}

// 订阅收藏数据更新
export function subscribeToDataUpdates(
  eventType: string,
  callback: (data: any) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === FAVORITES_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        callback(data);
      } catch (error) {
        console.error('处理收藏更新失败:', error);
      }
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}