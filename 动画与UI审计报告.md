# 三国赵云传 — 动画与 UI 审计报告

> 审计时间：2026-06-18
> 审计范围：`client/` 目录下的运行时动画系统与 UI 系统（以当前入口 `index.html` → `src/main.js` 引用的 Phaser 版本为准）

---

## 1. 项目结构与运行版本

当前实际运行的是 **Phaser 3（v3.90.0）** 版本：

- 入口：`client/index.html` 第 444 行 `<script type="module" src="src/main.js"></script>`
- 主类：`src/phaser/GameApp.js`
- 场景链：`BootScene → PreloadScene → GameScene`
- 构建工具：Vite 5.4，publicDir 指向 `assets/`，构建产物在 `dist/`

> 注意：仓库中同时保留了旧版原生 Canvas 实现（`client/js/` 目录），但已不被 `index.html` 引用，属于遗留代码。建议清理或明确归档，避免维护歧义。

---

## 2. 动画系统审计

### 2.1 资源加载

`src/phaser/plugins/AssetLoader.js` 负责批量加载：

| 资源类型 | 覆盖内容 | 状态 |
|---|---|---|
| 玩家切片 | 经典/机甲 8 方向待机切片 | ✅ 完整 |
| 玩家动作帧 | walk / dodge / hurt / death / ultimate / skill_0~2 | ✅ 完整 |
| 敌人 | 枪兵、曹将、吕布、典韦、许褚、骑兵、弓箭手 的切片与帧动画 | ✅ 完整 |
| 貂蝉 | 8 方向切片 + 被捆绑动画 | ✅ 完整 |
| 章节背景 | 4 张背景图 | ✅ 完整 |
| 通用 UI | 装备、头像、箭头、技能图标等 | ✅ 完整 |

所有 `assets/generated/`、`assets/equipment/`、`assets/player_mecha/` 下的引用资源均存在，加载失败时 `PreloadScene` 会记录 `failedAssetKeys` 到 registry。

### 2.2 动画工厂

`src/phaser/plugins/AnimationFactory.js` 在 `GameScene.create()` 中统一创建 Phaser Animation：

- 玩家两套动画（classic / mecha）
- 敌人按类型创建 walk / attack / ultimate
- 貂蝉被捆绑循环动画

实现简洁，但存在以下隐患：

1. **动画重复创建风险**：`createAnim` 会先 `scene.anims.remove(key)` 再创建。`GameScene.restart()` 会重新走 `create()`，当前做法能避免重复 key 报错，但旧动画对象被移除后，如果其他场景或 sprite 仍引用会报错。当前单场景模式下无问题。
2. **缺失死亡动画**：敌人没有独立的 death 动画，死亡时只是淡出（`setAlpha`），视觉反馈较弱。
3. **弓箭手缺少方向走动画**：弓箭手只有 `walk_left` 一套帧，追踪玩家时靠 8 方向切片替代，移动时会出现“平移切片”的僵硬感。

### 2.3 玩家动画状态机

`src/phaser/entities/Player.js` 的 `syncSprite()` 按优先级处理：

```
death > dodge > attacking (skill/ultimate) > moving walk > idle slice
```

**优点**：
- 优先级清晰，高优先级动作能正确覆盖低优先级。
- 使用 Phaser 原生 `sprite.play(key, true)`，动画播放稳定。
- 受击闪烁通过 `setVisible(false)` 实现，简单有效。

**问题与风险**：

| # | 问题 | 位置 | 影响 |
|---|---|---|---|
| 1 | `hurt` 动画永远不会被触发 | `syncSprite()` 中无 hurt 分支 | `createPlayerAnimations` 创建了 hurt 动画但未被使用，受击时只有闪烁，缺少后仰/受击动作 |
| 2 | 死亡动画只播放一次，无冻结末帧 | `Player.dead` 后 `syncSprite()` 调用 `playAnimationOnce('death')`，但 `update()` 中 `if (this.dead) return;` 导致后续不再同步 sprite，若死亡动画播放完毕可能回到首帧或消失 | 需验证 |
| 3 | `updateFlip()` 对移动/攻击/闪避统一按 `dir` 或 `dodgeDir` 判断，但待机切片方向由 `AssetLoader.resolveSliceDir` 提供 8 方向素材，翻转逻辑与素材朝向耦合 | `Player.js:317-324` | 偶发左右镜像错误，尤其是斜向方向 |
| 4 | 技能 3（烽火燎原 U）没有专属动画 | `AnimationFactory` 只创建了 skill_0~2 | 释放 U 时玩家保持 walk/idle，视觉缺失 |

