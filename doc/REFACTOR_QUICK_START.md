# 🚀 代码重构快速开始指南

## 📊 当前状态

根据代码分析，项目存在以下问题：

- **71个超大文件** (>300行)
- **196个超大函数** (>50行)
- **最大文件**: admin/page.tsx (7454行) 🔴
- **总代码量**: 79,548行

## 🎯 重构目标

将所有文件控制在300行以内，函数控制在50行以内。

## 📋 优先级列表

| 优先级 | 文件 | 行数 | 状态 |
|--------|------|------|------|
| 🔴 P0 | admin/page.tsx | 7454 | ⏳ 待处理 |
| 🔴 P0 | play/page.tsx | 4847 | ⏳ 待处理 |
| 🟡 P1 | db.client.ts | 2440 | ⏳ 待处理 |
| 🟡 P1 | play-stats/page.tsx | 2310 | ⏳ 待处理 |
| 🟡 P1 | live/page.tsx | 2218 | ⏳ 待处理 |
| 🟡 P1 | UserMenu.tsx | 2170 | ⏳ 待处理 |

## 🛠️ 可用工具

### 1. 代码分析工具

```bash
# 分析代码复杂度
node scripts/analyze-code-complexity.js
```

### 2. 组件结构生成器

```bash
# 创建新组件结构
./scripts/create-component-structure.sh <路径> <组件名>

# 示例：创建用户管理组件
./scripts/create-component-structure.sh src/app/admin/components UserManagement
```

### 3. 共享工具模块

已创建的工具模块：

```typescript
// API请求Hook
import { useApiRequest } from '@/shared/hooks/useApiRequest';

// API客户端
import { api } from '@/shared/utils/apiClient';

// 验证工具
import { validation, validateForm } from '@/shared/utils/validation';

// 格式化工具
import { format } from '@/shared/utils/format';
```

## 🚀 立即开始：拆分 admin/page.tsx

### 步骤1：创建分支

```bash
git checkout -b refactor/admin-page
```

### 步骤2：备份原文件

```bash
cp src/app/admin/page.tsx src/app/admin/page.tsx.backup
```

### 步骤3：创建组件结构

```bash
# 创建用户管理组件
mkdir -p src/app/admin/components/UserManagement/{hooks,components}

# 创建视频源管理组件
mkdir -p src/app/admin/components/SourceManagement/{hooks,components}

# 创建直播源管理组件
mkdir -p src/app/admin/components/LiveSourceManagement/{hooks,components}

# 创建分类管理组件
mkdir -p src/app/admin/components/CategoryManagement/{hooks,components}

# 创建站点配置组件
mkdir -p src/app/admin/components/SiteConfiguration/{hooks,components}

# 创建配置文件编辑器
mkdir -p src/app/admin/components/ConfigFileEditor/{hooks,components}
```

### 步骤4：提取用户管理模块

#### 4.1 创建 Hook (useUserManagement.ts)

```typescript
// src/app/admin/components/UserManagement/hooks/useUserManagement.ts
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

  const updateUser = async (username: string, userData: any) => {
    await execute(() => api.put(`/api/admin/users/${username}`, userData), {
      onSuccess: () => fetchUsers(),
    });
  };

  const deleteUser = async (username: string) => {
    await execute(() => api.delete(`/api/admin/users/${username}`), {
      onSuccess: () => fetchUsers(),
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    addUser,
    updateUser,
    deleteUser,
    refetch: fetchUsers,
  };
}
```

#### 4.2 创建用户列表组件 (UserList.tsx)

```typescript
// src/app/admin/components/UserManagement/components/UserList.tsx
interface UserListProps {
  users: any[];
  onEdit: (user: any) => void;
  onDelete: (username: string) => void;
}

export function UserList({ users, onEdit, onDelete }: UserListProps) {
  return (
    <div className="user-list">
      <table className="w-full">
        <thead>
          <tr>
            <th>用户名</th>
            <th>角色</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.username}>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>
                <button onClick={() => onEdit(user)}>编辑</button>
                <button onClick={() => onDelete(user.username)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

#### 4.3 创建主组件 (index.tsx)

```typescript
// src/app/admin/components/UserManagement/index.tsx
'use client';

