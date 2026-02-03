/**
 * 贺卡系统
 * 职责：弹窗管理、序列帧播放、内容渲染
 */
const CardSystem = {
    modal: null,
    canvas: null,
    ctx: null,
    slider: null,
    container: null, // 贺图容器

    // 状态
    currentFrame: 1,
    totalFrames: 24,
    isPlaying: false,
    playInterval: null,
    isDragging: false,
    startX: 0,
    startFrame: 1,

    // 资源缓存
    frameImages: [],
    imagesLoaded: false,

    // 辅助：绑定点击/触摸事件 (解决 300ms 延迟)
    addTapListener(element, callback) {
        if (!element) return;
        let isTouch = false;

        // Touch End
        element.addEventListener('touchend', (e) => {
            isTouch = true;
            e.preventDefault(); // 阻止后续的 mouse 事件
            callback(e);

            // 重置标志位
            setTimeout(() => { isTouch = false; }, 500);
        }, { passive: false });

        // Click (作为回退，或 PC 端)
        element.addEventListener('click', (e) => {
            if (isTouch) return; // 如果已经触发过 touch，忽略 click
            callback(e);
        });
    },

    init() {
        this.modal = document.getElementById('card-modal');
        this.canvas = document.getElementById('frame-canvas');
        this.slider = document.getElementById('frame-slider');
        this.container = document.querySelector('.frame-player-container');

        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
        }

        // 绑定事件
        this.bindEvents();
    },

    // 预加载序列帧
    preloadFrames(styleName, textName) {
        this.frameImages = [];
        this.imagesLoaded = false;
        let loadedCount = 0;

        const style = styleName || 'frosted_blindbox';
        const text = textName || '';

        // 保存当前加载的组合标识，用于缓存检查
        this.currentStyleText = `${style}_${text}`;

        console.log(`[Card] Preloading frames for Style: ${style}, Text: ${text}`);

        for (let i = 1; i <= this.totalFrames; i++) {
            const img = new Image();
            // 序号补零，如 01, 02...
            const frameIndex = i.toString().padStart(2, '0');
            // 构造路径: assets/sequences/{style}/{text}/v1/{index}.jpg
            const path = `assets/sequences/${style}/${text}/v1/${frameIndex}.jpg`;

            img.src = path;
            img.onload = () => {
                loadedCount++;
                if (loadedCount === this.totalFrames) {
                    this.imagesLoaded = true;
                    console.log(`[Card] All ${this.totalFrames} frames loaded successfully.`);
                    if (this.modal && !this.modal.classList.contains('hidden')) {
                        this.renderFrame();
                        if (window.AppState.config.auto_play) {
                            this.play();
                        }
                    }
                }
            };
            img.onerror = () => {
                // 如果特定路径加载失败，尝试加载默认兜底图
                // 这里可以使用一个统一的默认图，或者保持 Loading 状态
                console.warn(`[Card] Failed to load frame: ${path}. Attempting fallback...`);
                // 可以在这里设置一个兜底路径，或者直接在渲染时处理
            };
            this.frameImages[i] = img;
        }
    },

    bindEvents() {
        // 关闭/接受祝福
        // 关闭/接受祝福
        // 关闭/接受祝福
        const acceptBtn = document.getElementById('accept-btn');
        this.addTapListener(acceptBtn, (e) => {
            // 播放点击特效
            let cx, cy;
            if (e.changedTouches && e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                const rect = e.target.getBoundingClientRect();
                cx = rect.left + rect.width / 2;
                cy = rect.top + rect.height / 2;
            } else {
                const rect = e.currentTarget.getBoundingClientRect();
                cx = rect.left + rect.width / 2;
                cy = rect.top + rect.height / 2;
            }

            this.playClickEffect(cx, cy);

            // 延迟关闭，让特效展示一下 (400ms)
            setTimeout(() => {
                this.close();
            }, 400);
        });

        // 内容切换按钮 (优化 Touch 响应)
        const viewPromptBtn = document.getElementById('view-prompt-btn');
        const viewMeaningBtn = document.getElementById('view-meaning-btn');

        this.addTapListener(viewPromptBtn, () => {
            this.switchTab('prompt');
        });

        this.addTapListener(viewMeaningBtn, () => {
            this.switchTab('meaning');
        });

        // 进度条拖动
        if (this.slider) {
            // 动态设置最大值
            this.slider.max = this.totalFrames;

            this.slider.addEventListener('input', (e) => {
                this.pause();
                this.currentFrame = parseInt(e.target.value);
                this.renderFrame();
            });
        }

        // --- 贺图区域手势交互 ---
        if (this.container) {
            const startDrag = (e) => {
                this.isDragging = true;
                this.pause();
                this.startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
                this.startFrame = this.currentFrame;
                e.preventDefault();
            };

            const onDrag = (e) => {
                if (!this.isDragging) return;
                const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
                const deltaX = currentX - this.startX;
                const sensitivity = 10;
                const frameDelta = Math.round(deltaX / sensitivity);
                let newFrame = this.startFrame + frameDelta;

                if (newFrame < 1) newFrame = 1;
                if (newFrame > this.totalFrames) newFrame = this.totalFrames;

                if (newFrame !== this.currentFrame) {
                    this.currentFrame = newFrame;
                    this.renderFrame();
                    this.updateSlider();
                }
            };

            const endDrag = () => {
                this.isDragging = false;
            };

            this.container.addEventListener('mousedown', startDrag);
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', endDrag);

            this.container.addEventListener('touchstart', startDrag, { passive: false });
            document.addEventListener('touchmove', onDrag, { passive: false });
            document.addEventListener('touchend', endDrag);
        }
    },

    // 切换 Tab（内容区域）
    switchTab(tabId) {
        const panes = document.querySelectorAll('.tab-pane');
        panes.forEach(p => {
            p.classList.remove('active');
            if (p.id === 'tab-' + tabId) {
                p.classList.add('active');
            }
        });

        // 切换到提示词 tab 时触发打字机效果
        if (tabId === 'prompt' && this._pendingPromptText) {
            this.startTypewriterNoCursor('terminal-prompt', this._pendingPromptText, 30);
        }
    },

    // 风格友好名称映射
    styleNames: {
        'frosted_blindbox': '磨砂盲盒风格',
        'felt_craft': '手作毛毡风格',
        'cyber_mecha': '赛博机甲风格',
        'pixel_blocks': '像素积木风格'
    },

    // 更新文本数据
    updateData(config) {
        // 更新全局状态 (AppState) 已有的数据
        const recipient = config.recipient || '妈妈';
        const recipEl = document.getElementById('card-recipient');
        if (recipEl) recipEl.innerText = recipient;

        // 同步更新封面页收件人
        const coverRecipEl = document.getElementById('cover-recipient');
        if (coverRecipEl) coverRecipEl.innerText = recipient;

        // 更新提示词信息窗的数据
        // 兼容 ES6 (no optional chaining)
        const promptInfoRecip = document.getElementById('prompt-info-recipient');
        if (promptInfoRecip) promptInfoRecip.innerText = recipient;

        const styleDisplayName = this.styleNames[config.card_style] || config.card_style;
        const promptInfoStyle = document.getElementById('prompt-info-style');
        if (promptInfoStyle) promptInfoStyle.innerText = styleDisplayName;

        const promptInfoText = document.getElementById('prompt-info-text');
        // config.greeting_words 可能是一个数组，取第一个
        let wordKey = '';
        if (Array.isArray(config.greeting_words)) {
            wordKey = config.greeting_words[0];
        } else {
            wordKey = config.greeting_words;
        }

        // Try to get Chinese text for the key if possible, 
        // otherwise just show the key. 
        // Ideally we should lookup from configData
        if (window.AppState.configData && window.AppState.configData.default) {
            const words = window.AppState.configData.default.words;
            if (words && words[wordKey]) {
                if (promptInfoText) promptInfoText.innerText = words[wordKey].text;
            } else {
                if (promptInfoText) promptInfoText.innerText = wordKey;
            }
        }
    },

    // 显示遮罩层 (不显示内容)
    showMask() {
        if (!this.modal) this.init();

        // 显示独立遮罩
        const mask = document.getElementById('card-mask');
        if (mask) {
            mask.classList.remove('hidden');
            mask.style.display = 'block';
        }

        this.modal.classList.remove('hidden');
        this.modal.style.display = 'flex';
        // 确保卡片内容处于初始隐藏状态
        const cardBody = this.modal.querySelector('.card-body');
        if (cardBody) {
            cardBody.classList.remove('active');
        }
    },

    open(floaterConfig) {
        // 先确保遮罩开启 (双重保险)
        this.showMask();

        // 重置 Tab 到寓意页
        this.switchTab('meaning');

        // 标记 active 触发 CSS 动画
        const cardBody = this.modal.querySelector('.card-body');
        if (cardBody) {
            // 强制重绘以确保动画重播 (Reflow hack)
            void cardBody.offsetWidth;
            cardBody.classList.add('active');
        }

        // 绑定内容 & 打字机效果
        const titleEl = document.getElementById('card-title');
        const pinyinEl = document.getElementById('card-pinyin');

        if (titleEl) titleEl.innerText = floaterConfig.text || '...';
        if (pinyinEl) pinyinEl.innerText = floaterConfig.pinyin || '';

        // --- 动态邮票逻辑 ---
        const stampBox = document.getElementById('stamp-box');
        if (stampBox) {
            let stampPath = 'assets/stamp_wealth.png'; // 默认

            // 根据关键词选择邮票
            if (floaterConfig.key === 'burger') {
                stampPath = 'assets/stamp_burger.png';
            } else if (floaterConfig.key === 'snowflake') {
                stampPath = 'assets/stamp_snowflake_elsa.png';
            }

            // 瑞雪呈祥单独使用 Elsa 邮票 (保留旧逻辑兼容)
            if (floaterConfig.key === 'frosted_blindbox') { // 可能是风格key混淆，修正为snowflake
                stampPath = 'assets/stamp_snowflake_elsa.png';
            }

            // 清空旧占位符，插入新图片
            stampBox.innerHTML = '';
            const img = document.createElement('img');
            img.src = stampPath;
            img.alt = 'Stamp';
            stampBox.appendChild(img);
        }

        this.updateData(window.AppState.config);

        // 渲染寓意内容（无打字机效果）
        const meaningText = floaterConfig.meaning || "愿你快乐每一天！";
        const meaningContent = document.getElementById('meaning-content');
        if (meaningContent) {
            meaningContent.innerText = meaningText;
        }

        // 渲染提示词终端内容
        const styleDisplayName = this.styleNames[window.AppState.config.card_style] || window.AppState.config.card_style;
        const terminalStyle = document.getElementById('terminal-style');
        if (terminalStyle) {
            terminalStyle.innerText = styleDisplayName;
        }

        const promptText = floaterConfig.ai_prompt || "AI Prompt Loading...";
        const terminalPrompt = document.getElementById('terminal-prompt');
        if (terminalPrompt) {
            // 存储提示词文本，切换到 prompt tab 时再触发打字机效果
            this._pendingPromptText = promptText;
            terminalPrompt.innerText = ''; // 清空，等待打字机
        }

        // 延迟显示「接受祝福」按钮（给用户阅读时间）
        setTimeout(() => {
            const btn = document.getElementById('accept-btn');
            if (btn) {
                btn.classList.remove('hidden-initially');
                btn.classList.add('fade-in-up');
            }
        }, 800);

        // 隐藏按钮初始状态
        const btn = document.getElementById('accept-btn');
        if (btn) {
            btn.classList.remove('fade-in-up');
            btn.classList.add('hidden-initially');
        }

        // 预加载并播放序列帧
        // 从 AppState 获取当前风格，从 floaterConfig 获取当前 word key
        const currentStyle = window.AppState.config.card_style;
        const currentKey = floaterConfig.key || 'burger'; // fallback
        this.currentStyle = currentStyle;
        this.currentKey = currentKey;
        this.preloadFrames(currentStyle, currentKey);

        // 逻辑修改：起始帧设为第1张
        this.currentFrame = 1;
        this.renderFrame();
        this.updateSlider();

        // 只有当图片已经加载完成时才立刻播放
        if (this.imagesLoaded && window.AppState.config.auto_play) {
            this.play();
        }
    },

    // 打字机效果（带光标）
    startTypewriter(elementId, text, speed = 50, callback) {
        const container = document.getElementById(elementId);
        if (!container) return;

        container.innerHTML = ''; // Clear

        let index = 0;
        const cursor = document.createElement('span');
        cursor.className = 'cursor';
        container.appendChild(cursor);

        // Clear existing interval if any (store in dataset/property to avoid collision)
        if (container._typeInterval) clearInterval(container._typeInterval);

        function type() {
            if (index < text.length) {
                const char = text.charAt(index);
                const charNode = document.createTextNode(char);
                container.insertBefore(charNode, cursor);
                index++;
            } else {
                clearInterval(container._typeInterval);
                // Keep cursor blinking or remove? Usually keep for typewriter feel
                // Trigger callback
                if (callback) callback();
            }
        }

        container._typeInterval = setInterval(type, speed);
    },

    // 打字机效果（无光标，仅动画）
    startTypewriterNoCursor(elementId, text, speed = 50, callback) {
        const container = document.getElementById(elementId);
        if (!container) return;

        container.innerHTML = ''; // Clear

        let index = 0;

        // Clear existing interval if any
        if (container._typeInterval) clearInterval(container._typeInterval);

        const type = () => {
            if (index < text.length) {
                const char = text.charAt(index);
                container.textContent += char;
                index++;
            } else {
                clearInterval(container._typeInterval);
                if (callback) callback();
            }
        };

        container._typeInterval = setInterval(type, speed);
    },

    // 回调钩子
    onClose: null,

    close() {
        if (!this.modal) return;

        this.modal.classList.add('hidden');

        // Hide mask
        const mask = document.getElementById('card-mask');
        if (mask) {
            mask.classList.add('hidden');
            setTimeout(() => { mask.style.display = 'none'; }, 300);
        }

        // Reset active state
        const cardBody = this.modal.querySelector('.card-body');
        if (cardBody) cardBody.classList.remove('active');



        this.pause();

        if (this.onClose) {
            this.onClose();
            this.onClose = null;
        }

        setTimeout(() => {
            this.modal.style.display = 'none';
        }, 300);
    },

    // 播放控制
    play() {
        if (this.isPlaying) return;

        // 逻辑修改：检查图片是否加载完成，未加载则不播放
        if (!this.imagesLoaded) {
            console.log('[Card] Images not loaded, waiting...');
            return;
        }

        this.isPlaying = true;

        if (this.playInterval) clearInterval(this.playInterval);

        // 逻辑修改：速度调整 (80ms，约 12.5 FPS)
        this.playInterval = setInterval(() => {
            this.currentFrame++;

            // 逻辑修改：播放到24帧后，暂停0.5秒再从头开始
            if (this.currentFrame > this.totalFrames) {
                // 暂时清除定时器
                clearInterval(this.playInterval);
                this.playInterval = null;
                this.isPlaying = false; // 关键修复

                // 停顿 500ms
                this.pauseTimeout = setTimeout(() => {
                    this.currentFrame = 1;
                    this.renderFrame();
                    this.updateSlider();
                    // 重新启动播放
                    this.play();
                }, 500);

                return; // 这一帧不渲染（或者保持最后一帧？）
                // 如果 return，画面停留在 > totalFrames，renderFrame处理了吗？
                // renderFrame img = this.frameImages[this.currentFrame]
                // if currentFrame > totalFrames, img won't exist.
                // So we should clamp rendering or keep last frame?
                // Before pause, currentFrame was totalFrames.
                // In this tick, it became totalFrames + 1.
                // So we shouldn't render totalFrames + 1.
                // We should just pause.
            }

            this.updateSlider();
            this.renderFrame();
        }, 80);
    },

    pause() {
        this.isPlaying = false;
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
        if (this.pauseTimeout) {
            clearTimeout(this.pauseTimeout);
            this.pauseTimeout = null;
        }
    },

    updateSlider() {
        if (this.slider) {
            this.slider.value = this.currentFrame;
        }
    },

    // 核心渲染逻辑
    renderFrame() {
        if (!this.ctx) return;

        // --- DPI 高清适配 ---
        // 获取设备像素比
        const dpr = window.devicePixelRatio || 1;
        // 获取 CSS 宽高 (显示尺寸)
        // 注意：canvas.width/height 是物理像素，canvas.style.width/height 是逻辑像素
        const rect = this.canvas.getBoundingClientRect();

        // 只有当 rect 有效时才重置 canvas 尺寸 (避免初始化时宽度为0导致清空)
        if (rect.width > 0 && rect.height > 0) {
            // 如果物理尺寸不匹配，重新设置
            if (this.canvas.width !== Math.round(rect.width * dpr) ||
                this.canvas.height !== Math.round(rect.height * dpr)) {

                this.canvas.width = Math.round(rect.width * dpr);
                this.canvas.height = Math.round(rect.height * dpr);

                // 缩放 Context，这样后续绘制坐标不需要乘 dpr
                this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
        }

        const width = rect.width;   // 使用逻辑宽度
        const height = rect.height; // 使用逻辑高度

        // 清空 (使用逻辑坐标)
        this.ctx.clearRect(0, 0, width, height);

        // --- 绘制背景 (序列帧图片) ---
        const img = this.frameImages[this.currentFrame];
        if (img && img.complete && img.naturalWidth !== 0) {
            // 图片加载成功，绘制图片
            // 保持比例铺满 (Cover 模式)
            const imgRatio = img.naturalWidth / img.naturalHeight;
            const canvasRatio = width / height;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (imgRatio > canvasRatio) {
                // 图片更宽，按高度适配
                drawHeight = height;
                drawWidth = height * imgRatio;
                offsetX = (width - drawWidth) / 2;
                offsetY = 0;
            } else {
                // 图片更高，按宽度适配
                drawWidth = width;
                drawHeight = width / imgRatio;
                offsetX = 0;
                offsetY = (height - drawHeight) / 2;
            }

            // 绘制图片
            this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        } else {
            // 图片未加载或加载失败，使用之前的颜色占位
            const hue = (this.currentFrame / this.totalFrames) * 360;
            this.ctx.fillStyle = `hsl(${hue}, 70%, 80%)`;
            this.ctx.fillRect(0, 0, width, height);

            // 绘制当前帧数 (Loading)
            this.ctx.fillStyle = '#333';
            // 动态字号: 宽度 8%
            const fontSizeBig = Math.max(20, Math.floor(width * 0.08));
            const fontSizeSmall = Math.max(12, Math.floor(width * 0.024));

            this.ctx.font = `${fontSizeBig}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`Frame ${this.currentFrame}`, width / 2, height / 2);

            // 绘制风格标识
            this.ctx.font = `${fontSizeSmall}px Arial`;
            this.ctx.fillText(`Style: ${window.AppState.config.card_style}`, width / 2, height / 2 + fontSizeBig * 0.8);
            this.ctx.fillText(`(Loading...)`, width / 2, height / 2 + fontSizeBig * 1.2);
        }
    },

    playClickEffect(x, y) {
        const images = window.FloaterSystem ? window.FloaterSystem.starBurstImages : [];
        if (!images || images.length === 0) return;

        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.left = (x - 150) + 'px';
        canvas.style.top = (y - 150) + 'px';
        canvas.style.width = '300px';
        canvas.style.height = '300px';
        canvas.style.zIndex = '20000';
        canvas.style.pointerEvents = 'none';
        canvas.width = 300;
        canvas.height = 300;

        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let frame = 0;
        const animate = () => {
            ctx.clearRect(0, 0, 300, 300);
            if (frame >= images.length) {
                if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
                return;
            }
            const img = images[frame];
            if (img && img.complete) ctx.drawImage(img, 0, 0, 300, 300);
            frame++;
            setTimeout(() => requestAnimationFrame(animate), 40);
        };
        requestAnimationFrame(animate);
    }
};

window.CardSystem = CardSystem;
