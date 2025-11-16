'use client';

import { useRef, useEffect } from 'react';

// 播放器控制Hook
export const usePlayerControls = (
  artPlayerRef: React.MutableRefObject<any>,
  currentEpisodeIndexRef: React.MutableRefObject<number>,
  detailRef: React.MutableRefObject<any>,
  setCurrentEpisodeIndex: (index: number) => void,
  saveCurrentPlayProgress: () => void,
  isSkipControllerTriggeredRef: React.MutableRefObject<boolean>,
  videoEndedHandledRef: React.MutableRefObject<boolean>
) => {
  // 进度条拖拽状态管理
  const isDraggingProgressRef = useRef(false);
  const seekResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // resize事件防抖管理
  const resizeResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------------------------------------
  // 集数切换
  // ---------------------------------------------------------------------------
  // 处理集数切换
  const handleEpisodeChange = (episodeNumber: number) => {
    if (episodeNumber >= 0 && detailRef.current?.episodes && episodeNumber < detailRef.current.episodes.length) {
      // 在更换集数前保存当前播放进度
      if (artPlayerRef.current && artPlayerRef.current.paused) {
        saveCurrentPlayProgress();
      }
      setCurrentEpisodeIndex(episodeNumber);
    }
  };

  const handlePreviousEpisode = () => {
    const d = detailRef.current;
    const idx = currentEpisodeIndexRef.current;
    if (d && d.episodes && idx > 0) {
      if (artPlayerRef.current && !artPlayerRef.current.paused) {
        saveCurrentPlayProgress();
      }
      setCurrentEpisodeIndex(idx - 1);
    }
  };

  const handleNextEpisode = () => {
    const d = detailRef.current;
    const idx = currentEpisodeIndexRef.current;
    if (d && d.episodes && idx < d.episodes.length - 1) {
      // 🔥 关键修复：通过 SkipController 自动跳下一集时，不保存播放进度
      // 因为此时的播放位置是片尾，用户并没有真正看到这个位置
      // 如果保存了片尾的进度，下次"继续观看"会从片尾开始，导致进度错误
      // if (artPlayerRef.current && !artPlayerRef.current.paused) {
      //   saveCurrentPlayProgress();
      // }

      // 🔑 标记通过 SkipController 触发了下一集
      isSkipControllerTriggeredRef.current = true;
      setCurrentEpisodeIndex(idx + 1);
    }
  };

  // ---------------------------------------------------------------------------
  // 键盘快捷键
  // ---------------------------------------------------------------------------
  // 处理全局快捷键
  const handleKeyboardShortcuts = (e: KeyboardEvent) => {
    // 忽略输入框中的按键事件
    if (
      (e.target as HTMLElement).tagName === 'INPUT' ||
      (e.target as HTMLElement).tagName === 'TEXTAREA'
    )
      return;

    // Alt + 左箭头 = 上一集
    if (e.altKey && e.key === 'ArrowLeft') {
      if (detailRef.current && currentEpisodeIndexRef.current > 0) {
        handlePreviousEpisode();
        e.preventDefault();
      }
    }

    // Alt + 右箭头 = 下一集
    if (e.altKey && e.key === 'ArrowRight') {
      const d = detailRef.current;
      const idx = currentEpisodeIndexRef.current;
      if (d && idx < d.episodes.length - 1) {
        handleNextEpisode();
        e.preventDefault();
      }
    }

    // 左箭头 = 快退
    if (!e.altKey && e.key === 'ArrowLeft') {
      if (artPlayerRef.current && artPlayerRef.current.currentTime > 5) {
        artPlayerRef.current.currentTime -= 10;
        e.preventDefault();
      }
    }

    // 右箭头 = 快进
    if (!e.altKey && e.key === 'ArrowRight') {
      if (
        artPlayerRef.current &&
        artPlayerRef.current.currentTime < artPlayerRef.current.duration - 5
      ) {
        artPlayerRef.current.currentTime += 10;
        e.preventDefault();
      }
    }

    // 上箭头 = 音量+
    if (e.key === 'ArrowUp') {
      if (artPlayerRef.current && artPlayerRef.current.volume < 1) {
        artPlayerRef.current.volume =
          Math.round((artPlayerRef.current.volume + 0.1) * 10) / 10;
        artPlayerRef.current.notice.show = `音量: ${Math.round(
          artPlayerRef.current.volume * 100
        )}`;
        e.preventDefault();
      }
    }

    // 下箭头 = 音量-
    if (e.key === 'ArrowDown') {
      if (artPlayerRef.current && artPlayerRef.current.volume > 0) {
        artPlayerRef.current.volume =
          Math.round((artPlayerRef.current.volume - 0.1) * 10) / 10;
        artPlayerRef.current.notice.show = `音量: ${Math.round(
          artPlayerRef.current.volume * 100
        )}`;
        e.preventDefault();
      }
    }

    // 空格 = 播放/暂停
    if (e.key === ' ') {
      if (artPlayerRef.current) {
        artPlayerRef.current.toggle();
        e.preventDefault();
      }
    }

    // f 键 = 切换全屏
    if (e.key === 'f' || e.key === 'F') {
      if (artPlayerRef.current) {
        artPlayerRef.current.fullscreen = !artPlayerRef.current.fullscreen;
        e.preventDefault();
      }
    }
  };

  // 注册键盘快捷键
  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, []);

  // 设置播放器事件监听器
  const setupPlayerEventListeners = () => {
    if (!artPlayerRef.current) return;

    // 监听播放进度跳转，优化弹幕重置（减少闪烁）
    artPlayerRef.current.on('seek', () => {
      if (artPlayerRef.current?.plugins?.artplayerPluginDanmuku) {
        // 清除之前的重置计时器
        if (seekResetTimeoutRef.current) {
          clearTimeout(seekResetTimeoutRef.current);
        }
        
        // 增加延迟并只在非拖拽状态下重置，减少快进时的闪烁
        seekResetTimeoutRef.current = setTimeout(() => {
          if (!isDraggingProgressRef.current && artPlayerRef.current?.plugins?.artplayerPluginDanmuku && !artPlayerRef.current.seeking) {
            artPlayerRef.current.plugins.artplayerPluginDanmuku.reset();
            console.log('进度跳转，弹幕已重置');
          }
        }, 500); // 增加到500ms延迟，减少频繁重置导致的闪烁
      }
    });

    // 监听拖拽状态 - v5.2.0优化: 在拖拽期间暂停弹幕更新以减少闪烁
    artPlayerRef.current.on('video:seeking', () => {
      isDraggingProgressRef.current = true;
      // v5.2.0新增: 拖拽时隐藏弹幕，减少CPU占用和闪烁
      // 只有在外部弹幕开启且当前显示时才隐藏
      if (artPlayerRef.current?.plugins?.artplayerPluginDanmuku && 
          !artPlayerRef.current.plugins.artplayerPluginDanmuku.isHide) {
        artPlayerRef.current.plugins.artplayerPluginDanmuku.hide();
      }
    });

    artPlayerRef.current.on('video:seeked', () => {
      isDraggingProgressRef.current = false;
      // v5.2.0优化: 拖拽结束后根据外部弹幕开关状态决定是否恢复弹幕显示
      if (artPlayerRef.current?.plugins?.artplayerPluginDanmuku) {
        // 只有在外部弹幕开启时才恢复显示
        if (localStorage.getItem('enable_external_danmu') === 'true') {
          artPlayerRef.current.plugins.artplayerPluginDanmuku.show(); // 先恢复显示
          setTimeout(() => {
            // 延迟重置以确保播放状态稳定
            if (artPlayerRef.current?.plugins?.artplayerPluginDanmuku) {
              artPlayerRef.current.plugins.artplayerPluginDanmuku.reset();
              console.log('拖拽结束，弹幕已重置');
            }
          }, 100);
        } else {
          // 外部弹幕关闭时，确保保持隐藏状态
          artPlayerRef.current.plugins.artplayerPluginDanmuku.hide();
          console.log('拖拽结束，外部弹幕已关闭，保持隐藏状态');
        }
      }
    });

    // 监听播放器窗口尺寸变化，触发弹幕重置（双重保障）
    artPlayerRef.current.on('resize', () => {
      // 清除之前的重置计时器
      if (resizeResetTimeoutRef.current) {
        clearTimeout(resizeResetTimeoutRef.current);
      }
      
      // 延迟重置弹幕，避免连续触发（全屏切换优化）
      resizeResetTimeoutRef.current = setTimeout(() => {
        if (artPlayerRef.current?.plugins?.artplayerPluginDanmuku) {
          artPlayerRef.current.plugins.artplayerPluginDanmuku.reset();
          console.log('窗口尺寸变化，弹幕已重置（防抖优化）');
        }
      }, 300); // 300ms防抖，减少全屏切换时的卡顿
    });

    // 监听视频播放结束事件，自动播放下一集
    artPlayerRef.current.on('video:ended', () => {
      const idx = currentEpisodeIndexRef.current;

      // 🔥 关键修复：首先检查这个 video:ended 事件是否已经被处理过
      if (videoEndedHandledRef.current) {
        return;
      }

      // 🔑 检查是否已经通过 SkipController 触发了下一集，避免重复触发
      if (isSkipControllerTriggeredRef.current) {
        videoEndedHandledRef.current = true;
        // 🔥 关键修复：延迟重置标志，等待新集数开始加载
        setTimeout(() => {
          isSkipControllerTriggeredRef.current = false;
        }, 2000);
        return;
      }

      const d = detailRef.current;
      if (d && d.episodes && idx < d.episodes.length - 1) {
        videoEndedHandledRef.current = true;
        setTimeout(() => {
          setCurrentEpisodeIndex(idx + 1);
        }, 1000);
      }
    });
  };

  // 清理定时器
  const cleanupPlayerTimers = () => {
    if (seekResetTimeoutRef.current) {
      clearTimeout(seekResetTimeoutRef.current);
    }
    
    if (resizeResetTimeoutRef.current) {
      clearTimeout(resizeResetTimeoutRef.current);
    }
  };

  return {
    handleEpisodeChange,
    handlePreviousEpisode,
    handleNextEpisode,
    setupPlayerEventListeners,
    cleanupPlayerTimers,
    isDraggingProgressRef,
  };
};