/* eslint-disable no-console, @typescript-eslint/no-explicit-any */

import { AdminConfig } from './admin.types';
import {
  ContentStat,
  EpisodeSkipConfig,
  Favorite,
  IStorage,
  PlayRecord,
  PlayStatsResult,
  UserPlayStat,
} from './types';
import fs from 'fs';
import path from 'path';

// 确保数据目录存在
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_DIR = path.join(DATA_DIR, 'users');
const SYSTEM_DIR = path.join(DATA_DIR, 'system');

// 创建必要的目录
function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_DIR)) {
    fs.mkdirSync(USERS_DIR, { recursive: true });
  }
  if (!fs.existsSync(SYSTEM_DIR)) {
    fs.mkdirSync(SYSTEM_DIR, { recursive: true });
  }
}

ensureDirectories();

// 工具函数：读取JSON文件
function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
  }
  return defaultValue;
}

// 工具函数：写入JSON文件
function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing file ${filePath}:`, err);
  }
}

// 工具函数：删除文件
function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Error deleting file ${filePath}:`, err);
  }
}

export class FileStorage implements IStorage {
  private getUserDir(userName: string): string {
    return path.join(USERS_DIR, userName);
  }

  private getUserFile(userName: string, fileName: string): string {
    return path.join(this.getUserDir(userName), fileName);
  }

  private getSystemFile(fileName: string): string {
    return path.join(SYSTEM_DIR, fileName);
  }

  // ---------- 播放记录 ----------
  private prKey(key: string): string {
    return `pr_${key}.json`;
  }

  async getPlayRecord(
    userName: string,
    key: string
  ): Promise<PlayRecord | null> {
    const filePath = this.getUserFile(userName, this.prKey(key));
    return readJsonFile<PlayRecord | null>(filePath, null);
  }

  async setPlayRecord(
    userName: string,
    key: string,
    record: PlayRecord
  ): Promise<void> {
    const filePath = this.getUserFile(userName, this.prKey(key));
    writeJsonFile(filePath, record);
  }

  async getAllPlayRecords(
    userName: string
  ): Promise<Record<string, PlayRecord>> {
    const userDir = this.getUserDir(userName);
    const records: Record<string, PlayRecord> = {};

    if (!fs.existsSync(userDir)) {
      return records;
    }

    const files = fs.readdirSync(userDir);
    for (const file of files) {
      if (file.startsWith('pr_') && file.endsWith('.json')) {
        const key = file.substring(3, file.length - 5); // 移除 'pr_' 前缀和 '.json' 后缀
        const filePath = path.join(userDir, file);
        const record = readJsonFile<PlayRecord | null>(filePath, null);
        if (record) {
          records[key] = record;
        }
      }
    }

    return records;
  }

  async deletePlayRecord(userName: string, key: string): Promise<void> {
    const filePath = this.getUserFile(userName, this.prKey(key));
    deleteFile(filePath);
  }

  // ---------- 收藏 ----------
  private favKey(key: string): string {
    return `fav_${key}.json`;
  }

  async getFavorite(
    userName: string,
    key: string
  ): Promise<Favorite | null> {
    const filePath = this.getUserFile(userName, this.favKey(key));
    return readJsonFile<Favorite | null>(filePath, null);
  }

  async setFavorite(
    userName: string,
    key: string,
    favorite: Favorite
  ): Promise<void> {
    const filePath = this.getUserFile(userName, this.favKey(key));
    writeJsonFile(filePath, favorite);
  }

  async getAllFavorites(
    userName: string
  ): Promise<Record<string, Favorite>> {
    const userDir = this.getUserDir(userName);
    const favorites: Record<string, Favorite> = {};

    if (!fs.existsSync(userDir)) {
      return favorites;
    }

    const files = fs.readdirSync(userDir);
    for (const file of files) {
      if (file.startsWith('fav_') && file.endsWith('.json')) {
        const key = file.substring(4, file.length - 5); // 移除 'fav_' 前缀和 '.json' 后缀
        const filePath = path.join(userDir, file);
        const favorite = readJsonFile<Favorite | null>(filePath, null);
        if (favorite) {
          favorites[key] = favorite;
        }
      }
    }

    return favorites;
  }

  async deleteFavorite(userName: string, key: string): Promise<void> {
    const filePath = this.getUserFile(userName, this.favKey(key));
    deleteFile(filePath);
  }

  // ---------- 用户相关 ----------
  private userFile(userName: string): string {
    return path.join(USERS_DIR, `${userName}.json`);
  }

