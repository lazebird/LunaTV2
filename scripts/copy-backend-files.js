const fs = require('fs');
const path = require('path');

const frontendLibDir = '/home/liulang/projects/backup/LunaTV/src/frontend/lib';
const backendLibDir = '/home/liulang/projects/backup/LunaTV/src/backend/lib';

// 需要复制到后端的文件列表
const filesToCopy = [
  'admin-auth.ts',
  'admin.types.ts',
  'ai-recommend.client.ts',
  'api-middleware.ts',
  'api-response.ts',
  'api-route.ts',
  'api-utils.ts',
  'bangumi.client.ts',
  'calendar-cache.ts',
  'channel-search.ts',
  'client-cache.ts',
  'constants.ts',
  'data-utils.ts',
  'db.client.ts',
  'db.ts',
  'douban.client.ts',
  'douban.ts',
  'downstream.ts',
  'filesystem.db.ts',
  'kvrocks.db.ts',
  'live.ts',
  'networkDetection.ts',
  'play-stats-data.ts',
  'redis-base.db.ts',
  'redis.db.ts',
  'release-calendar-scraper.ts',
  'search-ranking.ts',
  'shortdrama-cache.ts',
  'shortdrama.client.ts',
  'spiderJar.ts',
  'telegram-tokens.ts',
  'time.ts',
  'tmdb-cache.ts',
  'tmdb.client.ts',
  'types.ts',
  'upstash.db.ts',
  'user-levels.ts',
  'utils.ts',
  'validation.ts',
  'watching-updates.ts',
  'yellow.ts'
];

// 需要复制的目录列表
const dirsToCopy = [
  'admin',
  'api',
  'auth',
  'components',
  'config',
  'constants',
  'crypto',
  'database',
  'filesystem',
  'hooks',
  'media',
  'pwa',
  'search',
  'storage',
  'styles',
  'types',
  'utils'
];

// 复制文件
filesToCopy.forEach(file => {
  const src = path.join(frontendLibDir, file);
  const dest = path.join(backendLibDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${file}`);
  }
});

// 复制目录
dirsToCopy.forEach(dir => {
  const src = path.join(frontendLibDir, dir);
  const dest = path.join(backendLibDir, dir);
  if (fs.existsSync(src) && !fs.existsSync(dest)) {
    // 递归复制目录
    const copyDir = (src, dest) => {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      const files = fs.readdirSync(src);
      files.forEach(file => {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        if (fs.statSync(srcPath).isDirectory()) {
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      });
    };
    copyDir(src, dest);
    console.log(`Copied directory: ${dir}`);
  }
});

console.log('Backend files copy completed!');