'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface LocalSettings {
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

const DEFAULT_SETTINGS: LocalSettings = {
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

interface LocalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocalSettingsModal({ isOpen, onClose }: LocalSettingsModalProps) {
  const [settings, setSettings] = useState<LocalSettings>(DEFAULT_SETTINGS);

  // Load settings when modal opens
  useState(() => {
    if (isOpen) {
      loadSettings();
    }
  });

  const loadSettings = () => {
    // Load from localStorage
    const savedSettings = localStorage.getItem('localSettings');
    let loadedSettings = { ...DEFAULT_SETTINGS };
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        loadedSettings = { ...DEFAULT_SETTINGS, ...parsed };
      } catch (error) {
        console.error('Failed to parse local settings:', error);
      }
    } else {
      // Try to load from individual keys
      try {
        const doubanDataSource = localStorage.getItem('doubanDataSource');
        const doubanImageProxyType = localStorage.getItem('doubanImageProxyType');
        const defaultAggregateSearch = localStorage.getItem('defaultAggregateSearch');
        const speedTest = localStorage.getItem('speedTest');
        const fluidSearch = localStorage.getItem('fluidSearch');
        const iptvDirectConnection = localStorage.getItem('iptvDirectConnection');
        const enableAutoSkip = localStorage.getItem('enableAutoSkip');
        const enableAutoNextEpisode = localStorage.getItem('enableAutoNextEpisode');
        const continueWatchingFilter = localStorage.getItem('continueWatchingFilter');
        
        if (doubanDataSource) loadedSettings.doubanProxyType = doubanDataSource as any;
        if (doubanImageProxyType) loadedSettings.doubanImageProxyType = doubanImageProxyType as any;
        if (defaultAggregateSearch) loadedSettings.aggregateSearch = JSON.parse(defaultAggregateSearch);
        if (speedTest) loadedSettings.speedTest = JSON.parse(speedTest);
        if (fluidSearch) loadedSettings.fluidSearch = JSON.parse(fluidSearch);
        if (iptvDirectConnection) loadedSettings.iptvDirectConnection = JSON.parse(iptvDirectConnection);
        if (enableAutoSkip) loadedSettings.skipIntroOutro = JSON.parse(enableAutoSkip);
        if (enableAutoNextEpisode) loadedSettings.autoPlayNext = JSON.parse(enableAutoNextEpisode);
        if (continueWatchingFilter) loadedSettings.continueWatchingFilter = JSON.parse(continueWatchingFilter);
      } catch (error) {
        console.error('Failed to load individual settings:', error);
      }
    }
    
    setSettings(loadedSettings);
  };

  const saveSettings = (newSettings: LocalSettings) => {
    setSettings(newSettings);
    
    // Save to unified local settings
    localStorage.setItem('localSettings', JSON.stringify(newSettings));
    
    // Also save to individual keys for compatibility
    localStorage.setItem('doubanDataSource', newSettings.doubanProxyType);
    localStorage.setItem('doubanImageProxyType', newSettings.doubanImageProxyType);
    localStorage.setItem('defaultAggregateSearch', JSON.stringify(newSettings.aggregateSearch));
    localStorage.setItem('speedTest', JSON.stringify(newSettings.speedTest));
    localStorage.setItem('fluidSearch', JSON.stringify(newSettings.fluidSearch));
    localStorage.setItem('iptvDirectConnection', JSON.stringify(newSettings.iptvDirectConnection));
    localStorage.setItem('enableAutoSkip', JSON.stringify(newSettings.skipIntroOutro));
    localStorage.setItem('enableAutoNextEpisode', JSON.stringify(newSettings.autoPlayNext));
    localStorage.setItem('continueWatchingFilter', JSON.stringify(newSettings.continueWatchingFilter));
    
    // Trigger custom event
    window.dispatchEvent(new CustomEvent('localStorageChanged', {
      detail: { key: 'localSettings', value: newSettings }
    }));
  };

  const updateSetting = <K extends keyof LocalSettings>(
    key: K,
    value: LocalSettings[K]
  ) => {
    saveSettings({ ...settings, [key]: value });
  };

  const resetToDefault = () => {
    saveSettings(DEFAULT_SETTINGS);
  };

  const doubanProxyOptions = [
    { value: 'direct', label: '直连（浏览器直接请求豆瓣）' },
    { value: 'server', label: '代理（通过服务器请求豆瓣）' },
  ];

  const doubanImageProxyOptions = [
    { value: 'direct', label: '直连（浏览器直接请求豆瓣）' },
    { value: 'server', label: '代理（通过服务器请求豆瓣）' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* 设置面板 */}
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] my-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  本地设置
                </h3>
                <button
                  onClick={resetToDefault}
                  className="px-2 py-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="重置为默认设置"
                >
                  恢复默认
                </button>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 p-1 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-full h-full" />
              </button>
            </div>

            <div className="space-y-6">
              {/* 豆瓣数据代理设置 */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    豆瓣数据代理
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    选择获取豆瓣数据的方式
                  </p>
                </div>
                <div className="relative">
                  <select
                    value={settings.doubanProxyType}
                    onChange={(e) => updateSetting('doubanProxyType', e.target.value as 'direct' | 'server')}
                    className="w-full px-3 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm hover:border-gray-400 dark:hover:border-gray-500 appearance-none"
                  >
                    {doubanProxyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 text-gray-400 dark:text-gray-500"
                    >
                      <path d="m6 9 6 6 6-6"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700"></div>

              {/* 豆瓣图片代理设置 */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    豆瓣图片代理
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    选择获取豆瓣图片的方式
                  </p>
                </div>
                <div className="relative">
                  <select
                    value={settings.doubanImageProxyType}
                    onChange={(e) => updateSetting('doubanImageProxyType', e.target.value as 'direct' | 'server')}
                    className="w-full px-3 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm hover:border-gray-400 dark:hover:border-gray-500 appearance-none"
                  >
                    {doubanImageProxyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 text-gray-400 dark:text-gray-500"
                    >
                      <path d="m6 9 6 6 6-6"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700"></div>

              {/* 默认聚合搜索结果 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    默认聚合搜索结果
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    搜索时默认按标题和年份聚合显示结果
                  </p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.aggregateSearch}
                      onChange={(e) => updateSetting('aggregateSearch', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600"></div>
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>

              {/* 优选和测速 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    优选和测速
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    如出现播放器劫持问题可关闭
                  </p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.speedTest}
                      onChange={(e) => updateSetting('speedTest', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600"></div>
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>

              {/* 流式搜索输出 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    流式搜索输出
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    启用搜索结果实时流式输出，关闭后使用传统一次性搜索
                  </p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.fluidSearch}
                      onChange={(e) => updateSetting('fluidSearch', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600"></div>
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>

              {/* IPTV 视频浏览器直连 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    IPTV 视频浏览器直连
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    开启 IPTV 视频浏览器直连时，需要自备 Allow CORS 插件
                  </p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.iptvDirectConnection}
                      onChange={(e) => updateSetting('iptvDirectConnection', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600"></div>
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700"></div>

              {/* 跳过片头片尾设置 */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    跳过片头片尾设置
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    控制播放器默认的片头片尾跳过行为
                  </p>
                </div>
                
                {/* 启用自动跳过 */}
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      启用自动跳过
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      开启后将自动跳过片头片尾，关闭则显示手动跳过按钮
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.skipIntroOutro}
                        onChange={(e) => updateSetting('skipIntroOutro', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600"></div>
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </div>
                  </label>
                </div>

                {/* 片尾自动播放下一集 */}
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      片尾自动播放下一集
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      开启后片尾结束时自动跳转到下一集
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.autoPlayNext}
                        onChange={(e) => updateSetting('autoPlayNext', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600"></div>
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </div>
                  </label>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  这些设置会作为新视频的默认配置。对于已配置的视频，请在播放页面的"跳过设置"中单独调整。
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700"></div>

              {/* 继续观看进度筛选 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      继续观看进度筛选
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      是否启用"继续观看"的播放进度筛选功能
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.continueWatchingFilter}
                        onChange={(e) => updateSetting('continueWatchingFilter', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors dark:bg-gray-600"></div>
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </div>
                  </label>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                  筛选已关闭：将显示所有播放时间超过2分钟的内容
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                这些设置保存在本地浏览器中
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}