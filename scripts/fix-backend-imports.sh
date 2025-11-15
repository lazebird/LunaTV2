#!/bin/bash

# 修复 backend 目录中的导入路径

echo "修复 backend 目录中的相对导入路径..."

# 修复 backend/clients 目录
find src/backend/clients -name "*.ts" -type f -exec sed -i "s|from './client-cache'|from '@/lib/client-cache'|g" {} \;
find src/backend/clients -name "*.ts" -type f -exec sed -i "s|from './types'|from '@/lib/types'|g" {} \;
find src/backend/clients -name "*.ts" -type f -exec sed -i "s|from './auth'|from '@/lib/auth'|g" {} \;
find src/backend/clients -name "*.ts" -type f -exec sed -i "s|from './watching-updates'|from '@/lib/watching-updates'|g" {} \;
find src/backend/clients -name "*.ts" -type f -exec sed -i "s|from './db'|from '@/lib/db'|g" {} \;
find src/backend/clients -name "*.ts" -type f -exec sed -i "s|from './shortdrama-cache'|from '@/lib/shortdrama-cache'|g" {} \;
find src/backend/clients -name "*.ts" -type f -exec sed -i "s|from './tmdb-cache'|from '@/lib/tmdb-cache'|g" {} \;
find src/backend/clients -name "*.ts" -type f -exec sed -i "s|from './calendar-cache'|from '@/lib/calendar-cache'|g" {} \;
find src/backend/clients -name "*.ts" -type f -exec sed -i "s|from './database-cache'|from '@/lib/database-cache'|g" {} \;

# 修复 backend/data/storage 目录
find src/backend/data/storage -name "*.ts" -type f -exec sed -i "s|from './types'|from '@/lib/types'|g" {} \;
find src/backend/data/storage -name "*.ts" -type f -exec sed -i "s|from '../types'|from '@/lib/types'|g" {} \;
find src/backend/data/storage -name "*.ts" -type f -exec sed -i "s|from '../../types'|from '@/lib/types'|g" {} \;
find src/backend/data/storage -name "*.ts" -type f -exec sed -i "s|from './admin.types'|from '@/lib/admin.types'|g" {} \;
find src/backend/data/storage -name "*.ts" -type f -exec sed -i "s|from './filesystem.db'|from '@/lib/filesystem.db'|g" {} \;
find src/backend/data/storage -name "*.ts" -type f -exec sed -i "s|from './kvrocks.db'|from '@/lib/kvrocks.db'|g" {} \;
find src/backend/data/storage -name "*.ts" -type f -exec sed -i "s|from './redis.db'|from '@/lib/redis.db'|g" {} \;
find src/backend/data/storage -name "*.ts" -type f -exec sed -i "s|from './upstash.db'|from '@/lib/upstash.db'|g" {} \;
find src/backend/data/storage -name "*.ts" -type f -exec sed -i "s|from './redis-base.db'|from '@/lib/redis-base.db'|g" {} \;

# 修复 backend/utils 目录
find src/backend/utils -name "*.ts" -type f -exec sed -i "s|from './types'|from '@/lib/types'|g" {} \;
find src/backend/utils -name "*.ts" -type f -exec sed -i "s|from '../types'|from '@/lib/types'|g" {} \;

echo "✅ 导入路径修复完成"
