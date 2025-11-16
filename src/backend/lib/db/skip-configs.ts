/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */
'use client';

import { SkipSegment, EpisodeSkipConfig } from '../types';

// 跳过配置存储键
const SKIP_CONFIGS_KEY = 'lunatv_skip_configs_v2';

// 获取所有跳过配置
export async function getAllSkipConfigs(): Promise<Record<string, EpisodeSkipConfig>> {
  try {
    if (typeof window === 'undefined') return {};
    
    const stored = localStorage.getItem(SKIP_CONFIGS_KEY);
    if (!stored) return {};
    
    const configs = JSON.parse(stored);
    return typeof configs === 'object' && configs !== null ? configs : {};
  } catch (error) {
    console.error('获取跳过配置失败:', error);
    return {};
  }
}

// 保存跳过配置
export async function saveSkipConfig(
  key: string,
  config: EpisodeSkipConfig
): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    
    const allConfigs = await getAllSkipConfigs();
    allConfigs[key] = config;
    
    localStorage.setItem(SKIP_CONFIGS_KEY, JSON.stringify(allConfigs));
  } catch (error) {
    console.error('保存跳过配置失败:', error);
    throw error;
  }
}

// 获取跳过配置
export async function getSkipConfig(key: string): Promise<EpisodeSkipConfig | null> {
  try {
    const allConfigs = await getAllSkipConfigs();
    return allConfigs[key] || null;
  } catch (error) {
    console.error('获取跳过配置失败:', error);
    return null;
  }
}

// 删除跳过配置
export async function deleteSkipConfig(key: string): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    
    const allConfigs = await getAllSkipConfigs();
    
    if (allConfigs[key]) {
      delete allConfigs[key];
      localStorage.setItem(SKIP_CONFIGS_KEY, JSON.stringify(allConfigs));
    }
  } catch (error) {
    console.error('删除跳过配置失败:', error);
    throw error;
  }
}

// 清空所有跳过配置
export async function clearAllSkipConfigs(): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(SKIP_CONFIGS_KEY);
  } catch (error) {
    console.error('清空跳过配置失败:', error);
    throw error;
  }
}

// 添加跳过片段
export async function addSkipSegment(
  configKey: string,
  segment: SkipSegment
): Promise<void> {
  try {
    const config = await getSkipConfig(configKey);
    if (!config) {
      throw new Error('跳过配置不存在');
    }
    
    config.segments.push(segment);
    await saveSkipConfig(configKey, config);
  } catch (error) {
    console.error('添加跳过片段失败:', error);
    throw error;
  }
}

// 删除跳过片段
export async function removeSkipSegment(
  configKey: string,
  segmentIndex: number
): Promise<void> {
  try {
    const config = await getSkipConfig(configKey);
    if (!config) {
      throw new Error('跳过配置不存在');
    }
    
    if (segmentIndex >= 0 && segmentIndex < config.segments.length) {
      config.segments.splice(segmentIndex, 1);
      await saveSkipConfig(configKey, config);
    }
  } catch (error) {
    console.error('删除跳过片段失败:', error);
    throw error;
  }
}

// 更新跳过片段
export async function updateSkipSegment(
  configKey: string,
  segmentIndex: number,
  segment: SkipSegment
): Promise<void> {
  try {
    const config = await getSkipConfig(configKey);
    if (!config) {
      throw new Error('跳过配置不存在');
    }
    
    if (segmentIndex >= 0 && segmentIndex < config.segments.length) {
      config.segments[segmentIndex] = segment;
      await saveSkipConfig(configKey, config);
    }
  } catch (error) {
    console.error('更新跳过片段失败:', error);
    throw error;
  }
}

// 启用/禁用跳过配置
export async function toggleSkipConfig(
  configKey: string,
  enabled: boolean
): Promise<void> {
  try {
    const config = await getSkipConfig(configKey);
    if (!config) {
      throw new Error('跳过配置不存在');
    }
    
    config.enabled = enabled;
    await saveSkipConfig(configKey, config);
  } catch (error) {
    console.error('切换跳过配置失败:', error);
    throw error;
  }
}