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
  
  // 替换从 @/app/ 的导入
  if (content.includes("from '@/app/")) {
    content = content.replace(/from '@\/app\//g, "from '@/frontend/app/");
    updated = true;
  }
  
  // 替换从 @/app/api 的导入
  if (content.includes("from '@/app/api/")) {
    content = content.replace(/from '@\/app\/api\//g, "from '@/backend/api/");
    updated = true;
  }
  
  // 替换从 @/app 的其他引用
  if (content.includes('@/app/')) {
    content = content.replace(/@\/app\//g, '@/frontend/app/');
    updated = true;
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
}

// 处理src目录
const srcDir = '/home/liulang/projects/backup/LunaTV/src';
walkDir(srcDir, updateImports);

console.log('Import paths updated successfully!');