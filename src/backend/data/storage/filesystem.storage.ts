/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import { promises as fs } from 'fs';
import path from 'path';

import { AdminConfig } from '@/lib/admin.types';
import {
  ContentStat,
  EpisodeSkipConfig,
  Favorite,
  IStorage,
  PlayRecord,
  PlayStatsResult,
  UserPlayStat,
} from '@/lib/types';
import { CacheManager } from './filesystem/cache-manager';
import { FileOperations } from './filesystem/file-operations';
import { StatisticsCalculator } from './filesystem/statistics-calculator';
import { AdminConfigManager } from './filesystem/admin-config-manager';

// 搜索历史最大条数
const SEARCH_HISTORY_LIMIT = 20;

// 数据类型转换辅助函数
function ensureString(value: any): string {
  return String(value);
}

export class FileSystemStorage implements IStorage {
  private fileOps: FileOperations;
  private cacheManager: CacheManager;
  private dataDir: string;
  private adminConfigManager: AdminConfigManager;

  constructor() {
    this.dataDir = process.env.FILE_SYSTEM_DATA_DIR || path.join(process.cwd(), 'data');
    
    // 初始化文件操作工具
    this.fileOps = new FileOperations(this.dataDir);
    
    // 初始化缓存管理器
    this.cacheManager = new CacheManager(this.fileOps, {
      maxSize: 1000,
      defaultTTL: 5 * 60 * 1000, // 5分钟
      cleanupInterval: 60 * 1000, // 1分钟
      enableMemoryCache: true,
    });
    
    // 初始化Admin配置管理器
    this.adminConfigManager = new AdminConfigManager(
      this.fileOps, 
      this.getConfigFilePath('admin.json')
    );
    
    // 初始化目录结构
    this.initDirectories().catch(console.error);
  }

  private async initDirectories(): Promise<void> {
    const directories = [
      'users',
      'cache',
      'config',
      'stats',
      'temp',
      'cache/tmdb',
      'cache/douban',
      'cache/shortdrama',
      'cache/netdisk',
      'cache/youtube',
      'cache/danmu',
      'stats/userstats',
    ];

    await this.fileOps.initDirectories(directories);
    console.log(`[FileSystem] 数据目录初始化完成: ${this.dataDir}`);
  }

  private getUserDir(username: string): string {
    return path.join('users', username);
  }

  private async ensureUserDir(username: string): Promise<void> {
    const userDir = this.getUserDir(username);
    await this.fileOps.ensureDirectory(this.fileOps.getAbsolutePath(userDir));
  }

  private getUserFilePath(username: string, fileName: string): string {
    return this.fileOps.getAbsolutePath(
      path.join(this.getUserDir(username), fileName)
    );
  }

  private getConfigFilePath(fileName: string): string {
    return this.fileOps.getAbsolutePath(path.join('config', fileName));
  }

  private getStatsFilePath(fileName: string): string {
    return this.fileOps.getAbsolutePath(path.join('stats', fileName));
  }

  private getUserStatsFilePath(username: string): string {
    return this.fileOps.getAbsolutePath(
      path.join('stats/userstats', `${username}.json`)
    );
  }

  // 缓存辅助方法
  private async getWithCache<T>(
    category: string,
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    // 先检查缓存
    const cached = await this.cacheManager.get<T>(category, key);
    if (cached !== null) {
      return cached;
    }

    // 从数据源获取
    const data = await fetcher();

    // 更新缓存
    await this.cacheManager.set(category, key, data);

    return data;
  }

  // ---------- 播放记录 ----------
  async getPlayRecord(
    userName: string,
    key: string
  ): Promise<PlayRecord | null> {
    return this.getWithCache(`playrecords_${userName}`, key, async () => {
      const filePath = this.getUserFilePath(userName, 'playrecords.json');
      const records = await this.fileOps.readJsonFile<
        Record<string, PlayRecord>
      >(filePath);
      return records?.[key] || null;
    });
  }

  async setPlayRecord(
    userName: string,
    key: string,
    record: PlayRecord
  ): Promise<void> {
    await this.ensureUserDir(userName);
    const filePath = this.getUserFilePath(userName, 'playrecords.json');

    const records =
      (await this.fileOps.readJsonFile<Record<string, PlayRecord>>(filePath)) ||
      {};
    records[key] = record;
    await this.fileOps.writeJsonFile(filePath, records);

    // 更新缓存
    await this.cacheManager.set(`playrecords_${userName}`, key, record);
  }

