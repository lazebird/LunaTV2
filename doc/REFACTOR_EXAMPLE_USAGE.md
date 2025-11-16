# 🎯 重构实战示例

## 概述

本文档展示如何使用已创建的工具和模块进行实际重构。

## 📝 重构前后对比

### 重构前：admin/page.tsx (7454行)

```typescript
// ❌ 问题：所有逻辑混在一起
export default function AdminPage() {
  // 100+ 个状态变量
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 50+ 个函数，每个都很长
  const handleAddUser = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ /* ... */ }),
      });
      if (!res.ok) throw new Error('Failed');
      await refreshConfig();
    } catch (err) {
      alert('Error');
    } finally {
      setLoading(false);
    }
  };
  
  // ... 7000+ 行代码
}
```

### 重构后：使用新工具

#### 1. 使用 useApiRequest Hook

```typescript
// ✅ 好：使用共享Hook
import { useApiRequest } from '@/shared/hooks/useApiRequest';
import { api } from '@/shared/utils/apiClient';

function MyComponent() {
  const { execute, loading, error } = useApiRequest();
  
  const handleAddUser = async (userData: any) => {
    await execute(
      () => api.post('/api/admin/user', userData),
      {
        onSuccess: () => alert('成功'),
        onError: (err) => alert(err.message),
      }
    );
  };
  
  return (
    <div>
      {loading && <p>加载中...</p>}
      {error && <p>错误: {error.message}</p>}
      <button onClick={() => handleAddUser({...})}>添加</button>
    </div>
  );
}
```

#### 2. 使用 UserManagement Hook

```typescript
// ✅ 好：业务逻辑封装在Hook中
import { useUserManagement } from './hooks/useUserManagement';

function UserManagement({ refreshConfig }: { refreshConfig: () => Promise<void> }) {
  const {
    loading,
    addUser,
    banUser,
    deleteUser,
  } = useUserManagement(refreshConfig);
  
  return (
    <div>
      {loading && <p>处理中...</p>}
      <button onClick={() => addUser('test', '123456')}>添加用户</button>
      <button onClick={() => banUser('test')}>封禁用户</button>
      <button onClick={() => deleteUser('test')}>删除用户</button>
    </div>
  );
}
```

#### 3. 使用验证工具

```typescript
// ✅ 好：使用共享验证工具
import { validation, validateForm } from '@/shared/utils/validation';

function UserForm() {
  const [formData, setFormData] = useState({ username: '', email: '' });
  const [errors, setErrors] = useState({});
  
  const handleSubmit = () => {
    const errors = validateForm(formData, {
      username: (value) => 
        validation.isValidUsername(value) ? null : '用户名格式不正确',
      email: (value) =>
        validation.isValidEmail(value) ? null : 'Email格式不正确',
    });
    
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }
    
    // 提交表单...
  };
  
  return (
    <form>
      <input 
        value={formData.username}
        onChange={(e) => setFormData({...formData, username: e.target.value})}
      />
      {errors.username && <span>{errors.username}</span>}
      {/* ... */}
    </form>
  );
}
```

#### 4. 使用格式化工具

```typescript
// ✅ 好：使用共享格式化工具
import { format } from '@/shared/utils/format';

function UserList({ users }: { users: any[] }) {
  return (
    <table>
      {users.map(user => (
        <tr key={user.id}>
          <td>{user.username}</td>
          <td>{format.date(user.createdAt, true)}</td>
          <td>{format.relativeTime(user.lastLogin)}</td>
        </tr>
      ))}
    </table>
  );
}
```

## 🏗️ 完整的组件拆分示例

### 目录结构

```
src/app/admin/components/UserManagement/
├── index.tsx                      # 主组件 (<150行)
├── components/
│   ├── UserList.tsx              # 用户列表 (<100行)
│   ├── UserForm.tsx              # 用户表单 (<80行)
│   └── UserGroupManager.tsx      # 用户组管理 (<100行)
├── hooks/
│   └── useUserManagement.ts      # 业务逻辑 (<100行)
└── types.ts                       # 类型定义 (<50行)
```

### 主组件 (index.tsx)

```typescript
'use client';

import { useState } from 'react';
import { useUserManagement } from './hooks/useUserManagement';
import { UserList } from './components/UserList';
import { UserForm } from './components/UserForm';
import { UserGroupManager } from './components/UserGroupManager';

interface UserManagementProps {
  config: any;
  refreshConfig: () => Promise<void>;
}

export function UserManagement({ config, refreshConfig }: UserManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const {
    loading,
    addUser,
    banUser,
    unbanUser,
    setAdmin,
    removeAdmin,
    changePassword,
    deleteUser,
  } = useUserManagement(refreshConfig);

  const handleAddUser = async (username: string, password: string, userGroup?: string) => {
    await addUser(username, password, userGroup);
    setShowAddForm(false);
  };

  if (!config) {
    return <div>加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4>用户管理</h4>
        <button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '取消' : '添加用户'}
        </button>
      </div>

      {showAddForm && (
        <UserForm onSubmit={handleAddUser} loading={loading} />
      )}

      <UserList
        users={config.UserConfig.Users}
        onBan={banUser}
        onUnban={unbanUser}
        onSetAdmin={setAdmin}
        onRemoveAdmin={removeAdmin}
        onChangePassword={changePassword}
        onDelete={deleteUser}
        loading={loading}
      />

      <UserGroupManager
        groups={config.UserConfig.Tags}
        refreshConfig={refreshConfig}
      />
    </div>
  );
}
```

