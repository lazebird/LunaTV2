import { LiveChannel, LiveSource, EpgProgram } from '../types';

/**
 * 解析M3U播放列表
 */
export function parseM3U(content: string): LiveSource[] {
  const lines = content.split('\n');
  const sources: LiveSource[] = [];
  let currentSource: Partial<LiveSource> = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      // 解析频道信息
      const match = line.match(/tvg-id="([^"]*)".*tvg-logo="([^"]*)".*group-title="([^"]*)",(.+)/);
      if (match) {
        currentSource = {
          tvgId: match[1],
          logo: match[2],
          group: match[3],
          name: match[4].trim(),
        };
      }
    } else if (line && !line.startsWith('#')) {
      // URL行
      if (currentSource.name) {
        sources.push({
          ...currentSource,
          url: line,
          id: currentSource.name || line,
        } as LiveSource);
        currentSource = {};
      }
    }
  }
  
  return sources;
}

/**
 * 过滤频道
 */
export function filterChannels(
  channels: LiveChannel[],
  filter: {
    group?: string;
    search?: string;
  }
): LiveChannel[] {
  return channels.filter(channel => {
    if (filter.group && filter.group !== 'all' && channel.group !== filter.group) {
      return false;
    }
    if (filter.search && !channel.name.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    return true;
  });
}

/**
 * 排序频道
 */
export function sortChannels(
  channels: LiveChannel[],
  sortBy: 'name' | 'group',
  order: 'asc' | 'desc'
): LiveChannel[] {
  return [...channels].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else {
      comparison = a.group.localeCompare(b.group);
    }
    
    return order === 'desc' ? -comparison : comparison;
  });
}

/**
 * 获取当前播放的EPG节目
 */
export function getCurrentEpgProgram(
  programs: EpgProgram[],
  channelId: string,
  currentTime: number = Date.now()
): EpgProgram | null {
  return programs.find(program => 
    program.channel === channelId &&
    program.start <= currentTime &&
    program.stop > currentTime
  ) || null;
}

/**
 * 获取下一個EPG节目
 */
export function getNextEpgProgram(
  programs: EpgProgram[],
  channelId: string,
  currentTime: number = Date.now()
): EpgProgram | null {
  const channelPrograms = programs
    .filter(p => p.channel === channelId && p.start > currentTime)
    .sort((a, b) => a.start - b.start);
  
  return channelPrograms[0] || null;
}

/**
 * 格式化时间
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化日期时间
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 获取唯一的频道组列表
 */
export function getUniqueGroups(channels: LiveChannel[]): string[] {
  const groups = new Set(channels.map(channel => channel.group));
  return Array.from(groups).sort();
}

/**
 * 检查频道是否在收藏中
 */
export function isChannelFavorited(channelId: string, favorites: string[]): boolean {
  return favorites.includes(channelId);
}