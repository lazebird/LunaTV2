# LunaTV 前后端分离重构方案

## 重构目标

1. **前后端代码完全分离**：前端代码放在 `src/frontend`，后端代码放在 `src/backend`
2. **按功能模块组织**：基于用户视角和业务功能重新组织代码结构
3. **保持构建兼容**：确保 `pnpm build` 成功，不影响现有部署

## 新目录结构

```
src/
├── frontend/                    # 前端代码
│   ├── app/                     # Next.js App Router 页面
│   │   ├── (auth)/              # 认证相关页面组
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (content)/           # 内容浏览页面组
│   │   │   ├── douban/
│   │   │   ├── search/
│   │   │   ├── shortdrama/
│   │   │   └── release-calendar/
│   │   ├── (media)/             # 媒体播放页面组
│   │   │   ├── play/
│   │   │   └── live/
│   │   ├── (admin)/             # 管理后台页面组
│   │   │   ├── admin/
│   │   │   ├── source-browser/
│   │   │   └── source-test/
│   │   ├── (stats)/             # 统计分析页面组
│   │   │   └── play-stats/
│   │   ├── (integration)/       # 第三方集成页面组
│   │   │   └── tvbox/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/              # UI 组件
│   │   ├── common/              # 通用组件
│   │   │   ├── BackButton.tsx
│   │   │   ├── ImagePlaceholder.tsx
│   │   │   ├── PageLayout.tsx
│   │   │   └── SkeletonCard.tsx
│   │   ├── layout/              # 布局组件
│   │   │   ├── ModernNav.tsx
│   │   │   ├── MobileBottomNav.tsx
│   │   │   ├── MobileHeader.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── UserMenu.tsx
│   │   ├── media/               # 媒体相关组件
│   │   │   ├── VideoCard.tsx
│   │   │   ├── ShortDramaCard.tsx
│   │   │   ├── YouTubeVideoCard.tsx
│   │   │   ├── EpisodeSelector.tsx
│   │   │   └── SkipController.tsx
│   │   ├── content/             # 内容展示组件
│   │   │   ├── HeroBanner.tsx
│   │   │   ├── ScrollableRow.tsx
│   │   │   ├── VirtualDoubanGrid.tsx
│   │   │   ├── VirtualSearchGrid.tsx
│   │   │   └── AnimatedCardGrid.tsx
│   │   ├── search/              # 搜索相关组件
│   │   │   ├── SearchSuggestions.tsx
│   │   │   └── SearchResultFilter.tsx
│   │   ├── user/                # 用户相关组件
│   │   │   ├── ContinueWatching.tsx
│   │   │   └── TopContentList.tsx
│   │   ├── admin/               # 管理后台组件
│   │   │   ├── config/
│   │   │   │   ├── AIRecommendConfig.tsx
│   │   │   │   ├── YouTubeConfig.tsx
│   │   │   │   ├── TVBoxSecurityConfig.tsx
│   │   │   │   └── TelegramAuthConfig.tsx
│   │   │   ├── CacheManager.tsx
│   │   │   ├── DataMigration.tsx
│   │   │   ├── ImportExportModal.tsx
│   │   │   ├── SourceTestModule.tsx
│   │   │   └── TVBoxTokenManager.tsx
│   │   ├── live/                # 直播相关组件
│   │   │   └── EpgScrollableRow.tsx
│   │   ├── selectors/           # 选择器组件
│   │   │   ├── DoubanSelector.tsx
│   │   │   ├── DoubanCustomSelector.tsx
│   │   │   ├── MultiLevelSelector.tsx
│   │   │   ├── WeekdaySelector.tsx
│   │   │   └── TMDBFilterPanel.tsx
│   │   ├── modals/              # 模态框组件
│   │   │   ├── AIRecommendModal.tsx
│   │   │   ├── MobileActionSheet.tsx
│   │   │   └── TelegramWelcomeModal.tsx
│   │   ├── providers/           # Context Providers
│   │   │   ├── SiteProvider.tsx
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── SessionTracker.tsx
│   │   └── ui/                  # 基础 UI 组件
│   │       ├── CapsuleSwitch.tsx
│   │       ├── SectionTitle.tsx
│   │       ├── ThemeToggle.tsx
│   │       ├── VersionPanel.tsx
│   │       └── GlobalErrorIndicator.tsx
│   ├── hooks/                   # React Hooks
│   │   ├── useAlertModal.ts
│   │   ├── useImagePreload.ts
│   │   ├── useLoadingState.ts
│   │   ├── useLongPress.ts
│   │   ├── useResponsiveGrid.ts
│   │   └── useUserData.ts
│   ├── styles/                  # 样式文件
│   │   ├── globals.css
│   │   └── colors.css
│   └── types/                   # 前端类型定义
│       └── artplayer-plugin-chromecast.d.ts
│
├── backend/                     # 后端代码
│   ├── api/                     # API 路由处理器
│   │   ├── auth/                # 认证模块
│   │   │   ├── login.ts
│   │   │   ├── logout.ts
│   │   │   ├── register.ts
│   │   │   └── change-password.ts
│   │   ├── media/               # 媒体管理模块
│   │   │   ├── favorites.ts
│   │   │   ├── playrecords.ts
│   │   │   ├── search.ts
│   │   │   └── detail.ts
│   │   ├── content/             # 内容聚合模块
│   │   │   ├── douban.ts
│   │   │   ├── shortdrama.ts
│   │   │   ├── youtube.ts
│   │   │   └── release-calendar.ts
│   │   ├── live/                # 直播模块
│   │   │   ├── channels.ts
│   │   │   ├── sources.ts
│   │   │   ├── epg.ts
│   │   │   └── merged.ts
│   │   ├── admin/               # 管理后台模块
│   │   │   ├── config.ts
│   │   │   ├── source.ts
│   │   │   ├── user.ts
│   │   │   ├── cache.ts
│   │   │   └── data-migration.ts
│   │   ├── integration/         # 第三方集成模块
│   │   │   ├── tvbox.ts
│   │   │   ├── telegram.ts
│   │   │   ├── ai-recommend.ts
│   │   │   └── netdisk.ts
│   │   ├── proxy/               # 代理服务模块
│   │   │   ├── image-proxy.ts
│   │   │   ├── m3u8-proxy.ts
│   │   │   └── spider-jar.ts
│   │   └── utils/               # API 工具函数
│   │       ├── response.ts
│   │       ├── validation.ts
│   │       └── rate-limit.ts
│   ├── services/                # 业务逻辑层
│   │   ├── auth/                # 认证服务
│   │   │   ├── auth.service.ts
│   │   │   ├── telegram.service.ts
│   │   │   └── session.service.ts
│   │   ├── media/               # 媒体服务
│   │   │   ├── search.service.ts
│   │   │   ├── favorites.service.ts
│   │   │   ├── playrecords.service.ts
│   │   │   └── stats.service.ts
│   │   ├── content/             # 内容服务
│   │   │   ├── douban.service.ts
│   │   │   ├── shortdrama.service.ts
│   │   │   ├── youtube.service.ts
│   │   │   ├── bangumi.service.ts
│   │   │   └── calendar.service.ts
│   │   ├── live/                # 直播服务
│   │   │   ├── live.service.ts
│   │   │   └── epg.service.ts
│   │   ├── admin/               # 管理服务
│   │   │   ├── config.service.ts
│   │   │   ├── source.service.ts
│   │   │   └── user.service.ts
│   │   └── integration/         # 集成服务
│   │       ├── tvbox.service.ts
│   │       ├── ai-recommend.service.ts
│   │       └── netdisk.service.ts
│   ├── data/                    # 数据访问层
│   │   ├── storage/             # 存储实现
│   │   │   ├── base.storage.ts
│   │   │   ├── filesystem.storage.ts
│   │   │   ├── redis.storage.ts
│   │   │   ├── kvrocks.storage.ts
│   │   │   └── upstash.storage.ts
│   │   ├── cache/               # 缓存管理
│   │   │   ├── cache.manager.ts
│   │   │   ├── search-cache.ts
│   │   │   ├── douban-cache.ts
│   │   │   ├── youtube-cache.ts
│   │   │   └── danmu-cache.ts
│   │   └── repositories/        # 数据仓库
│   │       ├── user.repository.ts
│   │       ├── config.repository.ts
│   │       ├── media.repository.ts
│   │       └── stats.repository.ts
│   ├── clients/                 # 外部 API 客户端
│   │   ├── douban.client.ts
│   │   ├── shortdrama.client.ts
│   │   ├── youtube.client.ts
│   │   ├── bangumi.client.ts
│   │   ├── tmdb.client.ts
│   │   └── ai.client.ts
│   ├── utils/                   # 工具函数
│   │   ├── crypto.ts
│   │   ├── time.ts
│   │   ├── network.ts
│   │   └── validation.ts
│   ├── middleware/              # 中间件
│   │   ├── auth.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   └── error.middleware.ts
│   ├── types/                   # 后端类型定义
│   │   ├── api.types.ts
│   │   ├── storage.types.ts
│   │   ├── config.types.ts
│   │   └── media.types.ts
│   └── config/                  # 配置管理
│       ├── env.config.ts
│       ├── storage.config.ts
│       └── app.config.ts
│
└── shared/                      # 前后端共享代码
    ├── types/                   # 共享类型定义
    │   ├── user.types.ts
    │   ├── media.types.ts
    │   ├── config.types.ts
    │   └── api.types.ts
    ├── constants/               # 共享常量
    │   ├── routes.ts
    │   ├── errors.ts
    │   └── config.ts
    └── utils/                   # 共享工具函数
        ├── format.ts
        └── validation.ts
```

