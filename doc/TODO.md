# Feat
- ~~管理员配置页面的视频源列表增加搜索/过滤框，对表格中所有元素的JSON.stringify进行搜索/过滤~~
- ~~管理员配置页面使用左侧菜单和右侧内容的布局~~
- ~~详细分析下项目的版本更新检查机制~~
- 对代码进行结构优化和复杂度优化，删除冗余代码，抽象/封装复杂代码和通用接口，降低代码圈复杂度，限制函数和文件的代码行数，确保代码结构简单清晰
  - ✅ 已创建优化方案文档（CODE_OPTIMIZATION_PLAN.md）
  - ✅ 已创建共享模块（hooks、components、utils、styles）
  - ✅ 已创建实施指南（IMPLEMENTATION_GUIDE.md）
  - ✅ 已创建优化示例（OPTIMIZATION_EXAMPLE.md）
  - ✅ 已创建详细重构计划（REFACTOR_IMPLEMENTATION_PLAN.md）
  - ✅ 已创建快速开始指南（REFACTOR_QUICK_START.md）
  - ✅ 已创建代码分析工具（scripts/analyze-code-complexity.js）
  - ✅ 已创建组件生成脚本（scripts/create-component-structure.sh）
  - ✅ 已创建共享工具模块（useApiRequest、apiClient、validation、format）
  - 🔄 正在拆分大型组件（admin/page.tsx、play/page.tsx等）
  - 📊 代码分析结果：71个超大文件，196个超大函数
  - 🎯 重构优先级：P0(admin/page.tsx 7454行, play/page.tsx 4847行)
  - ✅ 已创建 UserManagement Hook (useUserManagement.ts)
  - ⏳ 正在拆分 UserManagement 组件
  - 📄 详见 REFACTOR_PROGRESS.md
- 分离前后端代码，前端代码放在src/frontend，后端代码放在src/backend；按照功能需求/用户视角重新组织优化代码结构；通过pnpm build确保构建成功
  - ✅ 已创建目录结构（frontend/backend/shared）
  - ✅ 已复制文件到新位置
  - ✅ 已更新TypeScript配置
  - ⏳ 正在修复导入路径（70%完成）
  - ⏳ 待验证构建成功
  - 📄 详见 BUILD_STATUS.md
- 尝试引入第三方UI库等组件，代替自定义组件，简化代码逻辑
- 分离前后端，分离业务，尝试分成monorepo

# Issue
- ~~订阅配置保存失败~~

# Usage
```bash
docker login --username=lazebird@163.com registry.cn-hangzhou.aliyuncs.com

docker build --tag registry.cn-hangzhou.aliyuncs.com/lazebird/lunatv .
docker push registry.cn-hangzhou.aliyuncs.com/lazebird/lunatv
```
