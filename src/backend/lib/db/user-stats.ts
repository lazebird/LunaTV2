/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */
'use client';

import { UserPlayStat } from '../types';

// 用户统计存储键
const USER_STATS_KEY = 'lunatv_user_stats_v2';

// 获取用户统计
export async function getUserStats(): Promise<UserPlayStat> {
  try {
    if (typeof window === 'undefined') {
      return {
        username: '',
        totalWatchTime: 0,
        totalPlays: 0,
        lastPlayTime: 0,
        recentRecords: [],
        avgWatchTime: 0,
        mostWatchedSource: '',
      };
    }
    
    const stored = localStorage.getItem(USER_STATS_KEY);
    if (!stored) {
      return {
        username: '',
        totalWatchTime: 0,
        totalPlays: 0,
        lastPlayTime: 0,
        recentRecords: [],
        avgWatchTime: 0,
        mostWatchedSource: '',
      };
    }
    
    const stats = JSON.parse(stored);
    return stats;
  } catch (error) {
    console.error('获取用户统计失败:', error);
    return {
      username: '',
      totalWatchTime: 0,
      totalPlays: 0,
      lastPlayTime: 0,
      recentRecords: [],
      avgWatchTime: 0,
      mostWatchedSource: '',
    };
  }
}

// 更新用户统计
export async function updateUserStats(updates: Partial<UserPlayStat>): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    
    const stats = await getUserStats();
    const updatedStats = { ...stats, ...updates };
    
    localStorage.setItem(USER_STATS_KEY, JSON.stringify(updatedStats));
  } catch (error) {
    console.error('更新用户统计失败:', error);
    throw error;
  }
}

// 增加播放时间
export async function addPlayTime(seconds: number): Promise<void> {
  try {
    const stats = await getUserStats();
    await updateUserStats({
      totalWatchTime: stats.totalWatchTime + seconds,
    });
  } catch (error) {
    console.error('增加播放时间失败:', error);
  }
}

// 增加播放次数
export async function addPlayCount(): Promise<void> {
  try {
    const stats = await getUserStats();
    await updateUserStats({
      totalPlays: stats.totalPlays + 1,
    });
  } catch (error) {
    console.error('增加播放次数失败:', error);
  }
}

// 更新最后播放时间
export async function updateLastPlayTime(): Promise<void> {
  try {
    await updateUserStats({
      lastPlayTime: Date.now(),
    });
  } catch (error) {
    console.error('更新最后播放时间失败:', error);
  }
}

// 重置用户统计
export async function resetUserStats(): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    
    await updateUserStats({
      totalWatchTime: 0,
      totalPlays: 0,
      lastPlayTime: 0,
      recentRecords: [],
      avgWatchTime: 0,
      mostWatchedSource: '',
    });
  } catch (error) {
    console.error('重置用户统计失败:', error);
    throw error;
  }
}

// 获取播放统计摘要
export async function getPlayStatsSummary(): Promise<{
  totalWatchTime: string;
  totalPlays: number;
  averageWatchTime: string;
}> {
  try {
    const stats = await getUserStats();
    const hours = Math.floor(stats.totalWatchTime / 3600);
    const minutes = Math.floor((stats.totalWatchTime % 3600) / 60);
    const totalWatchTime = hours > 0 ? `${hours}小时${minutes}分钟` : `${minutes}分钟`;
    
    const averageSeconds = stats.totalPlays > 0 
      ? Math.round(stats.totalWatchTime / stats.totalPlays)
      : 0;
    const avgMinutes = Math.floor(averageSeconds / 60);
    const avgSeconds = averageSeconds % 60;
    const averageWatchTime = avgMinutes > 0 
      ? `${avgMinutes}分${avgSeconds}秒`
      : `${avgSeconds}秒`;
    
    return {
      totalWatchTime,
      totalPlays: stats.totalPlays,
      averageWatchTime,
    };
  } catch (error) {
    console.error('获取播放统计摘要失败:', error);
    return {
      totalWatchTime: '0分钟',
      totalPlays: 0,
      averageWatchTime: '0秒',
    };
  }
}