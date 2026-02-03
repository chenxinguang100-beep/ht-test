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

        // 确保预加载容器存在
        let preloadContainer = document.getElementById('assets-preload');
        if (!preloadContainer) {
            preloadContainer = document.createElement('div');
            preloadContainer.id = 'assets-preload';
            document.body.appendChild(preloadContainer); // 假设 body 存在
        }

        // 预加载星星迸发特效 - 存入 DOM 防止 GC
        this.starBurstImages = [];
        for (let i = 1; i <= 12; i++) {
            const img = new Image();
            const num = i.toString().padStart(2, '0');
            img.src = `assets/effects/star_burst/xx_${num}.png`;
            this.starBurstImages.push(img);
            preloadContainer.appendChild(img);
        }

        // 预加载光环展开特效 - 存入 DOM 防止 GC
        this.haloExpandImages = [];
        for (let i = 1; i <= 12; i++) {
            const img = new Image();
            const num = i.toString().padStart(2, '0');
            img.src = `assets/effects/halo/gh_${num}.png`;
            this.haloExpandImages.push(img);
            preloadContainer.appendChild(img);
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
        el.dataset.originalScale = layerProps.scale; // 记录原始缩放比例用于点击后补偿

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
            // 点击时立即播放星星迸发特效 -> 移至贺卡接受按钮
            const currentZ = parseInt(el.style.zIndex) || 10;
            // this.createClickEffect(e.clientX, e.clientY, currentZ);
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
        if (!el._hasRefilled) {
            el._hasRefilled = true;
            this.refillOne();
        }

        // 2. 暂停当前动画
        if (el._anim) el._anim.pause();
        if (el._refillTimer) clearTimeout(el._refillTimer);

        // 3. 获取原始 CSS 缩放比例和当前位置
        const originalScale = parseFloat(el.dataset.originalScale) || 1;
        const rect = el.getBoundingClientRect(); // 当前视觉位置（包含原始 scale）
        const wrapper = document.getElementById('stage-wrapper');
        const wrapperRect = wrapper.getBoundingClientRect();

        // 4. 计算窗口缩放因子
        const scaleFactor = wrapperRect.width / wrapper.offsetWidth || 1;

        // 5. 计算天灯的视觉中心位置（相对于 wrapper）
        const visualCenterX = (rect.left + rect.width / 2 - wrapperRect.left) / scaleFactor;
        const visualCenterY = (rect.top + rect.height / 2 - wrapperRect.top) / scaleFactor;

        // 6. 获取元素的内在尺寸（不受 CSS transform 影响）
        const intrinsicWidth = el.offsetWidth;  // 未被 scale 影响的真实 DOM 宽度
        const intrinsicHeight = el.offsetHeight;

        // 7. 重置 transform 并设置绝对定位
        // 关键：使用内在尺寸，并将元素定位使其中心与之前的视觉中心对齐
        el.style.transform = 'none'; // 先移除原始 scale
        el.style.position = 'absolute';
        el.style.left = (visualCenterX - intrinsicWidth / 2) + 'px';
        el.style.top = (visualCenterY - intrinsicHeight / 2) + 'px';
        el.style.bottom = 'auto';
        el.style.width = intrinsicWidth + 'px';
        el.style.height = intrinsicHeight + 'px';
        el.style.margin = '0';
        el.style.zIndex = 160; // 天灯在光环(140)上方

        wrapper.appendChild(el);

        // 8. 计算飞向正中心的位移
        const wrapperCenterX = wrapper.offsetWidth / 2;
        const wrapperCenterY = wrapper.offsetHeight / 2;
        const moveX = wrapperCenterX - visualCenterX;
        const moveY = wrapperCenterY - visualCenterY;

        // 9. 强制重绘
        void el.offsetWidth;

        // 10. 计算统一的目标缩放
        const TARGET_VISUAL_WIDTH = 280; // 缩小天灯尺寸
        const INTRINSIC_BODY_WIDTH = 120; // .floater-body 固定宽度
        const targetScale = TARGET_VISUAL_WIDTH / INTRINSIC_BODY_WIDTH;

        // 11. 应用飞入动画
        el.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.8s ease-out';
        el.style.filter = 'blur(0px) brightness(1.1)';
        el.style.transform = `translate(${moveX}px, ${moveY}px) scale(${targetScale})`;

        // 12. 统一吊牌大小
        const tag = el.querySelector('.floater-tag');
        if (tag) {
            const DESIRED_TAG_VISUAL_WIDTH = 130;
            const compensatedWidth = DESIRED_TAG_VISUAL_WIDTH / targetScale;
            tag.style.width = `${compensatedWidth}px`;
        }

        // 立即展示遮罩层
        if (window.CardSystem && typeof window.CardSystem.showMask === 'function') {
            window.CardSystem.showMask();
        }

        // 飞入动画完成后播放光环特效
        setTimeout(() => {
            // 修正位置：光环中心对应屏幕中心 (相对于 Wrapper)
            const wrapperW = wrapper.offsetWidth;
            const wrapperH = wrapper.offsetHeight;
            const centerWrapperX = wrapperW / 2;
            const centerWrapperY = wrapperH / 2;
            this.createHaloEffect(centerWrapperX, centerWrapperY, 140); // 光环在天灯下方 (140 < 160)

            // 天灯开始渐隐（光环播放时同时渐隐，0.8秒渐隐时间）
            el.style.transition = 'opacity 0.8s ease-out';
            el.style.opacity = '0';

            // 天灯渐隐完成后移除元素
            setTimeout(() => {
                if (el.parentNode) el.parentNode.removeChild(el);
                this.isActive = true;
            }, 800);

            // 延后打开贺卡（光环开始后 600ms）
            setTimeout(() => {
                if (window.CardSystem && typeof window.CardSystem.open === 'function') {
                    window.CardSystem.open(config);
                }
            }, 600);

        }, 600);
    },

    createClickEffect(x, y, targetZIndex) {
        if (!this.container) return;

        // 使用 Canvas 替代 DIV
        const canvas = document.createElement('canvas');
        canvas.className = 'star-burst';

        // 设置高分辨率画布 (300x300 对于 3rem 来说足够清晰)
        canvas.width = 300;
        canvas.height = 300;

        // 计算相对坐标 (处理缩放)
        const rect = this.container.getBoundingClientRect();
        // Container 实际渲染宽度 / OffsetWidth
        const scale = rect.width / this.container.offsetWidth || 1;

        const localX = (x - rect.left) / scale;
        const localY = (y - rect.top) / scale;

        canvas.style.left = localX + 'px';
        canvas.style.top = localY + 'px';

        // 层级设为比点击物体低 1 级
        canvas.style.zIndex = (targetZIndex || 10) - 1;

        this.container.appendChild(canvas);

        const ctx = canvas.getContext('2d');

        // 序列帧动画
        let frame = 1;
        const maxFrames = 12;
        const fps = 24;
        const interval = 1000 / fps;
        let lastTime = 0;

        // 立即绘制第一帧 (Sync draw to prevent empty frame)
        if (this.starBurstImages && this.starBurstImages[0]) {
            ctx.drawImage(this.starBurstImages[0], 0, 0, canvas.width, canvas.height);
        }

        const updateFrame = (timestamp) => {
            if (!lastTime) lastTime = timestamp;

            // 超过最大帧，移除
            if (frame > maxFrames) {
                if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
                return;
            }

            if (timestamp - lastTime >= interval) {
                // 清空
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // 绘制当前帧 (frame 索引是 frame-1)，由于 startBurstImages 下标从0开始(对应01.png)
                const img = this.starBurstImages[frame - 1];
                if (img) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                }

                frame++;
                lastTime = timestamp;
            }
            requestAnimationFrame(updateFrame);
        };

        requestAnimationFrame(updateFrame);
    },

    // 光环展开特效 - 点击时立即播放
    createHaloEffect(x, y, targetZIndex) {
        // 使用 Canvas 替代 DIV
        const canvas = document.createElement('canvas');
        canvas.className = 'halo-expand';

        canvas.width = 600;
        canvas.height = 600;

        // 直接添加到 Stage Wrapper
        const wrapper = document.getElementById('stage-wrapper');
        if (wrapper) wrapper.appendChild(canvas);

        canvas.style.position = 'absolute'; // 相对 wrapper
        canvas.style.left = x + 'px';
        canvas.style.top = y + 'px';
        canvas.style.zIndex = targetZIndex || 150;

        const ctx = canvas.getContext('2d');

        // 序列帧动画
        let frame = 1;
        const maxFrames = 12;
        const fps = 24;
        const interval = 1000 / fps;
        let lastTime = 0;

        // 立即绘制第一帧
        if (this.haloExpandImages && this.haloExpandImages[0]) {
            ctx.drawImage(this.haloExpandImages[0], 0, 0, canvas.width, canvas.height);
        }

        const updateFrame = (timestamp) => {
            if (!lastTime) lastTime = timestamp;

            if (frame > maxFrames) {
                if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
                return;
            }

            if (timestamp - lastTime >= interval) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const img = this.haloExpandImages[frame - 1];
                if (img) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                }
                frame++;
                lastTime = timestamp;
            }
            requestAnimationFrame(updateFrame);
        };

        requestAnimationFrame(updateFrame);
    }
};

window.FloaterSystem = FloaterSystem;
