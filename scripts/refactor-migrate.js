#!/usr/bin/env node

/**
 * LunaTV 前后端分离迁移脚本
 * 
 * 用法：
 *   node scripts/refactor-migrate.js --phase=1
 *   node scripts/refactor-migrate.js --phase=2
 *   node scripts/refactor-migrate.js --phase=all
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

// 解析命令行参数
const args = process.argv.slice(2);
const phaseArg = args.find(arg => arg.startsWith('--phase='));
const phase = phaseArg ? phaseArg.split('=')[1] : '1';

console.log(`🚀 开始执行迁移 - 阶段 ${phase}\n`);

/**
 * 创建目录（如果不存在）
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ 创建目录: ${path.relative(ROOT_DIR, dir)}`);
  }
}

/**
 * 阶段 1：创建新目录结构
 */
function phase1_createStructure() {
  console.log('📁 阶段 1：创建新目录结构\n');

  const directories = [
    // Frontend
    'src/frontend/app/(auth)/login',
    'src/frontend/app/(auth)/register',
    'src/frontend/app/(content)/douban',
    'src/frontend/app/(content)/search',
    'src/frontend/app/(content)/shortdrama',
    'src/frontend/app/(content)/release-calendar',
    'src/frontend/app/(media)/play',
    'src/frontend/app/(media)/live',
    'src/frontend/app/(admin)/admin',
    'src/frontend/app/(admin)/source-browser',
    'src/frontend/app/(admin)/source-test',
    'src/frontend/app/(stats)/play-stats',
    'src/frontend/app/(integration)/tvbox',
    'src/frontend/components/common',
    'src/frontend/components/layout',
    'src/frontend/components/media',
    'src/frontend/components/content',
    'src/frontend/components/search',
    'src/frontend/components/user',
    'src/frontend/components/admin/config',
    'src/frontend/components/live',
    'src/frontend/components/selectors',
    'src/frontend/components/modals',
    'src/frontend/components/providers',
    'src/frontend/components/ui',
    'src/frontend/hooks',
    'src/frontend/styles',
    'src/frontend/types',
    
    // Backend
    'src/backend/api/auth',
    'src/backend/api/media',
    'src/backend/api/content',
    'src/backend/api/live',
    'src/backend/api/admin',
    'src/backend/api/integration',
    'src/backend/api/proxy',
    'src/backend/api/utils',
    'src/backend/services/auth',
    'src/backend/services/media',
    'src/backend/services/content',
    'src/backend/services/live',
    'src/backend/services/admin',
    'src/backend/services/integration',
    'src/backend/data/storage',
    'src/backend/data/cache',
    'src/backend/data/repositories',
    'src/backend/clients',
    'src/backend/utils',
    'src/backend/middleware',
    'src/backend/types',
    'src/backend/config',
    
    // Shared
    'src/shared/types',
    'src/shared/constants',
    'src/shared/utils',
  ];

  directories.forEach(dir => {
    ensureDir(path.join(ROOT_DIR, dir));
  });

  console.log('\n✅ 阶段 1 完成\n');
}

/**
 * 阶段 2：创建路由适配层
 */
function phase2_createAdapters() {
  console.log('🔗 阶段 2：创建路由适配层\n');

  // 创建 API 路由适配器示例
  const apiAdapterExample = `// API 路由适配层
// 此文件仅作为路由入口，实际逻辑在 backend 中实现

export * from '@backend/api/auth/login';
`;

  const apiAdapterPath = path.join(SRC_DIR, 'app', 'api', '_adapter_example.ts');
  fs.writeFileSync(apiAdapterPath, apiAdapterExample);
  console.log(`✅ 创建 API 适配器示例: ${path.relative(ROOT_DIR, apiAdapterPath)}`);

  // 创建页面适配器示例
  const pageAdapterExample = `// 页面路由适配层
// 此文件仅作为路由入口，实际组件在 frontend 中实现

export { default } from '@frontend/app/(auth)/login/page';
`;

  const pageAdapterPath = path.join(SRC_DIR, 'app', '_adapter_example_page.tsx');
  fs.writeFileSync(pageAdapterPath, pageAdapterExample);
  console.log(`✅ 创建页面适配器示例: ${path.relative(ROOT_DIR, pageAdapterPath)}`);

  console.log('\n✅ 阶段 2 完成\n');
}

