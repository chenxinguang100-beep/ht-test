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
    totalFrames: 16,
    isPlaying: false,
    playInterval: null,
    isDragging: false,
    startX: 0,
    startFrame: 1,

    // 资源缓存
    frameImages: [],
    imagesLoaded: false,

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

        const style = styleName || 'pixel_world';
        const text = textName || '';

        // 保存当前加载的组合标识，用于缓存检查
        this.currentStyleText = `${style}_${text}`;

        console.log(`[Card] Preloading frames for Style: ${style}, Text: ${text}`);

        for (let i = 1; i <= this.totalFrames; i++) {
            const img = new Image();
            // 序号补零，如 01, 02...
            const frameIndex = i.toString().padStart(2, '0');
            // 构造路径: assets/frames/{style}/{text}/{style}{text}_{index}.jpg
            const path = `assets/frames/${style}/${text}/${style}${text}_${frameIndex}.jpg`;

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
        document.getElementById('accept-btn').addEventListener('click', () => {
            this.close();
        });

        // 提示词按钮
        document.getElementById('info-btn').addEventListener('click', () => {
            this.togglePrompt(true);
        });

        // 提示词区域点击自动关闭
        document.getElementById('view-prompt').addEventListener('click', () => {
            this.togglePrompt(false);
        });

        // 进度条拖动
        if (this.slider) {
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

    // 切换提示词视图
    togglePrompt(show) {
        const greetingView = document.getElementById('view-greeting');
        const promptView = document.getElementById('view-prompt');
        if (show) {
            greetingView.classList.add('view-hidden');
            promptView.classList.remove('view-hidden');
        } else {
            greetingView.classList.remove('view-hidden');
            promptView.classList.add('view-hidden');
        }
    },

    // 风格友好名称映射
    styleNames: {
        'pixel_world': '像素世界风格',
        'felt_doll': '毛毡玩偶风格',
        'frosted_cartoon': '磨砂卡通风格',
        'dreamy_crystal': '梦幻水晶风格'
    },

    // 更新文本数据
    updateData(config) {
        // 更新全局状态 (AppState) 已有的数据
        document.getElementById('card-recipient').innerText = config.recipient || '妈妈';

        // 更新提示词信息窗的数据
        document.getElementById('prompt-info-recipient').innerText = config.recipient || '妈妈';
        const styleDisplayName = this.styleNames[config.card_style] || config.card_style;
        document.getElementById('prompt-info-style').innerText = styleDisplayName;
    },

    open(floaterConfig) {
        if (!this.modal) this.init();

        this.modal.classList.remove('hidden');
        this.modal.style.display = 'flex';

        // 重置视图
        this.togglePrompt(false);

        // 绑定内容
        document.getElementById('card-title').innerText = floaterConfig.text || '...';
        document.getElementById('card-pinyin').innerText = floaterConfig.pinyin || '';
        document.getElementById('card-message').innerText = floaterConfig.meaning || '';

        // 更新提示词详情
        document.getElementById('prompt-info-text').innerText = floaterConfig.text || '...';
        document.getElementById('prompt-ai-content').innerText = floaterConfig.ai_prompt || '';

        // 更新提示词视图中的风格和收件人
        this.updateData(window.AppState.config);

        const currentStyle = window.AppState.config.card_style;
        const currentText = floaterConfig.text || '';
        const combinationId = `${currentStyle}_${currentText}`;

        // 检查是否需要重新加载资源
        if (!this.currentStyleText || this.currentStyleText !== combinationId) {
            this.preloadFrames(currentStyle, currentText);
        }

        // 逻辑修改：起始帧设为第6张
        this.currentFrame = 6;
        this.renderFrame();
        this.updateSlider();

        // 只有当图片已经加载完成时才立刻播放
        if (this.imagesLoaded && window.AppState.config.auto_play) {
            this.play();
        }
    },

    // 回调钩子
    onClose: null,

    close() {
        if (!this.modal) return;
        this.modal.classList.add('hidden');
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

        // 逻辑修改：速度变慢 (100ms -> 150ms)
        this.playInterval = setInterval(() => {
            this.currentFrame++;

            // 逻辑修改：播放到16帧后，从第1张开始循环
            if (this.currentFrame > this.totalFrames) {
                this.currentFrame = 1;
            }

            this.updateSlider();
            this.renderFrame();
        }, 150);
    },

    pause() {
        this.isPlaying = false;
        if (this.playInterval) clearInterval(this.playInterval);
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
    }
};

window.CardSystem = CardSystem;
