# 代码迁移指南

## 迁移原则

1. **保持功能不变**：迁移过程中不修改业务逻辑
2. **逐步迁移**：一次迁移一个模块，确保每步都能构建成功
3. **保留历史**：使用 `git mv` 保留文件历史
4. **更新导入**：迁移后立即更新所有导入路径

## 迁移步骤

### 1. 迁移后端 API 路由

```bash
# 示例：迁移登录 API
git mv src/lib/auth.ts src/backend/services/auth/auth.service.ts

# 在 src/backend/api/auth/login.ts 中实现逻辑
# 在 src/app/api/login/route.ts 中导出
```

### 2. 迁移前端组件

```bash
# 示例：迁移 VideoCard 组件
git mv src/components/VideoCard.tsx src/frontend/components/media/VideoCard.tsx

# 更新所有导入路径
# 从: import VideoCard from '@/components/VideoCard'
# 到: import VideoCard from '@components/media/VideoCard'
```

### 3. 更新导入路径

使用新的路径别名：

```typescript
// 前端组件
import { VideoCard } from '@components/media/VideoCard';
import { useUserData } from '@hooks/useUserData';

// 后端服务
import { AuthService } from '@services/auth/auth.service';
import { SearchService } from '@services/media/search.service';

// 共享类型
import { User, PlayRecord } from '@shared/types';
import { ROUTES, ERROR_CODES } from '@shared/constants';
```

## 迁移检查清单

- [ ] 文件已移动到正确位置
- [ ] 所有导入路径已更新
- [ ] TypeScript 编译无错误
- [ ] `pnpm build` 成功
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

```bash
# 查看待迁移文件
find src/app src/components src/lib -type f -name "*.ts" -o -name "*.tsx"

# 查看已迁移文件
find src/frontend src/backend src/shared -type f -name "*.ts" -o -name "*.tsx"
```
