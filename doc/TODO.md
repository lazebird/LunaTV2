# Feat
- ~~管理员配置页面的视频源列表增加搜索/过滤框，对表格中所有元素的JSON.stringify进行搜索/过滤~~
- ~~管理员配置页面使用左侧菜单和右侧内容的布局~~
- ~~详细分析下项目的版本更新检查机制~~
- ~~对代码进行结构优化和复杂度优化，删除冗余代码，抽象/封装复杂代码和通用接口，降低代码圈复杂度，限制函数和文件的代码行数，确保代码结构简单清晰~~
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
