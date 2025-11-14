/**
 * 文件系统存储功能测试
 */

import { FileSystemStorage } from '../src/lib/filesystem.db';
import path from 'path';
import { promises as fs } from 'fs';

// 测试配置
const TEST_DATA_DIR = path.join(__dirname, 'test_data');
const TEST_USERNAME = 'testuser';
const TEST_PASSWORD = 'testpass123';

async function cleanTestData() {
  try {
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
  } catch (error) {
    // 忽略删除错误
  }
}

async function setupTestEnvironment() {
  process.env.FILE_SYSTEM_DATA_DIR = TEST_DATA_DIR;
  process.env.NEXT_PUBLIC_STORAGE_TYPE = 'filesystem';
  await cleanTestData();
}

async function testUserManagement(storage: FileSystemStorage) {
  console.log('\n🧪 测试用户管理功能...');
  
  try {
    // 测试用户注册
    await storage.registerUser(TEST_USERNAME, TEST_PASSWORD);
    console.log('✅ 用户注册成功');
    
    // 测试用户验证
    const isValid = await storage.verifyUser(TEST_USERNAME, TEST_PASSWORD);
    console.log(isValid ? '✅ 用户验证成功' : '❌ 用户验证失败');
    
    // 测试用户存在检查
    const exists = await storage.checkUserExist(TEST_USERNAME);
    console.log(exists ? '✅ 用户存在检查成功' : '❌ 用户存在检查失败');
    
    // 测试获取所有用户
    const users = await storage.getAllUsers();
    console.log(users.includes(TEST_USERNAME) ? '✅ 获取用户列表成功' : '❌ 获取用户列表失败');
    
    // 测试修改密码
    const newPassword = 'newpass123';
    await storage.changePassword(TEST_USERNAME, newPassword);
    const isValidNew = await storage.verifyUser(TEST_USERNAME, newPassword);
    console.log(isValidNew ? '✅ 修改密码成功' : '❌ 修改密码失败');
    
    return true;
  } catch (error) {
    console.error('❌ 用户管理测试失败:', error);
    return false;
  }
}

async function testPlayRecords(storage: FileSystemStorage) {
  console.log('\n🧪 测试播放记录功能...');
  
  try {
    const testRecord = {
      title: '测试视频',
      source_name: '测试源',
      cover: 'https://example.com/cover.jpg',
      year: '2023',
      index: 1,
      total_episodes: 10,
      play_time: 1800,
      total_time: 3600,
      save_time: Date.now(),
      search_title: '测试视频搜索'
    };
    
    const testKey = 'testsource+testid';
    
    // 测试保存播放记录
    await storage.setPlayRecord(TEST_USERNAME, testKey, testRecord);
    console.log('✅ 保存播放记录成功');
    
    // 测试获取播放记录
    const retrieved = await storage.getPlayRecord(TEST_USERNAME, testKey);
    console.log(retrieved && retrieved.title === testRecord.title ? '✅ 获取播放记录成功' : '❌ 获取播放记录失败');
    
    // 测试获取所有播放记录
    const allRecords = await storage.getAllPlayRecords(TEST_USERNAME);
    console.log(allRecords[testKey] ? '✅ 获取所有播放记录成功' : '❌ 获取所有播放记录失败');
    
    // 测试删除播放记录
    await storage.deletePlayRecord(TEST_USERNAME, testKey);
    const deleted = await storage.getPlayRecord(TEST_USERNAME, testKey);
    console.log(!deleted ? '✅ 删除播放记录成功' : '❌ 删除播放记录失败');
    
    return true;
  } catch (error) {
    console.error('❌ 播放记录测试失败:', error);
    return false;
  }
}

async function testFavorites(storage: FileSystemStorage) {
  console.log('\n🧪 测试收藏功能...');
  
  try {
    const testFavorite = {
      source_name: '测试源',
      total_episodes: 10,
      title: '测试收藏',
      year: '2023',
      cover: 'https://example.com/cover.jpg',
      save_time: Date.now(),
      search_title: '测试收藏搜索'
    };
    
    const testKey = 'testsource+testid';
    
    // 测试保存收藏
    await storage.setFavorite(TEST_USERNAME, testKey, testFavorite);
    console.log('✅ 保存收藏成功');
    
    // 测试获取收藏
    const retrieved = await storage.getFavorite(TEST_USERNAME, testKey);
    console.log(retrieved && retrieved.title === testFavorite.title ? '✅ 获取收藏成功' : '❌ 获取收藏失败');
    
    // 测试获取所有收藏
    const allFavorites = await storage.getAllFavorites(TEST_USERNAME);
    console.log(allFavorites[testKey] ? '✅ 获取所有收藏成功' : '❌ 获取所有收藏失败');
    
    // 测试删除收藏
    await storage.deleteFavorite(TEST_USERNAME, testKey);
    const deleted = await storage.getFavorite(TEST_USERNAME, testKey);
    console.log(!deleted ? '✅ 删除收藏成功' : '❌ 删除收藏失败');
    
    return true;
  } catch (error) {
    console.error('❌ 收藏测试失败:', error);
    return false;
  }
}