/**
 * 阶段 3：更新 TypeScript 配置
 */
function phase3_updateTsConfig() {
  console.log('⚙️  阶段 3：更新 TypeScript 配置\n');

  const tsconfigPath = path.join(ROOT_DIR, 'tsconfig.json');
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

  // 更新路径别名
  tsconfig.compilerOptions.paths = {
    '@/*': ['./src/*'],
    '@frontend/*': ['./src/frontend/*'],
    '@backend/*': ['./src/backend/*'],
    '@shared/*': ['./src/shared/*'],
    '@components/*': ['./src/frontend/components/*'],
    '@hooks/*': ['./src/frontend/hooks/*'],
    '@services/*': ['./src/backend/services/*'],
    '@api/*': ['./src/backend/api/*'],
    '@utils/*': ['./src/backend/utils/*'],
    '~/*': ['./public/*'],
  };

  // 备份原配置
  const backupPath = path.join(ROOT_DIR, 'tsconfig.json.backup');
  fs.copyFileSync(tsconfigPath, backupPath);
  console.log(`✅ 备份原配置: ${path.relative(ROOT_DIR, backupPath)}`);

  // 写入新配置
  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  console.log(`✅ 更新 TypeScript 配置: ${path.relative(ROOT_DIR, tsconfigPath)}`);

  console.log('\n✅ 阶段 3 完成\n');
}

/**
 * 阶段 4：创建共享类型定义
 */
function phase4_createSharedTypes() {
  console.log('📝 阶段 4：创建共享类型定义\n');

  // 用户类型
  const userTypes = `/**
 * 共享用户类型定义
 */

export interface User {
  username: string;
  role: 'admin' | 'user';
  group?: string;
  createdAt?: number;
  lastLogin?: number;
  loginCount?: number;
  level?: number;
}

export interface UserSession {
  username: string;
  role: 'admin' | 'user';
  expiresAt: number;
}

export interface UserGroup {
  name: string;
  permissions: string[];
  allowedSources?: string[];
}
`;

  fs.writeFileSync(
    path.join(SRC_DIR, 'shared', 'types', 'user.types.ts'),
    userTypes
  );
  console.log('✅ 创建共享用户类型');

  // 媒体类型
  const mediaTypes = `/**
 * 共享媒体类型定义
 */

export interface PlayRecord {
  title: string;
  source_name: string;
  cover: string;
  year: string;
  index: number;
  total_episodes: number;
  play_time: number;
  total_time: number;
  save_time: number;
  search_title: string;
  remarks?: string;
}

export interface Favorite {
  source_name: string;
  total_episodes: number;
  title: string;
  year: string;
  cover: string;
  save_time: number;
  search_title: string;
  origin?: 'vod' | 'live' | 'shortdrama';
  releaseDate?: string;
  remarks?: string;
}

export interface VideoSource {
  name: string;
  api: string;
  enabled: boolean;
  order: number;
}
`;

  fs.writeFileSync(
    path.join(SRC_DIR, 'shared', 'types', 'media.types.ts'),
    mediaTypes
  );
  console.log('✅ 创建共享媒体类型');

  // API 类型
  const apiTypes = `/**
 * 共享 API 类型定义
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SearchParams {
  query: string;
  page?: number;
  pageSize?: number;
  type?: string;
}
`;

  fs.writeFileSync(
    path.join(SRC_DIR, 'shared', 'types', 'api.types.ts'),
    apiTypes
  );
  console.log('✅ 创建共享 API 类型');

  // 导出索引
  const indexTypes = `/**
 * 共享类型定义导出
 */

export * from './user.types';
export * from './media.types';
export * from './api.types';
`;

  fs.writeFileSync(
    path.join(SRC_DIR, 'shared', 'types', 'index.ts'),
    indexTypes
  );
  console.log('✅ 创建类型导出索引');

  console.log('\n✅ 阶段 4 完成\n');
}

