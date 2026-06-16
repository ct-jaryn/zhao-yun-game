# 三国赵云传 · 长坂坡

一款三国题材的幸存者-like 动作网页游戏。赵云在长坂坡单骑闯关，抵御一波波曹军。

## 项目结构

```
zhao-yun-game/
├── server/          # Node.js + Express 后端
│   ├── server.js
│   ├── routes/      # API 路由
│   ├── services/    # 排行榜与存档服务
│   └── package.json
├── client/          # 前端
│   ├── index.html
│   ├── css/         # 样式文件
│   └── js/          # ES Modules 拆分的游戏逻辑
└── README.md
```

## 快速开始

```bash
cd server
npm install
npm start
```

打开浏览器访问 http://localhost:3000 即可开始游戏。

## 后端 API

- `GET  /api/leaderboard?limit=N` — 获取排行榜
- `POST /api/leaderboard` — 提交成绩 `{name, score, kills, wave, level, time}`
- `GET  /api/saves` — 读取最近一次存档
- `POST /api/saves` — 保存存档 `{player, wave, score, gameTime, totalKills}`

## 操作说明

| 按键 | 功能 |
|------|------|
| W A S D | 移动 |
| 鼠标左键 | 点击地面移动 / 按住瞄准 |
| J | 普通攻击 |
| K | 枪刃旋风（AOE）|
| L | 突刺（突进）|
| U | 烽火燎原（大范围）|
| I | 龙胆枪绝（终极技）|
| 空格 | 闪避翻滚 |
| E | 拾取装备 |
| Tab | 装备面板 |
| Esc | 暂停 / 保存存档 |

## 主要优化

- **前后端拆分**：Express 后端提供静态资源与排行榜/存档 API。
- **模块化前端**：原生 ES Modules 拆分配置、实体、输入、渲染、UI 与主循环。
- **角色素材升级**：使用 8 方向像素风赵云切片替代原有几何图形角色，并接入普攻、旋风斩、闪避翻滚、受伤、死亡 4 帧动画。
- **升级奖励选择**：升级时弹出三选一奖励卡。
- **鼠标操作**：支持点击地面移动与按住鼠标瞄准。
- **连击增强**：连击越高得分倍率越高，到达里程碑触发特效。
- **响应式画布**：自适应窗口尺寸，保持 16:9 比例。
- **排行榜**：开始与结算界面均可查看前 10 名。

## 技术栈

- 后端：Node.js + Express
- 前端：原生 HTML5 Canvas + ES Modules
- 存储：内存 + JSON 文件持久化（无需数据库）
