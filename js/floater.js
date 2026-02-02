/**
 * 漂浮挂件系统
 * 职责：生成、动画控制、点击交互
 */
const FloaterSystem = {
    container: null,
    floaters: [],
    isActive: true, // 控制是否允许交互，但不影响后台挂件补充
    lastTypeKey: null, // 记录上一次生成的类型，用于防重复

    // 目标总数：6个
    TARGET_COUNT: 6,

    // 分槽生成逻辑
    slots: [15, 27, 39, 51, 63, 75],
    lastSlotIndex: -1,

    // 配置映射表
    // 移除硬编码 types，改为动态读取
    init() {
        this.container = document.getElementById('floater-layer');
        if (!this.container) return;

        // 预加载图片 (改为从 Config 读)
        if (window.AppState.configData && window.AppState.configData.default && window.AppState.configData.default.words) {
            const words = window.AppState.configData.default.words;
            Object.values(words).forEach(t => {
                const img = new Image();
                img.src = t.image;
            });
        }

        // 预加载星星迸发特效
        for (let i = 1; i <= 12; i++) {
            const img = new Image();
            const num = i.toString().padStart(2, '0');
            img.src = `assets/关卡道具-星星迸发/道具-星星迸发-xx_${num}.png`;
        }

        // 预加载光环展开特效
        for (let i = 1; i <= 12; i++) {
            const img = new Image();
            const num = i.toString().padStart(2, '0');
            img.src = `assets/关卡道具-光环展开/道具-光环展开-gh_${num}.png`;
        }

        this.refresh(window.AppState.config.greeting_words);
    },

    // 获取单词配置 (Helper)
    getWordConfig(key) {
        if (!window.AppState.configData) return null;

        // 1. 尝试从默认配置读取基础信息 (image, text, pinyin, meaning)
        const baseConfig = window.AppState.configData.default.words[key];
        if (!baseConfig) return null;

        // 2. 尝试根据当前 Style 读取特定的 Prompt
        const currentStyle = window.AppState.config.card_style;
        let prompt = baseConfig.ai_prompt || ""; // 默认 prompt

        if (window.AppState.configData.prompts &&
            window.AppState.configData.prompts[currentStyle] &&
            window.AppState.configData.prompts[currentStyle][key]) {
            prompt = window.AppState.configData.prompts[currentStyle][key];
        }

        // 3. 合并返回
        return {
            ...baseConfig,
            key: key, // 添加 key 字段，便于 CardSystem 识别当前 word
            ai_prompt: prompt
        };
    },

    refresh(types) {
        this.clearAll();

        let typeList = [];
        if (Array.isArray(types)) {
            typeList = [...types];
        } else {
            typeList = [types];
        }

        const initialQueue = [];
        for (let i = 0; i < this.TARGET_COUNT; i++) {
            const typeKey = typeList[i % typeList.length];
            initialQueue.push(typeKey);
        }

        initialQueue.forEach((typeKey, index) => {
            this.createFloater(typeKey, true, index);
        });

        this.isActive = true;
    },

    clearAll() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.floaters.forEach(el => {
            if (el._anim) el._anim.cancel();
            if (el._refillTimer) clearTimeout(el._refillTimer);
        });
        this.floaters = [];
        this.lastSlotIndex = -1;
    },

    // 补充新挂件
    refillOne() {
        // 即使在交互锁定状态，也允许补充挂件，确保背景不空虚
        const configTypes = window.AppState.config.greeting_words;
        let typeList = Array.isArray(configTypes) ? configTypes : [configTypes];

        let typeKey;
        if (typeList.length > 1) {
            // 如果有多个备选，排除掉上一个生成的，确保连续不重复
            const filteredList = typeList.filter(t => t !== this.lastTypeKey);
            typeKey = filteredList[Math.floor(Math.random() * filteredList.length)];
        } else {
            typeKey = typeList[0];
        }

        this.createFloater(typeKey, false);
    },

    createFloater(typeKey, isInitial = false, initialIndex = 0) {
        if (!this.container) return;

        const config = this.getWordConfig(typeKey) || this.getWordConfig('burger');
        // 如果连 fallback 都没有 (config没加载)，则临时模拟一个
        if (!config) return;
        const el = document.createElement('div');
        el.className = 'floater';

        // --- 景别分层逻辑 (Depth of Field) ---
        // 0: 远景 (小、慢、暗、模糊)
        // 1: 中景 (标准、交互核心)
        // 2: 近景 (大、快、亮、强模糊)
        const depth = Math.floor(Math.random() * 3);
        let layerProps = {
            scale: 1.3,
            blur: 0,
            brightness: 1,
            speedMult: 1,
            zIndex: 10
        };

        if (depth === 0) { // 远景 (小、慢、极轻微模糊、亮度保持)
            layerProps = {
                scale: 0.6 + Math.random() * 0.3,
                blur: 0.8,
                brightness: 1.0, // 亮度保持正常
                speedMult: 1.6,
                zIndex: 5
            };
        } else if (depth === 2) { // 近景 (稍大、快、亮、清晰)
            layerProps = {
                scale: 1.5 + Math.random() * 0.3, // 缩小尺寸，不再突兀
                blur: 0, // 取消模糊
                brightness: 1.2, // 稍微提亮，增加质感
                speedMult: 0.7,
                zIndex: 20
            };
        } else { // 中景 (标准)
            layerProps = {
                scale: 1.1 + Math.random() * 0.2,
                blur: 0,
                brightness: 1.0,
                speedMult: 1.0,
                zIndex: 10
            };
        }

        el.style.zIndex = layerProps.zIndex;
        el.style.filter = `blur(${layerProps.blur}px) brightness(${layerProps.brightness})`;
        el.style.transform = `scale(${layerProps.scale})`;
        el.dataset.depth = depth; // 记录景别以便还原

        // --- 槽位选择 ---
        let slotIndex;
        let attempts = 0;
        do {
            slotIndex = Math.floor(Math.random() * this.slots.length);
            attempts++;
        } while (slotIndex === this.lastSlotIndex && attempts < 3);
        this.lastSlotIndex = slotIndex;

        const baseLeft = this.slots[slotIndex];
        const randomOffset = (Math.random() - 0.5) * 10;
        const finalLeft = baseLeft + randomOffset;
        el.style.left = finalLeft + '%';

        // --- 初始位置 ---
        let startBottom = -30;
        if (isInitial) {
            const layerHeight = 90 / this.TARGET_COUNT;
            const baseBottom = initialIndex * layerHeight;
            const offset = Math.random() * (layerHeight * 0.8);
            startBottom = baseBottom + offset;
            el.style.bottom = startBottom + '%';
        } else {
            el.style.bottom = '-30%';
        }

        // --- DOM ---
        const body = document.createElement('div');
        body.className = 'floater-body';

        // 逻辑变更: 24种独立天灯
        // 路径: assets/sequences/{style}/{word}/lantern.png
        const currentStyle = window.AppState.config.card_style;
        const wordKey = typeKey;
        const lanternPath = `assets/sequences/${currentStyle}/${wordKey}/lantern.png`;

        // 默认使用生成的路径。如果文件不存在 (onerror)，在 CSS background 中较难捕获。
        // 但我们已经生成了所有占位符。
        body.style.backgroundImage = `url('${lanternPath}')`;
        body.title = config.text;

        // 挂绳：使用图片素材替代 CSS 绘制
        const string = document.createElement('img');
        string.className = 'floater-string';
        // 赛博风格使用金属灯绳，其他风格使用红色灯绳
        const ropePath = currentStyle === 'cyber_mecha'
            ? 'assets/rope_metal.png'
            : 'assets/rope_red.png';
        string.src = ropePath;
        string.alt = '';

        // 吊牌：使用图片素材替代 CSS 绘制
        const tag = document.createElement('img');
        tag.className = 'floater-tag';
        // 路径模式：assets/tags/{style}/{word}.png
        // 只有 frosted_blindbox 和 cyber_mecha 有吊牌素材
        const tagStyle = (currentStyle === 'cyber_mecha') ? 'cyber_mecha' : 'frosted_blindbox';
        const tagPath = `assets/tags/${tagStyle}/${wordKey}.png`;
        tag.src = tagPath;
        tag.alt = config.text;
        tag.title = config.text;

        // 图片加载失败时回退到 CSS 绘制方案
        tag.onerror = function () {
            const fallbackTag = document.createElement('div');
            fallbackTag.className = 'floater-tag floater-tag-fallback';
            fallbackTag.innerText = config.text;
            if (tag.parentNode) {
                tag.parentNode.replaceChild(fallbackTag, tag);
            }
        };

        el.appendChild(body);
        el.appendChild(string);
        el.appendChild(tag);

        el.addEventListener('click', (e) => {
            if (!this.isActive) return; // 弹窗打开时禁止重复点击
            // 点击时立即播放星星迸发特效
            const currentZ = parseInt(el.style.zIndex) || 10;
            this.createClickEffect(e.clientX, e.clientY, currentZ);
            this.handleFloaterClick(el, config);
            e.stopPropagation();
        });

        // --- 速度计算 ---
        const baseSpeed = window.AppState.config.float_speed || 15;
        // 应用景别速度倍率
        const duration = (baseSpeed * layerProps.speedMult) * (0.9 + Math.random() * 0.2);

        let actualDuration = duration;
        if (isInitial) {
            const totalDistance = 120 - (-30);
            const remainingDistance = 120 - startBottom;
            actualDuration = duration * (remainingDistance / totalDistance);
        }

        this.animateFloater(el, actualDuration, startBottom);

        this.container.appendChild(el);
        this.floaters.push(el);
        this.lastTypeKey = typeKey; // 更新最后生成的类型
    },

    animateFloater(el, duration, startBottom) {
        const endBottom = 120;
        const animation = el.animate(
            [
                { bottom: startBottom + '%', opacity: 1 },
                { bottom: endBottom + '%', opacity: 1 }
            ],
            {
                duration: duration * 1000,
                easing: 'linear',
                iterations: 1
            }
        );

        el._anim = animation;
        el._hasRefilled = false; // 标记该挂件是否已经触发过补充

        // 提前补充机制
        const totalDistance = endBottom - startBottom;
        const distanceToTop = 100 - startBottom;

        if (distanceToTop > 0) {
            const timeToTop = duration * (distanceToTop / totalDistance);
            el._refillTimer = setTimeout(() => {
                if (!el._hasRefilled) {
                    el._hasRefilled = true;
                    this.refillOne();
                }
            }, timeToTop * 1000);
        }

        animation.onfinish = () => {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
            const idx = this.floaters.indexOf(el);
            if (idx > -1) this.floaters.splice(idx, 1);
        };
    },

    handleFloaterClick(el, config) {
        console.log('Clicked:', config.text);

        this.isActive = false; // 锁定交互

        // 1. 立即触发补充逻辑
        // 因为这个挂件要去展示贺卡了，它腾出的位置应该立即由新挂件补上
        if (!el._hasRefilled) {
            el._hasRefilled = true;
            this.refillOne();
        }

        // 2. 暂停当前动画 (WAAPI 必须用 pause() 方法，CSS 属性无效)
        if (el._anim) el._anim.pause();
        if (el._refillTimer) clearTimeout(el._refillTimer);

        // 3. 记录当前几何信息与状态
        const startRect = el.getBoundingClientRect();
        const originalFilter = el.style.filter;
        const originalZIndex = el.style.zIndex;

        let startScale = 1;
        const transformMatch = el.style.transform.match(/scale\(([^)]+)\)/);
        if (transformMatch && transformMatch[1]) {
            startScale = parseFloat(transformMatch[1]);
        }

        const stageWrapper = document.getElementById('stage-wrapper');
        const stageRect = stageWrapper.getBoundingClientRect();
        const stageCenterX = stageRect.left + stageRect.width / 2;
        const stageCenterY = stageRect.top + stageRect.height / 2;
        const elCenterX = startRect.left + startRect.width / 2;
        const elCenterY = startRect.top + startRect.height / 2;

        const moveX = (stageCenterX - elCenterX) / (window.AppState.scale || 1);
        const moveY = (stageCenterY - elCenterY) / (window.AppState.scale || 1);

        // 4. 执行飞入中心动画 (清除模糊，提升层级)
        el.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.8s ease-out';
        el.style.zIndex = 100;
        el.style.filter = 'blur(0px) brightness(1.1)'; // 飞到中心时变亮且清晰
        el.style.transform = `translate(${moveX}px, ${moveY}px) scale(2)`;

        setTimeout(() => {
            // 移动到位后，播放光环展开特效
            // 此时物体在舞台中心，zIndex 为 100
            this.createHaloEffect(stageCenterX, stageCenterY, 100);

            // 延迟一点时间再打开贺卡，让特效展示一下
            setTimeout(() => {
                if (window.CardSystem && typeof window.CardSystem.open === 'function') {
                    window.CardSystem.open(config);
                }

                // 绑定关闭回调
                if (window.CardSystem) {
                    const originalClose = window.CardSystem.onClose;
                    window.CardSystem.onClose = () => {
                        if (typeof originalClose === 'function') originalClose();

                        // 还原挂件 (恢复原始滤镜和层级)
                        el.style.transition = 'transform 0.6s ease-out, filter 0.6s ease-out';
                        el.style.transform = `translate(0, 0) scale(${startScale})`;
                        el.style.filter = originalFilter;
                        el.style.zIndex = originalZIndex;

                        setTimeout(() => {
                            if (el._anim) el._anim.play(); // 恢复播放
                            this.isActive = true; // 恢复交互
                        }, 600);
                    };
                }
            }, 600); // 特效播放由于是 20fps 12帧 ≈ 600ms，这里同步等待

        }, 1000);
    },

    createClickEffect(x, y, targetZIndex) {
        if (!this.container) return;

        const effect = document.createElement('div');
        effect.className = 'star-burst';

        // 计算相对坐标 (处理缩放)
        const rect = this.container.getBoundingClientRect();
        const scaleX = rect.width / this.container.offsetWidth;
        const scale = scaleX || 1;

        const localX = (x - rect.left) / scale;
        const localY = (y - rect.top) / scale;

        effect.style.left = localX + 'px';
        effect.style.top = localY + 'px';

        // 层级设为比点击物体低 1 级，确保在物体下方播放
        effect.style.zIndex = (targetZIndex || 10) - 1;

        // 预设第一帧背景，避免闪烁
        effect.style.backgroundImage = `url('assets/关卡道具-星星迸发/道具-星星迸发-xx_01.png')`;

        this.container.appendChild(effect);

        // 序列帧动画
        let frame = 2; // 从第2帧开始，因为第1帧已预设
        const maxFrames = 12;
        const fps = 24; // 提高帧率减少闪烁
        const interval = 1000 / fps;
        let lastTime = 0;

        const updateFrame = (timestamp) => {
            if (frame > maxFrames) {
                if (effect.parentNode) effect.parentNode.removeChild(effect);
                return;
            }

            if (timestamp - lastTime >= interval) {
                const num = frame.toString().padStart(2, '0');
                const path = `assets/关卡道具-星星迸发/道具-星星迸发-xx_${num}.png`;
                effect.style.backgroundImage = `url('${path}')`;
                frame++;
                lastTime = timestamp;
            }
            requestAnimationFrame(updateFrame);
        };

        requestAnimationFrame(updateFrame);
    },

    // 光环展开特效 - 点击时立即播放
    createHaloEffect(x, y, targetZIndex) {
        if (!this.container) return;

        const effect = document.createElement('div');
        effect.className = 'halo-expand';

        // 计算相对坐标 (处理缩放)
        const rect = this.container.getBoundingClientRect();
        const scaleX = rect.width / this.container.offsetWidth;
        const scale = scaleX || 1;

        const localX = (x - rect.left) / scale;
        const localY = (y - rect.top) / scale;

        effect.style.left = localX + 'px';
        effect.style.top = localY + 'px';

        // 层级设为与点击物体相同
        effect.style.zIndex = targetZIndex || 10;

        // 预设第一帧背景，避免闪烁
        effect.style.backgroundImage = `url('assets/关卡道具-光环展开/道具-光环展开-gh_01.png')`;

        this.container.appendChild(effect);

        // 序列帧动画
        let frame = 2; // 从第2帧开始，因为第1帧已预设
        const maxFrames = 12;
        const fps = 24; // 光环展开用更快的帧率
        const interval = 1000 / fps;
        let lastTime = 0;

        const updateFrame = (timestamp) => {
            if (frame > maxFrames) {
                if (effect.parentNode) effect.parentNode.removeChild(effect);
                return;
            }

            if (timestamp - lastTime >= interval) {
                const num = frame.toString().padStart(2, '0');
                const path = `assets/关卡道具-光环展开/道具-光环展开-gh_${num}.png`;
                effect.style.backgroundImage = `url('${path}')`;
                frame++;
                lastTime = timestamp;
            }
            requestAnimationFrame(updateFrame);
        };

        requestAnimationFrame(updateFrame);
    }
};

window.FloaterSystem = FloaterSystem;
