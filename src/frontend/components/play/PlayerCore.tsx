'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import artplayerPluginChromecast from '@/frontend/lib/artplayer-plugin-chromecast';

// Wake Lock API 类型声明
interface WakeLockSentinel {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
  removeEventListener(type: 'release', listener: () => void): void;
}

// 播放器核心Hook
export const usePlayerCore = (
  Hls: any,
  videoUrl: string,
  loading: boolean,
  blockAdEnabled: boolean,
  blockAdEnabledRef: React.MutableRefObject<boolean>,
  videoTitle: string,
  videoCover: string,
  currentEpisodeIndex: number,
  detail: any,
  totalEpisodes: number,
  resumeTimeRef: React.MutableRefObject<number | null>,
  lastVolumeRef: React.MutableRefObject<number>,
  lastPlaybackRateRef: React.MutableRefObject<number>,
  setError: (error: string | null) => void,
  setIsVideoLoading: (loading: boolean) => void,
  loadExternalDanmu: () => Promise<any[]>,
  externalDanmuEnabledRef: React.MutableRefObject<boolean>,
  isEpisodeChangingRef: React.MutableRefObject<boolean>,
  requestWakeLock: () => Promise<void>,
  releaseWakeLock: () => Promise<void>,
  saveCurrentPlayProgress: () => void,
  videoEndedHandledRef: React.MutableRefObject<boolean>,
  setCurrentPlayTime: (time: number) => void,
  setVideoDuration: (duration: number) => void,
  cleanupPlayer: () => void
) => {
  const artPlayerRef = useRef<any>(null);
  const artRef = useRef<HTMLDivElement | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const lastSaveTimeRef = useRef<number>(0);

  // 检测移动设备（在组件层级定义）- 参考ArtPlayer compatibility.js
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOSGlobal = /iPad|iPhone|iPod/i.test(userAgent) && !(window as any).MSStream;
  const isIOS13Global = isIOSGlobal || (userAgent.includes('Macintosh') && navigator.maxTouchPoints >= 1);
  const isMobileGlobal = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || isIOS13Global;
  const isSafari = /^(?:(?!chrome|android).)*safari/i.test(userAgent);
  const isIOS = isIOSGlobal;
  const isIOS13 = isIOS13Global;
  const isMobile = isMobileGlobal;
  const isWebKit = isSafari || isIOS;
  
  // Chrome浏览器检测 - 只有真正的Chrome才支持Chromecast
  const isChrome = /Chrome/i.test(userAgent) && 
                  !/Edg/i.test(userAgent) &&      // 排除Edge
                  !/OPR/i.test(userAgent) &&      // 排除Opera
                  !/SamsungBrowser/i.test(userAgent) && // 排除三星浏览器
                  !/OPPO/i.test(userAgent) &&     // 排除OPPO浏览器
                  !/OppoBrowser/i.test(userAgent) && // 排除OppoBrowser
                  !/HeyTapBrowser/i.test(userAgent) && // 排除HeyTapBrowser (OPPO新版浏览器)
                  !/OnePlus/i.test(userAgent) &&  // 排除OnePlus浏览器
                  !/Xiaomi/i.test(userAgent) &&   // 排除小米浏览器
                  !/MIUI/i.test(userAgent) &&     // 排除MIUI浏览器
                  !/Huawei/i.test(userAgent) &&   // 排除华为浏览器
                  !/Vivo/i.test(userAgent) &&     // 排除Vivo浏览器
                  !/UCBrowser/i.test(userAgent) && // 排除UC浏览器
                  !/QQBrowser/i.test(userAgent) && // 排除QQ浏览器
                  !/Baidu/i.test(userAgent) &&    // 排除百度浏览器
                  !/SogouMobileBrowser/i.test(userAgent); // 排除搜狗浏览器

  // 去广告相关函数
  function filterAdsFromM3U8(m3u8Content: string): string {
    if (!m3u8Content) return '';

    // 按行分割M3U8内容
    const lines = m3u8Content.split('\n');
    const filteredLines = [];
    let inAdBlock = false; // 是否在广告区块内
    let adSegmentCount = 0; // 统计移除的广告片段数量

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 🎯 增强功能1: 检测行业标准广告标记（SCTE-35系列）
      if (line.includes('#EXT-X-CUE-OUT') ||
          (line.includes('#EXT-X-DATERANGE') && line.includes('SCTE35')) ||
          line.includes('#EXT-X-SCTE35') ||
          line.includes('#EXT-OATCLS-SCTE35')) {
        inAdBlock = true;
        adSegmentCount++;
        continue; // 跳过广告开始标记
      }

      // 🎯 增强功能2: 检测广告结束标记
      if (line.includes('#EXT-X-CUE-IN')) {
        inAdBlock = false;
        continue; // 跳过广告结束标记
      }

      // 🎯 增强功能3: 如果在广告区块内，跳过所有内容
      if (inAdBlock) {
        continue;
      }

      // ✅ 原始逻辑保留: 过滤#EXT-X-DISCONTINUITY标识
      if (!line.includes('#EXT-X-DISCONTINUITY')) {
        filteredLines.push(line);
      }
    }

    // 输出统计信息
    if (adSegmentCount > 0) {
      console.log(`✅ M3U8广告过滤: 移除 ${adSegmentCount} 个广告片段`);
    }

    return filteredLines.join('\n');
  }

  class CustomHlsJsLoader extends Hls.DefaultConfig.loader {
    constructor(config: any) {
      super(config);
      const load = this.load.bind(this);
      this.load = function (context: any, config: any, callbacks: any) {
        // 拦截manifest和level请求
        if (
          (context as any).type === 'manifest' ||
          (context as any).type === 'level'
        ) {
          const onSuccess = callbacks.onSuccess;
          callbacks.onSuccess = function (
            response: any,
            stats: any,
            context: any
          ) {
            // 如果是m3u8文件，处理内容以移除广告分段
            if (response.data && typeof response.data === 'string') {
              // 过滤掉广告段 - 实现更精确的广告过滤逻辑
              response.data = filterAdsFromM3U8(response.data);
            }
            return onSuccess(response, stats, context, null);
          };
        }
        // 执行原始load方法
        load(context, config, callbacks);
      };
    }
  }

  // 更新视频地址
  const ensureVideoSource = (video: HTMLVideoElement | null, url: string) => {
    if (!video || !url) return;
    const sources = Array.from(video.getElementsByTagName('source'));
    const existed = sources.some((s) => s.src === url);
    if (!existed) {
      // 移除旧的 source，保持唯一
      sources.forEach((s) => s.remove());
      const sourceEl = document.createElement('source');
      sourceEl.src = url;
      video.appendChild(sourceEl);
    }

    // 始终允许远程播放（AirPlay / Cast）
    video.disableRemotePlayback = false;
    // 如果曾经有禁用属性，移除之
    if (video.hasAttribute('disableRemotePlayback')) {
      video.removeAttribute('disableRemotePlayback');
    }
  };

  // 内部 Wake Lock 函数（避免与传入参数冲突）
  const internalRequestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request(
          'screen'
        );
        console.log('Wake Lock 已启用');
      }
    } catch (err) {
      console.warn('Wake Lock 请求失败:', err);
    }
  };

  const internalReleaseWakeLock = async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Wake Lock 已释放');
      }
    } catch (err) {
      console.warn('Wake Lock 释放失败:', err);
    }
  };

  // 初始化播放器
  useEffect(() => {
    // 异步初始化播放器，避免SSR问题
    const initPlayer = async () => {
      if (
        !Hls ||
        !videoUrl ||
        loading ||
        currentEpisodeIndex === null ||
        !artRef.current
      ) {
        return;
      }

    // 确保选集索引有效
    if (
      !detail ||
      !detail.episodes ||
      currentEpisodeIndex >= detail.episodes.length ||
      currentEpisodeIndex < 0
    ) {
      setError(`选集索引无效，当前共 ${totalEpisodes} 集`);
      return;
    }

    if (!videoUrl) {
      setError('视频地址无效');
      return;
    }
    console.log(videoUrl);

    // 调试信息：输出设备检测结果和投屏策略
    console.log('🔍 设备检测结果:', {
      userAgent,
      isIOS,
      isSafari,
      isMobile,
      isWebKit,
      isChrome,
      'AirPlay按钮': isIOS || isSafari ? '✅ 显示' : '❌ 隐藏',
      'Chromecast按钮': isChrome && !isIOS ? '✅ 显示' : '❌ 隐藏',
      '投屏策略': isIOS || isSafari ? '🍎 AirPlay (WebKit)' : isChrome ? '📺 Chromecast (Cast API)' : '❌ 不支持投屏'
    });

    if (artPlayerRef.current && !loading) {
      try {
        // 🚀 关键修复：区分换源和切换集数
        const isEpisodeChange = isEpisodeChangingRef.current;
        const currentTime = artPlayerRef.current.currentTime || 0;

        let switchPromise: Promise<any>;
        if (isEpisodeChange) {
          console.log(`🎯 开始切换集数: ${videoUrl} (重置播放时间到0)`);
          // 切换集数时重置播放时间到0
          switchPromise = artPlayerRef.current.switchUrl(videoUrl);
        } else {
          console.log(`🎯 开始切换源: ${videoUrl} (保持进度: ${currentTime.toFixed(2)}s)`);
          // 换源时保持播放进度
          switchPromise = artPlayerRef.current.switchQuality(videoUrl);
        }

        // 创建切换Promise
        switchPromise = switchPromise.then(() => {
          artPlayerRef.current.title = `${videoTitle} - 第${currentEpisodeIndex + 1}集`;
          artPlayerRef.current.poster = videoCover;
          console.log('✅ 源切换完成');

          // 🔥 重置集数切换标识
          if (isEpisodeChange) {
            // 🔑 关键修复：切换集数后显式重置播放时间为 0，确保片头自动跳过能触发
            artPlayerRef.current.currentTime = 0;
            console.log('🎯 集数切换完成，重置播放时间为 0');
            isEpisodeChangingRef.current = false;
          }
        }).catch((error: any) => {
          console.warn('⚠️ 源切换失败，将重建播放器:', error);
          // 重置集数切换标识
          if (isEpisodeChange) {
            isEpisodeChangingRef.current = false;
          }
          throw error; // 让外层catch处理
        });

        await switchPromise;
        
        if (artPlayerRef.current?.video) {
          ensureVideoSource(
            artPlayerRef.current.video as HTMLVideoElement,
            videoUrl
          );
        }
        
        console.log('使用switch方法成功切换视频');
        return;
      } catch (error) {
        console.warn('Switch方法失败，将重建播放器:', error);
        // 重置集数切换标识
        isEpisodeChangingRef.current = false;
        // 如果switch失败，清理播放器并重新创建
        cleanupPlayer();
      }
    }
    if (artPlayerRef.current) {
      cleanupPlayer();
    }

    // 确保 DOM 容器完全清空，避免多实例冲突
    if (artRef.current) {
      artRef.current.innerHTML = '';
    }

    try {
      // 使用动态导入的 Artplayer
      const Artplayer = (window as any).DynamicArtplayer;
      const artplayerPluginDanmuku = (window as any).DynamicArtplayerPluginDanmuku;
      
      // 创建新的播放器实例
      Artplayer.PLAYBACK_RATE = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
      Artplayer.USE_RAF = false;
      Artplayer.FULLSCREEN_WEB_IN_BODY = true;
      // 重新启用5.3.0内存优化功能，但使用false参数避免清空DOM
      Artplayer.REMOVE_SRC_WHEN_DESTROY = true;

      artPlayerRef.current = new Artplayer({
        container: artRef.current,
        url: videoUrl,
        poster: videoCover,
        volume: 0.7,
        isLive: false,
        // iOS设备需要静音才能自动播放，参考ArtPlayer源码处理
        muted: isIOS || isSafari,
        autoplay: true,
        pip: true,
        autoSize: false,
        autoMini: false,
        screenshot: false,
        setting: true,
        loop: false,
        flip: false,
        playbackRate: true,
        aspectRatio: false,
        fullscreen: true,
        fullscreenWeb: true,
        subtitleOffset: false,
        miniProgressBar: false,
        mutex: true,
        playsInline: true,
        autoPlayback: false,
        theme: '#22c55e',
        lang: 'zh-cn',
        hotkey: false,
        fastForward: true,
        autoOrientation: true,
        lock: true,
        // AirPlay 仅在支持 WebKit API 的浏览器中启用
        airplay: isIOS || isSafari,
        moreVideoAttr: {
          crossOrigin: 'anonymous',
        },
        // HLS 支持配置
        customType: {
          m3u8: function (video: HTMLVideoElement, url: string) {
            if (!Hls) {
              console.error('HLS.js 未加载');
              return;
            }

            if (video.hls) {
              video.hls.destroy();
            }
            
            // 在函数内部重新检测iOS13+设备
            const localIsIOS13 = isIOS13;
            
            // 🚀 根据 HLS.js 官方源码的最佳实践配置
            const hls = new Hls({
              debug: false,
              enableWorker: true,
              // 参考 HLS.js config.ts：移动设备关闭低延迟模式以节省资源
              lowLatencyMode: !isMobile,
              
              // 🎯 官方推荐的缓冲策略 - iOS13+ 特别优化
              /* 缓冲长度配置 - 参考 hlsDefaultConfig */
              maxBufferLength: isMobile 
                ? (localIsIOS13 ? 8 : isIOS ? 10 : 15)  // iOS13+: 8s, iOS: 10s, Android: 15s
                : 30, // 桌面默认30s
              backBufferLength: isMobile 
                ? (localIsIOS13 ? 5 : isIOS ? 8 : 10)   // iOS13+更保守
                : Infinity, // 桌面使用无限回退缓冲

              /* 缓冲大小配置 - 基于官方 maxBufferSize */
              maxBufferSize: isMobile 
                ? (localIsIOS13 ? 20 * 1000 * 1000 : isIOS ? 30 * 1000 * 1000 : 40 * 1000 * 1000) // iOS13+: 20MB, iOS: 30MB, Android: 40MB
                : 60 * 1000 * 1000, // 桌面: 60MB (官方默认)

              /* 网络加载优化 - 参考 defaultLoadPolicy */
              maxLoadingDelay: isMobile ? (localIsIOS13 ? 2 : 3) : 4, // iOS13+设备更快超时
              maxBufferHole: isMobile ? (localIsIOS13 ? 0.05 : 0.1) : 0.1, // 减少缓冲洞容忍度
              
              /* Fragment管理 - 参考官方配置 */
              liveDurationInfinity: false, // 避免无限缓冲 (官方默认false)
              liveBackBufferLength: isMobile ? (localIsIOS13 ? 3 : 5) : null, // 已废弃，保持兼容

              /* 高级优化配置 - 参考 StreamControllerConfig */
              maxMaxBufferLength: isMobile ? (localIsIOS13 ? 60 : 120) : 600, // 最大缓冲长度限制
              maxFragLookUpTolerance: isMobile ? 0.1 : 0.25, // 片段查找容忍度
              
              /* ABR优化 - 参考 ABRControllerConfig */
              abrEwmaFastLive: isMobile ? 2 : 3, // 移动端更快的码率切换
              abrEwmaSlowLive: isMobile ? 6 : 9,
              abrBandWidthFactor: isMobile ? 0.8 : 0.95, // 移动端更保守的带宽估计
              
              /* 启动优化 */
              startFragPrefetch: !isMobile, // 移动端关闭预取以节省资源
              testBandwidth: !localIsIOS13, // iOS13+关闭带宽测试以快速启动
              
              /* Loader配置 - 参考官方 fragLoadPolicy */
              fragLoadPolicy: {
                default: {
                  maxTimeToFirstByteMs: isMobile ? 6000 : 10000,
                  maxLoadTimeMs: isMobile ? 60000 : 120000,
                  timeoutRetry: {
                    maxNumRetry: isMobile ? 2 : 4,
                    retryDelayMs: 0,
                    maxRetryDelayMs: 0,
                  },
                  errorRetry: {
                    maxNumRetry: isMobile ? 3 : 6,
                    retryDelayMs: 1000,
                    maxRetryDelayMs: isMobile ? 4000 : 8000,
                  },
                },
              },

              /* 自定义loader */
              loader: blockAdEnabledRef.current
                ? CustomHlsJsLoader
                : Hls.DefaultConfig.loader,
            });

            hls.loadSource(url);
            hls.attachMedia(video);
            video.hls = hls;

            ensureVideoSource(video, url);

            hls.on(Hls.Events.ERROR, function (event: any, data: any) {
              console.error('HLS Error:', event, data);

              // v1.6.13 增强：处理片段解析错误（针对initPTS修复）
              if (data.details === Hls.ErrorDetails.FRAG_PARSING_ERROR) {
                console.log('片段解析错误，尝试重新加载...');
                // 重新开始加载，利用v1.6.13的initPTS修复
                hls.startLoad();
                return;
              }

              // v1.6.13 增强：处理时间戳相关错误（直播回搜修复）
              if (data.details === Hls.ErrorDetails.BUFFER_APPEND_ERROR &&
                  data.err && data.err.message &&
                  data.err.message.includes('timestamp')) {
                console.log('时间戳错误，清理缓冲区并重新加载...');
                try {
                  // 清理缓冲区后重新开始，利用v1.6.13的时间戳包装修复
                  const currentTime = video.currentTime;
                  hls.trigger(Hls.Events.BUFFER_RESET, undefined);
                  hls.startLoad(currentTime);
                } catch (e) {
                  console.warn('缓冲区重置失败:', e);
                  hls.startLoad();
                }
                return;
              }

              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.log('网络错误，尝试恢复...');
                    hls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log('媒体错误，尝试恢复...');
                    hls.recoverMediaError();
                    break;
                  default:
                    console.log('无法恢复的错误');
                    hls.destroy();
                    break;
                }
              }
            });
          },
        },
        icons: {
          loading:
            '<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cGF0aCBkPSJNMjUuMjUxIDYuNDYxYy0xMC4zMTggMC0xOC42ODMgOC4zNjUtMTguNjgzIDE4LjY4M2g0LjA2OGMwLTguMDcgNi41NDUtMTQuNjE1IDE0LjYxNS0xNC42MTVWNi40NjF6IiBmaWxsPSIjMDA5Njg4Ij48YW5pbWF0ZVRyYW5zZm9ybSBhdHRyaWJ1dGVOYW1lPSJ0cmFuc2Zvcm0iIGF0dHJpYnV0ZVR5cGU9IlhNTCIgZHVyPSIxcyIgZnJvbT0iMCAyNSAyNSIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIHRvPSIzNjAgMjUgMjUiIHR5cGU9InJvdGF0ZSIvPjwvcGF0aD48L3N2Zz4=">',
        },
        settings: [
          {
            html: '去广告',
            icon: '<text x="50%" y="50%" font-size="20" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#ffffff">AD</text>',
            tooltip: blockAdEnabled ? '已开启' : '已关闭',
            onClick() {
              const newVal = !blockAdEnabled;
              try {
                localStorage.setItem('enable_blockad', String(newVal));
                if (artPlayerRef.current) {
                  resumeTimeRef.current = artPlayerRef.current.currentTime;
                  if (artPlayerRef.current.video.hls) {
                    artPlayerRef.current.video.hls.destroy();
                  }
                  artPlayerRef.current.destroy(false);
                  artPlayerRef.current = null;
                }
                blockAdEnabledRef.current = newVal;
              } catch (_) {
                // ignore
              }
              return newVal ? '当前开启' : '当前关闭';
            },
          },
        ],
        // 控制栏配置
        controls: [
          {
            position: 'left',
            index: 13,
            html: '<i class="art-icon flex"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="currentColor"/></svg></i>',
            tooltip: '播放下一集',
            click: function () {
              // 这里需要传入 handleNextEpisode 函数
              // 由于在hook中，我们通过其他方式处理
            },
          },
        ],
        plugins: [
          artplayerPluginDanmuku((() => {
            // 🎯 设备性能检测
            const getDevicePerformance = () => {
              const hardwareConcurrency = navigator.hardwareConcurrency || 2
              const memory = (performance as any).memory?.jsHeapSizeLimit || 0
              
              // 简单性能评分（0-1）
              let score = 0
              score += Math.min(hardwareConcurrency / 4, 1) * 0.5 // CPU核心数权重
              score += Math.min(memory / (1024 * 1024 * 1024), 1) * 0.3 // 内存权重
              score += (isMobile ? 0.2 : 0.5) * 0.2 // 设备类型权重
              
              if (score > 0.7) return 'high'
              if (score > 0.4) return 'medium' 
              return 'low'
            }
            
            const devicePerformance = getDevicePerformance()
            console.log(`🎯 设备性能等级: ${devicePerformance}`)
            
            // 🚀 激进性能优化：针对大量弹幕的渲染策略
            const getOptimizedConfig = () => {
              const baseConfig = {
                danmuku: [], // 初始为空数组，后续通过load方法加载
                speed: parseInt(localStorage.getItem('danmaku_speed') || '6'),
                opacity: parseFloat(localStorage.getItem('danmaku_opacity') || '0.8'),
                fontSize: parseInt(localStorage.getItem('danmaku_fontSize') || '25'),
                color: '#FFFFFF',
                mode: 0 as const,
                modes: JSON.parse(localStorage.getItem('danmaku_modes') || '[0, 1, 2]') as Array<0 | 1 | 2>,
                margin: JSON.parse(localStorage.getItem('danmaku_margin') || '[10, "75%"]') as [number | `${number}%`, number | `${number}%`],
                visible: localStorage.getItem('danmaku_visible') !== 'false',
                emitter: false,
                maxLength: 50,
                lockTime: 1, // 🎯 进一步减少锁定时间，提升进度跳转响应
                theme: 'dark' as const,
                width: 300,

                // 🎯 激进优化配置 - 保持功能完整性
                antiOverlap: devicePerformance === 'high', // 只有高性能设备开启防重叠，避免重叠计算
                synchronousPlayback: true, // ✅ 必须保持true！确保弹幕与视频播放速度同步
                heatmap: false, // 关闭热力图，减少DOM计算开销
                
                // 🧠 智能过滤器 - 激进性能优化，过滤影响性能的弹幕
                filter: (danmu: any) => {
                  // 基础验证
                  if (!danmu.text || !danmu.text.trim()) return false

                  const text = danmu.text.trim();

                  // 🔥 激进长度限制，减少DOM渲染负担
                  if (text.length > 50) return false // 从100改为50，更激进
                  if (text.length < 2) return false  // 过短弹幕通常无意义

                  // 🔥 激进特殊字符过滤，避免复杂渲染
                  const specialCharCount = (text.match(/[^\u4e00-\u9fa5a-zA-Z0-9\s.,!?；，。！？]/g) || []).length
                  if (specialCharCount > 5) return false // 从10改为5，更严格

                  // 🔥 过滤纯数字或纯符号弹幕，减少无意义渲染
                  if (/^\d+$/.test(text)) return false
                  if (/^[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/.test(text)) return false

                  // 🔥 过滤常见低质量弹幕，提升整体质量
                  const lowQualityPatterns = [
                    /^666+$/, /^好+$/, /^哈+$/, /^啊+$/,
                    /^[!！.。？?]+$/, /^牛+$/, /^强+$/
                  ];
                  if (lowQualityPatterns.some(pattern => pattern.test(text))) return false

                  return true
                },
                
                // 🚀 优化的弹幕显示前检查（换源时性能优化）
                beforeVisible: (danmu: any) => {
                  return new Promise<boolean>((resolve) => {
                    // 换源期间快速拒绝弹幕显示，减少处理开销
                    if (isEpisodeChangingRef.current) {
                      resolve(false);
                      return;
                    }

                    // 🎯 动态弹幕密度控制 - 根据当前屏幕上的弹幕数量决定是否显示
                    const currentVisibleCount = document.querySelectorAll('.art-danmuku [data-state="emit"]').length;
                    const maxConcurrentDanmu = devicePerformance === 'high' ? 60 :
                                             devicePerformance === 'medium' ? 40 : 25;

                    if (currentVisibleCount >= maxConcurrentDanmu) {
                      // 🔥 当弹幕密度过高时，随机丢弃部分弹幕，保持流畅性
                      const dropRate = devicePerformance === 'high' ? 0.1 :
                                      devicePerformance === 'medium' ? 0.3 : 0.5;
                      if (Math.random() < dropRate) {
                        resolve(false); // 丢弃当前弹幕
                        return;
                      }
                    }

                    // 🎯 硬件加速优化
                    if (danmu.$ref && danmu.mode === 0) {
                      danmu.$ref.style.willChange = 'transform';
                      danmu.$ref.style.backfaceVisibility = 'hidden';

                      // 低性能设备额外优化
                      if (devicePerformance === 'low') {
                        danmu.$ref.style.transform = 'translateZ(0)'; // 强制硬件加速
                        danmu.$ref.classList.add('art-danmuku-optimized');
                      }
                    }

                    resolve(true);
                  });
                },
              }
              
              // 根据设备性能调整核心配置
              switch (devicePerformance) {
                case 'high': // 高性能设备 - 完整功能
                  return {
                    ...baseConfig,
                    antiOverlap: true, // 开启防重叠
                    synchronousPlayback: true, // 保持弹幕与视频播放速度同步
                    useWorker: true, // v5.2.0: 启用Web Worker优化
                  }
                
                case 'medium': // 中等性能设备 - 适度优化
                  return {
                    ...baseConfig,
                    antiOverlap: !isMobile, // 移动端关闭防重叠
                    synchronousPlayback: true, // 保持同步播放以确保体验一致
                    useWorker: true, // v5.2.0: 中等设备也启用Worker
                  }
                
                case 'low': // 低性能设备 - 平衡优化
                  return {
                    ...baseConfig,
                    antiOverlap: false, // 关闭复杂的防重叠算法
                    synchronousPlayback: true, // 保持同步以确保体验，计算量不大
                    useWorker: true, // 开启Worker减少主线程负担
                    maxLength: 30, // v5.2.0优化: 减少弹幕数量是关键优化
                  }
              }
            }
            
            const config = getOptimizedConfig()
            
            // 🎨 为低性能设备添加CSS硬件加速样式
            if (devicePerformance === 'low') {
              // 创建CSS动画样式（硬件加速）
              if (!document.getElementById('danmaku-performance-css')) {
                const style = document.createElement('style')
                style.id = 'danmaku-performance-css'
                style.textContent = `
                  /* 🚀 硬件加速的弹幕优化 */
                  .art-danmuku-optimized {
                    will-change: transform !important;
                    backface-visibility: hidden !important;
                    transform: translateZ(0) !important;
                    transition: transform linear !important;
                  }
                `
                document.head.appendChild(style)
                console.log('🎨 已加载CSS硬件加速优化')
              }
            }
            
            return config
          })()),
          // Chromecast 插件加载策略：
          // 只在 Chrome 浏览器中显示 Chromecast（排除 iOS Chrome）
          // Safari 和 iOS：不显示 Chromecast（用原生 AirPlay）
          // 其他浏览器：不显示 Chromecast（不支持 Cast API）
          ...(isChrome && !isIOS ? [
            artplayerPluginChromecast({
              onStateChange: (state) => {
                console.log('Chromecast state changed:', state);
              },
              onCastAvailable: (available) => {
                console.log('Chromecast available:', available);
              },
              onCastStart: () => {
                console.log('Chromecast started');
              },
              onError: (error) => {
                console.error('Chromecast error:', error);
              }
            })
          ] : []),
        ],
      });

      // 设置播放器事件监听器
      const setupPlayerEventListeners = () => {
        // 这里可以添加播放器事件监听器的设置逻辑
        console.log('设置播放器事件监听器');
      };
      
      setupPlayerEventListeners();

      // 监听播放器事件
      artPlayerRef.current.on('ready', async () => {
        setError(null);

        // iOS设备自动播放优化：如果是静音启动的，在开始播放后恢复音量
        if ((isIOS || isSafari) && artPlayerRef.current.muted) {
          console.log('iOS设备静音自动播放，准备在播放开始后恢复音量');
          
          const handleFirstPlay = () => {
            setTimeout(() => {
              if (artPlayerRef.current && artPlayerRef.current.muted) {
                artPlayerRef.current.muted = false;
                artPlayerRef.current.volume = lastVolumeRef.current || 0.7;
                console.log('iOS设备已恢复音量:', artPlayerRef.current.volume);
              }
            }, 500); // 延迟500ms确保播放稳定
            
            // 只执行一次
            artPlayerRef.current.off('video:play', handleFirstPlay);
          };
          
          artPlayerRef.current.on('video:play', handleFirstPlay);
        }

        // 播放器就绪后，加载外部弹幕数据
        console.log('播放器已就绪，开始加载外部弹幕');
        setTimeout(async () => {
          try {
            const externalDanmu = await loadExternalDanmu(); // 这里会检查开关状态
            console.log('外部弹幕加载结果:', externalDanmu);
            
            if (artPlayerRef.current?.plugins?.artplayerPluginDanmuku) {
              if (externalDanmu.length > 0) {
                console.log('向播放器插件加载弹幕数据:', externalDanmu.length, '条');
                artPlayerRef.current.plugins.artplayerPluginDanmuku.load(externalDanmu);
                artPlayerRef.current.notice.show = `已加载 ${externalDanmu.length} 条弹幕`;
              } else {
                console.log('没有弹幕数据可加载');
                artPlayerRef.current.notice.show = '暂无弹幕数据';
              }
            } else {
              console.error('弹幕插件未找到');
            }
          } catch (error) {
            console.error('加载外部弹幕失败:', error);
          }
        }, 1000); // 延迟1秒确保插件完全初始化

        // 播放器就绪后，如果正在播放则请求 Wake Lock
        if (artPlayerRef.current && !artPlayerRef.current.paused) {
          internalRequestWakeLock();
        }
      });

      // 监听播放状态变化，控制 Wake Lock
      artPlayerRef.current.on('play', () => {
        internalRequestWakeLock();
      });

      artPlayerRef.current.on('pause', () => {
        internalReleaseWakeLock();
        // 🔥 关键修复：暂停时也检查是否在片尾，避免保存错误的进度
        const currentTime = artPlayerRef.current?.currentTime || 0;
        const duration = artPlayerRef.current?.duration || 0;
        const remainingTime = duration - currentTime;
        const isNearEnd = duration > 0 && remainingTime < 180; // 最后3分钟

        if (!isNearEnd) {
          saveCurrentPlayProgress();
        }
      });

      artPlayerRef.current.on('video:ended', () => {
        internalReleaseWakeLock();
      });

      // 如果播放器初始化时已经在播放状态，则请求 Wake Lock
      if (artPlayerRef.current && !artPlayerRef.current.paused) {
        internalRequestWakeLock();
      }

      artPlayerRef.current.on('video:volumechange', () => {
        lastVolumeRef.current = artPlayerRef.current.volume;
      });
      artPlayerRef.current.on('video:ratechange', () => {
        lastPlaybackRateRef.current = artPlayerRef.current.playbackRate;
      });

      // 监听视频可播放事件，这时恢复播放进度更可靠
      artPlayerRef.current.on('video:canplay', () => {
        // 🔥 重置 video:ended 处理标志，因为这是新视频
        videoEndedHandledRef.current = false;

        // 若存在需要恢复的播放进度，则跳转
        if (resumeTimeRef.current && resumeTimeRef.current > 0) {
          try {
            const duration = artPlayerRef.current.duration || 0;
            let target = resumeTimeRef.current;
            if (duration && target >= duration - 2) {
              target = Math.max(0, duration - 5);
            }
            artPlayerRef.current.currentTime = target;
            console.log('成功恢复播放进度到:', resumeTimeRef.current);
          } catch (err) {
            console.warn('恢复播放进度失败:', err);
          }
        }
        resumeTimeRef.current = null;

        setTimeout(() => {
          if (
            Math.abs(artPlayerRef.current.volume - lastVolumeRef.current) > 0.01
          ) {
            artPlayerRef.current.volume = lastVolumeRef.current;
          }
          if (
            Math.abs(
              artPlayerRef.current.playbackRate - lastPlaybackRateRef.current
            ) > 0.01 &&
            isWebKit
          ) {
            artPlayerRef.current.playbackRate = lastPlaybackRateRef.current;
          }
          artPlayerRef.current.notice.show = '';
        }, 0);

        // 隐藏换源加载状态
        setIsVideoLoading(false);

        // 🔥 重置集数切换标识（播放器成功创建后）
        if (isEpisodeChangingRef.current) {
          isEpisodeChangingRef.current = false;
          console.log('🎯 播放器创建完成，重置集数切换标识');
        }
      });

      // 监听播放器错误
      artPlayerRef.current.on('error', (err: any) => {
        console.error('播放器错误:', err);
        if (artPlayerRef.current.currentTime > 0) {
          return;
        }
      });

      // 合并的timeupdate监听器 - 处理跳过片头片尾和保存进度
      artPlayerRef.current.on('video:timeupdate', () => {
        const currentTime = artPlayerRef.current.currentTime || 0;
        const duration = artPlayerRef.current.duration || 0;

        // 更新 SkipController 所需的时间信息
        setCurrentPlayTime(currentTime);
        setVideoDuration(duration);

        // 保存播放进度逻辑 - 优化保存间隔以减少网络开销
        const saveNow = Date.now();
        // 🔧 优化：增加播放中的保存间隔，依赖暂停时保存作为主要保存时机
        // upstash: 60秒兜底保存，其他存储: 30秒兜底保存
        // 用户暂停、切换集数、页面卸载时会立即保存，因此较长间隔不影响体验
        const interval = process.env.NEXT_PUBLIC_STORAGE_TYPE === 'upstash' ? 60000 : 30000;

        // 🔥 关键修复：如果当前播放位置接近视频结尾（最后3分钟），不保存进度
        // 这是为了避免自动跳过片尾时保存了片尾位置的进度，导致"继续观看"从错误位置开始
        const remainingTime = duration - currentTime;
        const isNearEnd = duration > 0 && remainingTime < 180; // 最后3分钟

        if (saveNow - lastSaveTimeRef.current > interval && !isNearEnd) {
          saveCurrentPlayProgress();
          lastSaveTimeRef.current = saveNow;
        }
      });

      if (artPlayerRef.current?.video) {
        ensureVideoSource(
          artPlayerRef.current.video as HTMLVideoElement,
          videoUrl
        );
      }
    } catch (err) {
      console.error('创建播放器失败:', err);
      // 重置集数切换标识
      isEpisodeChangingRef.current = false;
      setError('播放器初始化失败');
    }
    }; // 结束 initPlayer 函数

    // 动态导入 ArtPlayer 并初始化
    const loadAndInit = async () => {
      try {
        const [{ default: Artplayer }, { default: artplayerPluginDanmuku }] = await Promise.all([
          import('artplayer'),
          import('artplayer-plugin-danmuku')
        ]);
        
        // 将导入的模块设置为全局变量供 initPlayer 使用
        (window as any).DynamicArtplayer = Artplayer;
        (window as any).DynamicArtplayerPluginDanmuku = artplayerPluginDanmuku;
        
        await initPlayer();
      } catch (error) {
        console.error('动态导入 ArtPlayer 失败:', error);
        setError('播放器加载失败');
      }
    };

    loadAndInit();
  }, [
    Hls, videoUrl, loading, blockAdEnabled, videoTitle, videoCover, 
    currentEpisodeIndex, detail, totalEpisodes, resumeTimeRef, lastVolumeRef, 
    lastPlaybackRateRef, setError, setIsVideoLoading, loadExternalDanmu,
    externalDanmuEnabledRef, isEpisodeChangingRef, saveCurrentPlayProgress, videoEndedHandledRef,
    setCurrentPlayTime, setVideoDuration, cleanupPlayer
  ]);

  return {
    artPlayerRef,
    artRef,
    cleanupPlayer,
  };
};