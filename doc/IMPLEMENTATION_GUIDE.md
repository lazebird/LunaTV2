# 代码优化实施指南

## 快速开始

### 第一步：使用共享模块（立即可做）

在任何新代码或修改现有代码时，使用已创建的共享模块：

```bash
# 已创建的共享模块
src/shared/
├── hooks/
│   ├── useAlertModal.ts      ✅ 可用
│   ├── useLoadingState.ts    ✅ 可用
│   └── useApiRequest.ts      ✅ 可用
├── components/
│   ├── AlertModal.tsx        ✅ 可用
│   └── LoadingSpinner.tsx    ✅ 可用
├── utils/
│   └── api.ts                ✅ 可用
└── styles/
    └── buttonStyles.ts       ✅ 可用
```

### 第二步：拆分admin/page.tsx（本周）

按以下顺序拆分：

1. **提取UserConfig组件**（优先级：🔴 高）
2. **提取VideoSourceConfig组件**（优先级：🔴 高）
3. **提取CategoryConfig组件**（优先级：🟡 中）
4. **提取SiteConfig组件**（优先级：🟡 中）
5. **提取ConfigFile组件**（优先级：🟢 低）

## 详细步骤

### 步骤1：提取UserConfig组件

#### 1.1 创建目录结构
```bash
mkdir -p src/app/admin/components/UserConfig/{hooks,components}
```

#### 1.2 创建主组件文件
```typescript
// src/app/admin/components/UserConfig/index.tsx
import { AdminConfig } from '@/lib/admin.types';
import { useAlertModal } from '@shared/hooks/useAlertModal';
import { useLoadingState } from '@shared/hooks/useLoadingState';
import { AlertModal } from '@shared/components/AlertModal';

interface UserConfigProps {
  config: AdminConfig | null;
  role: 'owner' | 'admin' | null;
  refreshConfig: () => Promise<void>;
}

export function UserConfig({ config, role, refreshConfig }: UserConfigProps) {
  const { alertModal, showSuccess, showError, hideAlert } = useAlertModal();
  const { isLoading, withLoading } = useLoadingState();
  
  // 组件逻辑...
  
  return (
    <div className='space-y-6'>
      {/* 组件内容 */}
      <AlertModal {...alertModal} onClose={hideAlert} />
    </div>
  );
}
```

#### 1.3 从admin/page.tsx中复制相关代码
- 复制UserConfig相关的状态
- 复制UserConfig相关的函数
- 复制UserConfig相关的JSX

#### 1.4 在admin/page.tsx中使用新组件
```typescript
import { UserConfig } from './components/UserConfig';

// 在render中
{activeTab === 'users' && (
  <UserConfig config={config} role={role} refreshConfig={refreshConfig} />
)}
```

#### 1.5 测试功能
- 测试用户添加
- 测试用户删除
- 测试用户组管理
- 测试权限配置

#### 1.6 删除admin/page.tsx中的旧代码
确认新组件工作正常后，删除旧代码。

---

### 步骤2：提取VideoSourceConfig组件

重复步骤1的流程，针对VideoSourceConfig。

---

### 步骤3：优化现有组件

对于已经独立的组件（如UserMenu.tsx），进行优化：

#### 3.1 使用共享Hooks
```typescript
// 优化前
const [alertModal, setAlertModal] = useState({...});
const showAlert = (config) => {...};

// 优化后
import { useAlertModal } from '@shared/hooks/useAlertModal';
const { alertModal, showSuccess, showError, hideAlert } = useAlertModal();
```

#### 3.2 使用共享组件
```typescript
// 优化前
{loading && <div>加载中...</div>}

// 优化后
import { LoadingSpinner } from '@shared/components/LoadingSpinner';
{loading && <LoadingSpinner />}
```

#### 3.3 使用统一样式
```typescript
// 优化前
<button className='px-3 py-1.5 text-sm font-medium bg-blue-600...'>

// 优化后
import { buttonStyles } from '@shared/styles/buttonStyles';
<button className={buttonStyles.primary}>
```

---

## 代码规范

### 文件大小限制

- 组件文件：≤ 300行
- Hook文件：≤ 100行
- 工具函数文件：≤ 200行
- 类型定义文件：≤ 150行

### 函数复杂度限制

- 单个函数：≤ 50行
- 圈复杂度：≤ 10
- 嵌套层级：≤ 4层

### 命名规范

- 组件：PascalCase（如 `UserConfig`）
- Hook：camelCase，以use开头（如 `useUserManagement`）
- 工具函数：camelCase（如 `apiPost`）
- 常量：UPPER_SNAKE_CASE（如 `MAX_PAGE_SIZE`）
- 类型：PascalCase（如 `UserConfig`）

### 目录结构规范

```
ComponentName/
├── index.tsx           # 主组件
├── ComponentName.tsx   # 如果需要分离
├── hooks/              # 组件专用Hooks
│   └── useXxx.ts
├── components/         # 子组件
│   └── SubComponent.tsx
└── types.ts           # 组件专用类型
```

---

## 检查清单

### 代码质量检查

- [ ] 文件行数 < 300
- [ ] 函数行数 < 50
- [ ] 圈复杂度 < 10
- [ ] 无重复代码
- [ ] 类型定义完整
- [ ] 无any类型（除非必要）

### 功能检查

- [ ] 所有功能正常工作
- [ ] 无控制台错误
- [ ] 无TypeScript错误
- [ ] 性能无明显下降

### 代码风格检查

- [ ] 使用共享模块
- [ ] 遵循命名规范
- [ ] 遵循目录结构规范
- [ ] 有适当的注释

---

## 常见问题

### Q: 什么时候应该提取为共享模块？

A: 当代码在3个或更多地方重复使用时，应该提取为共享模块。

### Q: 如何决定组件拆分的粒度？

A: 遵循单一职责原则：
- 一个组件只做一件事
- 文件行数不超过300行
- 函数行数不超过50行

### Q: 拆分后如何保证功能不变？

A: 
1. 先复制代码到新组件
2. 在新位置测试功能
3. 确认无误后删除旧代码
4. 使用Git管理，随时可回滚

### Q: 如何处理组件间的状态共享？

A: 
1. 通过props传递（优先）
2. 使用Context（中等规模）
3. 使用状态管理库（大规模）

---

## 进度跟踪

### 本周目标

- [x] 创建共享模块
- [ ] 提取UserConfig组件
- [ ] 提取VideoSourceConfig组件
- [ ] 测试功能完整性

### 下周目标

- [ ] 提取CategoryConfig组件
- [ ] 提取SiteConfig组件
- [ ] 开始拆分play/page.tsx

### 本月目标

- [ ] 完成admin/page.tsx拆分
- [ ] 完成play/page.tsx拆分
- [ ] 优化其他大文件
- [ ] 建立代码规范文档

---

## 获取帮助

遇到问题时：

1. 查看 [OPTIMIZATION_EXAMPLE.md](OPTIMIZATION_EXAMPLE.md) 了解示例
2. 查看 [CODE_OPTIMIZATION_PLAN.md](CODE_OPTIMIZATION_PLAN.md) 了解整体计划
3. 查看 [CODE_OPTIMIZATION_SUMMARY.md](CODE_OPTIMIZATION_SUMMARY.md) 了解当前状态

---

## 总结

记住三个原则：

1. **渐进式优化**：一次优化一个模块
2. **保持功能不变**：重构不改变业务逻辑
3. **及时测试**：每完成一个模块就测试

通过遵循这个指南，可以系统地优化代码，提升项目质量。
