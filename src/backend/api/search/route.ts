/* eslint-disable @typescript-eslint/no-explicit-any,no-console */

import { NextRequest } from 'next/server';

import { getAvailableApiSites, getCacheTime, getConfig } from '@/backend/lib/config';
import { searchFromApi } from '@/backend/lib/downstream';
import { yellowWords } from '@/backend/lib/yellow';
import { 
  validateAuth, 
  createErrorResponse, 
  createCachedResponse, 
  withTimeout 
} from '@/backend/lib/api-utils';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // 验证用户认证
  const authValidation = validateAuth(request);
  if (!authValidation.success) {
    return createErrorResponse(authValidation.error!, authValidation.status);
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    const cacheTime = await getCacheTime();
    return createCachedResponse({ results: [] }, cacheTime);
  }

  try {
    const config = await getConfig();
    const apiSites = await getAvailableApiSites(authValidation.authInfo!.username);

    // 并发搜索所有API站点，带超时控制
    const searchPromises = apiSites.map((site) =>
      withTimeout(searchFromApi(site, query), 20000).catch((err) => {
        console.warn(`搜索失败 ${site.name}:`, err.message);
        return []; // 返回空数组而不是抛出错误
      })
    );

    const allResults = await Promise.all(searchPromises);
    const flattenedResults = allResults.flat();

    // 黄词过滤
    const disableYellowFilter = config.SiteConfig?.DisableYellowFilter || process.env.NEXT_PUBLIC_DISABLE_YELLOW_FILTER === 'true';
    const filteredResults = disableYellowFilter
      ? flattenedResults
      : flattenedResults.filter((item) => !yellowWords.some((word) => item.title.includes(word)));

    const cacheTime = await getCacheTime();
    return createCachedResponse({ results: filteredResults }, cacheTime);
  } catch (error) {
    console.error('搜索错误:', error);
    return createErrorResponse('搜索失败');
  }
}
