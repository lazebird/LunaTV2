/* eslint-disable no-console, @typescript-eslint/no-explicit-any */

import {
  ContentStat,
  PlayRecord,
  PlayStatsResult,
  UserPlayStat,
} from '../types';

/**
 * 统计数据接口
 */
interface UserStatistics {
  totalWatchTime: number;
  totalPlays: number;
  lastPlayTime: number;
  recentRecords: PlayRecord[];
  avgWatchTime: number;
  mostWatchedSource: string;
  totalMovies: number;
  firstWatchDate: number;
  sourceCount: Record<string, number>;
}

/**
 * 统计计算工具类
 * 提供各种统计数据的计算逻辑
 */
export class StatisticsCalculator {
  /**
   * 计算用户统计数据
   */
  static calculateUserStats(
    userName: string,
    playRecords: Record<string, PlayRecord>,
    loginStats?: {
      loginCount?: number;
      firstLoginTime?: number;
      lastLoginTime?: number;
    }
  ): UserPlayStat {
    const records = Object.values(playRecords);

    if (records.length === 0) {
      return {
        username: userName,
        totalWatchTime: 0,
        totalPlays: 0,
        lastPlayTime: 0,
        recentRecords: [],
        avgWatchTime: 0,
        mostWatchedSource: '',
        totalMovies: 0,
        firstWatchDate: Date.now(),
        lastUpdateTime: Date.now(),
        loginCount: loginStats?.loginCount || 0,
        firstLoginTime: loginStats?.firstLoginTime || 0,
        lastLoginTime: loginStats?.lastLoginTime || 0,
        lastLoginDate: loginStats?.lastLoginTime || 0,
      };
    }

    // 基础统计计算
    const stats = this.calculateBasicStatistics(records);
    
    // 高级统计计算
    const advancedStats = this.calculateAdvancedStatistics(records);
    
    // 合并统计结果
    return {
      username: userName,
      ...stats,
      ...advancedStats,
      lastUpdateTime: Date.now(),
      loginCount: loginStats?.loginCount || 0,
      firstLoginTime: loginStats?.firstLoginTime || 0,
      lastLoginTime: loginStats?.lastLoginTime || 0,
      lastLoginDate: loginStats?.lastLoginTime || 0,
    };
  }

  /**
   * 计算基础统计数据
   */
  private static calculateBasicStatistics(records: PlayRecord[]): Omit<UserStatistics, 'sourceCount'> {
    const totalWatchTime = records.reduce((sum, record) => sum + (record.play_time || 0), 0);
    const totalPlays = records.length;
    const lastPlayTime = Math.max(...records.map(r => r.save_time || 0));
    const firstWatchDate = Math.min(...records.map(r => r.save_time || Date.now()));
    const totalMovies = new Set(records.map(r => `${r.title}_${r.source_name}_${r.year}`)).size;
    const avgWatchTime = totalPlays > 0 ? totalWatchTime / totalPlays : 0;

    // 最近10条记录，按时间排序
    const recentRecords = records
      .sort((a, b) => (b.save_time || 0) - (a.save_time || 0))
      .slice(0, 10);

    // 最常观看的来源
    const mostWatchedSource = this.getMostWatchedSource(records);

    return {
      totalWatchTime,
      totalPlays,
      lastPlayTime,
      recentRecords,
      avgWatchTime,
      mostWatchedSource,
      totalMovies,
      firstWatchDate,
    };
  }

  /**
   * 计算高级统计数据
   */
  private static calculateAdvancedStatistics(records: PlayRecord[]): Pick<UserStatistics, 'sourceCount'> {
    const sourceCount: Record<string, number> = {};
    
    records.forEach(record => {
      const sourceName = record.source_name || '未知来源';
      sourceCount[sourceName] = (sourceCount[sourceName] || 0) + 1;
    });

    return { sourceCount };
  }

  /**
   * 获取最常观看的来源
   */
  private static getMostWatchedSource(records: PlayRecord[]): string {
    const sourceMap = new Map<string, number>();
    
    records.forEach(record => {
      const sourceName = record.source_name || '未知来源';
      const count = sourceMap.get(sourceName) || 0;
      sourceMap.set(sourceName, count + 1);
    });

    if (sourceMap.size === 0) return '';

    return Array.from(sourceMap.entries())
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }

  /**
   * 计算全站播放统计
   */
  static calculatePlayStats(
    allUsers: string[],
    userStatsMap: Map<string, UserPlayStat>
  ): PlayStatsResult {
    const userStats = Array.from(userStatsMap.values());
    const totalUsers = allUsers.length;
    
    if (userStats.length === 0) {
      return this.createEmptyPlayStats();
    }

    // 基础统计
    const totalWatchTime = userStats.reduce((sum, stat) => sum + stat.totalWatchTime, 0);
    const totalPlays = userStats.reduce((sum, stat) => sum + stat.totalPlays, 0);
    const avgWatchTimePerUser = totalUsers > 0 ? totalWatchTime / totalUsers : 0;
    const avgPlaysPerUser = totalUsers > 0 ? totalPlays / totalUsers : 0;

    // 热门来源统计
    const topSources = this.calculateTopSources(userStats);

    // 每日统计（简化版）
    const dailyStats = this.generateDailyStats(totalWatchTime, totalPlays);

    // 用户注册统计
    const registrationStats = this.calculateRegistrationStats(userStats);

    // 活跃用户统计
    const activeUsers = this.calculateActiveUsers(userStats);

    const result: PlayStatsResult = {
        totalUsers: allUsers.length,
        totalWatchTime,
        totalPlays,
        avgWatchTimePerUser,
        avgPlaysPerUser,
        userStats: userStats.map(stat => ({
          username: stat.username,
          totalWatchTime: stat.totalWatchTime,
          totalPlays: stat.totalPlays,
          lastPlayTime: stat.lastPlayTime,
          recentRecords: stat.recentRecords,
          avgWatchTime: stat.avgWatchTime,
          mostWatchedSource: stat.mostWatchedSource,
          registrationDays: Math.floor((Date.now() - (stat.firstWatchDate || Date.now())) / (1000 * 60 * 60 * 24)) + 1,
          lastLoginTime: stat.lastPlayTime || stat.firstWatchDate || Date.now(),
          loginCount: stat.loginCount || 0,
          createdAt: stat.firstWatchDate || Date.now()
        })).sort((a, b) => b.totalWatchTime - a.totalWatchTime),
        topSources,
        dailyStats,
        registrationStats: {
          todayNewUsers: 0, // TODO: 实现今日新用户统计
          totalRegisteredUsers: allUsers.length,
          registrationTrend: [],
        },
        activeUsers,
      };
      
      return result;
  }

  /**
   * 创建空的播放统计
   */
  private static createEmptyPlayStats(): PlayStatsResult {
    return {
      totalUsers: 0,
      totalWatchTime: 0,
      totalPlays: 0,
      avgWatchTimePerUser: 0,
      avgPlaysPerUser: 0,
      userStats: [],
      topSources: [],
      dailyStats: [],
      registrationStats: {
        todayNewUsers: 0,
        totalRegisteredUsers: 0,
        registrationTrend: [],
      },
      activeUsers: {
        daily: 0,
        weekly: 0,
        monthly: 0,
      },
    };
  }

  /**
   * 计算热门来源
   */
  private static calculateTopSources(userStats: UserPlayStat[]): Array<{ source: string; count: number }> {
    const sourceMap = new Map<string, number>();

    userStats.forEach(user => {
      user.recentRecords.forEach(record => {
        const sourceName = record.source_name || '未知来源';
        const count = sourceMap.get(sourceName) || 0;
        sourceMap.set(sourceName, count + 1);
      });
    });

    return Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * 生成每日统计
   */
  private static generateDailyStats(totalWatchTime: number, totalPlays: number): Array<{ date: string; watchTime: number; plays: number }> {
    const dailyStats = [];
    const now = Date.now();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      dailyStats.push({
        date: date.toISOString().split('T')[0],
        watchTime: Math.floor(totalWatchTime / 7), // 简化计算
        plays: Math.floor(totalPlays / 7),
      });
    }

    return dailyStats;
  }

  /**
   * 计算用户注册统计
   */
  private static calculateRegistrationStats(userStats: UserPlayStat[]): {
    todayNewUsers: number;
    totalRegisteredUsers: number;
    registrationTrend: Array<{ date: string; newUsers: number }>;
  } {
    const now = Date.now();
    const todayStart = new Date(now).setHours(0, 0, 0, 0);
    let todayNewUsers = 0;
    const registrationData: Record<string, number> = {};
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    userStats.forEach(user => {
      const userCreatedAt = user.firstWatchDate || now;
      
      // 统计今日新增用户
      if (userCreatedAt >= todayStart) {
        todayNewUsers++;
      }

      // 统计注册时间分布（近7天）
      if (userCreatedAt >= sevenDaysAgo) {
        const regDate = new Date(userCreatedAt).toISOString().split('T')[0];
        registrationData[regDate] = (registrationData[regDate] || 0) + 1;
      }
    });

    // 生成注册趋势
    const registrationTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      registrationTrend.push({
        date: dateKey,
        newUsers: registrationData[dateKey] || 0,
      });
    }

