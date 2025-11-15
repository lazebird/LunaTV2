#!/bin/bash

# 组件结构创建脚本
# 用法: ./scripts/create-component-structure.sh <component-path> <component-name>
# 示例: ./scripts/create-component-structure.sh src/app/admin/components UserManagement

set -e

COMPONENT_PATH=$1
COMPONENT_NAME=$2

if [ -z "$COMPONENT_PATH" ] || [ -z "$COMPONENT_NAME" ]; then
  echo "用法: $0 <component-path> <component-name>"
  echo "示例: $0 src/app/admin/components UserManagement"
  exit 1
fi

FULL_PATH="$COMPONENT_PATH/$COMPONENT_NAME"

echo "📦 创建组件结构: $FULL_PATH"

# 创建目录
mkdir -p "$FULL_PATH/hooks"
mkdir -p "$FULL_PATH/components"

# 创建主组件文件
cat > "$FULL_PATH/index.tsx" << 'EOF'
'use client';

import { use${COMPONENT_NAME}Logic } from './hooks/use${COMPONENT_NAME}Logic';

export function ${COMPONENT_NAME}() {
  const logic = use${COMPONENT_NAME}Logic();

  return (
    <div className="${COMPONENT_NAME_LOWER}">
      <h2>${COMPONENT_NAME}</h2>
      {/* 组件内容 */}
    </div>
  );
}
EOF

# 替换占位符
sed -i "s/\${COMPONENT_NAME}/$COMPONENT_NAME/g" "$FULL_PATH/index.tsx"
COMPONENT_NAME_LOWER=$(echo "$COMPONENT_NAME" | sed 's/\([A-Z]\)/-\L\1/g' | sed 's/^-//')
sed -i "s/\${COMPONENT_NAME_LOWER}/$COMPONENT_NAME_LOWER/g" "$FULL_PATH/index.tsx"

# 创建 Hook 文件
cat > "$FULL_PATH/hooks/use${COMPONENT_NAME}Logic.ts" << 'EOF'
import { useState, useEffect } from 'react';
import { useApiRequest } from '@/shared/hooks/useApiRequest';

export function use${COMPONENT_NAME}Logic() {
  const [data, setData] = useState<any[]>([]);
  const { execute, loading, error } = useApiRequest();

  const fetchData = async () => {
    const result = await execute(async () => {
      const response = await fetch('/api/your-endpoint');
      return response.json();
    });
    if (result) {
      setData(result);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
EOF

sed -i "s/\${COMPONENT_NAME}/$COMPONENT_NAME/g" "$FULL_PATH/hooks/use${COMPONENT_NAME}Logic.ts"

# 创建 types 文件
cat > "$FULL_PATH/types.ts" << 'EOF'
export interface ${COMPONENT_NAME}Props {
  // 定义组件属性
}

export interface ${COMPONENT_NAME}Data {
  // 定义数据类型
}
EOF

sed -i "s/\${COMPONENT_NAME}/$COMPONENT_NAME/g" "$FULL_PATH/types.ts"

echo "✅ 组件结构创建完成!"
echo ""
echo "📁 创建的文件:"
echo "  - $FULL_PATH/index.tsx"
echo "  - $FULL_PATH/hooks/use${COMPONENT_NAME}Logic.ts"
echo "  - $FULL_PATH/types.ts"
echo ""
echo "📝 下一步:"
echo "  1. 编辑 index.tsx 实现组件UI"
echo "  2. 编辑 hooks/use${COMPONENT_NAME}Logic.ts 实现业务逻辑"
echo "  3. 编辑 types.ts 定义类型"
echo "  4. 在父组件中导入使用"
