# LunaTV 前后端分离快速开始指南

## 当前状态

✅ 已完成：
- 创建了新的目录结构（src/frontend, src/backend, src/shared）
- 更新了 TypeScript 配置，添加了路径别名
- 创建了共享类型定义和常量
- 创建了迁移指南文档

⏳ 待完成：
- 逐步迁移现有代码到新结构
- 更新所有导入路径
- 验证构建和功能

## 渐进式迁移策略

由于项目规模较大，我们采用**渐进式迁移**策略，而不是一次性重构：

### 阶段 A：共享代码优先（已完成）
- ✅ 创建共享类型定义
- ✅ 创建共享常量
- ✅ 更新 TypeScript 配置

### 阶段 B：后端服务层迁移（推荐先做）

1. **迁移存储层**
   ```bash
   # 迁移数据库实现
   cp src/lib/filesystem.db.ts src/backend/data/storage/filesystem.storage.ts
   cp src/lib/redis.db.ts src/backend/data/storage/redis.storage.ts
   cp src/lib/kvrocks.db.ts src/backend/data/storage/kvrocks.storage.ts
   cp src/lib/upstash.db.ts src/backend/data/storage/upstash.storage.ts
   cp src/lib/db.ts src/backend/data/storage/base.storage.ts
   ```

2. **迁移外部客户端**
   ```bash
   # 迁移第三方 API 客户端
   cp src/lib/douban.client.ts src/backend/clients/douban.client.ts
   cp src/lib/shortdrama.client.ts src/backend/clients/shortdrama.client.ts
   cp src/lib/bangumi.client.ts src/backend/clients/bangumi.client.ts
   cp src/lib/tmdb.client.ts src/backend/clients/tmdb.client.ts
   cp src/lib/ai-recommend.client.ts src/backend/clients/ai.client.ts
   ```

3. **迁移业务服务**
   ```bash
   # 迁移认证服务
   cp src/lib/auth.ts src/backend/services/auth/auth.service.ts
   
   # 迁移搜索服务
   cp src/lib/downstream.ts src/backend/services/media/search.service.ts
   
   # 迁移豆瓣服务
   cp src/lib/douban.ts src/backend/services/content/douban.service.ts
   ```

### 阶段 C：前端组件迁移

1. **迁移通用组件**
   ```bash
   # 基础组件
   cp src/components/BackButton.tsx src/frontend/components/common/
   cp src/components/ImagePlaceholder.tsx src/frontend/components/common/
   cp src/components/PageLayout.tsx src/frontend/components/common/
   cp src/components/SkeletonCard.tsx src/frontend/components/common/
   ```

2. **迁移布局组件**
   ```bash
   cp src/components/ModernNav.tsx src/frontend/components/layout/
   cp src/components/MobileBottomNav.tsx src/frontend/components/layout/
   cp src/components/MobileHeader.tsx src/frontend/components/layout/
   cp src/components/Sidebar.tsx src/frontend/components/layout/
   cp src/components/UserMenu.tsx src/frontend/components/layout/
   ```

3. **迁移媒体组件**
   ```bash
   cp src/components/VideoCard.tsx src/frontend/components/media/
   cp src/components/ShortDramaCard.tsx src/frontend/components/media/
   cp src/components/YouTubeVideoCard.tsx src/frontend/components/media/
   cp src/components/EpisodeSelector.tsx src/frontend/components/media/
   ```

### 阶段 D：API 路由适配（最后做）

由于 Next.js 要求 API 路由必须在 `src/app/api` 目录下，我们保持现有结构，但将业务逻辑提取到 backend：

```typescript
// src/app/api/login/route.ts (保持不变，但调用 backend 服务)
import { AuthService } from '@backend/services/auth/auth.service';

export async function POST(request: Request) {
  const authService = new AuthService();
  return authService.login(request);
}
```

## 实用迁移命令

### 1. 批量复制文件（保留原文件）

