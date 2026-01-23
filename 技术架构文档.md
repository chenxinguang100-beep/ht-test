# H5动态贺卡 - 技术架构文档

## 1. 项目概述
本项是一个高性能、零框架依赖的 H5 交互页面，旨在模拟“学生 Python 代码控制前端特效”的场景。项目采用纯原生 JavaScript、HTML5 和 CSS3 开发，确保了在低版本浏览器（如 Chrome 59+）中的流畅运行。

### 核心特性
- **高度适配性**: 支持 PC 与平板（如 iPad）等不同比例的屏幕。
- **响应式算法**: 采用 `Absolute Center + Transform Scale` 方案，确保核心内容永远居中且等比缩放，不被截断。
- **高性能动画**: 混合使用 Web Animation API、CSS Keyframes 以及 Canvas 2D 渲染，确保在 Chrome 59/74 等旧版本环境下依然丝滑。
- **标准化协议**: 通过 `window.postMessage` 实现与宿主环境（Python/判定系统）的 JSON 通信。

---

## 2. 目录结构
```text
H5动态贺卡/
├── index.html          # 入口 HTML，定义舞台结构与弹窗 DOM
├── assets/             # 静态资源
│   ├── bg_stage.png    # 舞台大背景图
│   ├── item_*.png      # 漂浮挂件素材
│   └── frames/         # 贺图序列帧资源目录
│       └── pixel_night/ # 风格目录 (1.jpg - 16.jpg)
├── css/
│   ├── style.css       # 全局样式、舞台定位、漂浮挂件样式
│   └── modal.css       # 贺卡弹窗专用样式（REM 布局）
└── js/
    ├── main.js         # 核心控制器：初始化、通信协议、响应式适配
    ├── floater.js      # 漂浮系统：槽位生成、生命周期补充、交互还原逻辑
    ├── card.js         # 贺卡系统：Canvas DPI 高清适配、序列帧播放、手势交互
    └── mock.js         # 调试系统：左下角模拟 Python 发送指令的面板
```

---

## 3. 核心架构与技术细节

### 3.1 响应式布局方案 (Absolute + Scale)
为了解决不同屏幕比例下内容被截断或偏移的问题，项目放弃了传统的 `vh/vw` 布局，转而采用一种“固定比例舞台”方案：
1. **固定舞台尺寸**: 锁定 `#stage-wrapper` 为 `1000px * 750px`。
2. **绝对居中**: 使用 `top: 50%; left: 50%; transform: translate(-50%, -50%)`。
3. **动态缩放**: `main.js` 根据当前视口尺寸计算 `min(scaleX, scaleY)`，并将缩放值应用到 `transform` 的 `scale()` 属性中。
4. **文字缩放**: 锁定根字号 `html { font-size: 100px; }`，内部所有 UI（挂件、贺卡文字）均使用 `rem` 单位，确保 UI 随舞台等比缩放。
5. **加载优化**: 舞台初始 `opacity` 设为 `0`，待 JS 计算完缩放比例后通过 `opacity: 1` 渐显，消除了 Chrome 74 等浏览器中常见的尺寸“先小后大”跳变感。
6. **清晰度优化**: 针对老版本浏览器缩放产生的模糊，显式开启了 `backface-visibility: hidden` 和 `transform-style: preserve-3d` 硬件加速层，大幅提升了渲染锐度。

### 3.2 漂浮挂件系统 (Floater System)
- **景别分层系统 (Depth of Field)**: 
    - 挂件随机分配至远、中、近三层景别，采用“近亮远小”的高清视差方案。
    - **远景层**: 尺寸微小、亮度标准、极轻微模糊 (`0.8px`)、飞行速度最慢，营造空气透视感。
    - **中景层**: 交互核心层，标准尺寸与亮度、完全清晰、标准飞行速度。
    - **近景层**: 尺寸稍大、高亮度（模拟补光效果）、完全清晰（取消强虚化）、飞行速度最快，产生丝滑的近距离掠过感。