/**
 * 阶段 5：创建共享常量
 */
function phase5_createSharedConstants() {
  console.log('🔢 阶段 5：创建共享常量\n');

  // 路由常量
  const routeConstants = `/**
 * 共享路由常量
 */

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: '/admin',
  SEARCH: '/search',
  PLAY: '/play',
  LIVE: '/live',
  DOUBAN: '/douban',
  SHORTDRAMA: '/shortdrama',
  RELEASE_CALENDAR: '/release-calendar',
  PLAY_STATS: '/play-stats',
  SOURCE_BROWSER: '/source-browser',
  SOURCE_TEST: '/source-test',
  TVBOX: '/tvbox',
} as const;

export const API_ROUTES = {
  LOGIN: '/api/login',
  LOGOUT: '/api/logout',
  REGISTER: '/api/register',
  SEARCH: '/api/search',
  FAVORITES: '/api/favorites',
  PLAYRECORDS: '/api/playrecords',
  DOUBAN: '/api/douban',
  YOUTUBE: '/api/youtube',
  LIVE: '/api/live',
  ADMIN: '/api/admin',
} as const;
`;

  fs.writeFileSync(
    path.join(SRC_DIR, 'shared', 'constants', 'routes.ts'),
    routeConstants
  );
  console.log('✅ 创建路由常量');

  // 错误常量
  const errorConstants = `/**
 * 共享错误常量
 */

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.UNAUTHORIZED]: '未授权，请先登录',
  [ERROR_CODES.FORBIDDEN]: '权限不足',
  [ERROR_CODES.NOT_FOUND]: '资源不存在',
  [ERROR_CODES.VALIDATION_ERROR]: '参数验证失败',
  [ERROR_CODES.INTERNAL_ERROR]: '服务器内部错误',
  [ERROR_CODES.RATE_LIMIT]: '请求过于频繁，请稍后再试',
} as const;
`;

  fs.writeFileSync(
    path.join(SRC_DIR, 'shared', 'constants', 'errors.ts'),
    errorConstants
  );
  console.log('✅ 创建错误常量');

  // 配置常量
  const configConstants = `/**
 * 共享配置常量
 */

export const STORAGE_TYPES = {
  FILESYSTEM: 'filesystem',
  REDIS: 'redis',
  KVROCKS: 'kvrocks',
  UPSTASH: 'upstash',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const MEDIA_ORIGINS = {
  VOD: 'vod',
  LIVE: 'live',
  SHORTDRAMA: 'shortdrama',
} as const;

export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 7200, // 2 hours
} as const;
`;

  fs.writeFileSync(
    path.join(SRC_DIR, 'shared', 'constants', 'config.ts'),
    configConstants
  );
  console.log('✅ 创建配置常量');

  // 导出索引
  const indexConstants = `/**
 * 共享常量导出
 */

export * from './routes';
export * from './errors';
export * from './config';
`;

  fs.writeFileSync(
    path.join(SRC_DIR, 'shared', 'constants', 'index.ts'),
    indexConstants
  );
  console.log('✅ 创建常量导出索引');

  console.log('\n✅ 阶段 5 完成\n');
}

/**
 * 阶段 6：创建迁移指南
 */
