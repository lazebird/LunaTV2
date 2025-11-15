# 代码重构实施计划

## 📋 概述

本文档提供**立即可执行**的代码优化方案，采用渐进式重构策略，最小化风险。

## 🎯 优化目标

### 代码质量指标
- 单文件行数：≤ 300行
- 单函数行数：≤ 50行
- 圈复杂度：≤ 10
- 代码重复率：< 10%

### 优先级排序

| 优先级 | 文件 | 行数 | 复杂度 | 影响范围 |
|--------|------|------|--------|----------|
| 🔴 P0 | admin/page.tsx | 7453 | 极高 | 管理功能 |
| 🔴 P0 | play/page.tsx | 4846 | 极高 | 核心播放 |
| 🟡 P1 | play-stats/page.tsx | 2309 | 高 | 统计功能 |
| 🟡 P1 | live/page.tsx | 2217 | 高 | 直播功能 |
| 🟢 P2 | 其他页面 | <2000 | 中 | 辅助功能 |

## 📦 阶段1：基础设施（已完成 ✅）

### 1.1 共享工具模块

已创建以下工具模块：

```
src/shared/
├── hooks/
│   ├── useApiRequest.ts      ✅ API请求Hook
│   ├── useAlertModal.ts       ✅ 已存在
│   ├── useLoadingState.ts     ✅ 已存在
│   └── useUserData.ts         ✅ 已存在
├── utils/
│   ├── apiClient.ts           ✅ API客户端
│   ├── validation.ts          ✅ 验证工具
│   └── format.ts              ✅ 格式化工具
└── components/
    └── (待创建通用组件)
```

### 1.2 通用组件（待创建）

需要创建的通用组件：

```typescript
// src/shared/components/Button.tsx
// src/shared/components/Input.tsx
// src/shared/components/Modal.tsx
// src/shared/components/LoadingSpinner.tsx
// src/shared/components/ErrorMessage.tsx
```

## 🔧 阶段2：拆分 admin/page.tsx（P0）

### 2.1 当前问题分析

```
admin/page.tsx (7453行)
├── 用户管理 (~1500行)
├── 视频源管理 (~2000行)
├── 直播源管理 (~800行)
├── 分类管理 (~600行)
├── 站点配置 (~1200行)
├── 配置文件 (~800行)
└── 其他配置 (~553行)
```

### 2.2 拆分方案

#### 步骤1：提取用户管理模块

```
src/app/admin/
├── page.tsx (主入口, <200行)
└── components/
    └── UserManagement/
        ├── index.tsx (主组件, <150行)
        ├── UserList.tsx (<100行)
        ├── UserForm.tsx (<80行)
        ├── UserGroupManager.tsx (<100行)
        └── hooks/
            └── useUserManagement.ts (<100行)
```

**实施步骤**：
1. 创建目录结构
2. 提取用户列表渲染逻辑到 UserList.tsx
3. 提取用户表单到 UserForm.tsx
4. 提取用户组管理到 UserGroupManager.tsx
5. 提取状态管理到 useUserManagement.ts
6. 在 admin/page.tsx 中导入并使用

#### 步骤2：提取视频源管理模块

```
src/app/admin/components/
└── SourceManagement/
    ├── index.tsx (<150行)
    ├── SourceList.tsx (<100行)
    ├── SourceForm.tsx (<80行)
    ├── SourceValidator.tsx (<100行)
    ├── ImportExportModal.tsx (<100行)
    └── hooks/
        └── useSourceManagement.ts (<100行)
```

#### 步骤3：提取其他配置模块

```
src/app/admin/components/
├── LiveSourceManagement/ (直播源)
├── CategoryManagement/ (分类)
├── SiteConfiguration/ (站点配置)
└── ConfigFileEditor/ (配置文件)
```

### 2.3 重构示例

**重构前**（admin/page.tsx 片段）：
```typescript
// 7453行的巨型文件
export default function AdminPage() {
  // 100+ 个状态变量
  const [users, setUsers] = useState([]);
  const [sources, setSources] = useState([]);
  // ... 更多状态

  // 50+ 个函数
  const handleAddUser = async () => { /* 50行代码 */ };
  const handleDeleteUser = async () => { /* 30行代码 */ };
  // ... 更多函数

  return (
    <div>
      {/* 7000+ 行JSX */}
    </div>
  );
}
```

**重构后**（admin/page.tsx）：
```typescript
// <200行的清晰入口
import { UserManagement } from './components/UserManagement';
import { SourceManagement } from './components/SourceManagement';
import { LiveSourceManagement } from './components/LiveSourceManagement';
// ... 其他导入

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="admin-layout">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="admin-content">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'sources' && <SourceManagement />}
        {activeTab === 'live' && <LiveSourceManagement />}
        {/* ... 其他标签页 */}
      </main>
    </div>
  );
}
```

