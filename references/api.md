# 济南公交 (出行369) API 文档

## 基础信息

| 项目 | 值 |
|------|-----|
| API 域名 | `https://api.369cx.cn/v2/` |
| 协议 | HTTPS |
| 数据格式 | JSON |
| User-Agent | `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36` |

---

## 登录接口

### 1. 获取二维码
```
GET /Auth/LoginByScan/1

Response:
{
  "status": {"code": 401, "msg": "abc123"}  // msg 是二维码ID
}
```

### 2. 二维码链接
```
https://jngj.369cx.cn/scanlogin.html?{msg}
```

### 3. 轮询登录状态
```
GET /Auth/LoginByScan/{msg}

Response (等待扫码):
{"status": {"code": 401}}

Response (登录成功):
{
  "result": {
    "token": "Bearer eyJhbGci...",
    "nickName": "用户昵称"
  },
  "status": {"code": 0}
}
```

---

## 业务接口

### 1. 搜索
```
POST /Search
Authorization: {token}

Body: {"keyword": "K93"}

Response:
{
  "result": {
    "result": [
      {"type": 1, "text1": "K93路", "guid": "610"},  // type=1 线路
      {"type": 2, "text1": "XX站", "guid": "..."}    // type=2 站点
    ]
  }
}
```

### 2. 线路实时信息
```
GET /Line/GetRealTimeLineInfo/{lineId}
Authorization: {token}

Response:
{
  "result": {
    "name": "K93路",
    "startStationName": "起点",
    "endStationName": "终点",
    "firstDepartureTime": "6:00",
    "lastDepartureTime": "21:00",
    "stations": [
      {"stationNo": 1, "name": "站名", "distance": 500}
    ],
    "busses": [
      {
        "name": "K0001",
        "stationNo": 5,
        "velocity": 25.0,
        "distance": 150,
        "ratio": 75
      }
    ]
  }
}
```

### 3. 车辆实时状态
```
GET /Bus/GetBussesByLineId/{lineId}
Authorization: {token}
```

---

## 字段说明

### 车辆字段
| 字段 | 说明 |
|------|------|
| `stationNo` | 当前站序号 |
| `velocity` | 速度 (km/h) |
| `distance` | 距下站距离 (m) |
| `ratio` | 满载率 (%) |
| `siteTime` | 停站时间 (秒) |

### 站点字段
| 字段 | 说明 |
|------|------|
| `stationNo` | 站序号 |
| `name` | 站名 |
| `distance` | 距上站距离 (m) |

---

## 状态码

| 状态码 | 含义 |
|--------|------|
| 0 | 成功 |
| 401 | 认证失败 / 等待扫码 |
