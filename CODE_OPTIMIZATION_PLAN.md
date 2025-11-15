# 代码优化方案

## 问题分析

### 当前代码问题

1. **文件过大**
   - `admin/page.tsx`: 7453行 - 严重超标
   - `play/page.tsx`: 4846行 - 严重超标
   - `db.client.ts`: 2439行 - 超标
   - `play-stats/page.tsx`: 2309行 - 超标

2. **代码复杂度高**
   - 单个组件包含多个子组件
   - 业务逻辑与UI混合
   - 重复代码多
   - 缺乏抽象和封装

3. **可维护性差**
   - 难以定位问题
   - 修改影响范围大
   - 测试困难

## 优化目标

1. **文件行数限制**
   - 组件文件: ≤ 300行
   - 工具函数文件: ≤ 200行
   - 类型定义文件: ≤ 150行

2. **函数复杂度限制**
   - 单个函数: ≤ 50行
   - 圈复杂度: ≤ 10

3. **代码质量提升**
   - 提取通用逻辑
   - 封装重复代码
   - 分离关注点

## 优化策略

### 1. 提取通用组件和Hooks

#### 通用UI组件
```typescript
// src/shared/components/AlertModal.tsx
// src/shared/components/ConfirmModal.tsx
// src/shared/components/LoadingSpinner.tsx
```

#### 通用Hooks
```typescript
// src/shared/hooks/useAlertModal.ts
// src/shared/hooks/useLoadingState.ts
// src/shared/hooks/useConfirmModal.ts
// src/shared/hooks/useApiRequest.ts
```

#### 通用工具函数
```typescript
// src/shared/utils/api.ts - API请求封装
// src/shared/utils/validation.ts - 验证函数
// src/shared/utils/format.ts - 格式化函数
```

### 2. 拆分大型组件

#### admin/page.tsx 拆分方案

```
src/app/admin/
├── page.tsx (主入口, <100行)
├── components/
│   ├── UserConfig/
│   │   ├── index.tsx (主组件, <200行)
│   │   ├── UserList.tsx (<150行)
│   │   ├── UserGroupManager.tsx (<150行)
│   │   ├── AddUserForm.tsx (<100行)
│   │   ├── UserPermissionModal.tsx (<150行)
│   │   └── hooks/
│   │       ├── useUserManagement.ts (<100行)
│   │       └── useUserGroupManagement.ts (<100行)
│   ├── VideoSourceConfig/
│   │   ├── index.tsx (<200行)
│   │   ├── SourceList.tsx (<150行)
│   │   ├── SourceForm.tsx (<100行)
│   │   ├── SourceValidation.tsx (<150行)
│   │   ├── ImportExportModal.tsx (<150行)
│   │   └── hooks/
│   │       └── useSourceManagement.ts (<100行)
│   ├── CategoryConfig/
│   │   ├── index.tsx (<150行)
│   │   ├── CategoryList.tsx (<100行)
│   │   └── CategoryForm.tsx (<80行)
│   ├── SiteConfig/
│   │   ├── index.tsx (<200行)
│   │   ├── BasicSettings.tsx (<100行)
│   │   ├── ProxySettings.tsx (<100行)
│   │   └── TMDBSettings.tsx (<100行)
│   └── ConfigFile/
│       ├── index.tsx (<150行)
│       ├── SubscriptionManager.tsx (<100行)
│       └── ConfigEditor.tsx (<80行)
└── hooks/
    ├── useAdminConfig.ts (<100行)
    └── useTabNavigation.ts (<50行)
```

#### play/page.tsx 拆分方案

```
src/app/play/
├── page.tsx (主入口, <150行)
├── components/
│   ├── VideoPlayer/
│   │   ├── index.tsx (<200行)
│   │   ├── PlayerControls.tsx (<150行)
│   │   ├── DanmakuPanel.tsx (<150行)
│   │   └── SkipController.tsx (已存在)
│   ├── EpisodeList/
│   │   ├── index.tsx (<150行)
│   │   ├── EpisodeGrid.tsx (<100行)
│   │   └── EpisodeSelector.tsx (已存在)
│   ├── VideoInfo/
│   │   ├── index.tsx (<100行)
│   │   ├── BasicInfo.tsx (<80行)
│   │   └── SourceSelector.tsx (<80行)
│   └── RelatedContent/
│       ├── index.tsx (<100行)
│       └── RecommendationList.tsx (<100行)
└── hooks/
    ├── useVideoPlayer.ts (<150行)
    ├── useEpisodeManagement.ts (<100行)
    ├── useDanmaku.ts (<100行)
    └── usePlayHistory.ts (<80行)
```