**重构后**（UserManagement/index.tsx）：
```typescript
// <150行的独立模块
import { UserList } from './UserList';
import { UserForm } from './UserForm';
import { useUserManagement } from './hooks/useUserManagement';

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

**重构后**（hooks/useUserManagement.ts）：
```typescript
// <100行的业务逻辑
import { useState, useEffect } from 'react';
import { api } from '@/shared/utils/apiClient';

export function useUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/admin/users');
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (userData) => {
    await api.post('/api/admin/users', userData);
    await fetchUsers();
  };

  // ... 其他方法

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, addUser, updateUser, deleteUser };
}
```

## 🎮 阶段3：拆分 play/page.tsx（P0）

### 3.1 拆分方案

```
src/app/play/
├── page.tsx (主入口, <150行)
└── components/
    ├── VideoPlayer/
    │   ├── index.tsx (<150行)
    │   ├── PlayerControls.tsx (<100行)
    │   ├── DanmakuPanel.tsx (<100行)
    │   └── hooks/
    │       └── useVideoPlayer.ts (<150行)
    ├── EpisodeList/
    │   ├── index.tsx (<100行)
    │   ├── EpisodeGrid.tsx (<80行)
    │   └── hooks/
    │       └── useEpisodeManagement.ts (<100行)
    ├── VideoInfo/
    │   ├── index.tsx (<80行)
    │   └── SourceSelector.tsx (<60行)
    └── RelatedContent/
        └── index.tsx (<100行)
```

### 3.2 实施步骤

1. **提取播放器组件**
   - 创建 VideoPlayer 目录
   - 提取播放器初始化逻辑
   - 提取控制器逻辑
   - 提取弹幕逻辑

2. **提取剧集列表组件**
   - 创建 EpisodeList 目录
   - 提取剧集渲染逻辑
   - 提取剧集切换逻辑

3. **提取视频信息组件**
   - 创建 VideoInfo 目录
   - 提取基本信息展示
   - 提取源选择器

## 📊 阶段4：优化其他页面（P1-P2）

### 4.1 play-stats/page.tsx (2309行)

拆分为：
- StatisticsOverview (统计概览)
- UserStatistics (用户统计)
- GlobalStatistics (全局统计)
- StatisticsCharts (图表组件)

### 4.2 live/page.tsx (2217行)

拆分为：
- ChannelList (频道列表)
- EPGDisplay (节目单)
- LivePlayer (直播播放器)
- ChannelSearch (频道搜索)

## 🔄 实施流程

### 每个模块的重构流程

```
1. 创建新目录结构
   ↓
2. 创建空组件文件
   ↓
3. 复制相关代码到新文件
   ↓
4. 提取共享逻辑到hooks
   ↓
5. 简化组件，移除重复代码
   ↓
6. 更新主文件导入
   ↓
7. 测试功能
   ↓
8. 删除旧代码
```

### 安全措施

1. **使用Git分支**
   ```bash
   git checkout -b refactor/admin-page
   ```

2. **小步提交**
   - 每完成一个组件就提交
   - 提交信息清晰描述改动

3. **保留备份**
   ```bash
   cp src/app/admin/page.tsx src/app/admin/page.tsx.backup
   ```

4. **及时测试**
   - 每个组件完成后立即测试
   - 确保功能正常再继续

## ✅ 验收标准

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

## 📅 时间估算

| 阶段 | 任务 | 预计时间 |
|------|------|----------|
| 1 | 基础设施 | ✅ 已完成 |
| 2 | admin/page.tsx | 3-4天 |
| 3 | play/page.tsx | 2-3天 |
| 4 | 其他页面 | 3-4天 |
| 5 | 测试和优化 | 2天 |
| **总计** | | **10-13天** |

## 🚀 立即开始

### 第一步：拆分 UserManagement

```bash
# 1. 创建分支
git checkout -b refactor/admin-user-management

# 2. 创建目录
mkdir -p src/app/admin/components/UserManagement/hooks

# 3. 创建文件
touch src/app/admin/components/UserManagement/index.tsx
touch src/app/admin/components/UserManagement/UserList.tsx
touch src/app/admin/components/UserManagement/UserForm.tsx
touch src/app/admin/components/UserManagement/hooks/useUserManagement.ts

# 4. 开始重构...
```

## 📚 参考资源

- [React组件设计最佳实践](https://react.dev/learn/thinking-in-react)
- [代码重构技巧](https://refactoring.guru/)
- [TypeScript最佳实践](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

**更新时间**: 2025-01-XX  
**状态**: 📝 准备就绪，可以开始实施