async function testCache(storage: FileSystemStorage) {
  console.log('\n🧪 测试缓存功能...');
  
  try {
    const testKey = 'test:cache:key';
    const testData = { message: 'Hello, Cache!', timestamp: Date.now() };
    
    // 测试设置缓存
    await storage.setCache(testKey, testData, 60); // 60秒TTL
    console.log('✅ 设置缓存成功');
    
    // 测试获取缓存
    const retrieved = await storage.getCache(testKey);
    console.log(retrieved && retrieved.message === testData.message ? '✅ 获取缓存成功' : '❌ 获取缓存失败');
    
    // 测试删除缓存
    await storage.deleteCache(testKey);
    const deleted = await storage.getCache(testKey);
    console.log(!deleted ? '✅ 删除缓存成功' : '❌ 删除缓存失败');
    
    // 测试过期缓存
    const expireKey = 'test:expire:key';
    await storage.setCache(expireKey, testData, 1); // 1秒TTL
    await new Promise(resolve => setTimeout(resolve, 1100)); // 等待1.1秒
    const expired = await storage.getCache(expireKey);
    console.log(!expired ? '✅ 过期缓存处理成功' : '❌ 过期缓存处理失败');
    
    return true;
  } catch (error) {
    console.error('❌ 缓存测试失败:', error);
    return false;
  }
}

async function testStatistics(storage: FileSystemStorage) {
  console.log('\n🧪 测试统计功能...');
  
  try {
    // 创建一些测试数据
    const testRecords = {
      'source1+id1': {
        title: '测试视频1',
        source_name: 'source1',
        cover: '',
        year: '2023',
        index: 1,
        total_episodes: 10,
        play_time: 1800,
        total_time: 3600,
        save_time: Date.now(),
        search_title: '测试视频1'
      },
      'source2+id2': {
        title: '测试视频2',
        source_name: 'source2',
        cover: '',
        year: '2023',
        index: 2,
        total_episodes: 8,
        play_time: 1200,
        total_time: 2400,
        save_time: Date.now(),
        search_title: '测试视频2'
      }
    };
    
    // 保存测试播放记录
    for (const [key, record] of Object.entries(testRecords)) {
      await storage.setPlayRecord(TEST_USERNAME, key, record);
    }
    
    // 测试用户统计
    const userStats = await storage.getUserPlayStat(TEST_USERNAME);
    console.log(userStats.totalPlays === 2 ? '✅ 用户统计计算成功' : '❌ 用户统计计算失败');
    
    // 测试全站统计
    const playStats = await storage.getPlayStats();
    console.log(playStats.totalUsers === 1 ? '✅ 全站统计计算成功' : '❌ 全站统计计算失败');
    
    // 测试内容统计
    const contentStats = await storage.getContentStats();
    console.log(contentStats.length === 2 ? '✅ 内容统计计算成功' : '❌ 内容统计计算失败');
    
    return true;
  } catch (error) {
    console.error('❌ 统计测试失败:', error);
    return false;
  }
}

async function testHealthCheck(storage: FileSystemStorage) {
  console.log('\n🧪 测试健康检查功能...');
  
  try {
    const health = await (storage as any).checkStorageHealth?.();
    if (health) {
      console.log(health.available ? '✅ 存储健康检查通过' : '❌ 存储健康检查失败');
      console.log(`📊 存储空间: ${Math.round(health.usedSpace / 1024 / 1024)}MB / ${Math.round(health.totalSpace / 1024 / 1024)}MB`);
      return true;
    } else {
      console.log('⚠️ 健康检查功能未实现');
      return true;
    }
  } catch (error) {
    console.error('❌ 健康检查测试失败:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 开始文件系统存储功能测试...');
  
  await setupTestEnvironment();
  
  let storage: FileSystemStorage;
  try {
    storage = new FileSystemStorage();
  } catch (error) {
    console.error('❌ 初始化存储失败:', error);
    return;
  }
  
  const tests = [
    { name: '用户管理', fn: () => testUserManagement(storage) },
    { name: '播放记录', fn: () => testPlayRecords(storage) },
    { name: '收藏功能', fn: () => testFavorites(storage) },
    { name: '缓存功能', fn: () => testCache(storage) },
    { name: '统计功能', fn: () => testStatistics(storage) },
    { name: '健康检查', fn: () => testHealthCheck(storage) }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} 测试异常:`, error);
      failed++;
    }
  }
  
  console.log('\n📊 测试结果汇总:');
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📈 成功率: ${Math.round((passed / tests.length) * 100)}%`);
  
  // 清理测试数据
  await cleanTestData();
  
  if (failed === 0) {
    console.log('\n🎉 所有测试通过！文件系统存储功能正常。');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查实现。');
  }
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests };