# 素材文件结构说明文档

本文档详细描述了 H5 动态贺卡项目的素材文件目录结构及命名规范，方便开发与设计人员进行维护和扩展。

## 1. 根目录 (ROOT: `assets/`)

存放通用的基础素材，如漂浮挂件图标、邮票和装饰物。

| 文件名 | 说明 | 示例 |
| :--- | :--- | :--- |
| `item_{keyword}.png` | **漂浮挂件图标**。对应 `config.json` 中的 `words` 关键词。 | `item_burger.png` (汉堡), `item_snowflake.png` (雪花) |
| `stamp_{keyword}.png` | **邮票图标**。用于贺卡右下角的装饰，对应不同主题。 | `stamp_wealth.png` (财富), `stamp_burger.png` (汉堡) |
| `rope_*.png` | **挂绳素材**。连接气球和挂件的绳子图片。 | `rope_red.png`, `rope_metal.png` |
| `bg_stage.jpeg` | **通用背景图**。部分风格（如手作毛毡、像素积木）使用的默认背景。 | - |

## 2. 序列帧动画 (Sequences: `assets/sequences/`)

存放贺卡开启时的核心 3D 动画序列帧。结构为：`风格 -> 关键词 -> 版本 -> 图片`。

**目录结构：**
`assets/sequences/{style_name}/{keyword}/v1/{index}.jpg`

- **{style_name}**: 风格名称，对应 `config.json` 中的 `styles` 键值。
    - `frosted_blindbox` (磨砂盲盒)
    - `felt_craft` (手作毛毡)
    - `cyber_mecha` (赛博机甲)
    - `pixel_blocks` (像素积木)
- **{keyword}**: 祝福语关键词。
    - `burger`, `snowflake`, `wealth`, `fortune`, `lucky`, `high_fly`
- **v1**: 版本号目录 (保留扩展性)。
- **{index}.jpg**: 序列帧图片，两位数编号，从 `01.jpg` 到 `24.jpg`。

**示例：**
- `assets/sequences/frosted_blindbox/burger/v1/01.jpg`
- `assets/sequences/cyber_mecha/snowflake/v1/24.jpg`

> **注意**：部分风格的专用背景图也存放在该风格目录下，例如 `assets/sequences/frosted_blindbox/bg_stage.jpg`。

## 3. 特效素材 (Effects: `assets/effects/`)

存放交互特效的序列帧或粒子图片。

### 点击破碎特效 (`assets/effects/star_burst/`)
用于点击“接受祝福”按钮或漂浮物时的视觉反馈。

- `xx_{01-12}.png`: 12 帧连续的星星爆炸/破碎动画序列。

## 4. 其他目录

- **`assets/styles/`**: (旧/备用) 存放一些风格相关的额外素材，目前主要由 `config.json` 直接指定路径，该目录可能包含部分测试或遗留文件。
- **`assets/fonts/`**: 存放项目字体文件 (如 `AlimamaDongFangDaKai-Regular.ttf`)。

## 5. 配置与素材的关联

素材的加载路径主要由 `config.json` 控制：

- **挂件图标**: `default.words.{key}.image` (例如 `"assets/item_burger.png"`)
- **背景图**: `styles.{style}.background`
- **序列帧**: 程序中硬编码了路径规则 `assets/sequences/{style}/{key}/v1/{index}.jpg`，因此新增素材时**必须**严格遵守上述目录结构和命名规范。