## 迁移步骤

### 阶段 1：准备工作（不影响现有代码）

1. 创建新的目录结构
2. 更新 tsconfig.json 路径别名
3. 创建迁移脚本

### 阶段 2：后端代码迁移

1. 迁移 API 路由（src/app/api/* → src/backend/api/*）
2. 迁移业务逻辑（src/lib/* → src/backend/services/*）
3. 迁移数据层（src/lib/db.ts, filesystem.db.ts 等 → src/backend/data/*）
4. 迁移外部客户端（src/lib/*.client.ts → src/backend/clients/*）

### 阶段 3：前端代码迁移

1. 迁移页面组件（src/app/* → src/frontend/app/*）
2. 迁移 UI 组件（src/components/* → src/frontend/components/*）
3. 迁移 Hooks（src/hooks/* → src/frontend/hooks/*）
4. 迁移样式文件（src/styles/* → src/frontend/styles/*）

### 阶段 4：共享代码提取

1. 提取共享类型定义到 src/shared/types/
2. 提取共享常量到 src/shared/constants/
3. 提取共享工具函数到 src/shared/utils/

### 阶段 5：配置更新

1. 更新 next.config.js
2. 更新 tsconfig.json
3. 更新导入路径

### 阶段 6：测试与验证

1. 运行 `pnpm build` 验证构建
2. 运行 `pnpm dev` 验证开发环境
3. 测试关键功能

## 路径别名配置

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@frontend/*": ["./src/frontend/*"],
      "@backend/*": ["./src/backend/*"],
      "@shared/*": ["./src/shared/*"],
      "@components/*": ["./src/frontend/components/*"],
      "@hooks/*": ["./src/frontend/hooks/*"],
      "@services/*": ["./src/backend/services/*"],
      "@api/*": ["./src/backend/api/*"],
      "@utils/*": ["./src/backend/utils/*"],
      "~/*": ["./public/*"]
    }
  }
}
```

## Next.js App Router 适配

由于 Next.js App Router 要求页面和 API 路由必须在 `src/app` 目录下，我们需要：

1. **保留 src/app 作为路由入口**
2. **将实际逻辑移到 src/frontend 和 src/backend**
3. **src/app 中的文件作为薄层，导入实际实现**

### 示例：API 路由适配

```typescript
// src/app/api/login/route.ts (薄层)
export { POST } from '@backend/api/auth/login';

// src/backend/api/auth/login.ts (实际实现)
export async function POST(request: Request) {
  // 实际登录逻辑
}
```

### 示例：页面组件适配

```typescript
// src/app/login/page.tsx (薄层)
export { default } from '@frontend/app/(auth)/login/page';

// src/frontend/app/(auth)/login/page.tsx (实际实现)
export default function LoginPage() {
  // 实际页面组件
}
```

## 优势

1. **清晰的代码组织**：前后端完全分离，职责明确
2. **按功能模块化**：相关代码聚合在一起，易于维护
3. **类型安全**：共享类型定义，避免前后端类型不一致
4. **易于测试**：业务逻辑独立，便于单元测试
5. **团队协作**：前后端开发人员可以独立工作
6. **代码复用**：共享代码统一管理
7. **渐进式迁移**：可以逐步迁移，不影响现有功能

## 注意事项

1. **保持 Next.js 兼容性**：必须保留 src/app 目录结构
2. **更新所有导入路径**：使用新的路径别名
3. **测试覆盖**：每个模块迁移后都要测试
4. **文档更新**：更新开发文档和 README
5. **Git 历史**：使用 `git mv` 保留文件历史

## 时间估算

- 阶段 1：1 天
- 阶段 2：3-5 天
- 阶段 3：3-5 天
- 阶段 4：1-2 天
- 阶段 5：1 天
- 阶段 6：2-3 天

**总计：11-17 天**

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 构建失败 | 高 | 分阶段迁移，每步验证构建 |
| 导入路径错误 | 中 | 使用 TypeScript 类型检查 |
| 功能回归 | 高 | 完整的功能测试 |
| 性能下降 | 中 | 性能基准测试 |

## 成功标准

- ✅ `pnpm build` 成功
- ✅ `pnpm dev` 正常运行
- ✅ 所有页面正常访问
- ✅ 所有 API 正常响应
- ✅ 类型检查无错误
- ✅ 核心功能测试通过
