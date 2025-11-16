/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */

'use client';

import { SearchResult } from '@/frontend/lib/types';
import { getVideoResolutionFromM3u8 } from '@/frontend/lib/utils';

// 设备检测结果
const getUserAgent = () => typeof navigator !== 'undefined' ? navigator.userAgent : '';
const isIOSGlobal = () => {
  const userAgent = getUserAgent();
  return /iPad|iPhone|iPod/i.test(userAgent) && !(window as any).MSStream;
};
const isIOS13Global = () => {
  const userAgent = getUserAgent();
  return isIOSGlobal() || (userAgent.includes('Macintosh') && navigator.maxTouchPoints >= 1);
};
const isMobileGlobal = () => {
  const userAgent = getUserAgent();
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || isIOS13Global();
};

// 生成搜索查询的多种变体，提高搜索命中率
export const generateSearchVariants = (originalQuery: string): string[] => {
  const variants: string[] = [];
  const trimmed = originalQuery.trim();

  // 1. 原始查询（最高优先级）
  variants.push(trimmed);

  // 2. 处理中文标点符号变体
  const chinesePunctuationVariants = generateChinesePunctuationVariants(trimmed);
  chinesePunctuationVariants.forEach(variant => {
    if (!variants.includes(variant)) {
      variants.push(variant);
    }
  });

  // 如果包含空格，生成额外变体
  if (trimmed.includes(' ')) {
    // 4. 去除所有空格
    const noSpaces = trimmed.replace(/\s+/g, '');
    if (noSpaces !== trimmed) {
      variants.push(noSpaces);
    }

    // 5. 标准化空格（多个空格合并为一个）
    const normalizedSpaces = trimmed.replace(/\s+/g, ' ');
    if (normalizedSpaces !== trimmed && !variants.includes(normalizedSpaces)) {
      variants.push(normalizedSpaces);
    }

    // 6. 提取关键词组合（针对"中餐厅 第九季"这种情况）
    const keywords = trimmed.split(/\s+/);
    if (keywords.length >= 2) {
      // 主要关键词 + 季/集等后缀
      const mainKeyword = keywords[0];
      const lastKeyword = keywords[keywords.length - 1];

      // 如果最后一个词包含"第"、"季"、"集"等，尝试组合
      if (/第|季|集|部|篇|章/.test(lastKeyword)) {
        const combined = mainKeyword + lastKeyword;
        if (!variants.includes(combined)) {
          variants.push(combined);
        }
      }

      // 7. 空格变冒号的变体（重要！针对"死神来了 血脉诅咒" -> "死神来了：血脉诅咒"）
      const withColon = trimmed.replace(/\s+/g, '：');
      if (!variants.includes(withColon)) {
        variants.push(withColon);
      }

      // 8. 空格变英文冒号的变体
      const withEnglishColon = trimmed.replace(/\s+/g, ':');
      if (!variants.includes(withEnglishColon)) {
        variants.push(withEnglishColon);
      }

      // 仅使用主关键词搜索（过滤无意义的词）
      const meaninglessWords = ['the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by'];
      if (!variants.includes(mainKeyword) &&
          !meaninglessWords.includes(mainKeyword.toLowerCase()) &&
          mainKeyword.length > 2) {
        variants.push(mainKeyword);
      }
    }
  }

  // 去重并返回
  return Array.from(new Set(variants));
};