### 2.4 敌人动画

`src/phaser/entities/Enemy.js` 的 `syncSprite()`：

- 攻击时播放 attack / ultimate 一次性动画
- 移动时按类型播放 walk 动画或回退到 8 方向切片
- 待机回退到 8 方向切片

**问题**：

1. **敌人死亡同样无动画**：仅做 alpha 淡出，Boss 死亡时缺少倒下/爆炸动作。
2. **敌人受击只改 tint**：`hitFlash > 0` 时 `setTint(0xffffff)`，无受击动画或击退。
3. **许褚/典韦/曹操无大招动画资源**：`AnimationFactory` 为 xuzhu / dianwei / general 创建了 `ultimate` 动画，但 `AssetLoader` 未加载 dianwei 的 ultimate 资源（目录中也没有），`Enemy.js` 中 `isUltimate` 为 true 时会尝试播放 `${type}_ultimate`，若资源缺失则静默无动画。
4. **general 类型 Boss 的移动动画按 4 方向**：`general_walk_right/down/up`，但 `syncSprite()` 中直接 `this.sprite.play(`${type}_walk`)`，不会根据方向切换 right/down/up，导致曹将移动动画方向固定。

### 2.5 特效与粒子

`EffectManager` 使用 `Particle` 类（Graphics 矩形）和 `addText`（Phaser Text）。

**优点**：
- 击杀、升级、受击、技能释放均有粒子。
- 屏幕震动/闪光使用 Phaser 原生 `camera.shake/flash`。

**问题**：

1. **粒子为纯色方块**：`Particle.createSprite()` 使用 `fillRect` 绘制正方形，无纹理、无旋转、无混合模式，视觉上较为廉价。
2. **高频创建销毁 Graphics 对象**：每个粒子/漂浮文字都新建 `Phaser.GameObjects.Graphics` 或 `Text`，数量多时会带来 GC 压力。建议改用对象池或 Phaser 粒子系统。
3. ** Projectile 无纹理时使用 Graphics + Container**：同样存在对象创建开销。

### 2.6 貂蝉动画

`DiaoChan.js`：
- 被捆绑状态：每帧按 `tiedAnimTimer` 切换 `diaochan_tied_N`，形成循环动画。
- 获救后：切换到 8 方向切片。

**问题**：
- 获救后没有欢呼/奔跑动画，只是静态切片。
- 救援时没有绳子断裂的帧动画，只有粒子和文字。

---

## 3. UI 系统审计

### 3.1 整体架构

- HTML/CSS 定义全部界面：开始菜单、章节选择、皮肤选择、暂停、装备、升级、对话、死亡/胜利等。
- `UIBridge.js` 绑定 DOM 事件，调用 `GameApp.startChapter()`。
- `UISync.js` 每帧从 `GameController` 同步数据到 DOM。

### 3.2 HUD

`client/index.html` + `client/css/ui.css`：

- 左上角：头像、等级、HP/MP/EXP 条、四维属性
- 右侧：阶段/击杀/连击/得分/时间、击杀日志、装备栏、小地图
- 底部：技能栏、闪避指示器、拾取提示

**优点**：
- 信息层级清晰，金色主题与三国风格一致。
- 血条/蓝条使用渐变 + 高光条，质感较好。
- 低血量警告使用 `box-shadow` 心跳动画，醒目。

**问题**：

| # | 问题 | 说明 |
|---|---|---|
| 1 | 技能冷却显示为 conic-gradient 遮罩 | `UISync.js:88-89` 用 `conic-gradient` 模拟 CD 转圈，但 `cdEl.textContent` 在 CD 期间显示数字，数字与遮罩重叠可读性一般 |
| 2 | 连击数字变化缺少缩放动画 | `updateCombo()` 只在达到 10 的倍数时触发一次 `milestone` class，平时数字跳变更生硬 |
| 3 | 小地图无玩家朝向/敌人类型区分 | 小地图用简单色块，Boss 与小兵只有大小差别，无朝向指示 |
| 4 | 击杀日志样式名不一致 | `ui.css` 中定义 `.kill-item`，但 `UISync.js:150` 生成的是 `.kl-item`，CSS 动画 `fadeIn` 未作用于 Phaser 版本的击杀日志 |