```bash
# 复制所有客户端文件
for file in src/lib/*.client.ts; do
  filename=$(basename "$file")
  cp "$file" "src/backend/clients/$filename"
done

# 复制所有存储文件
for file in src/lib/*.db.ts; do
  filename=$(basename "$file")
  cp "$file" "src/backend/data/storage/${filename/.db.ts/.storage.ts}"
done
```

### 2. 查找需要更新的导入

```bash
# 查找所有导入 @/lib 的文件
grep -r "from '@/lib" src/app src/components --include="*.ts" --include="*.tsx"

# 查找所有导入 @/components 的文件
grep -r "from '@/components" src/app --include="*.ts" --include="*.tsx"
```

### 3. 验证构建

```bash
# 类型检查
pnpm typecheck

# 完整构建
pnpm build

# 开发模式测试
pnpm dev
```

## 推荐的迁移顺序

1. **第一步：迁移共享代码**（已完成）
   - 共享类型
   - 共享常量
   - 共享工具函数

2. **第二步：迁移后端独立模块**
   - 存储层（不依赖其他模块）
   - 外部客户端（不依赖其他模块）
   - 工具函数

3. **第三步：迁移后端服务层**
   - 认证服务
   - 媒体服务
   - 内容服务

4. **第四步：迁移前端组件**
   - 通用组件
   - 布局组件
   - 业务组件

5. **第五步：更新导入路径**
   - 使用新的路径别名
   - 批量替换导入语句

6. **第六步：测试验证**
   - 类型检查
   - 构建测试
   - 功能测试

## 注意事项

### ⚠️ 重要提示

1. **不要删除原文件**：先复制，确认新位置工作正常后再删除
2. **逐步迁移**：一次迁移一个模块，确保每步都能构建成功
3. **保持功能不变**：迁移过程中不修改业务逻辑
4. **及时提交**：每完成一个模块的迁移就提交一次

### 🔧 路径别名使用

```typescript
// ✅ 推荐：使用新的路径别名
import { User } from '@shared/types';
import { ROUTES } from '@shared/constants';
import { AuthService } from '@backend/services/auth/auth.service';
import { VideoCard } from '@components/media/VideoCard';

// ❌ 避免：使用旧的路径
import { User } from '@/lib/types';
import VideoCard from '@/components/VideoCard';
```

### 📝 Git 提交建议

```bash
# 每个模块迁移后提交
git add src/backend/clients/
git commit -m "refactor: migrate external clients to backend/clients"

git add src/frontend/components/common/
git commit -m "refactor: migrate common components to frontend/components/common"
```

## 验证清单

迁移完成后，确保以下项目都通过：

- [ ] `pnpm typecheck` 无错误
- [ ] `pnpm build` 成功
- [ ] `pnpm dev` 正常启动
- [ ] 登录功能正常
- [ ] 搜索功能正常
- [ ] 播放功能正常
- [ ] 管理后台正常
- [ ] 所有页面可访问

## 回滚方案

如果迁移过程中出现问题：

```bash
# 恢复 TypeScript 配置
cp tsconfig.json.backup tsconfig.json

# 删除新创建的目录
rm -rf src/frontend src/backend src/shared

# 恢复 Git 提交
git reset --hard HEAD~1
```

## 下一步

1. 阅读 `MIGRATION_GUIDE.md` 了解详细迁移步骤
2. 阅读 `REFACTOR_PLAN.md` 了解完整重构计划
3. 开始迁移第一个模块（推荐从存储层开始）
4. 每完成一个模块就运行 `pnpm typecheck` 验证

## 获取帮助

如果遇到问题：

1. 查看 TypeScript 错误信息
2. 检查导入路径是否正确
3. 确认文件是否在正确位置
4. 查看 `tsconfig.json` 中的路径别名配置

---

**记住**：这是一个渐进式的重构过程，不需要一次性完成所有迁移。可以先迁移部分模块，确保系统正常运行后再继续迁移其他模块。