// 生成中文标点符号的搜索变体
const generateChinesePunctuationVariants = (query: string): string[] => {
  const variants: string[] = [];

  // 检查是否包含中文标点符号
  const chinesePunctuation = /[：；，。！？、""''（）【】《》]/;
  if (!chinesePunctuation.test(query)) {
    return variants;
  }

  // 中文冒号变体 (针对"死神来了：血脉诅咒"这种情况)
  if (query.includes('：')) {
    // 优先级1: 替换为空格 (最可能匹配，如"死神来了 血脉诅咒" 能匹配到 "死神来了6：血脉诅咒")
    const withSpace = query.replace(/：/g, ' ');
    variants.push(withSpace);

    // 优先级2: 完全去除冒号
    const noColon = query.replace(/：/g, '');
    variants.push(noColon);

    // 优先级3: 替换为英文冒号
    const englishColon = query.replace(/：/g, ':');
    variants.push(englishColon);

    // 优先级4: 提取冒号前的主标题 (降低优先级，避免匹配到错误的系列)
    const beforeColon = query.split('：')[0].trim();
    if (beforeColon && beforeColon !== query) {
      variants.push(beforeColon);
    }

    // 优先级5: 提取冒号后的副标题
    const afterColon = query.split('：')[1]?.trim();
    if (afterColon) {
      variants.push(afterColon);
    }
  }

  // 其他中文标点符号处理
  let cleanedQuery = query;

  // 替换中文标点为对应英文标点
  cleanedQuery = cleanedQuery.replace(/；/g, ';');
  cleanedQuery = cleanedQuery.replace(/，/g, ',');
  cleanedQuery = cleanedQuery.replace(/。/g, '.');
  cleanedQuery = cleanedQuery.replace(/！/g, '!');
  cleanedQuery = cleanedQuery.replace(/？/g, '?');
  cleanedQuery = cleanedQuery.replace(/"/g, '"');
  cleanedQuery = cleanedQuery.replace(/"/g, '"');
  cleanedQuery = cleanedQuery.replace(/'/g, "'");
  cleanedQuery = cleanedQuery.replace(/'/g, "'");
  cleanedQuery = cleanedQuery.replace(/（/g, '(');
  cleanedQuery = cleanedQuery.replace(/）/g, ')');
  cleanedQuery = cleanedQuery.replace(/【/g, '[');
  cleanedQuery = cleanedQuery.replace(/】/g, ']');
  cleanedQuery = cleanedQuery.replace(/《/g, '<');
  cleanedQuery = cleanedQuery.replace(/》/g, '>');

  if (cleanedQuery !== query) {
    variants.push(cleanedQuery);
  }

  // 完全去除所有标点符号
  const noPunctuation = query.replace(/[：；，。！？、""''（）【】《》:;,.!?"'()[\]<>]/g, '');
  if (noPunctuation !== query && noPunctuation.trim()) {
    variants.push(noPunctuation);
  }

  return variants;
};

// 检查是否包含查询中的所有关键词（与downstream评分逻辑保持一致）
export const checkAllKeywordsMatch = (queryTitle: string, resultTitle: string): boolean => {
  const queryWords = queryTitle.replace(/[^\w\s\u4e00-\u9fff]/g, '').split(/\s+/).filter(w => w.length > 0);

  // 检查结果标题是否包含查询中的所有关键词
  return queryWords.every(word => resultTitle.includes(word));
};

// 播放源优选函数（针对旧iPad做极端保守优化）
export const preferBestSource = async (
  sources: SearchResult[]
): Promise<{ bestSource: SearchResult; videoInfoMap?: Map<string, { quality: string; loadSpeed: string; pingTime: number; hasError?: boolean }> }> => {
  if (sources.length === 1) return { bestSource: sources[0] };

  // 使用全局统一的设备检测结果
  const userAgent = getUserAgent();
  const _isIPad = /iPad/i.test(userAgent) || (userAgent.includes('Macintosh') && navigator.maxTouchPoints >= 1);
  const _isIOS = isIOSGlobal();
  const isIOS13 = isIOS13Global();
  const isMobile = isMobileGlobal();

  // 如果是iPad或iOS13+（包括新iPad在桌面模式下），使用极简策略避免崩溃
  if (isIOS13) {
    console.log('检测到iPad/iOS13+设备，使用无测速优选策略避免崩溃');
    
    // 简单的源名称优先级排序，不进行实际测速
    const sourcePreference = [
      'ok', 'niuhu', 'ying', 'wasu', 'mgtv', 'iqiyi', 'youku', 'qq'
    ];
    
    const sortedSources = sources.sort((a, b) => {
      const aIndex = sourcePreference.findIndex(name => 
        a.source_name?.toLowerCase().includes(name)
      );
      const bIndex = sourcePreference.findIndex(name => 
        b.source_name?.toLowerCase().includes(name)
      );
      
      // 如果都在优先级列表中，按优先级排序
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // 如果只有一个在优先级列表中，优先选择它
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // 都不在优先级列表中，保持原始顺序
      return 0;
    });
    
    console.log('iPad/iOS13+优选结果:', sortedSources.map(s => s.source_name));
    return { bestSource: sortedSources[0] };
  }

  // 移动设备使用轻量级测速（仅ping，不创建HLS）
  if (isMobile) {
    console.log('移动设备使用轻量级优选');
    const bestSource = await lightweightPreference(sources);
    return { bestSource };
  }

  // 桌面设备使用原来的测速方法（控制并发）
  return await fullSpeedTest(sources);
};

// 轻量级优选：仅测试连通性，不创建video和HLS
const lightweightPreference = async (sources: SearchResult[]): Promise<SearchResult> => {
  console.log('开始轻量级测速，仅测试连通性');
  
  const results = await Promise.all(
    sources.map(async (source) => {
      try {
        if (!source.episodes || source.episodes.length === 0) {
          return { source, pingTime: 9999, available: false };
        }

        const episodeUrl = source.episodes.length > 1 
          ? source.episodes[1] 
          : source.episodes[0];
        
        // 仅测试连通性和响应时间
        const startTime = performance.now();
        await fetch(episodeUrl, { 
          method: 'HEAD', 
          mode: 'no-cors',
          signal: AbortSignal.timeout(3000) // 3秒超时
        });
        const pingTime = performance.now() - startTime;
        
        return { 
          source, 
          pingTime: Math.round(pingTime), 
          available: true 
        };
      } catch (error) {
        console.warn(`轻量级测速失败: ${source.source_name}`, error);
        return { source, pingTime: 9999, available: false };
      }
    })
  );

  // 按可用性和响应时间排序
  const sortedResults = results
    .filter(r => r.available)
    .sort((a, b) => a.pingTime - b.pingTime);

  if (sortedResults.length === 0) {
    console.warn('所有源都不可用，返回第一个');
    return sources[0];
  }

  console.log('轻量级优选结果:', sortedResults.map(r => 
    `${r.source.source_name}: ${r.pingTime}ms`
  ));
  
  return sortedResults[0].source;
};

// 完整测速（桌面设备）
export const fullSpeedTest = async (
  sources: SearchResult[]
): Promise<{ bestSource: SearchResult; videoInfoMap: Map<string, { quality: string; loadSpeed: string; pingTime: number; hasError?: boolean }> }> => {
  // 桌面设备使用小批量并发，避免创建过多实例
  const concurrency = 2;
  const allResults: Array<{
    source: SearchResult;
    testResult: { quality: string; loadSpeed: string; pingTime: number };
  } | null> = [];

  for (let i = 0; i < sources.length; i += concurrency) {
    const batch = sources.slice(i, i + concurrency);
    console.log(`测速批次 ${Math.floor(i/concurrency) + 1}/${Math.ceil(sources.length/concurrency)}: ${batch.length} 个源`);
    
    const batchResults = await Promise.all(
      batch.map(async (source) => {
        try {
          if (!source.episodes || source.episodes.length === 0) {
            return null;
          }

          const episodeUrl = source.episodes.length > 1
            ? source.episodes[1]
            : source.episodes[0];
          
          const testResult = await getVideoResolutionFromM3u8(episodeUrl);
          return { source, testResult };
        } catch (error) {
          console.warn(`测速失败: ${source.source_name}`, error);
          return null;
        }
      })
    );
    
    allResults.push(...batchResults);
    
    // 批次间延迟，让资源有时间清理
    if (i + concurrency < sources.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // 等待所有测速完成，包含成功和失败的结果
  // 保存所有测速结果到 precomputedVideoInfo，供 EpisodeSelector 使用（包含错误结果）
  const newVideoInfoMap = new Map<
    string,
    {
      quality: string;
      loadSpeed: string;
      pingTime: number;
      hasError?: boolean;
    }
  >();
  allResults.forEach((result, index) => {
    const source = sources[index];
    const sourceKey = `${source.source}-${source.id}`;

    if (result) {
      // 成功的结果
      newVideoInfoMap.set(sourceKey, result.testResult);
    }
  });

  // 过滤出成功的结果用于优选计算
  const successfulResults = allResults.filter(Boolean) as Array<{
    source: SearchResult;
    testResult: { quality: string; loadSpeed: string; pingTime: number };
  }>;

  if (successfulResults.length === 0) {
    console.warn('所有播放源测速都失败，使用第一个播放源');
    return { bestSource: sources[0], videoInfoMap: new Map() };
  }

  // 找出所有有效速度的最大值，用于线性映射
  const validSpeeds = successfulResults
    .map((result) => {
      const speedStr = result.testResult.loadSpeed;
      if (speedStr === '未知' || speedStr === '测量中...') return 0;

      const match = speedStr.match(/^([\d.]+)\s*(KB\/s|MB\/s)$/);
      if (!match) return 0;

      const value = parseFloat(match[1]);
      const unit = match[2];
      return unit === 'MB/s' ? value * 1024 : value; // 统一转换为 KB/s
    })
    .filter((speed) => speed > 0);

  const maxSpeed = validSpeeds.length > 0 ? Math.max(...validSpeeds) : 1024; // 默认1MB/s作为基准

  // 找出所有有效延迟的最小值和最大值，用于线性映射
  const validPings = successfulResults
    .map((result) => result.testResult.pingTime)
    .filter((ping) => ping > 0);

  const minPing = validPings.length > 0 ? Math.min(...validPings) : 50;
  const maxPing = validPings.length > 0 ? Math.max(...validPings) : 1000;

  // 计算每个结果的评分
  const resultsWithScore = successfulResults.map((result) => ({
    ...result,
    score: calculateSourceScore(
      result.testResult,
      maxSpeed,
      minPing,
      maxPing
    ),
  }));

  // 按综合评分排序，选择最佳播放源
  resultsWithScore.sort((a, b) => b.score - a.score);

  console.log('播放源评分排序结果:');
  resultsWithScore.forEach((result, index) => {
    console.log(
      `${index + 1}. ${result.source.source_name
      } - 评分: ${result.score.toFixed(2)} (${result.testResult.quality}, ${result.testResult.loadSpeed
      }, ${result.testResult.pingTime}ms)`
    );
  });

  return { bestSource: resultsWithScore[0].source, videoInfoMap: newVideoInfoMap };
};

// 计算播放源综合评分
const calculateSourceScore = (
  testResult: {
    quality: string;
    loadSpeed: string;
    pingTime: number;
  },
  maxSpeed: number,
  minPing: number,
  maxPing: number
): number => {
  let score = 0;

  // 分辨率评分 (40% 权重)
  const qualityScore = (() => {
    switch (testResult.quality) {
      case '4K':
        return 100;
      case '2K':
        return 85;
      case '1080p':
        return 75;
      case '720p':
        return 60;
      case '480p':
        return 40;
      case 'SD':
        return 20;
      default:
        return 0;
    }
  })();
  score += qualityScore * 0.4;

  // 下载速度评分 (40% 权重) - 基于最大速度线性映射
  const speedScore = (() => {
    const speedStr = testResult.loadSpeed;
    if (speedStr === '未知' || speedStr === '测量中...') return 30;

    // 解析速度值
    const match = speedStr.match(/^([\d.]+)\s*(KB\/s|MB\/s)$/);
    if (!match) return 30;

    const value = parseFloat(match[1]);
    const unit = match[2];
    const speedKBps = unit === 'MB/s' ? value * 1024 : value;

    // 基于最大速度线性映射，最高100分
    const speedRatio = speedKBps / maxSpeed;
    return Math.min(100, Math.max(0, speedRatio * 100));
  })();
  score += speedScore * 0.4;

  // 网络延迟评分 (20% 权重) - 基于延迟范围线性映射
  const pingScore = (() => {
    const ping = testResult.pingTime;
    if (ping <= 0) return 0; // 无效延迟给默认分

    // 如果所有延迟都相同，给满分
    if (maxPing === minPing) return 100;

    // 线性映射：最低延迟=100分，最高延迟=0分
    const pingRatio = (maxPing - ping) / (maxPing - minPing);
    return Math.min(100, Math.max(0, pingRatio * 100));
  })();
  score += pingScore * 0.2;

  return Math.round(score * 100) / 100; // 保留两位小数
};

// 智能搜索和源筛选函数
export const fetchSourcesData = async (
  query: string,
  videoTitle: string,
  videoYear: string,
  videoDoubanId: number,
  searchType?: string
): Promise<SearchResult[]> => {
  // 使用智能搜索变体获取全部源信息
  try {
    console.log('开始智能搜索，原始查询:', query);
    const searchVariants = generateSearchVariants(query.trim());
    console.log('生成的搜索变体:', searchVariants);
    
    const allResults: SearchResult[] = [];
    let bestResults: SearchResult[] = [];
    
    // 依次尝试每个搜索变体，采用早期退出策略
    for (const variant of searchVariants) {
      console.log('尝试搜索变体:', variant);

      const response = await fetch(
        `/api/search?q=${encodeURIComponent(variant)}`
      );
      if (!response.ok) {
        console.warn(`搜索变体 "${variant}" 失败:`, response.statusText);
        continue;
      }
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        allResults.push(...data.results);

        // 处理搜索结果，使用智能模糊匹配（与downstream评分逻辑保持一致）
        const filteredResults = data.results.filter(
          (result: SearchResult) => {
            // 如果有 douban_id，优先使用 douban_id 精确匹配
            if (videoDoubanId && videoDoubanId > 0 && result.douban_id) {
              return result.douban_id === videoDoubanId;
            }

            const queryTitle = videoTitle.replaceAll(' ', '').toLowerCase();
            const resultTitle = result.title.replaceAll(' ', '').toLowerCase();

            // 智能标题匹配：支持数字变体和标点符号变化
            // 优先使用精确包含匹配，避免短标题（如"玫瑰"）匹配到包含该字的其他电影（如"玫瑰的故事"）
            const titleMatch = resultTitle.includes(queryTitle) ||
              queryTitle.includes(resultTitle) ||
              // 移除数字和标点后匹配（针对"死神来了：血脉诅咒" vs "死神来了6：血脉诅咒"）
              resultTitle.replace(/\d+|[：:]/g, '') === queryTitle.replace(/\d+|[：:]/g, '') ||
              // 通用关键词匹配：仅当查询标题较长时（4个字符以上）才使用关键词匹配
              // 避免短标题（如"玫瑰"2字）被拆分匹配
              (queryTitle.length > 4 && checkAllKeywordsMatch(queryTitle, resultTitle));

            const yearMatch = videoYear
              ? result.year.toLowerCase() === videoYear.toLowerCase()
              : true;
            const typeMatch = searchType
              ? (searchType === 'tv' && result.episodes.length > 1) ||
                (searchType === 'movie' && result.episodes.length === 1)
              : true;

            return titleMatch && yearMatch && typeMatch;
          }
        );

        if (filteredResults.length > 0) {
          console.log(`变体 "${variant}" 找到 ${filteredResults.length} 个精确匹配结果`);
          bestResults = filteredResults;
          break; // 找到精确匹配就停止
        }
      }
    }
    
    // 智能匹配：英文标题严格匹配，中文标题宽松匹配
    let finalResults = bestResults;

    // 如果没有精确匹配，根据语言类型进行不同策略的匹配
    if (bestResults.length === 0) {
      const queryTitle = videoTitle.toLowerCase().trim();
      const allCandidates = allResults;

      // 检测查询主要语言（英文 vs 中文）
      const englishChars = (queryTitle.match(/[a-z\s]/g) || []).length;
      const chineseChars = (queryTitle.match(/[\u4e00-\u9fff]/g) || []).length;
      const isEnglishQuery = englishChars > chineseChars;

      console.log(`搜索语言检测: ${isEnglishQuery ? '英文' : '中文'} - "${queryTitle}"`);

      let relevantMatches;

      if (isEnglishQuery) {
        // 英文查询：使用词汇匹配策略，避免不相关结果
        console.log('使用英文词汇匹配策略');

        // 提取有效英文词汇（过滤停用词）
        const queryWords = queryTitle.toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 2 && !['the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by'].includes(word));

        console.log('英文关键词:', queryWords);

        relevantMatches = allCandidates.filter(result => {
          const title = result.title.toLowerCase();
          const titleWords = title.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(word => word.length > 1);

          // 计算词汇匹配度：标题必须包含至少50%的查询关键词
          const matchedWords = queryWords.filter(queryWord =>
            titleWords.some(titleWord =>
              titleWord.includes(queryWord) || queryWord.includes(titleWord) ||
              // 允许部分相似（如gumball vs gum）
              (queryWord.length > 4 && titleWord.length > 4 &&
               queryWord.substring(0, 4) === titleWord.substring(0, 4))
            )
          );

          const wordMatchRatio = matchedWords.length / queryWords.length;
          if (wordMatchRatio >= 0.5) {
            console.log(`英文词汇匹配 (${matchedWords.length}/${queryWords.length}): "${result.title}" - 匹配词: [${matchedWords.join(', ')}]`);
            return true;
          }
          return false;
        });
      } else {
        // 中文查询：宽松匹配，保持现有行为
        console.log('使用中文宽松匹配策略');
        relevantMatches = allCandidates.filter(result => {
          const title = result.title.toLowerCase();
          const normalizedQuery = queryTitle.replace(/[^\w\u4e00-\u9fff]/g, '');
          const normalizedTitle = title.replace(/[^\w\u4e00-\u9fff]/g, '');

          // 包含匹配或50%相似度
          if (normalizedTitle.includes(normalizedQuery) || normalizedQuery.includes(normalizedTitle)) {
            console.log(`中文包含匹配: "${result.title}"`);
            return true;
          }

          const commonChars = Array.from(normalizedQuery).filter(char => normalizedTitle.includes(char)).length;
          const similarity = commonChars / normalizedQuery.length;
          if (similarity >= 0.5) {
            console.log(`中文相似匹配 (${(similarity*100).toFixed(1)}%): "${result.title}"`);
            return true;
          }
          return false;
        });
      }

      console.log(`匹配结果: ${relevantMatches.length}/${allCandidates.length}`);

      const maxResults = isEnglishQuery ? 5 : 20; // 英文更严格控制结果数
      if (relevantMatches.length > 0 && relevantMatches.length <= maxResults) {
        finalResults = Array.from(
          new Map(relevantMatches.map(item => [`${item.source}-${item.id}`, item])).values()
        );
      } else {
        console.log('没有找到合理的匹配，返回空结果');
        finalResults = [];
      }
    }
      
    console.log(`智能搜索完成，最终返回 ${finalResults.length} 个结果`);
    return finalResults;
  } catch (err) {
    console.error('智能搜索失败:', err);
    return [];
  }
};

// 获取指定源的详细信息
export const fetchSourceDetail = async (
  source: string,
  id: string
): Promise<SearchResult[]> => {
  try {
    let detailResponse;

    // 判断是否为短剧源
    if (source === 'shortdrama') {
      detailResponse = await fetch(
        `/api/shortdrama/detail?id=${encodeURIComponent(id)}&episode=1`
      );
    } else {
      detailResponse = await fetch(
        `/api/detail?source=${encodeURIComponent(source)}&id=${encodeURIComponent(id)}`
      );
    }

    if (!detailResponse.ok) {
      throw new Error('获取视频详情失败');
    }
    const detailData = (await detailResponse.json()) as SearchResult;
    return [detailData];
  } catch (err) {
    console.error('获取视频详情失败:', err);
    return [];
  }
};