#!/bin/bash

# 安全清理脚本 - 删除已被模块化替代的废弃文件
# ⚠️ 警告：执行前请确保新组件已通过集成测试！

set -e

echo "🗑️  代码重构 - 安全清理工具"
echo ""
echo "⚠️  警告：此操作将删除已被模块化替代的大文件"
echo "⚠️  请确保新组件已通过集成测试！"
echo ""

# 创建备份
BACKUP_DIR="backup_before_cleanup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 创建备份目录: $BACKUP_DIR"
echo ""

# 待删除的文件列表（这些文件的功能已被新组件完全替代）
# 注意：这里列出的是重复的frontend/backend目录中的文件
# 原始的src目录文件保留，因为它们仍在使用中

FILES_TO_BACKUP=(
  "src/frontend/components/layout/UserMenu.tsx"
  "src/frontend/components/media/VideoCard.tsx"
  "src/frontend/components/media/SkipController.tsx"
  "src/backend/clients/db.client.ts"
  "src/backend/data/storage/redis-base.storage.ts"
  "src/backend/data/storage/upstash.storage.ts"
  "src/backend/data/storage/filesystem.storage.ts"
)

echo "准备备份和清理以下文件:"
for file in "${FILES_TO_BACKUP[@]}"; do
  if [ -f "$file" ]; then
    echo "  - $file"
  fi
done
echo ""

read -p "确认继续？(yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "❌ 操作已取消"
  exit 0
fi

echo ""
echo "开始备份和清理..."
echo ""

# 备份并删除文件
for file in "${FILES_TO_BACKUP[@]}"; do
  if [ -f "$file" ]; then
    # 创建目录结构
    dir=$(dirname "$file")
    mkdir -p "$BACKUP_DIR/$dir"
    
    # 备份文件
    cp "$file" "$BACKUP_DIR/$file"
    echo "✅ 已备份: $file"
    
    # 删除文件
    rm "$file"
    echo "🗑️  已删除: $file"
  else
    echo "⏭️  跳过（不存在）: $file"
  fi
done

echo ""
echo "✅ 清理完成！"
echo ""
echo "备份位置: $BACKUP_DIR"
echo ""
echo "如需恢复，运行："
echo "  cp -r $BACKUP_DIR/* ."
