import { PlayRecord } from './types';

export interface PlayStatsData {
  totalPlayTime: number;
  totalEpisodes: number;
  averageEpisodeTime: number;
  mostWatchedDay: string;
  playStreak: number;
  longestPlayStreak: number;
  favoriteGenres: Array<{ genre: string; count: number }>;
  watchTimeByDay: Array<{ date: string; minutes: number }>;
  recentRecords: PlayRecord[];
  topSources: Array<{ source: string; count: number }>;
}

export interface DailyStats {
  date: string;
  episodes: number;
  minutes: number;
  sources: Set<string>;
}

export function calculatePlayStats(records: PlayRecord[]): PlayStatsData {
  if (!records || records.length === 0) {
    return {
      totalPlayTime: 0,
      totalEpisodes: 0,
      averageEpisodeTime: 0,
      mostWatchedDay: '',
      playStreak: 0,
      longestPlayStreak: 0,
      favoriteGenres: [],
      watchTimeByDay: [],
      recentRecords: [],
      topSources: [],
    };
  }

  // 基本统计
  const totalPlayTime = records.reduce((sum, record) => sum + (record.play_time || 0), 0);
  const totalEpisodes = records.length;
  const averageEpisodeTime = totalEpisodes > 0 ? Math.round(totalPlayTime / totalEpisodes) : 0;

  // 按日期分组统计
  const dailyStats = new Map<string, DailyStats>();
  const sourceCounts = new Map<string, number>();

  records.forEach(record => {
    const date = new Date(record.save_time).toISOString().split('T')[0];
    
    if (!dailyStats.has(date)) {
      dailyStats.set(date, {
        date,
        episodes: 0,
        minutes: 0,
        sources: new Set(),
      });
    }
    
    const dayStats = dailyStats.get(date)!;
    dayStats.episodes++;
    dayStats.minutes += Math.round((record.play_time || 0) / 60);
    dayStats.sources.add(record.source_name || '');
    
    // 统计源
    const sourceName = record.source_name || '未知';
    sourceCounts.set(sourceName, (sourceCounts.get(sourceName) || 0) + 1);
  });

  // 找出观看最多的日期
  let mostWatchedDay = '';
  let maxEpisodes = 0;
  dailyStats.forEach(dayStats => {
    if (dayStats.episodes > maxEpisodes) {
      maxEpisodes = dayStats.episodes;
      mostWatchedDay = dayStats.date;
    }
  });

  // 计算连续观看天数
  const sortedDates = Array.from(dailyStats.keys()).sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  sortedDates.forEach(dateStr => {
    const currentDate = new Date(dateStr);
    
    if (!lastDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    
    lastDate = currentDate;
  });
  
  longestStreak = Math.max(longestStreak, tempStreak);
  
  // 检查是否是连续到今天
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  if (sortedDates.includes(today)) {
    currentStreak = tempStreak;
  } else if (sortedDates.includes(yesterday)) {
    currentStreak = tempStreak;
  } else {
    currentStreak = 0;
  }

  // 统计观看时间按日期（最近30天）
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const watchTimeByDay = Array.from(dailyStats.values())
    .filter(day => new Date(day.date) >= thirtyDaysAgo)
    .map(day => ({
      date: day.date,
      minutes: day.minutes,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 最近播放记录（最近10条）
  const recentRecords = records
    .sort((a, b) => b.save_time - a.save_time)
    .slice(0, 10);

  // 热门源（前5个）
  const topSources = Array.from(sourceCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));

  return {
    totalPlayTime,
    totalEpisodes,
    averageEpisodeTime,
    mostWatchedDay,
    playStreak: currentStreak,
    longestPlayStreak: longestStreak,
    favoriteGenres: [], // 需要额外的数据来计算
    watchTimeByDay,
    recentRecords,
    topSources,
  };
}

export function formatPlayTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
  }
}

export function getPlayTimeDistribution(records: PlayRecord[]): Array<{
  range: string;
  count: number;
  percentage: number;
}> {
  const ranges = [
    { min: 0, max: 300, label: '5分钟以下' },
    { min: 300, max: 600, label: '5-10分钟' },
    { min: 600, max: 1200, label: '10-20分钟' },
    { min: 1200, max: 2400, label: '20-40分钟' },
    { min: 2400, max: 3600, label: '40-60分钟' },
    { min: 3600, max: Infinity, label: '1小时以上' },
  ];

  const distribution = ranges.map(range => ({
    range: range.label,
    count: 0,
    percentage: 0,
  }));

  records.forEach(record => {
    const playTime = record.play_time || 0;
    const rangeIndex = ranges.findIndex(r => playTime >= r.min && playTime < r.max);
    if (rangeIndex !== -1) {
      distribution[rangeIndex].count++;
    }
  });

  const total = records.length;
  distribution.forEach(item => {
    item.percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
  });

  return distribution;
}

export function getWatchProgressStats(records: PlayRecord[]): {
  completed: number;
  inProgress: number;
  notStarted: number;
} {
  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;

  records.forEach(record => {
    const progress = record.play_time || 0;
    const total = record.total_time || 0;
    
    if (total === 0) {
      notStarted++;
    } else if (progress >= total * 0.9) {
      completed++;
    } else if (progress > 0) {
      inProgress++;
    } else {
      notStarted++;
    }
  });

  return { completed, inProgress, notStarted };
}