    return {
      todayNewUsers,
      totalRegisteredUsers: userStats.length,
      registrationTrend,
    };
  }

  /**
   * 计算活跃用户统计
   */
  private static calculateActiveUsers(userStats: UserPlayStat[]): {
    daily: number;
    weekly: number;
    monthly: number;
  } {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    return {
      daily: userStats.filter(user => user.lastPlayTime >= oneDayAgo).length,
      weekly: userStats.filter(user => user.lastPlayTime >= sevenDaysAgo).length,
      monthly: userStats.filter(user => user.lastPlayTime >= thirtyDaysAgo).length,
    };
  }

  /**
   * 计算内容统计
   */
  static calculateContentStats(
    allUsersPlayRecords: Map<string, Record<string, PlayRecord>>,
    limit = 10
  ): ContentStat[] {
    const contentStats: Record<string, {
      source: string;
      id: string;
      title: string;
      source_name: string;
      cover: string;
      year: string;
      playCount: number;
      totalWatchTime: number;
      uniqueUsers: Set<string>;
      lastPlayed: number;
    }> = {};

    // 收集所有播放记录
    allUsersPlayRecords.forEach((playRecords, userName) => {
      Object.entries(playRecords).forEach(([key, record]) => {
        if (!contentStats[key]) {
          const [source, id] = key.split('+', 2);
          contentStats[key] = {
            source: source || '',
            id: id || '',
            title: record.title || '未知标题',
            source_name: record.source_name || '未知来源',
            cover: record.cover || '',
            year: record.year || '',
            playCount: 0,
            totalWatchTime: 0,
            uniqueUsers: new Set(),
            lastPlayed: 0,
          };
        }

        const stat = contentStats[key];
        stat.playCount += 1;
        stat.totalWatchTime += record.play_time || 0;
        stat.uniqueUsers.add(userName);
        if (record.save_time > stat.lastPlayed) {
          stat.lastPlayed = record.save_time;
        }
      });
    });

    // 转换为数组并排序
    return Object.values(contentStats)
      .map((stat) => ({
        source: stat.source,
        id: stat.id,
        title: stat.title,
        source_name: stat.source_name,
        cover: stat.cover,
        year: stat.year,
        playCount: stat.playCount,
        totalWatchTime: stat.totalWatchTime,
        averageWatchTime: stat.playCount > 0 ? stat.totalWatchTime / stat.playCount : 0,
        lastPlayed: stat.lastPlayed,
        uniqueUsers: stat.uniqueUsers.size,
      }))
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, limit);
  }

  /**
   * 计算观看进度统计
   */
  static calculateWatchProgressStats(records: PlayRecord[]): {
    completedCount: number;
    inProgressCount: number;
    notStartedCount: number;
    averageProgress: number;
  } {
    let completedCount = 0;
    let inProgressCount = 0;
    let totalProgress = 0;

    records.forEach(record => {
      const progress = record.total_episodes > 0 
        ? record.index / record.total_episodes 
        : 0;

      totalProgress += progress;

      if (progress >= 0.9) {
        completedCount++;
      } else if (progress > 0) {
        inProgressCount++;
      }
    });

    const notStartedCount = records.length - completedCount - inProgressCount;
    const averageProgress = records.length > 0 ? totalProgress / records.length : 0;

    return {
      completedCount,
      inProgressCount,
      notStartedCount,
      averageProgress,
    };
  }

  /**
   * 计算观看时间分布
   */
  static calculateWatchTimeDistribution(records: PlayRecord[]): {
    short: number; // < 30分钟
    medium: number; // 30分钟 - 2小时
    long: number; // > 2小时
    total: number;
  } {
    const distribution = { short: 0, medium: 0, long: 0, total: 0 };

    records.forEach(record => {
      const watchTime = record.play_time || 0;
      distribution.total += watchTime;

      if (watchTime < 30 * 60) {
        distribution.short += watchTime;
      } else if (watchTime <= 2 * 60 * 60) {
        distribution.medium += watchTime;
      } else {
        distribution.long += watchTime;
      }
    });

    return distribution;
  }

  /**
   * 计算类型偏好统计
   */
  static calculateGenrePreferences(records: PlayRecord[]): Array<{ genre: string; count: number; percentage: number }> {
    const genreMap = new Map<string, number>();

    records.forEach(record => {
      const type = (record as any).type_name || '未知类型';
      genreMap.set(type, (genreMap.get(type) || 0) + 1);
    });

    const total = records.length;
    return Array.from(genreMap.entries())
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }
}