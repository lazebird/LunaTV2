import { useState, useEffect, useCallback, useMemo } from 'react';
import { LiveChannel, LiveSource, FilterState } from '../types';
import { parseM3U, filterChannels, sortChannels, getUniqueGroups } from '../utils/live-utils';

export function useLiveChannels() {
  const [sources, setSources] = useState<LiveSource[]>([]);
  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<LiveChannel[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterState>({
    group: 'all',
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // 加载直播源
  const loadSources = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/live/sources');
      if (!response.ok) {
        throw new Error('加载直播源失败');
      }
      
      const data = await response.json();
      setSources(data.sources || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 加载收藏列表
  const loadFavorites = useCallback(() => {
    try {
      const saved = localStorage.getItem('live_favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (err) {
      console.error('加载收藏失败:', err);
    }
  }, []);

  // 添加收藏
  const addFavorite = useCallback((channelId: string) => {
    setFavorites(prev => {
      const newFavorites = [...new Set([...prev, channelId])];
      localStorage.setItem('live_favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  // 移除收藏
  const removeFavorite = useCallback((channelId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.filter(id => id !== channelId);
      localStorage.setItem('live_favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  // 切换收藏状态
  const toggleFavorite = useCallback((channelId: string) => {
    if (favorites.includes(channelId)) {
      removeFavorite(channelId);
    } else {
      addFavorite(channelId);
    }
  }, [favorites, addFavorite, removeFavorite]);

  // 转换源为频道格式
  useEffect(() => {
    const convertedChannels: LiveChannel[] = sources.map(source => ({
      id: source.id,
      tvgId: source.tvgId || '',
      name: source.name,
      logo: source.logo || '',
      group: source.group || '未分类',
      url: source.url,
    }));
    setChannels(convertedChannels);
  }, [sources]);

  // 应用过滤和排序
  useEffect(() => {
    let result = channels;
    
    // 应用过滤
    result = filterChannels(result, {
      group: filter.group === 'all' ? undefined : filter.group,
      search: filter.search || undefined,
    });
    
    // 应用排序
    result = sortChannels(result, filter.sortBy, filter.sortOrder);
    
    // 收藏的频道排在前面
    result.sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
    
    setFilteredChannels(result);
  }, [channels, filter, favorites]);

  // 获取唯一的组列表
  const groups = useMemo(() => {
    return getUniqueGroups(channels);
  }, [channels]);

  // 初始化加载
  useEffect(() => {
    loadSources();
    loadFavorites();
  }, [loadSources, loadFavorites]);

  // 更新过滤器
  const updateFilter = useCallback((updates: Partial<FilterState>) => {
    setFilter(prev => ({ ...prev, ...updates }));
  }, []);

  // 搜索频道（防抖）
  const searchChannels = useCallback((query: string) => {
    updateFilter({ search: query });
  }, [updateFilter]);

  // 按组过滤
  const filterByGroup = useCallback((group: string) => {
    updateFilter({ group });
  }, [updateFilter]);

  // 切换排序
  const toggleSort = useCallback(() => {
    updateFilter({
      sortBy: filter.sortBy === 'name' ? 'group' : 'name',
    });
  }, [filter.sortBy, updateFilter]);

  // 切换排序顺序
  const toggleSortOrder = useCallback(() => {
    updateFilter({
      sortOrder: filter.sortOrder === 'asc' ? 'desc' : 'asc',
    });
  }, [filter.sortOrder, updateFilter]);

  return {
    channels: filteredChannels,
    favorites,
    groups,
    isLoading,
    error,
    filter,
    loadSources,
    toggleFavorite,
    searchChannels,
    filterByGroup,
    toggleSort,
    toggleSortOrder,
    isFavorited: (channelId: string) => favorites.includes(channelId),
  };
}