  async getAllPlayRecords(
    userName: string
  ): Promise<Record<string, PlayRecord>> {
    const filePath = this.getUserFilePath(userName, 'playrecords.json');
    const records = await this.fileOps.readJsonFile<Record<string, PlayRecord>>(
      filePath
    );

    if (records) {
      // 批量更新缓存
      const cacheEntries = Object.entries(records).map(([key, record]) => ({
        key,
        data: record,
      }));
      await this.cacheManager.mset(`playrecords_${userName}`, cacheEntries);
    }

    return records || {};
  }

  async deletePlayRecord(userName: string, key: string): Promise<void> {
    const filePath = this.getUserFilePath(userName, 'playrecords.json');

    const records = await this.fileOps.readJsonFile<Record<string, PlayRecord>>(
      filePath
    );
    if (records && records[key]) {
      delete records[key];
      await this.fileOps.writeJsonFile(filePath, records);
      await this.cacheManager.delete(`playrecords_${userName}`, key);
    }
  }

  // ---------- 收藏 ----------
  async getFavorite(userName: string, key: string): Promise<Favorite | null> {
    return this.getWithCache(`favorites_${userName}`, key, async () => {
      const filePath = this.getUserFilePath(userName, 'favorites.json');
      const favorites = await this.fileOps.readJsonFile<
        Record<string, Favorite>
      >(filePath);
      return favorites?.[key] || null;
    });
  }

  async setFavorite(
    userName: string,
    key: string,
    favorite: Favorite
  ): Promise<void> {
    await this.ensureUserDir(userName);
    const filePath = this.getUserFilePath(userName, 'favorites.json');

    const favorites =
      (await this.fileOps.readJsonFile<Record<string, Favorite>>(filePath)) ||
      {};
    favorites[key] = favorite;
    await this.fileOps.writeJsonFile(filePath, favorites);

    // 更新缓存
    await this.cacheManager.set(`favorites_${userName}`, key, favorite);
  }

  async getAllFavorites(userName: string): Promise<Record<string, Favorite>> {
    const filePath = this.getUserFilePath(userName, 'favorites.json');
    const favorites = await this.fileOps.readJsonFile<Record<string, Favorite>>(
      filePath
    );

    if (favorites) {
      // 批量更新缓存
      const cacheEntries = Object.entries(favorites).map(([key, favorite]) => ({
        key,
        data: favorite,
      }));
      await this.cacheManager.mset(`favorites_${userName}`, cacheEntries);
    }

    return favorites || {};
  }

  async deleteFavorite(userName: string, key: string): Promise<void> {
    const filePath = this.getUserFilePath(userName, 'favorites.json');

    const favorites = await this.fileOps.readJsonFile<Record<string, Favorite>>(
      filePath
    );
    if (favorites && favorites[key]) {
      delete favorites[key];
      await this.fileOps.writeJsonFile(filePath, favorites);
      await this.cacheManager.delete(`favorites_${userName}`, key);
    }
  }

  // ---------- 用户注册 / 登录 ----------
  private getUserProfilePath(userName: string): string {
    return this.getUserFilePath(userName, 'profile.json');
  }

  async registerUser(userName: string, password: string): Promise<void> {
    await this.ensureUserDir(userName);

    // 检查用户是否已存在
    const exists = await this.checkUserExist(userName);
    if (exists) {
      throw new Error('用户已存在');
    }

    // 保存用户信息
    const profilePath = this.getUserProfilePath(userName);
    const profile = {
      username: userName,
      password: password, // 生产环境应加密
      createdAt: Date.now(),
      lastLoginTime: 0,
      loginCount: 0,
      role: 'user',
    };

    await this.fileOps.writeJsonFile(profilePath, profile);
    console.log(`[FileSystem] 用户注册成功: ${userName}`);
  }

  async verifyUser(userName: string, password: string): Promise<boolean> {
    const profilePath = this.getUserProfilePath(userName);
    const profile = await this.fileOps.readJsonFile<any>(profilePath);

    if (!profile) {
      return false;
    }

    return ensureString(profile.password) === password;
  }

