const fs = require('fs');
const path = require('path');

// 递归遍历目录
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      callback(filePath);
    }
  });
}

// 更新文件中的导入路径
function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // 替换组件导入
  if (content.includes("from '@/components/")) {
    content = content.replace(/from '@\/components\//g, "from '@/frontend/components/");
    updated = true;
  }
  
  // 替换hooks导入
  if (content.includes("from '@/hooks/")) {
    content = content.replace(/from '@\/hooks\//g, "from '@/frontend/hooks/");
    updated = true;
  }
  
  // 替换lib导入（前端部分）
  if (content.includes("from '@/lib/") && !filePath.includes('/api/')) {
    content = content.replace(/from '@\/lib\//g, "from '@/frontend/lib/");
    updated = true;
  }
  
  // 替换types导入
  if (content.includes("from '@/types/")) {
    content = content.replace(/from '@\/types\//g, "from '@/frontend/types/");
    updated = true;
  }
  
  // 替换styles导入
  if (content.includes("from '@/styles/")) {
    content = content.replace(/from '@\/styles\//g, "from '@/frontend/styles/");
    updated = true;
  }
  
  // API路由中的lib导入保持使用backend
  if (filePath.includes('/api/') && content.includes("from '@/lib/")) {
    content = content.replace(/from '@\/lib\//g, "from '@/backend/lib/");
    updated = true;
  }
  
  // API路由中的types导入
  if (filePath.includes('/api/') && content.includes("from '@/types/")) {
    content = content.replace(/from '@\/types\//g, "from '@/backend/types/");
    updated = true;
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
}

// 处理src目录
const srcDir = path.join(__dirname, '../src');
walkDir(srcDir, updateImports);

console.log('Import paths updated successfully!');