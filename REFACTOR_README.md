# 🔧 代码重构工具使用指南

## 📖 概述

本项目提供了一套完整的代码重构工具和方法论，帮助将大型复杂文件拆分为小型、可维护的模块。

## 🎯 重构目标

- **文件行数**: ≤ 300行
- **函数行数**: ≤ 50行
- **圈复杂度**: ≤ 10
- **代码重复率**: < 10%

## 📊 当前状态

```bash
# 运行代码分析工具查看当前状态
node scripts/analyze-code-complexity.js
```

**分析结果**:
- 71个超大文件 (>300行)
- 196个超大函数 (>50行)
- 最大文件: admin/page.tsx (7,454行)

## 🛠️ 可用工具

### 1. 代码分析工具

**文件**: `scripts/analyze-code-complexity.js`

**功能**:
- 扫描所有TypeScript/JavaScript文件
- 识别超大文件和超大函数
- 生成优先级建议
- 提供详细统计报告

**使用方法**:
```bash
node scripts/analyze-code-complexity.js
```

**输出示例**:
```
📊 代码复杂度分析报告
================================================================================

📁 总计: 206 个文件, 79,548 行代码

🔍 发现 71 个超大文件 (>300行):

1. 🔴 极高 src/app/admin/page.tsx
   📏 7454 行 (超出 7154 行)
2. 🔴 极高 src/app/play/page.tsx
   📏 4847 行 (超出 4547 行)
...

📋 重构优先级建议:

🔴 P0 src/app/admin/page.tsx (7454 行)
🟡 P1 src/app/play/page.tsx (4847 行)
...
```

### 2. 组件结构生成器

**文件**: `scripts/create-component-structure.sh`

**功能**:
- 自动创建组件目录结构
- 生成模板文件
- 包含hooks、components、types目录
- 减少重复工作

**使用方法**:
```bash
./scripts/create-component-structure.sh <组件路径> <组件名>
```

**示例**:
```bash
# 创建用户管理组件
./scripts/create-component-structure.sh src/app/admin/components UserManagement

# 会创建以下结构:
# src/app/admin/components/UserManagement/
# ├── index.tsx
# ├── hooks/
# │   └── useUserManagementLogic.ts
# ├── components/
# └── types.ts
```

### 3. 共享工具模块

#### useApiRequest Hook

**文件**: `src/shared/hooks/useApiRequest.ts`

**功能**: 统一的API请求处理

**使用示例**:
```typescript
import { useApiRequest } from '@/shared/hooks/useApiRequest';

function MyComponent() {
  const { execute, loading, error } = useApiRequest();

  const handleSubmit = async () => {
    const result = await execute(
      async () => {
        const response = await fetch('/api/endpoint', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return response.json();
      },
      {
        onSuccess: (data) => {
          console.log('成功:', data);
        },
        onError: (error) => {
          console.error('失败:', error);
        },
      }
    );
  };

  return (
    <div>
      {loading && <p>加载中...</p>}
      {error && <p>错误: {error.message}</p>}
      <button onClick={handleSubmit}>提交</button>
    </div>
  );
}
```

#### API客户端

**文件**: `src/shared/utils/apiClient.ts`

**功能**: 封装的fetch API

**使用示例**:
```typescript
import { api } from '@/shared/utils/apiClient';

// GET请求
const users = await api.get('/api/users');

// POST请求
const newUser = await api.post('/api/users', {
  username: 'test',
  password: '123456',
});

// PUT请求
const updated = await api.put('/api/users/123', {
  username: 'newname',
});

// DELETE请求
await api.delete('/api/users/123');
```

#### 验证工具

**文件**: `src/shared/utils/validation.ts`

**功能**: 表单验证和数据验证