  async checkUserExist(userName: string): Promise<boolean> {
    const profilePath = this.getUserProfilePath(userName);
    const profile = await this.fileOps.readJsonFile<any>(profilePath);
    return profile !== null;
  }

  async changePassword(userName: string, newPassword: string): Promise<void> {
    const profilePath = this.getUserProfilePath(userName);
    const profile = await this.fileOps.readJsonFile<any>(profilePath);

    if (!profile) {
      throw new Error('用户不存在');
    }

    profile.password = newPassword; // 生产环境应加密
    profile.updatedAt = Date.now();

    await this.fileOps.writeJsonFile(profilePath, profile);
    console.log(`[FileSystem] 用户密码已更新: ${userName}`);
  }

  async deleteUser(userName: string): Promise<void> {
    const userDir = this.fileOps.getAbsolutePath(this.getUserDir(userName));

    try {
      // 删除整个用户目录
      await fs.rm(userDir, { recursive: true, force: true });
      console.log(`[FileSystem] 用户已删除: ${userName}`);
    } catch (error) {
      console.error(`[FileSystem] 删除用户失败: ${userName}`, error);
      throw error;
    }
  }

  async getAllUsers(): Promise<string[]> {
    try {
      const usersDir = this.fileOps.getAbsolutePath('users');
      const entries = await fs.readdir(usersDir, { withFileTypes: true });
      const users = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => ensureString(entry.name));

      return users;
    } catch (error) {
      console.error('[FileSystem] 获取用户列表失败:', error);
      return [];
    }
  }

  // ---------- 搜索历史 ----------
  async getSearchHistory(userName: string): Promise<string[]> {
    return this.getWithCache(`searchhistory_${userName}`, 'main', async () => {
      const filePath = this.getUserFilePath(userName, 'searchhistory.json');
      const history = await this.fileOps.readJsonFile<string[]>(filePath);
      return history || [];
    });
  }

  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    await this.ensureUserDir(userName);
    const filePath = this.getUserFilePath(userName, 'searchhistory.json');

    let history = (await this.fileOps.readJsonFile<string[]>(filePath)) || [];

    // 去重
    history = history.filter((item) => item !== keyword);

    // 插入到最前
    history.unshift(ensureString(keyword));

    // 限制最大长度
    if (history.length > SEARCH_HISTORY_LIMIT) {
      history = history.slice(0, SEARCH_HISTORY_LIMIT);
    }

    await this.fileOps.writeJsonFile(filePath, history);

    // 更新缓存
    await this.cacheManager.set(`searchhistory_${userName}`, 'main', history);
  }

  async deleteSearchHistory(userName: string, keyword?: string): Promise<void> {
    const filePath = this.getUserFilePath(userName, 'searchhistory.json');

    if (keyword) {
      let history = (await this.fileOps.readJsonFile<string[]>(filePath)) || [];
      history = history.filter((item) => item !== keyword);
      await this.fileOps.writeJsonFile(filePath, history);

      // 更新缓存
      await this.cacheManager.set(`searchhistory_${userName}`, 'main', history);
    } else {
      await this.fileOps.deleteFile(filePath);
      await this.cacheManager.clearCategory(`searchhistory_${userName}`);
    }
  }

  // ---------- 管理员配置 ----------
  private adminConfigPath() {
    return this.getConfigFilePath('admin.json');
  }

  async getAdminConfig(): Promise<AdminConfig | null> {
    return await this.adminConfigManager.loadAdminConfig();
  }

  async setAdminConfig(config: AdminConfig): Promise<void> {
    await this.adminConfigManager.saveAdminConfig(config);
  }

  /**
   * 保存订阅配置到源配置文件
   */
  async saveSubscriptionConfigToSourceFile(configContent: string): Promise<boolean> {
    return await this.adminConfigManager.saveSubscriptionConfig(configContent);
  }

  /**
   * 从源配置文件中删除指定的源
   */
  async removeSourcesFromSourceFile(keys: string[]): Promise<boolean> {
    return await this.adminConfigManager.removeSources(keys);
  }

  // ---------- 跳过片头片尾配置 ----------
  async getSkipConfig(
    userName: string,
    source: string,
    id: string
  ): Promise<EpisodeSkipConfig | null> {
    return this.getWithCache(
      `skipconfigs_${userName}`,
      `${source}+${id}`,
      async () => {
        const filePath = this.getUserFilePath(userName, 'skipconfigs.json');
        const configs = await this.fileOps.readJsonFile<
          Record<string, EpisodeSkipConfig>
        >(filePath);
        const key = `${source}+${id}`;
        return configs?.[key] || null;
      }
    );
  }

  async setSkipConfig(
    userName: string,
    source: string,
    id: string,
    config: EpisodeSkipConfig
  ): Promise<void> {
    await this.ensureUserDir(userName);
    const filePath = this.getUserFilePath(userName, 'skipconfigs.json');

    const configs =
      (await this.fileOps.readJsonFile<Record<string, EpisodeSkipConfig>>(
        filePath
      )) || {};
    const key = `${source}+${id}`;
    configs[key] = config;
    await this.fileOps.writeJsonFile(filePath, configs);

    // 更新缓存
    await this.cacheManager.set(`skipconfigs_${userName}`, key, config);
  }

  async deleteSkipConfig(
    userName: string,
    source: string,
    id: string
  ): Promise<void> {
    const filePath = this.getUserFilePath(userName, 'skipconfigs.json');

    const configs = await this.fileOps.readJsonFile<
      Record<string, EpisodeSkipConfig>
    >(filePath);
    if (configs) {
      const key = `${source}+${id}`;
      if (configs[key]) {
        delete configs[key];
        await this.fileOps.writeJsonFile(filePath, configs);
        await this.cacheManager.delete(`skipconfigs_${userName}`, key);
      }
    }
  }

  async getAllSkipConfigs(
    userName: string
  ): Promise<{ [key: string]: EpisodeSkipConfig }> {
    const filePath = this.getUserFilePath(userName, 'skipconfigs.json');
    const configs = await this.fileOps.readJsonFile<
      Record<string, EpisodeSkipConfig>
    >(filePath);

    if (configs) {
      // 批量更新缓存
      const cacheEntries = Object.entries(configs).map(([key, config]) => ({
        key,
        data: config,
      }));
      await this.cacheManager.mset(`skipconfigs_${userName}`, cacheEntries);
    }

    return configs || {};
  }

  // ---------- 剧集跳过配置（新版，多片段支持）----------
  async getEpisodeSkipConfig(
    userName: string,
    source: string,
    id: string
  ): Promise<EpisodeSkipConfig | null> {
    return this.getWithCache(
      `episodeskipconfigs_${userName}`,
      `${source}+${id}`,
      async () => {
        const filePath = this.getUserFilePath(
          userName,
          'episodeskipconfigs.json'
        );
        const configs = await this.fileOps.readJsonFile<
          Record<string, EpisodeSkipConfig>
        >(filePath);
        const key = `${source}+${id}`;
        return configs?.[key] || null;
      }
    );
  }

  async saveEpisodeSkipConfig(
    userName: string,
    source: string,
    id: string,
    config: EpisodeSkipConfig
  ): Promise<void> {
    await this.ensureUserDir(userName);
    const filePath = this.getUserFilePath(userName, 'episodeskipconfigs.json');

    const configs =
      (await this.fileOps.readJsonFile<Record<string, EpisodeSkipConfig>>(
        filePath
      )) || {};
    const key = `${source}+${id}`;
    configs[key] = config;
    await this.fileOps.writeJsonFile(filePath, configs);

    // 更新缓存
    await this.cacheManager.set(`episodeskipconfigs_${userName}`, key, config);
  }

  async deleteEpisodeSkipConfig(
    userName: string,
    source: string,
    id: string
  ): Promise<void> {
    const filePath = this.getUserFilePath(userName, 'episodeskipconfigs.json');

    const configs = await this.fileOps.readJsonFile<
      Record<string, EpisodeSkipConfig>
    >(filePath);
    if (configs) {
      const key = `${source}+${id}`;
      if (configs[key]) {
        delete configs[key];
        await this.fileOps.writeJsonFile(filePath, configs);
        await this.cacheManager.delete(`episodeskipconfigs_${userName}`, key);
      }
    }
  }

  async getAllEpisodeSkipConfigs(
    userName: string
  ): Promise<{ [key: string]: EpisodeSkipConfig }> {
    const filePath = this.getUserFilePath(userName, 'episodeskipconfigs.json');
    const configs = await this.fileOps.readJsonFile<
      Record<string, EpisodeSkipConfig>
    >(filePath);

    if (configs) {
      // 批量更新缓存
      const cacheEntries = Object.entries(configs).map(([key, config]) => ({
        key,
        data: config,
      }));
      await this.cacheManager.mset(
        `episodeskipconfigs_${userName}`,
        cacheEntries
      );
    }

    return configs || {};
  }

  // 清空所有数据
  async clearAllData(): Promise<void> {
    try {
      // 备份当前数据
      const backupDir = path.join(this.dataDir, `backup_${Date.now()}`);
      await this.fileOps.backupData(this.dataDir, path.basename(backupDir));

      // 清空所有子目录
      const dirs = ['users', 'cache', 'config', 'stats', 'temp'];
      await Promise.all(
        dirs.map(async (dir) => {
          try {
            const dirPath = this.fileOps.getAbsolutePath(dir);
            await fs.rm(dirPath, { recursive: true, force: true });
            await fs.mkdir(dirPath, { recursive: true });
          } catch (error) {
            console.error(`[FileSystem] 清空目录失败: ${dir}`, error);
          }
        })
      );

      console.log('[FileSystem] 所有数据已清空，备份已保存到:', backupDir);
    } catch (error) {
      console.error('[FileSystem] 清空数据失败:', error);
      throw new Error('清空数据失败');
    }
  }

  // ---------- 通用缓存方法 ----------
  async getCache(key: string): Promise<any | null> {
    return this.cacheManager.get('cache', key);
  }

  async setCache(
    key: string,
    data: any,
    expireSeconds?: number
  ): Promise<void> {
    await this.cacheManager.set('cache', key, data, expireSeconds);
  }

  async deleteCache(key: string): Promise<void> {
    await this.cacheManager.delete('cache', key);
  }

  async clearExpiredCache(prefix?: string): Promise<void> {
    if (prefix) {
      this.cacheManager.clearCategory(prefix);
    } else {
      this.cacheManager.clearExpired();
    }
  }

  // ---------- 播放统计相关 ----------
  // 获取全站播放统计
  async getPlayStats(): Promise<PlayStatsResult> {
    return this.getWithCache('playstats', 'summary', async () => {
      const allUsers = await this.getAllUsers();
      const userStatsMap = new Map<string, UserPlayStat>();

      // 收集所有用户的播放记录和统计
      for (const username of allUsers) {
        try {
          const playRecords = await this.getAllPlayRecords(username);
          const userProfile = await this.fileOps.readJsonFile<any>(
            this.getUserFilePath(username, 'profile.json')
          );

          const userStat = StatisticsCalculator.calculateUserStats(
            username,
            playRecords,
            userProfile
          );

          userStatsMap.set(username, userStat);
        } catch (error) {
          console.error(`[FileSystem] 计算用户 ${username} 统计失败:`, error);
        }
      }

      // 使用统计计算器计算全站统计
      const result = StatisticsCalculator.calculatePlayStats(
        allUsers,
        userStatsMap
      );

      // 缓存结果
      await this.cacheManager.set('playstats', 'summary', result, 1800); // 30分钟

      return result;
    });
  }

  // 获取用户播放统计
  async getUserPlayStat(userName: string): Promise<UserPlayStat> {
    return this.getWithCache('userstats', userName, async () => {
      const playRecords = await this.getAllPlayRecords(userName);
      const userProfile = await this.fileOps.readJsonFile<any>(
        this.getUserFilePath(userName, 'profile.json')
      );

      // 使用统计计算器计算用户统计
      const result = StatisticsCalculator.calculateUserStats(
        userName,
        playRecords,
        userProfile
      );

      // 缓存结果
      await this.cacheManager.set('userstats', userName, result, 1800); // 30分钟

      return result;
    });
  }

  async getContentStats(limit = 10): Promise<ContentStat[]> {
    try {
      const allUsers = await this.getAllUsers();
      const allUsersPlayRecords = new Map<string, Record<string, PlayRecord>>();

      // 收集所有用户的播放记录
      for (const username of allUsers) {
        const playRecords = await this.getAllPlayRecords(username);
        allUsersPlayRecords.set(username, playRecords);
      }

      // 使用统计计算器计算内容统计
      return StatisticsCalculator.calculateContentStats(
        allUsersPlayRecords,
        limit
      );
    } catch (error) {
      console.error('获取内容统计失败:', error);
      return [];
    }
  }

  async updatePlayStatistics(
    userName: string,
    source: string,
    id: string,
    watchTime: number
  ): Promise<void> {
    try {
      // 清除相关缓存
      this.cacheManager.clearCategory('playstats');
      this.cacheManager.clearCategory(`userstats_${userName}`);

      // 异步更新统计数据
      setImmediate(async () => {
        try {
          await this.getPlayStats();
          await this.getUserPlayStat(userName);
        } catch (error) {
          console.error('更新播放统计失败:', error);
        }
      });
    } catch (error) {
      console.error('更新播放统计失败:', error);
    }
  }

  // 更新用户登入统计
  async updateUserLoginStats(
    userName: string,
    loginTime: number,
    isFirstLogin?: boolean
  ): Promise<void> {
    try {
      const profilePath = this.getUserProfilePath(userName);
      let profile = await this.fileOps.readJsonFile<any>(profilePath);

      if (!profile) {
        profile = {
          username: userName,
          createdAt: loginTime,
          loginCount: 0,
          firstLoginTime: 0,
          lastLoginTime: 0,
        };
      }

      // 更新登入统计
      profile.loginCount = (profile.loginCount || 0) + 1;
      profile.lastLoginTime = loginTime;

      if (isFirstLogin || !profile.firstLoginTime) {
        profile.firstLoginTime = loginTime;
      }

      await this.fileOps.writeJsonFile(profilePath, profile);

      console.log(`[FileSystem] 用户 ${userName} 登入统计已更新:`, {
        loginCount: profile.loginCount,
        firstLoginTime: profile.firstLoginTime,
        lastLoginTime: profile.lastLoginTime,
      });
    } catch (error) {
      console.error(`更新用户 ${userName} 登入统计失败:`, error);
      throw error;
    }
  }

  // ---------- 扩展功能 ----------

  // 存储健康检查
  async checkStorageHealth(): Promise<any> {
    try {
      const stats = await this.fileOps.getFileStats(this.dataDir);

      if (!stats) {
        return {
          available: false,
          totalSpace: 0,
          usedSpace: 0,
          freeSpace: 0,
          errors: ['无法获取存储统计'],
        };
      }

      // 简化的空间计算（实际项目中可能需要更精确的计算）
      const totalSpace = 100 * 1024 * 1024 * 1024; // 假设100GB
      const usedSpace = await this.fileOps.calculateDirectorySize(this.dataDir);
      const freeSpace = totalSpace - usedSpace;

      return {
        available: true,
        totalSpace,
        usedSpace,
        freeSpace,
        errors: [],
      };
    } catch (error) {
      return {
        available: false,
        totalSpace: 0,
        usedSpace: 0,
        freeSpace: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  // 数据导出
  async exportUserData(userName: string): Promise<Buffer> {
    try {
      const userDir = this.fileOps.getAbsolutePath(this.getUserDir(userName));
      const userData: any = {};

      // 收集用户所有数据
      const files = [
        'playrecords.json',
        'favorites.json',
        'searchhistory.json',
        'skipconfigs.json',
        'episodeskipconfigs.json',
        'profile.json',
      ];

      for (const file of files) {
        const filePath = path.join(userDir, file);
        const data = await this.fileOps.readJsonFile(filePath);
        if (data) {
          userData[file.replace('.json', '')] = data;
        }
      }

      return Buffer.from(JSON.stringify(userData, null, 2));
    } catch (error) {
      console.error(`[FileSystem] 导出用户数据失败: ${userName}`, error);
      throw error;
    }
  }

  // 数据导入
  async importUserData(userName: string, data: Buffer): Promise<void> {
    try {
      const userData = JSON.parse(data.toString());
      await this.ensureUserDir(userName);
      const userDir = this.fileOps.getAbsolutePath(this.getUserDir(userName));

      // 导入用户数据
      for (const [key, value] of Object.entries(userData)) {
        const filePath = path.join(userDir, `${key}.json`);
        await this.fileOps.writeJsonFile(filePath, value);
      }

      // 清除相关缓存
      this.cacheManager.clearCategory(userName);

      console.log(`[FileSystem] 用户数据导入成功: ${userName}`);
    } catch (error) {
      console.error(`[FileSystem] 导入用户数据失败: ${userName}`, error);
      throw error;
    }
  }
}
