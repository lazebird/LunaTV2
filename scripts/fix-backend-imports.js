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
  
  // 替换backend目录中的lib导入
  if (content.includes("from '@/lib/")) {
    content = content.replace(/from '@\/lib\//g, "from '@/backend/lib/");
    updated = true;
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
}

// 处理src/backend目录
const backendDir = '/home/liulang/projects/backup/LunaTV/src/backend';
walkDir(backendDir, updateImports);

console.log('Backend imports updated successfully!');