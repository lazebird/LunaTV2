## 3. 环境变量配置

无论使用哪种部署方式，都需要配置以下环境变量：

| 变量名                   | 必需 | 描述                                                    |
| ------------------------ | ---- | ------------------------------------------------------- |
| USERNAME                 | 是   | 管理员用户名                                            |
| PASSWORD                 | 是   | 管理员密码                                              |
| NEXT_PUBLIC_STORAGE_TYPE | 否   | 存储类型 (file, localstorage, redis, upstash, kvrocks, cf-kv) |
| REDIS_URL                | 否   | Redis 连接 URL (使用 Redis 存储时)                      |
| UPSTASH_REDIS_URL        | 否   | Upstash Redis URL (使用 Upstash 存储时)                 |
| UPSTASH_REDIS_TOKEN      | 否   | Upstash Redis Token (使用 Upstash 存储时)               |
| KVROCKS_URL              | 否   | Kvrocks 连接 URL (使用 Kvrocks 存储时)                  |

## 4. 存储后端选择

### 4.1 File Storage (默认)

使用文件系统存储数据，适用于小型部署或测试环境。数据存储在项目目录的 `data` 文件夹中。

### 4.2 localStorage

适用于单用户或测试环境，数据存储在浏览器中。

### 4.3 Redis

适用于需要数据持久化和多设备同步的场景。

### 4.4 Upstash Redis

适用于无服务器部署场景。

### 4.5 Kvrocks

兼容 Redis 协议的高性能存储。

### 4.6 Cloudflare KV

适用于 Cloudflare Pages 部署，使用 Cloudflare 的全球分布式键值存储。