  private passwordFile(): string {
    return this.getSystemFile('passwords.json');
  }

  async registerUser(userName: string, password: string): Promise<void> {
    const passwords = readJsonFile<Record<string, string>>(
      this.passwordFile(),
      {}
    );
    passwords[userName] = password;
    writeJsonFile(this.passwordFile(), passwords);
  }

  async verifyUser(userName: string, password: string): Promise<boolean> {
    // 首先检查是否是环境变量中设置的用户
    const envUsername = process.env.USERNAME;
    const envPassword = process.env.PASSWORD;
    
    if (envUsername && envPassword && userName === envUsername && password === envPassword) {
      return true;
    }
    
    // 然后检查文件存储中的用户
    const passwords = readJsonFile<Record<string, string>>(
      this.passwordFile(),
      {}
    );
    return passwords[userName] === password;
  }

  async checkUserExist(userName: string): Promise<boolean> {
    // 检查环境变量用户
    const envUsername = process.env.USERNAME;
    if (envUsername && userName === envUsername) {
      return true;
    }
    
    // 检查文件存储中的用户
    const passwords = readJsonFile<Record<string, string>>(
      this.passwordFile(),
      {}
    );
    return userName in passwords;
  }

  async changePassword(userName: string, newPassword: string): Promise<void> {
    // 检查是否是环境变量用户
    const envUsername = process.env.USERNAME;
    if (envUsername && userName === envUsername) {
      // 环境变量用户不能通过应用更改密码
      throw new Error('Cannot change password for environment variable user');
    }
    
    const passwords = readJsonFile<Record<string, string>>(
      this.passwordFile(),
      {}
    );
    passwords[userName] = newPassword;
    writeJsonFile(this.passwordFile(), passwords);
  }

  async deleteUser(userName: string): Promise<void> {
    // 检查是否是环境变量用户
    const envUsername = process.env.USERNAME;
    if (envUsername && userName === envUsername) {
      // 环境变量用户不能被删除
      throw new Error('Cannot delete environment variable user');
    }
    
    // 删除用户密码
    const passwords = readJsonFile<Record<string, string>>(
      this.passwordFile(),
      {}
    );
    delete passwords[userName];
    writeJsonFile(this.passwordFile(), passwords);

    // 删除用户目录
    const userDir = this.getUserDir(userName);
    if (fs.existsSync(userDir)) {
      fs.rmSync(userDir, { recursive: true, force: true });
    }

    // 删除用户文件（如果存在）
    const userFile = this.userFile(userName);
    deleteFile(userFile);
  }

  // ---------- 搜索历史 ----------
  private searchHistoryFile(userName: string): string {
    return this.getUserFile(userName, 'search_history.json');
  }

  async getSearchHistory(userName: string): Promise<string[]> {
    const filePath = this.searchHistoryFile(userName);
    return readJsonFile<string[]>(filePath, []);
  }

  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    const filePath = this.searchHistoryFile(userName);
    const history = await this.getSearchHistory(userName);
    
    // 移除已存在的相同关键词
    const filteredHistory = history.filter((item) => item !== keyword);
    
    // 将新关键词添加到开头
    filteredHistory.unshift(keyword);
    
    // 限制历史记录数量
    if (filteredHistory.length > 20) {
      filteredHistory.splice(20);
    }
    
