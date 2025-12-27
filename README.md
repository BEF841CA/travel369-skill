# Travel369 MCP Server

一个用于查询济南公交实时信息的MCP服务器。

## 功能特性

- 扫码登录Travel369账号
- 搜索公交线路和站点
- 订阅公交线路并保存到数据库
- 查询站点实时公交信息
- 获取线路详细实时信息

## 安装

```bash
npm install
```

## 构建

```bash
npm run build
```

## 使用

### 启动服务器

```bash
npm start
```

### MCP工具列表

#### 1. scan-login
扫码登录Travel369账号

**参数:**
- `action`: "request" (获取二维码) 或 "poll" (轮询登录状态)
- `scanId`: 轮询时使用的扫码ID

**示例:**
```json
{
  "type": "scan-login",
  "params": {
    "action": "request"
  }
}
```

#### 2. login-status
查看当前登录状态

**示例:**
```json
{
  "type": "login-status",
  "params": {}
}
```

#### 3. search-bus
搜索公交线路或站点

**参数:**
- `keyword`: 搜索关键词，如"K93"或"火车站"

**示例:**
```json
{
  "type": "search-bus",
  "params": {
    "keyword": "K93"
  }
}
```

#### 4. subscribe-line
订阅公交线路，将线路和站点信息保存到数据库

**参数:**
- `lineId`: 线路ID（从search-bus结果中获取）

**示例:**
```json
{
  "type": "subscribe-line",
  "params": {
    "lineId": 1001
  }
}
```

#### 5. unsubscribe-line
取消订阅公交线路

**参数:**
- `lineId`: 线路ID

**示例:**
```json
{
  "type": "unsubscribe-line",
  "params": {
    "lineId": 1001
  }
}
```

#### 6. list-subscriptions
列出所有已订阅的公交线路

**示例:**
```json
{
  "type": "list-subscriptions",
  "params": {}
}
```

#### 7. query-station
查询站点实时公交信息

**参数:**
- `stationName`: 站点名称

**示例:**
```json
{
  "type": "query-station",
  "params": {
    "stationName": "火车站"
  }
}
```

#### 8. get-line-realtime
获取线路实时详细信息

**参数:**
- `lineId`: 线路ID

**示例:**
```json
{
  "type": "get-line-realtime",
  "params": {
    "lineId": 1001
  }
}
```

## 使用流程

1. 使用 `scan-login` 获取二维码
2. 使用Travel369手机APP扫描二维码
3. 使用 `scan-login` 轮询登录状态，直到登录成功
4. 使用 `search-bus` 搜索公交线路
5. 使用 `subscribe-line` 订阅感兴趣的线路
6. 使用 `query-station` 查询站点实时公交信息

## 技术栈

- TypeScript
- @modelcontextprotocol/sdk
- better-sqlite3
- axios
- zod

## 数据库

使用SQLite存储用户信息和订阅数据：
- 用户表 (users)
- 线路表 (bus_lines)
- 站点表 (bus_stations)

数据库文件位置: `travel369.db`