**使用示例**:
```typescript
import { validation, validateForm, validateUrl } from '@/shared/utils/validation';

// 单个验证
if (!validation.isValidUrl(url)) {
  alert('URL格式不正确');
}

if (!validation.isValidEmail(email)) {
  alert('Email格式不正确');
}

// 表单验证
const errors = validateForm(formData, {
  username: (value) => 
    validation.isValidUsername(value) ? null : '用户名格式不正确',
  password: (value) =>
    validation.isValidPassword(value) ? null : '密码至少6位',
  url: (value) =>
    validateUrl(value, 'API地址'),
});

if (Object.keys(errors).length > 0) {
  console.error('验证失败:', errors);
}
```

#### 格式化工具

**文件**: `src/shared/utils/format.ts`

**功能**: 数据格式化

**使用示例**:
```typescript
import { format } from '@/shared/utils/format';

// 日期格式化
format.date(Date.now()); // "2025-01-15"
format.date(Date.now(), true); // "2025-01-15 14:30"

// 时长格式化
format.duration(65); // "1:05"
format.duration(3665); // "1:01:05"

// 文件大小格式化
format.fileSize(1024); // "1.00 KB"
format.fileSize(1048576); // "1.00 MB"

// 数字格式化
format.number(1234567); // "1,234,567"

// 文本截断
format.truncate('很长的文本...', 10); // "很长的文本..."

// 相对时间
format.relativeTime(Date.now() - 60000); // "1分钟前"
format.relativeTime(Date.now() - 3600000); // "1小时前"
```

## 📝 重构流程

### 标准流程

```bash
# 1. 分析代码，确定重构目标
node scripts/analyze-code-complexity.js

# 2. 创建重构分支
git checkout -b refactor/component-name

# 3. 备份原文件
cp src/path/to/file.tsx src/path/to/file.tsx.backup

# 4. 创建新组件结构
./scripts/create-component-structure.sh src/path/to/components ComponentName

# 5. 提取代码到新组件
# 编辑新创建的文件，将代码从原文件移动过来

# 6. 更新主文件
# 在原文件中导入并使用新组件

# 7. 测试功能
pnpm dev
# 手动测试所有相关功能

# 8. 提交更改
git add .
git commit -m "refactor(scope): 提取ComponentName组件"

# 9. 删除备份（确认无问题后）
rm src/path/to/file.tsx.backup

# 10. 合并到主分支
git checkout main
git merge refactor/component-name
```

### 重构示例

#### 示例1: 拆分大型页面组件

**重构前** (admin/page.tsx - 7454行):
```typescript
export default function AdminPage() {
  // 100+ 个状态变量
  const [users, setUsers] = useState([]);
  const [sources, setSources] = useState([]);
  // ...

  // 50+ 个函数
  const handleAddUser = async () => { /* 50行代码 */ };
  const handleDeleteUser = async () => { /* 30行代码 */ };
  // ...

  return (
    <div>
      {/* 7000+ 行JSX */}
    </div>
  );
}
```

**重构后** (admin/page.tsx - <200行):
```typescript
import { UserManagement } from './components/UserManagement';
import { SourceManagement } from './components/SourceManagement';
// ... 其他导入

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="admin-layout">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="admin-content">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'sources' && <SourceManagement />}
        {/* ... 其他标签页 */}
      </main>
    </div>
  );
}
```

**新组件** (UserManagement/index.tsx - <150行):
```typescript
import { useUserManagement } from './hooks/useUserManagement';
import { UserList } from './components/UserList';
import { UserForm } from './components/UserForm';

export function UserManagement() {
  const {
    users,
    loading,
    addUser,
    updateUser,
    deleteUser,
  } = useUserManagement();

  return (
    <div className="user-management">
      <h2>用户管理</h2>
      <UserList 
        users={users}
        onEdit={updateUser}
        onDelete={deleteUser}
      />
      <UserForm onSubmit={addUser} />
    </div>
  );
}
```