import { useState } from 'react';
import { useUserManagement } from './hooks/useUserManagement';
import { UserList } from './components/UserList';

export function UserManagement() {
  const { users, loading, addUser, updateUser, deleteUser } = useUserManagement();
  const [editingUser, setEditingUser] = useState(null);

  if (loading) return <div>加载中...</div>;

  return (
    <div className="user-management">
      <h2>用户管理</h2>
      <UserList
        users={users}
        onEdit={setEditingUser}
        onDelete={deleteUser}
      />
      {/* 添加用户表单 */}
    </div>
  );
}
```

#### 4.4 在主页面中使用

```typescript
// src/app/admin/page.tsx (简化后)
'use client';

import { useState } from 'react';
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

### 步骤5：测试功能

```bash
# 启动开发服务器
pnpm dev

# 访问管理页面测试
# http://localhost:3000/admin
```

### 步骤6：提交更改

```bash
git add .
git commit -m "refactor(admin): 提取用户管理模块"
```

## 📝 重构检查清单

每完成一个模块，检查以下项目：

- [ ] 文件行数 < 300行
- [ ] 函数行数 < 50行
- [ ] 功能正常工作
- [ ] 无TypeScript错误
- [ ] 无ESLint警告
- [ ] 代码可读性提升
- [ ] 已提交到Git

## 🎯 下一步计划

### 第1周：admin/page.tsx
- [ ] Day 1-2: 用户管理模块
- [ ] Day 3-4: 视频源管理模块
- [ ] Day 5: 其他配置模块

### 第2周：play/page.tsx
- [ ] Day 1-2: 播放器组件
- [ ] Day 3: 剧集列表组件
- [ ] Day 4-5: 其他组件

### 第3周：其他大文件
- [ ] db.client.ts
- [ ] play-stats/page.tsx
- [ ] live/page.tsx
- [ ] UserMenu.tsx

## 💡 重构技巧

### 1. 识别可提取的代码

```typescript
// ❌ 不好：所有逻辑在一个组件中
function BigComponent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };
  
  return <div>{/* 大量JSX */}</div>;
}

// ✅ 好：逻辑提取到Hook
function SmallComponent() {
  const { users, loading } = useUsers();
  return <UserList users={users} loading={loading} />;
}
```

### 2. 使用组件组合

```typescript
// ❌ 不好：单一大组件
function AdminPage() {
  return (
    <div>
      {/* 7000行JSX */}
    </div>
  );
}

// ✅ 好：组件组合
function AdminPage() {
  return (
    <AdminLayout>
      <UserManagement />
      <SourceManagement />
      <SiteConfiguration />
    </AdminLayout>
  );
}
```

### 3. 提取通用逻辑

```typescript
// ❌ 不好：重复的API调用代码
const handleAdd = async () => {
  setLoading(true);
  try {
    await fetch('/api/add', { method: 'POST', body: JSON.stringify(data) });
    alert('成功');
  } catch (err) {
    alert('失败');
  } finally {
    setLoading(false);
  }
};

// ✅ 好：使用通用Hook
const { execute, loading } = useApiRequest();
const handleAdd = () => {
  execute(() => api.post('/api/add', data), {
    onSuccess: () => alert('成功'),
    onError: () => alert('失败'),
  });
};
```

## 📚 参考资源

- [详细重构方案](./REFACTOR_IMPLEMENTATION_PLAN.md)
- [代码优化计划](./CODE_OPTIMIZATION_PLAN.md)
- [实施指南](./IMPLEMENTATION_GUIDE.md)

## ❓ 常见问题

### Q: 重构会影响现有功能吗？
A: 不会。我们采用渐进式重构，每次只改一小部分，并立即测试。

### Q: 需要多长时间？
A: 预计2-3周完成所有重构。

### Q: 如果出问题怎么办？
A: 每次重构都在独立分支进行，可以随时回滚。

## 🎉 开始重构

```bash
# 1. 分析代码
node scripts/analyze-code-complexity.js

# 2. 创建分支
git checkout -b refactor/admin-page

# 3. 开始重构
# 按照上面的步骤进行...

# 4. 测试
pnpm dev

# 5. 提交
git commit -m "refactor: 完成xxx模块重构"
```

---

**准备好了吗？让我们开始重构之旅！** 🚀
