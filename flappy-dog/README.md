# Flappy Dog

一款通过麦克风声音输入来操控狗狗动作的趣味小游戏。

## 游戏概念

玩家通过对麦克风发出声音来控制狗狗：

- **音量（Volume）**：声音越大，狗狗跳得越高
- **音调（Pitch）**：高音 / 低音可触发不同动作
- **节奏（Rhythm）**：连续发声控制持续飞行

## 技术方向

- Web Audio API 实时采集麦克风输入
- 分析音量（RMS）、频率（FFT）等参数
- Canvas / WebGL 渲染游戏画面
- 狗狗角色动画与障碍物生成逻辑

## 目录结构（规划）

```
flappy-dog/
├── index.html       # 游戏入口
├── css/
│   └── style.css
├── js/
│   ├── audio.js     # 麦克风输入 & 声音分析
│   ├── game.js      # 游戏主逻辑
│   ├── dog.js       # 狗狗角色
│   └── obstacles.js # 障碍物生成
└── assets/          # 图片、音效资源
```