### 3. 提取业务逻辑层

#### API Service层
```typescript
// src/backend/services/admin/user.service.ts
export class UserService {
  async addUser(data: AddUserDto) { }
  async updateUser(id: string, data: UpdateUserDto) { }
  async deleteUser(id: string) { }
  async getUserList(filters: UserFilters) { }
}

// src/backend/services/admin/source.service.ts
export class SourceService {
  async addSource(data: AddSourceDto) { }
  async updateSource(id: string, data: UpdateSourceDto) { }
  async validateSource(id: string, keyword: string) { }
}
```

#### 统一API请求Hook
```typescript
// src/shared/hooks/useApiRequest.ts
export function useApiRequest<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const request = async (
    fn: () => Promise<T>,
    options?: RequestOptions
  ): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      if (options?.onError) {
        options.onError(error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return { request, loading, error };
}
```

### 4. 统一样式系统

```typescript
// src/shared/styles/buttonStyles.ts
export const buttonStyles = {
  primary: 'px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700...',
  success: 'px-3 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700...',
  danger: 'px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700...',
  // ... 其他样式
};

// src/shared/components/Button.tsx
export const Button = ({ variant, children, ...props }) => {
  return (
    <button className={buttonStyles[variant]} {...props}>
      {children}
    </button>
  );
};
```

### 5. 类型定义优化

```typescript
// src/shared/types/admin.types.ts
export interface User {
  username: string;
  role: UserRole;
  // ...
}

export interface VideoSource {
  key: string;
  name: string;
  // ...
}

// 使用类型组合而不是重复定义
export type UserWithPermissions = User & {
  permissions: Permission[];
};
```

## 实施步骤

### 阶段1：提取通用代码（1-2天）

1. 提取通用组件
   - AlertModal
   - ConfirmModal
   - LoadingSpinner
   - Button
   - Input
   - Select

2. 提取通用Hooks
   - useAlertModal
   - useLoadingState
   - useConfirmModal
   - useApiRequest

3. 提取通用工具函数
   - API请求封装
   - 错误处理
   - 数据验证

### 阶段2：拆分admin/page.tsx（2-3天）

1. 拆分UserConfig组件
2. 拆分VideoSourceConfig组件
3. 拆分CategoryConfig组件
4. 拆分SiteConfig组件
5. 拆分ConfigFile组件

### 阶段3：拆分play/page.tsx（2-3天）

1. 拆分VideoPlayer组件
2. 拆分EpisodeList组件
3. 拆分VideoInfo组件
4. 拆分RelatedContent组件

### 阶段4：优化其他大文件（2-3天）

1. 优化db.client.ts
2. 优化play-stats/page.tsx
3. 优化UserMenu.tsx
4. 优化VideoCard.tsx

### 阶段5：测试和验证（1-2天）

1. 功能测试
2. 性能测试
3. 代码审查

## 优化效果预期

### 代码质量指标

| 指标 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| 最大文件行数 | 7453 | <300 | 96% |
| 平均文件行数 | 800 | <150 | 81% |
| 代码重复率 | 30% | <10% | 67% |
| 圈复杂度 | 15-20 | <10 | 50% |

### 可维护性提升

1. **模块化**：每个文件职责单一，易于理解
2. **可复用**：通用组件和Hooks可在多处使用
3. **可测试**：小函数易于编写单元测试
4. **可扩展**：新功能添加不影响现有代码

### 开发效率提升

1. **定位问题快**：文件小，问题容易定位
2. **修改影响小**：模块独立，修改不影响其他模块
3. **协作友好**：多人可同时开发不同模块
4. **代码审查快**：小文件易于审查

## 注意事项

1. **保持功能不变**：重构过程中不修改业务逻辑
2. **渐进式重构**：一次重构一个模块，确保每步都能工作
3. **及时测试**：每完成一个模块就测试
4. **保留备份**：使用Git分支，随时可以回滚
5. **文档更新**：更新相关文档和注释

## 成功标准

- [ ] 所有文件行数 < 300行
- [ ] 所有函数行数 < 50行
- [ ] 圈复杂度 < 10
- [ ] 代码重复率 < 10%
- [ ] 所有功能正常工作
- [ ] 性能无明显下降
- [ ] TypeScript编译无错误
- [ ] 所有测试通过
