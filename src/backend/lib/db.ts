// Re-export all functions from db.client.ts as a db object
import * as dbClient from './db.client';
import { getConfig } from './config';

// Create a db object that exports all functions
export const db = {
  // From play-records
  ...dbClient,
  
  // Admin config methods
  saveAdminConfig: async (config: any) => {
    console.log('saveAdminConfig called');
  },
  
  getAdminConfig: async () => {
    const config = await getConfig();
    return config;
  },
  
  // User methods
  getAllUsers: async () => {
    const config = await getConfig();
    const users = config.UserConfig?.Users || [];
    // 返回用户名数组
    return users.map((user: any) => user.username);
  },
  
  // Cache methods
  clearExpiredCache: async (prefix?: string) => {
    console.log('clearExpiredCache called with prefix:', prefix);
  },
  
  clearAllData: async () => {
    console.log('clearAllData called');
  },
  
  registerUser: async (username: string, password: string) => {
    console.log('registerUser called');
  },
  
  setSkipConfig: async (username: string, source: string, id: string, config: any) => {
    console.log('setSkipConfig called');
  },
  
  getUserPlayStat: async (username: string) => {
    console.log('getUserPlayStat called');
    return { 
      lastLoginTime: 0, 
      lastLoginDate: 0, 
      firstLoginTime: 0, 
      loginCount: 0,
      totalMovies: 0,
      totalPlays: 0,
      lastPlayTime: 0,
      firstWatchDate: 0,
      lastUpdateTime: 0,
      totalWatchTime: 0,
      avgWatchTime: 0,
      mostWatchedSource: '',
      watchSources: {},
      recentRecords: []
    };
  },
  
  changePassword: async (username: string, password: string) => {
    console.log('changePassword called');
  },
  
  deleteUser: async (username: string) => {
    console.log('deleteUser called');
  },
  
  getCache: async (key: string) => {
    console.log('getCache called');
    return null;
  },
  
  setCache: async (key: string, value: any, ttl?: number) => {
    console.log('setCache called');
  },
  
  deleteCache: async (key: string) => {
    console.log('deleteCache called');
  },
  
  checkUserExist: async (username: string) => {
    console.log('checkUserExist called');
    return false;
  },
  
  getEpisodeSkipConfig: async (username: string, source: string, id: string) => {
    console.log('getEpisodeSkipConfig called');
    return null;
  },
  
  getAllEpisodeSkipConfigs: async (username: string) => {
    console.log('getAllEpisodeSkipConfigs called');
    return {};
  },
  
  saveEpisodeSkipConfig: async (username: string, source: string, id: string, config: any) => {
    console.log('saveEpisodeSkipConfig called');
  },
  
  deleteEpisodeSkipConfig: async (username: string, source: string, id: string) => {
    console.log('deleteEpisodeSkipConfig called');
  },
  
  // Override getFavorite to match API signature
  getFavorite: async (username: string, source: string, id: string) => {
    console.log('getFavorite called with username:', username);
    // Call the original getFavorite function with just source and id
    return dbClient.getFavorite(source, id);
  },
  
  // Override getAllFavorites to match API signature
  getAllFavorites: async (username?: string) => {
    console.log('getAllFavorites called with username:', username);
    // Call the original getAllFavorites function
    return dbClient.getAllFavorites();
  },
  
  // Override saveFavorite to match API signature
  saveFavorite: async (username: string, source: string, id: string, favorite: any) => {
    console.log('saveFavorite called with username:', username);
    // Call the original saveFavorite function with just source, id and favorite
    return dbClient.saveFavorite(source, id, favorite);
  },
  
  // Override deleteFavorite to match API signature
  deleteFavorite: async (username: string, source: string, id: string) => {
    console.log('deleteFavorite called with username:', username);
    // Call the original deleteFavorite function with just source and id
    return dbClient.deleteFavorite(source, id);
  },
  
  // User authentication methods
  verifyUser: async (username: string, password: string) => {
    console.log('verifyUser called');
    return false;
  },
  
  // Override getAllPlayRecords to match API signature
  getAllPlayRecords: async (username?: string) => {
    console.log('getAllPlayRecords called with username:', username);
    // Call the original getAllPlayRecords function
    return dbClient.getAllPlayRecords();
  },
  
  // Override savePlayRecord to match API signature
  savePlayRecord: async (username: string, source: string, id: string, record: any) => {
    console.log('savePlayRecord called with username:', username);
    // Call the original savePlayRecord function with just source, id and record
    return dbClient.savePlayRecord(source, id, record);
  },
  
  // Override deletePlayRecord to match API signature
  deletePlayRecord: async (username: string, source: string, id: string) => {
    console.log('deletePlayRecord called with username:', username);
    // Call the original deletePlayRecord function with just source and id
    return dbClient.deletePlayRecord(source, id);
  },
  
  // Override getPlayRecord to match API signature
  getPlayRecord: async (username: string, source: string, id: string) => {
    console.log('getPlayRecord called with username:', username);
    // Call the original getPlayRecord function with just source and id
    return dbClient.getPlayRecord(source, id);
  },
  
  // Override hasPlayRecord to match API signature
  hasPlayRecord: async (username: string, source: string, id: string) => {
    console.log('hasPlayRecord called with username:', username);
    // Call the original hasPlayRecord function with just source and id
    return dbClient.hasPlayRecord(source, id);
  },
  
  // Statistics methods
  isStatsSupported: () => {
    console.log('isStatsSupported called');
    return false;
  },
  
  updatePlayStatistics: async (username: string, source: string, id: string, statistics: any) => {
    console.log('updatePlayStatistics called');
  },
  
  // Override getSearchHistory to match API signature
  getSearchHistory: async (username?: string) => {
    console.log('getSearchHistory called with username:', username);
    // Call the original getSearchHistory function
    return dbClient.getSearchHistory();
  },
  
  // Override addSearchHistory to match API signature
  addSearchHistory: async (username: string, query: string, type: string, resultCount?: number) => {
    console.log('addSearchHistory called with username:', username);
    // Call the original addSearchHistory function with proper type casting
    return dbClient.addSearchHistory(query, type as any, resultCount);
  },
  
  // Override clearSearchHistory to match API signature
  clearSearchHistory: async (username?: string) => {
    console.log('clearSearchHistory called with username:', username);
    // Call the original clearSearchHistory function
    return dbClient.clearSearchHistory();
  },
  
  // Override deleteSearchHistory to match API signature
  deleteSearchHistory: async (username: string, keyword?: string) => {
    console.log('deleteSearchHistory called with username:', username);
    // Call the original deleteSearchHistory function with just keyword
    return dbClient.deleteSearchHistory(keyword || '');
  },
  
  // Override getSkipConfig to match API signature
  getSkipConfig: async (username: string, source: string, id: string) => {
    console.log('getSkipConfig called with username:', username);
    // Generate the config key and call the original function
    const configKey = `${source}+${id}`;
    return dbClient.getSkipConfig(configKey);
  },
  
  // Override saveSkipConfig to match API signature
  saveSkipConfig: async (username: string, source: string, id: string, config: any) => {
    console.log('saveSkipConfig called with username:', username);
    // Generate the config key and call the original function
    const configKey = `${source}+${id}`;
    return dbClient.saveSkipConfig(configKey, config);
  },
  
  // Override deleteSkipConfig to match API signature
  deleteSkipConfig: async (username: string, source: string, id: string) => {
    console.log('deleteSkipConfig called with username:', username);
    // Generate the config key and call the original function
    const configKey = `${source}+${id}`;
    return dbClient.deleteSkipConfig(configKey);
  },
  
  // Override getAllSkipConfigs to match API signature
  getAllSkipConfigs: async (username?: string) => {
    console.log('getAllSkipConfigs called with username:', username);
    // Call the original getAllSkipConfigs function
    return dbClient.getAllSkipConfigs();
  },
  
  // Override clearAllSkipConfigs to match API signature
  clearAllSkipConfigs: async (username?: string) => {
    console.log('clearAllSkipConfigs called with username:', username);
    // Call the original clearAllSkipConfigs function
    return dbClient.clearAllSkipConfigs();
  },
  
  // Override toggleSkipConfig to match API signature
  toggleSkipConfig: async (username: string, configKey: string, enabled: boolean) => {
    console.log('toggleSkipConfig called with username:', username);
    // Call the original toggleSkipConfig function
    return dbClient.toggleSkipConfig(configKey, enabled);
  },
  
  // User statistics methods
  updateUserLoginStats: async (username: string, loginTime: number, isNewUser: boolean) => {
    console.log('updateUserLoginStats called');
  },
  
  // Override getUserStats to match API signature
  getUserStats: async (username: string) => {
    console.log('getUserStats called with username:', username);
    // Call the original getUserStats function
    return dbClient.getUserStats();
  },
  
  // Override updateUserStats to match API signature
  updateUserStats: async (username: string, stats: any) => {
    console.log('updateUserStats called with username:', username);
    // Call the original updateUserStats function
    return dbClient.updateUserStats(stats);
  },
  
  // Override resetUserStats to match API signature
  resetUserStats: async (username: string) => {
    console.log('resetUserStats called with username:', username);
    // Call the original resetUserStats function
    return dbClient.resetUserStats();
  },
  
  // Add other methods as needed
};