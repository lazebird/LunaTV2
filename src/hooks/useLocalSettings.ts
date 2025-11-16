'use client';

import { useState, useEffect } from 'react';

export interface LocalSettings {
  doubanProxyType: 'direct' | 'server';
  doubanImageProxyType: 'direct' | 'server';
  aggregateSearch: boolean;
  speedTest: boolean;
  fluidSearch: boolean;
  iptvDirectConnection: boolean;
  skipIntroOutro: boolean;
  autoPlayNext: boolean;
  continueWatchingFilter: boolean;
}

export const DEFAULT_SETTINGS: LocalSettings = {
  doubanProxyType: 'direct',
  doubanImageProxyType: 'direct',
  aggregateSearch: true,
  speedTest: false,
  fluidSearch: true,
  iptvDirectConnection: false,
  skipIntroOutro: false,
  autoPlayNext: true,
  continueWatchingFilter: false,
};

// 设置键名映射
const SETTINGS_KEY_MAP = {
  doubanProxyType: 'doubanDataSource',
  doubanImageProxyType: 'doubanImageProxyType',
  aggregateSearch: 'defaultAggregateSearch',
  speedTest: 'speedTest',
  fluidSearch: 'fluidSearch',
  iptvDirectConnection: 'iptvDirectConnection',
  skipIntroOutro: 'enableAutoSkip',
  autoPlayNext: 'enableAutoNextEpisode',
  continueWatchingFilter: 'continueWatchingFilter',
} as const;

export function useLocalSettings() {
  const [settings, setSettings] = useState<LocalSettings>(DEFAULT_SETTINGS);

  // 加载设置
  const loadSettings = () => {
    // 从localStorage加载设置，优先从统一设置中读取，如果没有则从各个独立键名读取
    const savedSettings = localStorage.getItem('localSettings');
    let loadedSettings = { ...DEFAULT_SETTINGS };
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        loadedSettings = { ...DEFAULT_SETTINGS, ...parsed };
      } catch (error) {
        console.error('解析本地设置失败:', error);
      }
    } else {
      // 如果没有统一设置，从各个独立键名读取
      try {
        Object.entries(SETTINGS_KEY_MAP).forEach(([key, storageKey]) => {
          const value = localStorage.getItem(storageKey);
          if (value !== null) {
            if (typeof DEFAULT_SETTINGS[key as keyof LocalSettings] === 'boolean') {
              (loadedSettings as any)[key] = JSON.parse(value);
            } else {
              (loadedSettings as any)[key] = value;
            }
          }
        });
      } catch (error) {
        console.error('加载独立设置失败:', error);
      }
    }
    
    setSettings(loadedSettings);
    return loadedSettings;
  };

  // 保存设置
  const saveSettings = (newSettings: LocalSettings) => {
    setSettings(newSettings);
    
    // 保存到统一的本地设置
    localStorage.setItem('localSettings', JSON.stringify(newSettings));
    
    // 同时保存到各个组件使用的独立键名，确保兼容性
    Object.entries(SETTINGS_KEY_MAP).forEach(([key, storageKey]) => {
      const value = (newSettings as any)[key];
      if (typeof value === 'boolean') {
        localStorage.setItem(storageKey, JSON.stringify(value));
      } else {
        localStorage.setItem(storageKey, value);
      }
    });
    
    // 触发通知事件
    notifySettingsChanged(newSettings);
  };

  // 更新单个设置项
  const updateSetting = <K extends keyof LocalSettings>(
    key: K,
    value: LocalSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  // 重置为默认设置
  const resetToDefault = () => {
    saveSettings(DEFAULT_SETTINGS);
  };

  // 通知设置变更
  const notifySettingsChanged = (newSettings: LocalSettings) => {
    // 触发自定义事件，通知其他组件设置已更改
    window.dispatchEvent(new CustomEvent('localStorageChanged', {
      detail: { key: 'localSettings', value: newSettings }
    }));
    
    // 同时触发各个独立键名的storage事件，确保其他组件能够响应
    Object.entries(SETTINGS_KEY_MAP).forEach(([key, storageKey]) => {
      const oldValue = (settings as any)[key];
      const newValue = (newSettings as any)[key];
      
      if (typeof newValue === 'boolean') {
        window.dispatchEvent(new StorageEvent('storage', {
          key: storageKey,
          newValue: JSON.stringify(newValue),
          oldValue: JSON.stringify(oldValue),
          storageArea: localStorage
        }));
      } else {
        window.dispatchEvent(new StorageEvent('storage', {
          key: storageKey,
          newValue: newValue,
          oldValue: oldValue,
          storageArea: localStorage
        }));
      }
    });
  };

  // 初始化时加载设置
  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    loadSettings,
    saveSettings,
    updateSetting,
    resetToDefault,
  };
}