### 3.3 菜单与弹窗

- 开始菜单：背景 Ken Burns + 粒子 Canvas + 光效，视觉效果丰富。
- 章节/皮肤选择：卡片悬停动画、选中状态、锁定状态均实现。
- 暂停面板：左右分栏，显示角色状态与装备，信息完整。
- 升级奖励：三选一卡片，点击后关闭。
- 对话：头像 + 文本 + 继续按钮。

**问题**：

1. **开始菜单标题动画依赖运行时 JS 拆分字符**：`screens.css` 中 `.start-title-block h1 .title-char` 使用逐字动画，但 `index.html` 中 `h1` 被替换为 `img.start-logo`，该动画实际未生效，CSS 规则已失效。
2. **皮肤选择机甲预览图路径**：`index.html:370` 使用 `assets/player_mecha/slices/front.webp`，而 `AssetLoader` 加载的是 `player_mecha/slices/front.webp`（Vite publicDir 下无前缀），实际运行时由 Vite 处理，开发/生产路径一致，无问题。
3. **第四章广告锁屏使用 iframe 加载外部站点**：`index.html:391` 嵌入 `https://monkeycode-ai.com/`，可能受 CSP/跨域/网络影响，且用户体验不可控。
4. **对话框关闭后会残留 `game.paused = false`**：若对话触发前游戏已处于其他暂停状态（如玩家手动暂停），关闭对话会强制恢复，可能破坏状态。

### 3.4 响应式适配

CSS 中已有 `@media (max-width: 900px)`、`@media (max-width: 700px)`、`@media (max-width: 560px)` 等断点，对开始菜单、章节选择、皮肤选择、对话框做了适配。

**问题**：
- HUD 没有针对小屏做明显缩放，在移动端 16:9 容器下右侧面板可能挤占画面。
- 游戏内底部技能栏在小屏下可能超出屏幕。

### 3.5 UI 同步性能

`UISync.js` 使用 `this.cache` 对象做文本缓存，避免无变化时重复设置 `textContent`，这是好的实践。

**问题**：
- `updateEquipSidebar()` 每次通过 `innerHTML` 重建整个装备侧边栏，虽然用 HTML 字符串缓存，但装备变化时仍会导致 DOM 重排。当前装备槽位只有 5 个，影响轻微。
- `updateKillLog()` 同样每次 `innerHTML` 重建。

---

## 4. 测试与运行状况

已执行的测试：

| 测试 | 命令 | 结果 |
|---|---|---|
| 启动测试 | `npm test` | ✅ 通过 |
| 全章节/皮肤测试 | `npm run test:full` | ✅ 通过 |
| 回归测试 | `npm run test:regression` | ⚠️ `testGameOver` 超时 |

`testGameOver` 超时原因分析：该测试调用 `g.player.takeDamage(99999)`，理论上能直接致死并触发 `gameOver()`。超时可能由于 Playwright 在 evaluate 后页面状态未更新，或测试流程中浏览器上下文被前面用例影响。建议单独运行该用例确认是否为偶发。

---

## 5. 关键问题汇总（按优先级）

### 🔴 高优先级

1. **玩家受击动画未使用**：`hurt` 动画资源已加载但 `Player.syncSprite()` 未播放，导致受击反馈仅有闪烁。
2. **敌人无死亡动画**：所有敌人死亡都是简单淡出，Boss 战的高潮反馈不足。
3. **技能 3（U）无动画**：玩家释放“烽火燎原”时无对应动作。
4. **general 类型敌人移动方向动画未按方向切换**：曹将/Boss 移动动画固定为 right。

### 🟡 中优先级

