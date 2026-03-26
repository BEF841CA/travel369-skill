# 济南公交查询 Skill

通过[出行369](https://jngj.369cx.cn) API 查询济南市公交车实时位置、到站时间、线路站点。

## 功能

- 🚌 查询任意线路的实时车辆位置
- ⏱️ 查询到达某站的来车时间
- 📍 查看线路全部站点
- 🔐 扫码登录，token 自动缓存

## 安装

### 1. 放置 Skill

将 `jinan-bus` 文件夹放到 OpenClaw skills 目录：

```bash
cp -r jinan-bus ~/.openclaw/skills/
```

### 2. 登录

```bash
cd ~/.openclaw/skills/jinan-bus/scripts
python3 login.py
```

扫码登录后 token 自动保存，有效期约 30 天。

### 3. 依赖

```bash
pip3 install requests
```

## 使用

### 命令行

```bash
cd ~/.openclaw/skills/jinan-bus/scripts

# 查询某路公交所有车辆
python3 query.py K93

# 查询到达某站的来车时间
python3 query.py K163 --station 舜旺路

# 查看线路站点
python3 query.py K163 --stops
```

### OpenClaw 对话

安装 skill 后，直接在对话中提问：

```
K93路公交到哪了？
我在新泺大街舜旺路，K163最近的车多久到？
K163都有哪些站？
```

## 文件结构

```
jinan-bus/
├── SKILL.md              # 技能描述（OpenClaw 识别用）
├── README.md             # 本文件
├── scripts/
│   ├── login.py          # 扫码登录
│   └── query.py          # 查询脚本
└── references/
    └── api.md            # API 接口文档
```

## 数据来源

- API：[出行369](https://api.369cx.cn)
- 需要出行369账号（实名注册即可）

## 注意

- `~/.openclaw/jinan-bus-token.json` 包含登录凭证，**不要分享给别人**
- Token 有效期约 30 天，过期后重新运行 `login.py`
- 仅支持济南市公交线路

## License

MIT
