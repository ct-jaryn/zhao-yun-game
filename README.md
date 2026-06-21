# 三国赵云传 · 长坂坡

一款三国题材的幸存者-like 动作网页游戏。赵云在长坂坡单骑闯关，抵御一波波曹军。

> 当前版本已全面迁移至 **Phaser 3 + Vite**：渲染、动画、物理与输入由 Phaser 3 接管，使用 Vite 构建并打包，`client/` 目录可直接部署到任意静态站点。

## 项目结构

```
zhao-yun-game/
├── client/                 # 前端（唯一入口）
│   ├── index.html          # 单页入口
│   ├── src/                # ES Modules 源码
│   │   ├── main.js         # Vite 入口，初始化 Phaser GameApp
│   │   ├── phaser/         # Phaser 3 场景、实体、插件、工具
│   │   └── api.js          # 后端 API 封装（可选）
│   ├── css/                # 样式文件
│   ├── assets/             # 图片、音效等静态资源
│   ├── test-*.mjs          # Playwright 测试脚本
│   ├── package.json
│   └── vite.config.js
├── server/                 # 旧 Node.js + Express 后端（可选）
└── README.md
```

## 快速开始

### 开发模式

```bash
cd client
npm install
npm run dev
```

打开浏览器访问终端输出的地址（默认 `http://localhost:5173`）即可。

### 生产构建

```bash
cd client
npm run build
npm run preview
```

构建产物位于 `client/dist/`，可直接部署到 GitHub Pages / Netlify / Vercel 等静态托管服务。

### 旧 Express 后端（可选）

```bash
cd server
npm install
npm start
```

> 注意：排行榜与存档码功能依赖后端 API，在纯静态部署下会自动降级；后续计划迁移到浏览器本地存储或 Serverless 服务。

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
| Esc | 暂停 |

## 主要优化

- **Phaser 3 全面改造**：使用 Phaser 3.90 接管渲染、动画、物理、输入与场景管理，替代原生的 HTML5 Canvas 手写渲染循环。
- **Vite 构建工具链**：支持热更新、生产打包、资源哈希与静态资源优化。
- **Playwright 自动化测试**：覆盖启动、全章节/皮肤、暂停、装备、升级、对话、战斗、阶段、死亡与胜利等流程。
- **纯静态部署**：统一单一 HTML 入口（`client/index.html`），可直接托管到任意静态站点。
- **按需/分阶段资源加载**：启动时只加载玩家皮肤、UI 与通用资源；进入章节后再异步加载对应敌人素材，显著降低首屏流量。
- **素材清理与压缩**：删除未引用的源文件、预览图、备份目录与重复格式；压缩后 `client/assets` 从约 200MB 降至约 30MB。
- **模块化前端**：ES Modules 拆分配置、实体、输入、渲染、UI 与主循环。
- **角色素材升级**：使用 8 方向像素风赵云切片替代原有几何图形角色，并接入普攻、旋风斩、闪避翻滚、受伤、死亡动画。
- **机甲赵云皮肤**：独立头像、技能图标与全套黑金机甲动画。
- **升级奖励选择**：升级时弹出三选一奖励卡。
- **鼠标操作**：支持点击地面移动与按住鼠标瞄准。
- **连击增强**：连击越高得分倍率越高，到达里程碑触发特效。
- **响应式画布**：自适应窗口尺寸，保持 16:9 比例。

## 技术栈

- 前端：Phaser 3.90 + ES Modules + HTML/CSS
- 构建：Vite 5.4
- 测试：Playwright 1.61
- 部署：任意静态文件服务器 / GitHub Pages / Netlify / Vercel
- 旧后端：Node.js + Express（可选）

## 脚本说明

```bash
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run preview      # 预览生产构建
npm test             # 启动测试
npm run test:full    # 全章节/皮肤测试
npm run test:regression  # 回归测试（暂停/装备/升级/对话/战斗/阶段/死亡/胜利等）
```