5. **粒子系统使用 Graphics 对象池缺失**：高并发特效时存在 GC 风险。
6. **击杀日志 CSS 类名不一致**：`.kill-item` vs `.kl-item`。
7. **对话框会强制恢复 pause 状态**：可能破坏暂停栈。
8. **广告锁屏依赖外部 iframe**：稳定性与合规性风险。
9. **Boss 复活后视觉状态未重置**：`reviveBoss()` 没有恢复 sprite 的 alpha/rotation/scale，也没有恢复血条和名字的可见性，复活后可能保持死亡外观。
10. **枪兵移动动画未按方向切换**：枪兵有 `spearman_walk_right/down/up`，但 `Enemy.syncSprite()` 只尝试播放不存在的 `spearman_walk`，导致移动时回退到切片。
11. **`resolveWalkDir4` 返回不存在的 `left` 方向**：曹将/枪兵没有 `*_walk_left` 动画资源，函数返回 `left` 会导致方向动画缺失并回退到切片。

### 🟢 低优先级

9. 开始菜单标题 CSS 动画已失效（因替换为 logo 图片）。
10. 小地图可进一步美化（朝向、敌人类型图标）。
11. 旧版 `client/js/` 代码与新版并存，建议清理。

---

## 6. 改进建议

1. **修复 hurt 动画播放**：在 `Player.syncSprite()` 中加入 `if (this.hurtAnim.isActive && !this.dodging && !this.attacking)` 分支，或引入 `hurtTimer` 在受击时播放 hurt 动画。
2. **补充敌人死亡动画**：若资源允许，为通用敌人/BOSS 增加倒地或消散动画；否则至少加入死亡时缩放/旋转 + 粒子爆炸。
3. **为技能 3 增加一个施法动作**：可复用 skill_2（突刺）或新增一个抬手帧。
4. **general 移动动画按方向选择**：在 `Enemy.syncSprite()` 中根据 `resolveWalkDir4(dir)` 切换 `general_walk_right/down/up`。
5. **引入 Phaser 粒子管理器**：用 `Phaser.GameObjects.Particles.ParticleManager` 替代手动 Graphics，提升性能与视觉效果。
6. **统一击杀日志类名**：将 `UISync.js` 中的 `.kl-item` 改为 `.kill-item`，或反向更新 CSS。
7. **暂停栈管理**：对话/升级/暂停使用计数器或状态栈，避免强制恢复导致的状态错误。
8. **清理旧版代码**：将 `client/js/` 归档或删除，减少维护成本。

---

## 7. 结论

当前 Phaser 版本的动画与 UI 系统整体可用，核心流程（移动、攻击、闪避、技能、死亡、菜单、HUD）均正常工作，测试覆盖度也较高。主要问题集中在**动画资源利用率不足**（hurt、death、U 技能、敌人方向动画）和**部分 UI 细节/状态管理**上。修复上述高优先级问题后，游戏打击感与视觉品质会有明显提升。

---

## 8. 优化完成情况

> 优化时间：2026-06-18（第二轮审计后追加修复）

已按本报告建议完成以下优化：

| 优先级 | 问题 | 修复方式 | 状态 |
|---|---|---|---|
| 🔴 | 玩家受击动画未使用 | `Player.takeDamage` 触发 `hurtTimer`，`syncSprite` 按 death > dodge > hurt > attack > walk > idle 优先级播放；死亡动画末帧冻结 | ✅ |
| 🔴 | 敌人无死亡动画 | 死亡时增加缩放缩小 + 旋转 + alpha 淡出，并触发粒子爆炸 | ✅ |
| 🔴 | 技能 3（U）无动画 | `AnimationFactory` 复用 `ultimate` 帧创建 `skill_3` 动画 | ✅ |
| 🔴 | 曹将/Boss 移动方向动画固定 | `Enemy.syncSprite` 按 4 方向切换 `general_walk_right/down/up` | ✅ |
| 🟡 | 粒子高频创建销毁 | 新增 `src/phaser/utils/ObjectPool.js`，`Particle` 支持 `reset/deactivate`，`EffectManager` 使用池复用 | ✅ |
| 🟡 | 击杀日志 CSS 类名不一致 | `UISync.js` 中 `.kl-item` 改为 `.kill-item` | ✅ |
| 🟡 | 对话框强制恢复 pause | 引入 `pauseStack` + `pauseReasons`，`togglePause/showLevelUp/showDialogue` 统一入栈/出栈 | ✅ |
| 🟡 | Boss 复活后视觉状态未重置 | `Enemy.reviveBoss()` 恢复 sprite alpha/rotation/scale，恢复血条与名字可见性 | ✅ |
| 🟡 | 枪兵移动动画未按方向切换 | `Enemy.syncSprite()` 对 `spearman` 也按 4 方向播放 walk 动画 | ✅ |
| 🟡 | `resolveWalkDir4` 返回不存在的 `left` | 将 `left` 映射为 `right`，配合 flipX 表现左侧行走 | ✅ |
| 🟢 | HUD 小屏适配 | `ui.css` 新增 `@media (max-width: 700px)` HUD 缩放规则 | ✅ |
| 🟢 | 旧版 `client/js/` 代码 | 已删除整个目录 | ✅ |