**业务逻辑Hook** (hooks/useUserManagement.ts - <100行):
```typescript
import { useState, useEffect } from 'react';
import { api } from '@/shared/utils/apiClient';
import { useApiRequest } from '@/shared/hooks/useApiRequest';

export function useUserManagement() {
  const [users, setUsers] = useState([]);
  const { execute, loading } = useApiRequest();

  const fetchUsers = async () => {
    const result = await execute(() => api.get('/api/admin/users'));
    if (result) setUsers(result);
  };

  const addUser = async (userData: any) => {
    await execute(() => api.post('/api/admin/users', userData), {
      onSuccess: () => fetchUsers(),
    });
  };

  // ... 其他方法

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, addUser, updateUser, deleteUser };
}
```

## 📚 文档资源

### 核心文档
- [代码重构工作总结](./CODE_REFACTOR_SUMMARY.md) - 完整的工作总结
- [快速开始指南](./REFACTOR_QUICK_START.md) - 立即开始重构
- [详细实施计划](./REFACTOR_IMPLEMENTATION_PLAN.md) - 完整的重构方案
- [代码优化计划](./CODE_OPTIMIZATION_PLAN.md) - 优化策略和目标

### 工具文档
- [代码分析工具](./scripts/analyze-code-complexity.js) - 源码中有详细注释
- [组件生成器](./scripts/create-component-structure.sh) - 源码中有详细注释

## 🎯 重构优先级

根据代码分析结果，建议按以下优先级进行重构：

### P0 (极高优先级)
1. **admin/page.tsx** (7,454行)
   - 用户管理模块
   - 视频源管理模块
   - 直播源管理模块
   - 分类管理模块
   - 站点配置模块
   - 配置文件编辑器

2. **play/page.tsx** (4,847行)
   - 视频播放器组件
   - 剧集列表组件
   - 视频信息组件
   - 相关内容组件

### P1 (高优先级)
3. **db.client.ts** (2,440行)
4. **play-stats/page.tsx** (2,310行)
5. **live/page.tsx** (2,218行)
6. **UserMenu.tsx** (2,170行)

### P2 (中优先级)
7. **tvbox/page.tsx** (1,848行)
8. **search/page.tsx** (1,703行)
9. **VideoCard.tsx** (1,380行)
10. 其他60+个超大文件

## ✅ 验收标准

每个重构完成后，检查以下项目：

### 代码质量
- [ ] 所有文件 < 300行
- [ ] 所有函数 < 50行
- [ ] 圈复杂度 < 10
- [ ] TypeScript 无错误
- [ ] ESLint 无警告

### 功能完整性
- [ ] 所有功能正常工作
- [ ] 无回归bug
- [ ] 性能无明显下降

### 可维护性
- [ ] 代码结构清晰
- [ ] 组件职责单一
- [ ] 易于理解和修改
- [ ] 有适当的注释

## 💡 最佳实践

### DO ✅
- ✅ 使用共享工具模块（useApiRequest、api、validation、format）
- ✅ 一次只重构一个小模块
- ✅ 每次改动后立即测试
- ✅ 频繁提交到Git
- ✅ 保持代码简洁清晰
- ✅ 编写有意义的提交信息

### DON'T ❌
- ❌ 一次重构太多代码
- ❌ 修改业务逻辑
- ❌ 跳过测试环节
- ❌ 重复造轮子（使用共享模块）
- ❌ 过度优化
- ❌ 忽略类型安全

## 🚀 快速开始

```bash
# 1. 查看当前代码状态
node scripts/analyze-code-complexity.js

# 2. 阅读快速开始指南
cat REFACTOR_QUICK_START.md

# 3. 创建第一个重构分支
git checkout -b refactor/admin-user-management

# 4. 创建组件结构
./scripts/create-component-structure.sh src/app/admin/components UserManagement

# 5. 开始重构...
```

## 📞 获取帮助

如果在重构过程中遇到问题：

1. 查看 [快速开始指南](./REFACTOR_QUICK_START.md)
2. 查看 [详细实施计划](./REFACTOR_IMPLEMENTATION_PLAN.md)
3. 查看 [代码重构工作总结](./CODE_REFACTOR_SUMMARY.md)
4. 查看共享工具模块的源码和注释

---

**祝重构顺利！** 🎉
