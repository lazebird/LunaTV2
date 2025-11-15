#!/usr/bin/env node

/**
 * 代码复杂度分析工具
 * 分析文件行数、函数复杂度等指标
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  maxFileLines: 300,
  maxFunctionLines: 50,
  targetDirs: ['src/app', 'src/components', 'src/lib'],
  extensions: ['.tsx', '.ts', '.jsx', '.js'],
};

// 分析结果
const results = {
  largeFiles: [],
  largeFunctions: [],
  totalFiles: 0,
  totalLines: 0,
};

/**
 * 递归遍历目录
 */
function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        walkDir(filePath, callback);
      }
    } else {
      callback(filePath);
    }
  });
}

/**
 * 分析文件
 */
function analyzeFile(filePath) {
  const ext = path.extname(filePath);
  if (!CONFIG.extensions.includes(ext)) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const lineCount = lines.length;

  results.totalFiles++;
  results.totalLines += lineCount;

  // 检查文件大小
  if (lineCount > CONFIG.maxFileLines) {
    results.largeFiles.push({
      path: filePath,
      lines: lineCount,
      severity: getSeverity(lineCount, CONFIG.maxFileLines),
    });
  }

  // 分析函数
  analyzeFunctions(filePath, content);
}

/**
 * 分析函数复杂度
 */
function analyzeFunctions(filePath, content) {
  // 简单的函数检测（不完美但足够用）
  const functionRegex = /(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:async\s+)?function\s*\([^)]*\))/g;
  const lines = content.split('\n');
  
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    const startIndex = match.index;
    const startLine = content.substring(0, startIndex).split('\n').length;
    
    // 尝试找到函数结束位置（简化版）
    let braceCount = 0;
    let endLine = startLine;
    let foundStart = false;
    
    for (let i = startLine - 1; i < lines.length; i++) {
      const line = lines[i];
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          foundStart = true;
        } else if (char === '}') {
          braceCount--;
          if (foundStart && braceCount === 0) {
            endLine = i + 1;
            break;
          }
        }
      }
      if (foundStart && braceCount === 0) break;
    }
    
    const functionLines = endLine - startLine + 1;
    
    if (functionLines > CONFIG.maxFunctionLines) {
      results.largeFunctions.push({
        path: filePath,
        line: startLine,
        lines: functionLines,
        severity: getSeverity(functionLines, CONFIG.maxFunctionLines),
      });
    }
  }
}

/**
 * 获取严重程度
 */
function getSeverity(actual, threshold) {
  const ratio = actual / threshold;
  if (ratio > 10) return '🔴 极高';
  if (ratio > 5) return '🟠 很高';
  if (ratio > 2) return '🟡 高';
  return '🟢 中';
}

/**
 * 生成报告
 */
function generateReport() {
  console.log('\n📊 代码复杂度分析报告\n');
  console.log('='.repeat(80));
  
  console.log(`\n📁 总计: ${results.totalFiles} 个文件, ${results.totalLines.toLocaleString()} 行代码\n`);
  
  // 大文件报告
  if (results.largeFiles.length > 0) {
    console.log(`\n🔍 发现 ${results.largeFiles.length} 个超大文件 (>${CONFIG.maxFileLines}行):\n`);
    
    results.largeFiles
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 20)
      .forEach((file, index) => {
        const relativePath = path.relative(process.cwd(), file.path);
        console.log(`${index + 1}. ${file.severity} ${relativePath}`);
        console.log(`   📏 ${file.lines} 行 (超出 ${file.lines - CONFIG.maxFileLines} 行)`);
      });
  } else {
    console.log('\n✅ 没有发现超大文件\n');
  }
  
  // 大函数报告
  if (results.largeFunctions.length > 0) {
    console.log(`\n🔍 发现 ${results.largeFunctions.length} 个超大函数 (>${CONFIG.maxFunctionLines}行):\n`);
    
    results.largeFunctions
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 20)
      .forEach((func, index) => {
        const relativePath = path.relative(process.cwd(), func.path);
        console.log(`${index + 1}. ${func.severity} ${relativePath}:${func.line}`);
        console.log(`   📏 ${func.lines} 行 (超出 ${func.lines - CONFIG.maxFunctionLines} 行)`);
      });
  } else {
    console.log('\n✅ 没有发现超大函数\n');
  }
  
  // 优先级建议
  console.log('\n📋 重构优先级建议:\n');
  
  const topFiles = results.largeFiles
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 5);
  
  topFiles.forEach((file, index) => {
    const relativePath = path.relative(process.cwd(), file.path);
    const priority = index === 0 ? '🔴 P0' : index < 3 ? '🟡 P1' : '🟢 P2';
    console.log(`${priority} ${relativePath} (${file.lines} 行)`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 建议:\n');
  console.log('1. 优先重构 P0 级别的文件');
  console.log('2. 将大文件拆分为多个小模块');
  console.log('3. 提取通用逻辑到 hooks 和 utils');
  console.log('4. 使用组件组合而不是单一大组件');
  console.log('\n📖 详细重构方案请查看: REFACTOR_IMPLEMENTATION_PLAN.md\n');
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 开始分析代码复杂度...\n');
  
  CONFIG.targetDirs.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);
    walkDir(fullPath, analyzeFile);
  });
  
  generateReport();
}

// 运行
main();
