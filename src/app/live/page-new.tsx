'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import PageLayout from '@/frontend/components/PageLayout';
import { useLivePlayer } from './hooks/useLivePlayer';
import { useLiveChannels } from './hooks/useLiveChannels';
import { ChannelList } from './components/ChannelList';
import { PlayerControls } from './components/PlayerControls';
import { ChannelFilter } from './components/ChannelFilter';
import { EpgProgram } from './components/EpgProgram';
import { LiveChannel, EpgProgram as EpgProgramType } from './types';

export default function LivePage() {
  const router = useRouter();
  const [selectedChannel, setSelectedChannel] = useState<LiveChannel | undefined>();
  const [currentProgram, setCurrentProgram] = useState<EpgProgramType | null>(null);
  const [nextProgram, setNextProgram] = useState<EpgProgramType | null>(null);
  const [epgPrograms, setEpgPrograms] = useState<EpgProgramType[]>([]);

  // 使用自定义hooks
  const {
    videoRef,
    state,
    error,
    qualityLevels,
    currentQuality,
    initializePlayer,
    togglePlay,
    setVolume,
    toggleMute,
    setQuality,
    toggleFullscreen,
    seekTo,
  } = useLivePlayer();

  const {
    channels,
    favorites,
    groups,
    isLoading,
    error: channelsError,
    filter,
    toggleFavorite,
    searchChannels,
    filterByGroup,
    toggleSort,
    toggleSortOrder,
    isFavorited,
  } = useLiveChannels();

  // 处理频道选择
  const handleChannelSelect = (channel: LiveChannel) => {
    setSelectedChannel(channel);
    initializePlayer(channel.url);
    loadEpgPrograms(channel);
  };

  // 加载EPG节目单
  const loadEpgPrograms = async (channel: LiveChannel) => {
    try {
      const response = await fetch(`/api/live/epg?channel=${channel.id}`);
      if (response.ok) {
        const programs = await response.json();
        setEpgPrograms(programs);
        
        // 更新当前和下一个节目
        const now = Date.now();
        const current = programs.find(
          (p: EpgProgramType) => p.start <= now && p.stop > now
        );
        const next = programs
          .filter((p: EpgProgramType) => p.start > now)
          .sort((a: EpgProgramType, b: EpgProgramType) => a.start - b.start)[0];
        
        setCurrentProgram(current || null);
        setNextProgram(next || null);
      }
    } catch (err) {
      console.error('加载EPG失败:', err);
    }
  };

  // 自动刷新当前节目
  useEffect(() => {
    if (!selectedChannel) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const current = epgPrograms.find(
        (p) => p.start <= now && p.stop > now
      );
      const next = epgPrograms
        .filter((p) => p.start > now)
        .sort((a, b) => a.start - b.start)[0];

      setCurrentProgram(current || null);
      setNextProgram(next || null);
    }, 10000); // 每10秒更新一次

    return () => clearInterval(interval);
  }, [selectedChannel, epgPrograms]);

  return (
    <PageLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* 左侧频道列表 */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          {/* 过滤器 */}
          <div className="flex-shrink-0 p-4">
            <ChannelFilter
              filter={filter}
              groups={groups}
              onSearchChange={searchChannels}
              onGroupChange={filterByGroup}
              onSortToggle={toggleSort}
              onSortOrderToggle={toggleSortOrder}
            />
          </div>

          {/* 频道列表 */}
          <div className="flex-1 overflow-y-auto">
            <ChannelList
              channels={channels}
              favorites={favorites}
              selectedChannel={selectedChannel}
              onChannelSelect={handleChannelSelect}
              onToggleFavorite={toggleFavorite}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* 右侧播放器 */}
        <div className="flex-1 flex flex-col bg-black">
          {selectedChannel ? (
            <>
              {/* 视频播放器 */}
              <div className="flex-1 relative">
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  playsInline
                  controls={false}
                />
                
                {/* 播放器控制 */}
                <PlayerControls
                  state={state}
                  qualityLevels={qualityLevels}
                  currentQuality={currentQuality}
                  onTogglePlay={togglePlay}
                  onToggleMute={toggleMute}
                  onSetVolume={setVolume}
                  onSetQuality={setQuality}
                  onToggleFullscreen={toggleFullscreen}
                  onSeek={seekTo}
                  channelName={selectedChannel.name}
                />

                {/* 错误提示 */}
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center text-white">
                      <p className="text-lg font-medium mb-2">播放出错</p>
                      <p className="text-sm opacity-80">{error}</p>
                      <button
                        onClick={() => handleChannelSelect(selectedChannel)}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        重试
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 底部信息栏 */}
              <div className="h-48 bg-gray-900 p-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {/* EPG节目信息 */}
                  <div>
                    <EpgProgram
                      program={currentProgram}
                      nextProgram={nextProgram}
                    />
                  </div>

                  {/* 频道信息 */}
                  <div className="text-white">
                    <h3 className="font-medium mb-2">{selectedChannel.name}</h3>
                    <p className="text-sm text-gray-400 mb-1">{selectedChannel.group}</p>
                    {selectedChannel.logo && (
                      <img
                        src={selectedChannel.logo}
                        alt={selectedChannel.name}
                        className="w-16 h-16 rounded object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* 默认提示 */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <p className="text-lg mb-2">请选择一个频道开始观看</p>
                {channelsError && (
                  <p className="text-sm text-red-400">{channelsError}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}