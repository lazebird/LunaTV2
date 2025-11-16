# ⚡ 代码重构快速指南

## 🎯 核心问题

**13个超长文件需要拆分**，其中最严重的2个：

1. `admin/page.tsx` - **7453行** 🔴
2. `play/page.tsx` - **4846行** 🔴

## 🚀 快速开始

### 立即执行：拆分admin/page.tsx

```bash
# 1. 查看文件结构
grep -n "^const\|^function" src/app/admin/page.tsx

# 2. 创建组件目录（已完成）
mkdir -p src/frontend/components/admin

# 3. 拆分最大的组件（UserConfig - 2771行）
# 手动提取 361-3132 行到新文件

# 4. 拆分第二大组件（VideoSourceConfig - 1431行）
# 手动提取 3132-4563 行到新文件

# 5. 测试
pnpm dev
```

## 📊 文件清单

### 需要立即拆分（>3000行）
- [ ] `admin/page.tsx` (7453行)
- [ ] `play/page.tsx` (4846行)

### 需要优化（1000-3000行）
- [ ] `play-stats/page.tsx` (2309行)
- [ ] `live/page.tsx` (2217行)
- [ ] `UserMenu.tsx` (2169行)
- [ ] `tvbox/page.tsx` (1847行)
- [ ] `search/page.tsx` (1702行)
- [ ] `VideoCard.tsx` (1379行)
- [ ] `SkipController.tsx` (1284行)
- [ ] `source-browser/page.tsx` (1258行)
- [ ] `page.tsx` (1215行)
- [ ] `release-calendar/page.tsx` (1128行)

## 🛠️ 拆分模板

### 步骤1：创建新组件文件

```typescript
// src/frontend/components/admin/UserConfig.tsx
'use client';

import { useState } from 'react';
import { buttonStyles, useAlertModal, useLoadingState } from './shared';

interface UserConfigProps {
  config: AdminConfig | null;
  role: 'owner' | 'admin' | null;
  refreshConfig: () => Promise<void>;
}

export default function UserConfig({ config, role, refreshConfig }: UserConfigProps) {
  // 组件逻辑
  return (
    <div>
      {/* UI */}
    </div>
  );
}
```

### 步骤2：更新主文件

```typescript
// src/app/admin/page.tsx
import UserConfig from '@/frontend/components/admin/UserConfig';

function AdminPageClient() {
  return (
    <div>
      {activeTab === 'users' && (
        <UserConfig config={config} role={role} refreshConfig={refreshConfig} />
      )}
    </div>
  );
}
```

### 步骤3：测试

```bash
# 启动开发服务器
pnpm dev

# 访问管理后台
open http://localhost:3000/admin

# 测试所有功能
# - 用户管理
# - 视频源配置
# - 其他功能
```

## 📋 检查清单

### 拆分前
- [ ] 备份原文件
- [ ] 确认组件边界
- [ ] 识别共享依赖

### 拆分中
- [ ] 创建新文件
- [ ] 复制组件代码
- [ ] 添加导入语句
- [ ] 更新主文件

### 拆分后
- [ ] 功能测试
- [ ] 类型检查 (`pnpm type-check`)
- [ ] 构建测试 (`pnpm build`)
- [ ] 提交代码

## 🎓 最佳实践

### DO ✅
- 使用绝对路径导入 `@/`
- 保持组件单一职责
- 提取共享逻辑到工具函数
- 添加TypeScript类型

### DON'T ❌
- 不要在一个文件中放多个大组件
- 不要超过300行/组件
- 不要忽略类型定义
- 不要跳过测试

## 📈 进度追踪

```
总体进度: ████░░░░░░ 40%

✅ 已完成:
- 基础模块化
- 共享工具创建
- 问题分析

🔄 进行中:
- admin组件拆分

⏳ 待开始:
- play页面拆分
- 其他页面优化
```

## 🔗 相关文档

- [详细状态报告](./REFACTOR_STATUS.md)
- [下一步行动计划](./REFACTOR_NEXT_STEPS.md)
- [TODO列表](./doc/TODO.md)

## 💡 快速命令

```bash
# 查看最长的20个文件
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -20

# 查看特定文件的函数列表
grep -n "^const\|^function\|^export" src/app/admin/page.tsx

# 提取特定行范围
sed -n '361,3132p' src/app/admin/page.tsx > UserConfig.tsx

# 构建项目
pnpm build

# 类型检查
pnpm type-check
```

---

**更新**: 2025-01-16  
**状态**: 🔄 进行中