- **槽位算法 (Slot-based)**: 将水平方向划分为多个固定槽位（如 `[15, 27, 39, 51, 63, 75]`），生成时在槽位基础上增加随机偏移，避免挂件重叠。
- **提前补充机制 (Ahead-of-time Refill)**: 
    - 屏幕内始终保持 6 个挂件。
    - 当一个挂件飘到 `bottom: 100%`（即将离开视野）时，系统会通过 `setTimeout` 预判并在底部立刻补充一个新挂件，消除视觉真空期。
- **完美还原逻辑**: 
    - 点击挂件时，暂停其 `Web Animation`，记录当前坐标、景别滤镜和层级。
    - 使用 CSS `transition` 将挂件平滑移动到舞台中心、放大并**清除模糊滤镜**，确保观看贺卡时挂件清晰。
    - 贺卡关闭时，挂件平滑移回原位，恢复原始缩放、滤镜和层级，并在原坐标继续执行漂浮动画。

### 3.3 贺卡序列帧系统 (Card System)
- **动态路径映射**: 根据“风格”和“贺词”双重维度动态构建资源路径。
    - 规则：`assets/frames/{style}/{text}/{style}{text}_{index}.jpg`
    - 示例：`assets/frames/pixel_world/冰雪聪明/pixel_world冰雪聪明_01.jpg`
- **加载守卫**: 在播放前检查 `imagesLoaded` 状态，确保资源就绪后再开始动画。
- **循环播放算法**: 
    - 初始点亮天灯后，从第 6 帧开始播放，提供更好的初始视觉切入点。
    - 播放速度优化为 `150ms/帧`，提供更悠闲的视觉感受。
    - 循环模式：1-16 帧无限循环。
- **DPI 高清适配**: 
    - 针对 Windows Chrome 74 或高分屏模糊问题，通过 `window.devicePixelRatio` 获取物理像素比。
    - 动态设置 `canvas.width/height = rect.width * dpr`，并执行 `ctx.scale(dpr, dpr)`。
- **交互功能**:
    - **手势/鼠标交互**: 支持进度条点击/滑动，以及 Canvas 区域的左右拖动切帧。
    - **提示词切换**: 点击贺图右上角的感叹号 `!` 按钮，可在“祝福语视图”与“提示词视图”之间自由切换，增强了页面的功能性。

---

## 4. 通信协议 (PostMessage Protocol)

### 4.1 H5 接收指令 (Python -> H5)
**CMD**: `update_card`  
**Payload 示例**:
```json
{
    "cmd": "update_card",
    "content": {
        "greeting_words": ["burger", "horse"], // 挂件类型数组
        "card_style": "pixel_night",          // 贺图风格文件夹名
        "recipient": "妈妈",                   // 收件人姓名
        "message_body": "祝您身体健康...",      // 祝福内容
        "sender": "小明",                     // 发送者
        "auto_play": true,                    // 是否自动播放序列帧
        "float_speed": 15                     // 挂件飞行速度（秒）
    }
}
```

### 4.2 H5 发送指令 (H5 -> Python)
**CMD**: `close_app`  
当用户点击舞台右上角的“叉”按钮时触发。
```javascript
window.postMessage({ cmd: 'close_app' }, '*');
```

---

## 5. 开发者指南

### 5.1 如何更换素材
1. **背景图**: 替换 `assets/bg_stage.png`。
2. **挂件**: 替换 `assets/item_*.png`，并在 `floater.js` 的 `types` 对象中更新配置。
3. **序列帧**: 在 `assets/frames/` 下创建新风格文件夹（如 `cyberpunk/`），放入 `1.jpg` 至 `16.jpg`。

### 5.2 兼容性注意事项
- **CSS**: 严禁使用 `gap` (Flex/Grid), `backdrop-filter` (需带前缀并提供回退色), `inset` 等高版本属性。
- **JS**: 严禁使用 `?.` (可选链), `??` (空值合并), `const {a, ...b} = obj` (解构赋值的 Rest 属性) 等 Chrome 59 不支持的语法。本项目代码已严格遵循 ES6 基础规范。

