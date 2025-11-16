/* eslint-disable no-console, @typescript-eslint/no-explicit-any */

import { FileOperations } from './file-operations';

/**
 * 缓存项接口
 */
interface CacheItem<T> {
  data: T;
  expireTime?: number;
  lastAccessTime: number;
}

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  maxSize: number; // 最大缓存项数
  defaultTTL: number; // 默认TTL（毫秒）
  cleanupInterval: number; // 清理间隔（毫秒）
  enableMemoryCache: boolean; // 是否启用内存缓存
}

/**
 * 内存缓存管理类
 * 提供多层级缓存支持（内存 + 文件）
 */
export class CacheManager {
  private memoryCache = new Map<string, CacheItem<any>>();
  private fileOps: FileOperations;
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(fileOps: FileOperations, config: Partial<CacheConfig> = {}) {
    this.fileOps = fileOps;
    this.config = {
      maxSize: 1000,
      defaultTTL: 5 * 60 * 1000, // 5分钟
      cleanupInterval: 60 * 1000, // 1分钟
      enableMemoryCache: true,
      ...config
    };

    this.startCleanupTimer();
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, this.config.cleanupInterval);
  }

  /**
   * 停止清理定时器
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(category: string, key: string): string {
    return `${category}:${key}`;
  }

  /**
   * 生成文件路径
   */
  private generateFilePath(category: string, key: string): string {
    // 将键转换为安全的文件名
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return this.fileOps.getAbsolutePath(`cache/${category}/${safeKey}.json`);
  }

  /**
   * 检查缓存项是否过期
   */
  private isExpired(item: CacheItem<any>): boolean {
    if (!item.expireTime) {
      return false;
    }
    return Date.now() > item.expireTime;
  }

  /**
   * 清理过期的内存缓存
   */
  private cleanupExpired(): void {
    let cleanedCount = 0;

    for (const [key, item] of Array.from(this.memoryCache.entries())) {
      if (this.isExpired(item)) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    // 如果内存缓存过多，清理最久未访问的项
    if (this.memoryCache.size > this.config.maxSize) {
      const entries = Array.from(this.memoryCache.entries())
        .sort(([, a], [, b]) => a.lastAccessTime - b.lastAccessTime);
      
      const toDelete = entries.slice(0, this.memoryCache.size - this.config.maxSize);
      toDelete.forEach(([key]) => this.memoryCache.delete(key));
      
      cleanedCount += toDelete.length;
    }

    if (cleanedCount > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[CacheManager] 清理了 ${cleanedCount} 个过期缓存项`);
    }
  }

  /**
   * 获取缓存（先内存后文件）
   */
  async get<T>(category: string, key: string): Promise<T | null> {
    const cacheKey = this.generateCacheKey(category, key);

    // 1. 检查内存缓存
    if (this.config.enableMemoryCache) {
      const memoryItem = this.memoryCache.get(cacheKey);
      if (memoryItem && !this.isExpired(memoryItem)) {
        memoryItem.lastAccessTime = Date.now();
        return memoryItem.data;
      }
      
      // 内存缓存过期，删除
      if (memoryItem) {
        this.memoryCache.delete(cacheKey);
      }
    }

    // 2. 检查文件缓存
    try {
      const filePath = this.generateFilePath(category, key);
      const fileData = await this.fileOps.readJsonFile<CacheItem<T>>(filePath);
      
      if (!fileData) {
        return null;
      }

      // 检查文件缓存是否过期
      if (this.isExpired(fileData)) {
        await this.fileOps.deleteFile(filePath);
        return null;
      }

      // 更新内存缓存
      if (this.config.enableMemoryCache) {
        this.memoryCache.set(cacheKey, {
          ...fileData,
          lastAccessTime: Date.now()
        });
      }

      return fileData.data;
    } catch (error) {
      console.error(`[CacheManager] 获取缓存失败: ${category}:${key}`, error);
      return null;
    }
  }

  /**
   * 设置缓存（内存 + 文件）
   */
  async set<T>(
    category: string, 
    key: string, 
    data: T, 
    ttl?: number
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(category, key);
    const expireTime = ttl ? Date.now() + ttl : undefined;

    // 1. 设置内存缓存
    if (this.config.enableMemoryCache) {
      this.memoryCache.set(cacheKey, {
        data,
        expireTime,
        lastAccessTime: Date.now()
      });
    }

    // 2. 设置文件缓存
    try {
      const filePath = this.generateFilePath(category, key);
      const cacheItem: CacheItem<T> = {
        data,
        expireTime,
        lastAccessTime: Date.now()
      };

      await this.fileOps.writeJsonFile(filePath, cacheItem);
    } catch (error) {
      console.error(`[CacheManager] 设置缓存失败: ${category}:${key}`, error);
      // 文件写入失败不影响内存缓存
    }
  }

  /**
   * 删除缓存
   */
  async delete(category: string, key: string): Promise<void> {
    const cacheKey = this.generateCacheKey(category, key);

    // 1. 删除内存缓存
    this.memoryCache.delete(cacheKey);

    // 2. 删除文件缓存
    try {
      const filePath = this.generateFilePath(category, key);
      await this.fileOps.deleteFile(filePath);
    } catch (error) {
      console.error(`[CacheManager] 删除缓存失败: ${category}:${key}`, error);
    }
  }

  /**
   * 清理指定类别的缓存
   */
  async clearCategory(category: string): Promise<void> {
    // 1. 清理内存缓存
    for (const key of Array.from(this.memoryCache.keys())) {
      if (key.startsWith(`${category}:`)) {
        this.memoryCache.delete(key);
      }
    }

    // 2. 清理文件缓存
    try {
      const cacheDir = this.fileOps.getAbsolutePath(`cache/${category}`);
      const cleanedCount = await this.fileOps.cleanExpiredFiles(
        cacheDir,
        () => true // 清理所有文件
      );

      if (cleanedCount > 0 && process.env.NODE_ENV === 'development') {
        console.log(`[CacheManager] 清理类别 ${category} 的 ${cleanedCount} 个缓存项`);
      }
    } catch (error) {
      console.error(`[CacheManager] 清理类别缓存失败: ${category}`, error);
    }
  }

  /**
   * 清理所有过期缓存
   */
  async clearExpired(): Promise<void> {
    // 1. 清理内存缓存
    this.cleanupExpired();

    // 2. 清理文件缓存
    try {
      const cacheDir = this.fileOps.getAbsolutePath('cache');
      const entries = await this.fileOps.listDirectory(cacheDir);
      
      let totalCleaned = 0;
      
      for (const entry of entries) {
        const categoryPath = this.fileOps.getAbsolutePath(`cache/${entry}`);
        const cleanedCount = await this.fileOps.cleanExpiredFiles(
          categoryPath,
          (fileName, fileData) => {
            if (!fileData || typeof fileData !== 'object' || !('expireTime' in fileData)) {
              return true;
            }
            return fileData.expireTime ? Date.now() > fileData.expireTime : false;
          }
        );
        
        totalCleaned += cleanedCount;
      }

      if (totalCleaned > 0 && process.env.NODE_ENV === 'development') {
        console.log(`[CacheManager] 清理了 ${totalCleaned} 个过期文件缓存`);
      }
    } catch (error) {
      console.error('[CacheManager] 清理过期缓存失败:', error);
    }
  }

  /**
   * 批量获取缓存
   */
  async mget<T>(category: string, keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    const promises = keys.map(async (key) => {
      const value = await this.get<T>(category, key);
      results.set(key, value);
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * 批量设置缓存
   */
  async mset<T>(
    category: string, 
    entries: Array<{ key: string; data: T; ttl?: number }>
  ): Promise<void> {
    const promises = entries.map(({ key, data, ttl }) =>
      this.set(category, key, data, ttl)
    );

    await Promise.all(promises);
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    memoryCacheSize: number;
    memoryCacheItems: Array<{ key: string; size: number; expired: boolean }>;
    config: CacheConfig;
  } {
    const memoryCacheItems = Array.from(this.memoryCache.entries()).map(([key, item]) => ({
      key,
      size: JSON.stringify(item.data).length,
      expired: this.isExpired(item)
    }));

    return {
      memoryCacheSize: this.memoryCache.size,
      memoryCacheItems,
      config: { ...this.config }
    };
  }

  /**
   * 预热缓存
   */
  async warmup<T>(
    category: string,
    entries: Array<{ key: string; loader: () => Promise<T>; ttl?: number }>
  ): Promise<void> {
    const promises = entries.map(async ({ key, loader, ttl }) => {
      try {
        const data = await loader();
        await this.set(category, key, data, ttl);
      } catch (error) {
        console.error(`[CacheManager] 预热缓存失败: ${category}:${key}`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * 销毁缓存管理器
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.memoryCache.clear();
  }
}

/**
 * 简单的内存缓存实现（仅内存，不持久化）
 */
export class SimpleMemoryCache {
  private cache = new Map<string, { data: any; expireTime?: number }>();
  private defaultTTL: number;

  constructor(defaultTTL = 5 * 60 * 1000) {
    this.defaultTTL = defaultTTL;
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expireTime && Date.now() > item.expireTime) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      expireTime: ttl ? Date.now() + ttl : undefined
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}