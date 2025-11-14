# Feat
- ~~管理员配置页面的视频源列表增加搜索/过滤框，对表格中所有元素的JSON.stringify进行搜索/过滤~~
- ~~管理员配置页面使用左侧菜单和右侧内容的布局~~
- 分离前后端，分离业务，尝试分成monorepo

# Issue
- ~~订阅配置保存失败~~

# Usage
```bash
docker login --username=lazebird@163.com registry.cn-hangzhou.aliyuncs.com

build --tag registry.cn-hangzhou.aliyuncs.com/lazebird/lunatv .
docker push registry.cn-hangzhou.aliyuncs.com/lazebird/lunatv
```