function phase6_createMigrationGuide() {
  console.log('📖 阶段 6：创建迁移指南\n');

  const guide = `# 代码迁移指南

## 迁移原则

1. **保持功能不变**：迁移过程中不修改业务逻辑
2. **逐步迁移**：一次迁移一个模块，确保每步都能构建成功
3. **保留历史**：使用 \`git mv\` 保留文件历史
4. **更新导入**：迁移后立即更新所有导入路径

## 迁移步骤

### 1. 迁移后端 API 路由

\`\`\`bash
# 示例：迁移登录 API
git mv src/lib/auth.ts src/backend/services/auth/auth.service.ts

# 在 src/backend/api/auth/login.ts 中实现逻辑
# 在 src/app/api/login/route.ts 中导出
\`\`\`

### 2. 迁移前端组件

\`\`\`bash
# 示例：迁移 VideoCard 组件
git mv src/components/VideoCard.tsx src/frontend/components/media/VideoCard.tsx

# 更新所有导入路径
# 从: import VideoCard from '@/components/VideoCard'
# 到: import VideoCard from '@components/media/VideoCard'
\`\`\`

### 3. 更新导入路径

使用新的路径别名：

\`\`\`typescript
// 前端组件
import { VideoCard } from '@components/media/VideoCard';
import { useUserData } from '@hooks/useUserData';

// 后端服务
import { AuthService } from '@services/auth/auth.service';
import { SearchService } from '@services/media/search.service';

// 共享类型
import { User, PlayRecord } from '@shared/types';
import { ROUTES, ERROR_CODES } from '@shared/constants';
\`\`\`

## 迁移检查清单

- [ ] 文件已移动到正确位置
- [ ] 所有导入路径已更新
- [ ] TypeScript 编译无错误
- [ ] \`pnpm build\` 成功
- [ ] 功能测试通过
- [ ] Git 提交包含清晰的说明

## 常见问题

### Q: 迁移后构建失败？
A: 检查所有导入路径是否已更新，确保使用新的路径别名。

### Q: 类型错误？
A: 确保共享类型已正确导出和导入。

### Q: Next.js 路由不工作？
A: 确保 src/app 中的路由文件正确导出了实际实现。

## 迁移进度跟踪

使用以下命令查看迁移进度：

\`\`\`bash
# 查看待迁移文件
find src/app src/components src/lib -type f -name "*.ts" -o -name "*.tsx"

# 查看已迁移文件
find src/frontend src/backend src/shared -type f -name "*.ts" -o -name "*.tsx"
\`\`\`
`;

  fs.writeFileSync(
    path.join(ROOT_DIR, 'MIGRATION_GUIDE.md'),
    guide
  );
  console.log('✅ 创建迁移指南');

  console.log('\n✅ 阶段 6 完成\n');
}

/**
 * 验证构建
 */
function validateBuild() {
  console.log('🔍 验证构建...\n');

  try {
    execSync('pnpm typecheck', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('\n✅ TypeScript 类型检查通过\n');
  } catch (error) {
    console.error('\n❌ TypeScript 类型检查失败\n');
    process.exit(1);
  }
}

// 执行迁移
try {
  switch (phase) {
    case '1':
      phase1_createStructure();
      break;
    case '2':
      phase2_createAdapters();
      break;
    case '3':
      phase3_updateTsConfig();
      break;
    case '4':
      phase4_createSharedTypes();
      break;
    case '5':
      phase5_createSharedConstants();
      break;
    case '6':
      phase6_createMigrationGuide();
      break;
    case 'all':
      phase1_createStructure();
      phase2_createAdapters();
      phase3_updateTsConfig();
      phase4_createSharedTypes();
      phase5_createSharedConstants();
      phase6_createMigrationGuide();
      validateBuild();
      break;
    default:
      console.error(`❌ 未知阶段: ${phase}`);
      console.log('可用阶段: 1, 2, 3, 4, 5, 6, all');
      process.exit(1);
  }

  console.log('🎉 迁移完成！\n');
  console.log('下一步：');
  console.log('1. 查看 REFACTOR_PLAN.md 了解完整计划');
  console.log('2. 查看 MIGRATION_GUIDE.md 了解迁移指南');
  console.log('3. 开始逐步迁移代码文件');
  console.log('4. 运行 pnpm build 验证构建\n');
} catch (error) {
  console.error('❌ 迁移失败:', error.message);
  process.exit(1);
}