### 用户列表组件 (UserList.tsx)

```typescript
interface UserListProps {
  users: any[];
  onBan: (username: string) => Promise<void>;
  onUnban: (username: string) => Promise<void>;
  onSetAdmin: (username: string) => Promise<void>;
  onRemoveAdmin: (username: string) => Promise<void>;
  onChangePassword: (username: string, password: string) => Promise<void>;
  onDelete: (username: string) => Promise<void>;
  loading: boolean;
}

export function UserList({
  users,
  onBan,
  onUnban,
  onSetAdmin,
  onRemoveAdmin,
  onChangePassword,
  onDelete,
  loading,
}: UserListProps) {
  return (
    <div className="border rounded-lg overflow-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th>用户名</th>
            <th>角色</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.username}>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>{user.banned ? '已封禁' : '正常'}</td>
              <td>
                {!user.banned ? (
                  <button onClick={() => onBan(user.username)} disabled={loading}>
                    封禁
                  </button>
                ) : (
                  <button onClick={() => onUnban(user.username)} disabled={loading}>
                    解封
                  </button>
                )}
                {/* 更多操作按钮... */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 用户表单组件 (UserForm.tsx)

```typescript
import { useState } from 'react';
import { validation } from '@/shared/utils/validation';

interface UserFormProps {
  onSubmit: (username: string, password: string, userGroup?: string) => Promise<void>;
  loading: boolean;
}

export function UserForm({ onSubmit, loading }: UserFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    userGroup: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    // 验证
    const newErrors: Record<string, string> = {};
    if (!validation.isValidUsername(formData.username)) {
      newErrors.username = '用户名格式不正确';
    }
    if (!validation.isValidPassword(formData.password)) {
      newErrors.password = '密码至少6位';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit(formData.username, formData.password, formData.userGroup);
    setFormData({ username: '', password: '', userGroup: '' });
    setErrors({});
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
      <div>
        <input
          type="text"
          placeholder="用户名"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        />
        {errors.username && <span className="text-red-500 text-sm">{errors.username}</span>}
      </div>

      <div>
        <input
          type="password"
          placeholder="密码"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        />
        {errors.password && <span className="text-red-500 text-sm">{errors.password}</span>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !formData.username || !formData.password}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
      >
        {loading ? '添加中...' : '添加用户'}
      </button>
    </div>
  );
}
```

## 📊 重构效果对比

### 代码行数

| 组件 | 重构前 | 重构后 | 减少 |
|------|--------|--------|------|
| admin/page.tsx | 7,454行 | ~200行 | 97% ↓ |
| UserManagement | - | 150行 | 新增 |
| UserList | - | 100行 | 新增 |
| UserForm | - | 80行 | 新增 |
| useUserManagement | - | 70行 | 新增 |
| **总计** | 7,454行 | ~600行 | 92% ↓ |

### 可维护性

| 指标 | 重构前 | 重构后 | 改善 |
|------|--------|--------|------|
| 最大函数行数 | 4,768行 | <50行 | 99% ↓ |
| 单文件职责 | 混乱 | 单一 | ✅ |
| 代码复用 | 低 | 高 | ✅ |
| 测试难度 | 极难 | 简单 | ✅ |

## 🎯 关键要点

### DO ✅

1. ✅ 使用共享工具模块（useApiRequest、api、validation、format）
2. ✅ 将业务逻辑提取到Hook
3. ✅ 组件保持简洁，只负责UI
4. ✅ 使用TypeScript类型定义
5. ✅ 每个文件 < 150行

### DON'T ❌

1. ❌ 不要在组件中直接写fetch
2. ❌ 不要重复验证逻辑
3. ❌ 不要混合业务逻辑和UI
4. ❌ 不要创建超过200行的文件
5. ❌ 不要忽略错误处理

## 🚀 下一步

1. 继续拆分其他模块（SourceManagement、LiveSourceManagement等）
2. 为每个模块编写单元测试
3. 优化性能和用户体验
4. 更新文档

---

**参考文档**:
- [快速开始指南](./REFACTOR_QUICK_START.md)
- [重构进度](./REFACTOR_PROGRESS.md)
- [工具使用指南](./REFACTOR_README.md)
