# 代码风格规范

## 1. TypeScript/JavaScript 规范

### 1.1 命名规范

- **变量和函数**: 使用 camelCase
  ```typescript
  const userName = 'john';
  const getUserInfo = () => {};
  ```

- **常量**: 使用 SCREAMING_SNAKE_CASE
  ```typescript
  const API_BASE_URL = 'https://api.example.com';
  const MAX_RETRY_COUNT = 3;
  ```

- **类和组件**: 使用 PascalCase
  ```typescript
  class UserService {}
  const VideoCard = () => {};
  ```

- **接口和类型**: 使用 PascalCase，以 I 开头（接口）或不加前缀（类型）
  ```typescript
  interface IUser {
    id: string;
    name: string;
  }
  
  type VideoCardProps = {
    title: string;
  };
  ```

- **文件名**: 使用 kebab-case
  ```
  video-card.tsx
  user-service.ts
  api-response.ts
  ```

### 1.2 类型定义

- 优先使用 interface 而不是 type（除非需要联合类型、条件类型等）
- 为复杂类型创建明确的接口
- 避免使用 any，优先使用 unknown 或具体类型

```typescript
// 好的示例
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// 避免使用 any
function processData(data: unknown): Result {
  // 类型守卫
}
```

### 1.3 函数规范

- 函数应该单一职责，不超过50行
- 使用明确的参数和返回类型
- 优先使用箭头函数

```typescript
// 好的示例
const fetchData = async (url: string): Promise<ApiResponse> => {
  const response = await fetch(url);
  return response.json();
};
```

## 2. React 组件规范

### 2.1 组件结构

```typescript
interface ComponentProps {
  // 属性定义
}

const Component = ({ prop1, prop2 }: ComponentProps) => {
  // 1. Hooks
  const [state, setState] = useState();
  
  // 2. 事件处理函数
  const handleClick = useCallback(() => {
    // 处理逻辑
  }, []);
  
  // 3. 副作用
  useEffect(() => {
    // 副作用逻辑
  }, []);
  
  // 4. 渲染
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default memo(Component);
```

### 2.2 组件规范

- 使用函数组件和 Hooks
- 使用 memo 优化性能
- 复杂组件拆分为子组件
- 使用 TypeScript 明确定义 Props 类型

### 2.3 Hooks 使用

- 自定义 Hook 以 use 开头
- Hook 应该是纯函数，可复用
- 避免在循环、条件或嵌套函数中调用 Hook

```typescript
// 好的示例
const useUserData = (userId: string) => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // 获取用户数据
  }, [userId]);
  
  return { user, setUser };
};
```

## 3. 文件组织规范

### 3.1 目录结构

```
src/
├── components/          # 通用组件
│   ├── ui/              # UI 基础组件
│   └── feature/         # 功能组件
├── hooks/               # 自定义 Hooks
├── lib/                 # 工具库
│   ├── utils.ts         # 通用工具函数
│   ├── api.ts           # API 相关
│   └── types.ts         # 类型定义
├── app/                 # Next.js 页面
│   └── [page]/           # 页面组件
│       ├── components/   # 页面专用组件
│       ├── hooks/        # 页面专用 Hooks
│       └── utils/        # 页面专用工具
└── styles/              # 样式文件
```

### 3.2 导入导出规范

- 使用绝对路径导入
- 按类型分组导入：第三方库 -> 本地模块 -> 类型
- 使用命名导出而非默认导出

```typescript
// 好的示例
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { fetchUser } from '@/lib/api';
```

## 4. API 规范

### 4.1 路由结构

```
/api/
├── [resource]/
│   ├── route.ts         # 主路由
│   ├── [id]/
│   │   └── route.ts     # 动态路由
│   └── index.ts         # 索引（可选）
```

### 4.2 响应格式

使用统一的响应格式：

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
  timestamp?: number;
}
```

### 4.3 错误处理

- 使用统一的错误处理中间件
- 返回适当的 HTTP 状态码
- 提供有意义的错误信息

## 5. 样式规范

### 5.1 Tailwind CSS

- 优先使用 Tailwind 类名
- 避免内联样式
- 复杂组件使用 CSS-in-JS 或 styled-components

### 5.2 响应式设计

- 移动优先原则
- 使用 Tailwind 响应式前缀
- 断点：sm (640px), md (768px), lg (1024px), xl (1280px)

## 6. 性能优化

### 6.1 代码分割

- 使用动态导入分割大型组件
- 使用 React.lazy 和 Suspense
- 路由级别的代码分割

### 6.2 状态管理

- 使用本地状态优先
- 复杂状态使用 Context 或状态管理库
- 避免不必要的重新渲染

### 6.3 图片优化

- 使用 Next.js Image 组件
- 提供适当的尺寸和格式
- 实现懒加载

## 7. 测试规范

### 7.1 单元测试

- 测试文件命名：*.test.ts 或 *.spec.ts
- 使用 Jest 和 React Testing Library
- 测试组件行为而非实现细节

### 7.2 集成测试

- 测试 API 端点
- 测试用户流程
- 使用模拟数据

## 8. Git 规范

### 8.1 提交信息

使用约定式提交格式：

```
type(scope): description

[optional body]

[optional footer]
```

类型：
- feat: 新功能
- fix: 修复 bug
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试
- chore: 构建过程或辅助工具的变动

### 8.2 分支命名

- feature/功能名
- bugfix/问题描述
- hotfix/紧急修复
- release/版本号

## 9. 代码审查

### 9.1 审查要点

- 代码可读性和可维护性
- 性能影响
- 安全问题
- 测试覆盖率
- 类型安全

### 9.2 审查流程

1. 创建 PR
2. 至少一人审查
3. 通过所有测试
4. 解决审查意见
5. 合并到主分支

## 10. 文档规范

### 10.1 代码注释

- 解释为什么，而不是做什么
- 复杂逻辑必须注释
- API 接口必须有 JSDoc

```typescript
/**
 * 获取用户信息
 * @param userId 用户ID
 * @returns 用户信息对象
 * @throws {Error} 当用户不存在时
 */
const getUser = async (userId: string): Promise<User> => {
  // 实现
};
```

### 10.2 README 文件

每个模块和重要组件都应该有 README.md 说明：
- 功能描述
- 使用方法
- API 文档
- 示例代码