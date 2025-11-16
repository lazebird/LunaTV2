/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */
'use client';

import type { PlayRecord } from '../types';

// 播放记录存储键
const PLAY_RECORDS_KEY = 'lunatv_play_records_v2';

// 生成存储键
export function generateStorageKey(source: string, id: string): string {
  return `${source}+${id}`;
}

// 获取所有播放记录
export async function getAllPlayRecords(): Promise<Record<string, PlayRecord>> {
  try {
    if (typeof window === 'undefined') return {};
    
    const stored = localStorage.getItem(PLAY_RECORDS_KEY);
    if (!stored) return {};
    
    const records = JSON.parse(stored);
    return typeof records === 'object' && records !== null ? records : {};
  } catch (error) {
    console.error('获取播放记录失败:', error);
    return {};
  }
}

// 保存播放记录
export async function savePlayRecord(
  source: string,
  id: string,
  record: Omit<PlayRecord, 'original_episodes'> & { original_episodes?: number }
): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    
    const allRecords = await getAllPlayRecords();
    const key = generateStorageKey(source, id);
    const existingRecord = allRecords[key];
    
    // 如果是首次保存或original_episodes未设置，则设置original_episodes
    if (!existingRecord || record.original_episodes === undefined) {
      record.original_episodes = record.total_episodes;
    }
    
    allRecords[key] = {
      ...record,
      original_episodes: existingRecord?.original_episodes || record.original_episodes,
    };
    
    localStorage.setItem(PLAY_RECORDS_KEY, JSON.stringify(allRecords));
  } catch (error) {
    console.error('保存播放记录失败:', error);
    throw error;
  }
}

// 删除播放记录
export async function deletePlayRecord(source: string, id: string): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    
    const allRecords = await getAllPlayRecords();
    const key = generateStorageKey(source, id);
    
    if (allRecords[key]) {
      delete allRecords[key];
      localStorage.setItem(PLAY_RECORDS_KEY, JSON.stringify(allRecords));
    }
  } catch (error) {
    console.error('删除播放记录失败:', error);
    throw error;
  }
}

// 清空所有播放记录
export async function clearAllPlayRecords(): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(PLAY_RECORDS_KEY);
  } catch (error) {
    console.error('清空播放记录失败:', error);
    throw error;
  }
}

// 获取单个播放记录
export async function getPlayRecord(source: string, id: string): Promise<PlayRecord | null> {
  try {
    const allRecords = await getAllPlayRecords();
    const key = generateStorageKey(source, id);
    return allRecords[key] || null;
  } catch (error) {
    console.error('获取播放记录失败:', error);
    return null;
  }
}

// 检查是否有播放记录
export async function hasPlayRecord(source: string, id: string): Promise<boolean> {
  try {
    const record = await getPlayRecord(source, id);
    return record !== null;
  } catch (error) {
    console.error('检查播放记录失败:', error);
    return false;
  }
}