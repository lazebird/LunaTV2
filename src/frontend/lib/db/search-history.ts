/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */
'use client';

// 搜索历史项
export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  type?: 'vod' | 'live' | 'shortdrama' | 'tvbox';
  resultCount?: number;
}

// 搜索历史存储键
const SEARCH_HISTORY_KEY = 'lunatv_search_history_v2';

// 最大搜索历史数量
const MAX_SEARCH_HISTORY = 100;

// 获取所有搜索历史
export async function getAllSearchHistory(): Promise<SearchHistoryItem[]> {
  try {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored);
    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.error('获取搜索历史失败:', error);
    return [];
  }
}

// 添加搜索历史
export async function addSearchHistory(
  query: string,
  type: SearchHistoryItem['type'] = 'vod',
  resultCount?: number
): Promise<void> {
  try {
    if (typeof window === 'undefined' || !query.trim()) return;
    
    const history = await getAllSearchHistory();
    
    // 移除相同的查询
    const filteredHistory = history.filter(item => item.query !== query);
    
    // 添加新查询到开头
    filteredHistory.unshift({
      query: query.trim(),
      timestamp: Date.now(),
      type,
      resultCount,
    });
    
    // 限制历史数量
    const limitedHistory = filteredHistory.slice(0, MAX_SEARCH_HISTORY);
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('添加搜索历史失败:', error);
    throw error;
  }
}

// 删除搜索历史
export async function deleteSearchHistory(query: string): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    
    const history = await getAllSearchHistory();
    const filteredHistory = history.filter(item => item.query !== query);
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error('删除搜索历史失败:', error);
    throw error;
  }
}

// 清空搜索历史
export async function clearSearchHistory(): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('清空搜索历史失败:', error);
    throw error;
  }
}

// 获取搜索建议（基于历史）
export async function getSearchSuggestions(
  query: string,
  limit: number = 10
): Promise<string[]> {
  try {
    if (!query.trim()) return [];
    
    const history = await getAllSearchHistory();
    const suggestions = history
      .filter(item => item.query.toLowerCase().includes(query.toLowerCase()))
      .map(item => item.query)
      .slice(0, limit);
    
    return suggestions;
  } catch (error) {
    console.error('获取搜索建议失败:', error);
    return [];
  }
}

// 清理过期的搜索历史（超过30天）
export async function cleanupExpiredSearchHistory(): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    
    const history = await getAllSearchHistory();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const filteredHistory = history.filter(item => item.timestamp > thirtyDaysAgo);
    
    if (filteredHistory.length !== history.length) {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filteredHistory));
    }
  } catch (error) {
    console.error('清理搜索历史失败:', error);
  }
}