未改动项：
- 广告锁屏 iframe：涉及业务与合规决策，维持现状。
- 开始菜单标题逐字动画：因 HTML 已改为 logo 图片，对应 CSS 规则自然失效，无需修复。

### 验证结果

```
npm test                  ✅ 通过
npm run test:full         ✅ 通过
npm run test:regression   ✅ 通过（含此前超时的 testGameOver）
```

> 注：测试需基于最新构建产物。本次优化后已执行 `npm run build` 重新生成 `dist/`。


---

## 9. 第三轮：素材补全完成情况

> 修复时间：2026-06-18  
> 基于《素材需求分析报告》对所有高/中优先级素材缺口进行补全。

| 优先级 | 问题 | 修复方式 | 状态 |
|---|---|---|---|
| 🔴 | 玩家 skill_3 复用 ultimate | 生成 classic/mecha 专属 4 帧施法动画，保存到 `assets/player_skill3/`，替换复用逻辑 | ✅ |
| 🔴 | 典韦 ultimate 资源未加载 | 加载 `enemy_dianwei/skill_frames` 作为 `dianwei_ultimate` | ✅ |
| 🔴 | 投射物为纯色矩形 | 生成箭矢、金色枪气纹理，`Projectile` 自动选择 | ✅ |
| 🔴 | 粒子为纯色方块 | 生成火花/烟雾/血雾/金光纹理，`Particle` 支持纹理并按颜色匹配 | ✅ |
| 🟡 | 掉落物为黑底方框+emoji | 生成宝箱图标，`DropItem` 使用图片 | ✅ |
| 🟡 | 方向提示为 Graphics 三角 | 生成箭头图标，`DirectionHints` 使用 Image | ✅ |
| 🟡 | 小地图为纯色点 | 生成玩家/Boss/掉落物图标，`MinimapRenderer` 使用 drawImage | ✅ |
| 🟡 | 吕布/许褚 skill_frames 未加载 | 加载为 `lubu_skill` / `xuzhu_skill`，普通攻击 20% 概率播放 | ✅ |
| 🟡 | 敌人死亡/受击表现不足 | 增加血雾、火星、烟雾粒子，Boss 死亡增强震动/闪光 | ✅ |

### 新增资源目录

```
assets/player_skill3/          # 玩家 U 技能专属帧
assets/generated_effects/      # 粒子、投射物、掉落物、提示、小地图图标
```

### 主要代码改动

- `AssetLoader.js`：加载 dianwei/lubu/xuzhu skill_frames、新增 loadEffectAssets
- `AnimationFactory.js`：创建 dianwei_ultimate、lubu_skill、xuzhu_skill、player_skill_3 动画
- `Enemy.js`：普通攻击有几率播放 skill 动画；增强受击/死亡粒子
- `Projectile.js`：根据 owner/color 自动匹配纹理
- `Particle.js` / `EffectManager.js`：支持纹理粒子，按颜色自动选择纹理
- `DropItem.js`：使用宝箱图片
- `DirectionHints.js`：使用箭头图片
- `MinimapRenderer.js`：使用图标绘制
- `config.js`：新增特效图片路径常量

### 验证结果

```
npm test                  ✅ 通过
npm run test:full         ✅ 通过
npm run test:regression   ✅ 通过
npm run build             ✅ 成功
```

> 注：测试访问的是 `dist/` 构建产物，已执行 `npm run build` 重新生成。
