#!/bin/bash

echo "🔧 开始修复所有导入路径..."

# 修复 backend/data/storage 目录
echo "📁 修复 backend/data/storage..."
find src/backend/data/storage -name "*.ts" -type f -exec sed -i \
  -e "s|from './filesystem/|from '@/lib/filesystem/|g" \
  -e "s|from '../filesystem/|from '@/lib/filesystem/|g" \
  {} \;

# 修复 backend/clients 目录
echo "📁 修复 backend/clients..."
find src/backend/clients -name "*.ts" -type f -exec sed -i \
  -e "s|from './|from '@/lib/|g" \
  {} \;

# 修复 backend/utils 目录
echo "📁 修复 backend/utils..."
find src/backend/utils -name "*.ts" -type f -exec sed -i \
  -e "s|from './|from '@/lib/|g" \
  {} \;

# 修复 frontend/components 目录
echo "📁 修复 frontend/components..."
find src/frontend/components -name "*.tsx" -type f -exec sed -i \
  -e "s|from './BackButton'|from '@/components/BackButton'|g" \
  -e "s|from './MobileBottomNav'|from '@/components/MobileBottomNav'|g" \
  -e "s|from './MobileHeader'|from '@/components/MobileHeader'|g" \
  -e "s|from './ModernNav'|from '@/components/ModernNav'|g" \
  -e "s|from './Sidebar'|from '@/components/Sidebar'|g" \
  -e "s|from './SiteProvider'|from '@/components/SiteProvider'|g" \
  -e "s|from './ThemeProvider'|from '@/components/ThemeProvider'|g" \
  -e "s|from './ThemeToggle'|from '@/components/ThemeToggle'|g" \
  -e "s|from './UserMenu'|from '@/components/UserMenu'|g" \
  -e "s|from './VersionPanel'|from '@/components/VersionPanel'|g" \
  -e "s|from './VideoCard'|from '@/components/VideoCard'|g" \
  -e "s|from './SessionTracker'|from '@/components/SessionTracker'|g" \
  {} \;

echo "✅ 导入路径修复完成"
echo ""
echo "📊 统计信息："
echo "- Backend storage: $(find src/backend/data/storage -name "*.ts" | wc -l) 个文件"
echo "- Backend clients: $(find src/backend/clients -name "*.ts" | wc -l) 个文件"
echo "- Backend utils: $(find src/backend/utils -name "*.ts" | wc -l) 个文件"
echo "- Frontend components: $(find src/frontend/components -name "*.tsx" | wc -l) 个文件"