    writeJsonFile(filePath, filteredHistory);
  }

  async deleteSearchHistory(userName: string, keyword?: string): Promise<void> {
    const filePath = this.searchHistoryFile(userName);
    
    if (keyword) {
      // 删除特定关键词
      const history = await this.getSearchHistory(userName);
      const filteredHistory = history.filter((item) => item !== keyword);
      writeJsonFile(filePath, filteredHistory);
    } else {
      // 删除所有搜索历史
      deleteFile(filePath);
    }
  }

  // ---------- 用户列表 ----------
  async getAllUsers(): Promise<string[]> {
    const users: string[] = [];
    
    // 添加环境变量中的用户（如果存在）
    const envUsername = process.env.USERNAME;
    if (envUsername) {
      users.push(envUsername);
    }
    
    // 添加文件存储中的用户
    if (!fs.existsSync(USERS_DIR)) {
      return users;
    }

    const files = fs.readdirSync(USERS_DIR);
    for (const file of files) {
      const fullPath = path.join(USERS_DIR, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 避免重复添加环境变量用户
        if (!users.includes(file)) {
          users.push(file);
        }
      }
    }
    
    // 添加密码文件中的用户
    const passwords = readJsonFile<Record<string, string>>(
      this.passwordFile(),
      {}
    );
    
    for (const username in passwords) {
      if (!users.includes(username)) {
        users.push(username);
      }
    }
    
    return users;
  }

  // ---------- 管理员配置 ----------
  private adminConfigFile(): string {
    return this.getSystemFile('admin_config.json');
  }

  async getAdminConfig(): Promise<AdminConfig | null> {
    const config = readJsonFile<AdminConfig | null>(this.adminConfigFile(), null);
    // 如果配置文件不存在或为空，返回null以便上层可以处理初始化逻辑
    if (!config) {
      return null;
    }
    return config;
  }

  async setAdminConfig(config: AdminConfig): Promise<void> {
    writeJsonFile(this.adminConfigFile(), config);
  }

  // ---------- 跳过片头片尾配置 ----------
  private skipConfigKey(source: string, id: string): string {
    return `skip_${source}_${id}.json`;
  }

  async getSkipConfig(
    userName: string,
    source: string,
    id: string
  ): Promise<EpisodeSkipConfig | null> {
    const key = this.skipConfigKey(source, id);
    const filePath = this.getUserFile(userName, key);
    return readJsonFile<EpisodeSkipConfig | null>(filePath, null);
  }

  async setSkipConfig(
    userName: string,
    source: string,
    id: string,
    config: EpisodeSkipConfig
  ): Promise<void> {
    const key = this.skipConfigKey(source, id);
    const filePath = this.getUserFile(userName, key);
    writeJsonFile(filePath, config);
  }

  async deleteSkipConfig(
    userName: string,
    source: string,
    id: string
  ): Promise<void> {
    const key = this.skipConfigKey(source, id);
    const filePath = this.getUserFile(userName, key);
    deleteFile(filePath);
  }

  async getAllSkipConfigs(
    userName: string
  ): Promise<Record<string, EpisodeSkipConfig>> {
    const userDir = this.getUserDir(userName);
    const configs: Record<string, EpisodeSkipConfig> = {};

    if (!fs.existsSync(userDir)) {
      return configs;
    }

    const files = fs.readdirSync(userDir);
    for (const file of files) {
      if (file.startsWith('skip_') && file.endsWith('.json')) {
        const parts = file.substring(5, file.length - 5).split('_'); // 移除 'skip_' 前缀和 '.json' 后缀
        if (parts.length >= 2) {
          const source = parts[0];
          const id = parts.slice(1).join('_');
          const key = `${source}+${id}`;
          const filePath = path.join(userDir, file);
          const config = readJsonFile<EpisodeSkipConfig | null>(filePath, null);
          if (config) {
            configs[key] = config;
          }
        }
      }
    }

    return configs;
  }

  // ---------- 数据清理 ----------
  async clearAllData(): Promise<void> {
    // 删除所有用户数据
    if (fs.existsSync(USERS_DIR)) {
      fs.rmSync(USERS_DIR, { recursive: true, force: true });
    }
    
    // 删除系统数据
    if (fs.existsSync(SYSTEM_DIR)) {
      fs.rmSync(SYSTEM_DIR, { recursive: true, force: true });
    }
    
    // 重新创建目录
    ensureDirectories();
  }

  // ---------- 通用缓存 ----------
  private cacheFile(key: string): string {
    // 将键转换为文件路径友好的格式
    const safeKey = key.replace(/[^a-zA-Z0-9._-]/g, '_');
    return this.getSystemFile(`cache_${safeKey}.json`);
  }

  async getCache(key: string): Promise<any | null> {
    const filePath = this.cacheFile(key);
    return readJsonFile<any | null>(filePath, null);
  }

  async setCache(key: string, data: any, expireSeconds?: number): Promise<void> {
    const filePath = this.cacheFile(key);
    
    if (expireSeconds) {
      // 添加过期时间信息
      const expiredData = {
        data,
        expireAt: Date.now() + expireSeconds * 1000,
      };
      writeJsonFile(filePath, expiredData);
    } else {
      writeJsonFile(filePath, data);
    }
  }

  async deleteCache(key: string): Promise<void> {
    const filePath = this.cacheFile(key);
    deleteFile(filePath);
  }

  async clearExpiredCache(prefix?: string): Promise<void> {
    if (!fs.existsSync(SYSTEM_DIR)) {
      return;
    }

    const files = fs.readdirSync(SYSTEM_DIR);
    const now = Date.now();
    
    for (const file of files) {
      if (file.startsWith('cache_') && file.endsWith('.json')) {
        // 检查是否匹配前缀（如果提供了前缀）
        if (prefix && !file.startsWith(`cache_${prefix}`)) {
          continue;
        }
        
        const filePath = path.join(SYSTEM_DIR, file);
        try {
          const data = readJsonFile<{ expireAt?: number } | null>(filePath, null);
          if (data && data.expireAt && data.expireAt < now) {
            deleteFile(filePath);
          }
        } catch (err) {
          console.error(`Error checking cache expiration for ${file}:`, err);
        }
      }
    }
  }

  // ---------- 播放统计 ----------
  private playStatsFile(): string {
    return this.getSystemFile('play_stats.json');
  }

  private userStatsFile(userName: string): string {
    return this.getUserFile(userName, 'user_stats.json');
  }

  private contentStatsFile(): string {
    return this.getSystemFile('content_stats.json');
  }

  async getPlayStats(): Promise<PlayStatsResult> {
    const statsFile = this.playStatsFile();
    const stats = readJsonFile<PlayStatsResult>(statsFile, {
      users: [],
      content: [],
      total: {
        playCount: 0,
        uniqueUsers: 0,
        totalWatchTime: 0,
      },
      activeUsers: {
        daily: 0,
        weekly: 0,
        monthly: 0,
      },
    });
    return stats;
  }

  async getUserPlayStat(userName: string): Promise<UserPlayStat> {
    const userStatsFile = this.userStatsFile(userName);
    const defaultStat: UserPlayStat = {
      userName,
      playCount: 0,
      totalWatchTime: 0,
      favoriteCount: 0,
      firstPlayDate: Date.now(),
      lastPlayDate: Date.now(),
    };
    
    const userStat = readJsonFile<UserPlayStat>(userStatsFile, defaultStat);
    return userStat;
  }

  async getContentStats(limit?: number): Promise<ContentStat[]> {
    const contentStatsFile = this.contentStatsFile();
    const contentStats = readJsonFile<ContentStat[]>(contentStatsFile, []);
    
    if (limit) {
      return contentStats.slice(0, limit);
    }
    return contentStats;
  }

  async updatePlayStatistics(
    userName: string,
    source: string,
    id: string,
    watchTime: number
  ): Promise<void> {
    // 更新用户统计数据
    const userStatsFile = this.userStatsFile(userName);
    const currentUserStat = await this.getUserPlayStat(userName);
    
    // 更新用户统计
    currentUserStat.playCount += 1;
    currentUserStat.totalWatchTime += watchTime;
    currentUserStat.lastPlayDate = Date.now();
    
    writeJsonFile(userStatsFile, currentUserStat);
    
    // 更新内容统计
    const contentStatsFile = this.contentStatsFile();
    const contentStats = await this.getContentStats();
    
    const contentKey = `${source}+${id}`;
    const existingStatIndex = contentStats.findIndex(stat => stat.contentKey === contentKey);
    
    if (existingStatIndex >= 0) {
      contentStats[existingStatIndex].playCount += 1;
      contentStats[existingStatIndex].totalWatchTime += watchTime;
      contentStats[existingStatIndex].lastPlayDate = Date.now();
    } else {
      contentStats.push({
        contentKey,
        playCount: 1,
        totalWatchTime: watchTime,
        firstPlayDate: Date.now(),
        lastPlayDate: Date.now(),
      });
    }
    
    writeJsonFile(contentStatsFile, contentStats);
  }

  // ---------- 登入统计 ----------
  private loginStatsFile(): string {
    return this.getSystemFile('login_stats.json');
  }

  async updateUserLoginStats(
    userName: string,
    loginTime: number,
    isFirstLogin?: boolean
  ): Promise<void> {
    const loginStatsFile = this.loginStatsFile();
    const loginStats = readJsonFile<Record<string, { loginCount: number; firstLogin: number; lastLogin: number }>>(
      loginStatsFile,
      {}
    );
    
    if (!loginStats[userName]) {
      loginStats[userName] = {
        loginCount: 0,
        firstLogin: loginTime,
        lastLogin: 0,
      };
    }
    
    loginStats[userName].loginCount += 1;
    loginStats[userName].lastLogin = loginTime;
    
    if (isFirstLogin) {
      loginStats[userName].firstLogin = loginTime;
    }
    
    writeJsonFile(loginStatsFile, loginStats);
  }
}
