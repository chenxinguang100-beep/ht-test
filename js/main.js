/**
 * H5动态贺卡 - 主逻辑控制器
 * 职责：初始化、通信监听、全局状态管理、响应式适配
 */

// 全局状态管理器
const AppState = {
    // 当前配置
    config: {
        greeting_words: ['burger', 'horse', 'banana'], // 默认多选
        card_style: 'frosted_blindbox', // 默认风格更新为磨砂盲盒
        auto_play: true,
        recipient: '妈妈',
        message_body: '亲爱的妈妈，愿你诸事顺遂，活力满满，开心每一天~',
        sender: 'XXX',
        float_speed: 15 // 飞行速度 (秒)，越小越快
    },

    // 等待消息状态 (借鉴 h5-demo：只有接收到消息才会播放，否则一直 loading)
    isWaiting: true,

    // 初始化
    async init() {
        // 先加载配置
        await this.loadConfig();

        // 初始应用背景
        this.updateBackground();

        this.setupPostMessageListener();
        this.setupResponsiveLayout();
        this.setupGlobalEvents();
        window.addEventListener('resize', this.setupResponsiveLayout);

        console.log('App Initialized');

        // 启动各模块
        if (window.CardSystem) window.CardSystem.init();

        // 显示初始 Loading 状态，等待消息 (不启动倒计时)
        this.showWaitingState();

        // 发送 ready 事件给父容器（Python/IDE）
        // 这会触发 walnut_webview 的 onReady 回调
        this.sendReady();

        // 绑定封面页按钮事件
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            // 简单的 Touch/Click 混合监听
            const handleStart = (e) => {
                e.preventDefault(); // 防止双重触发
                document.getElementById('cover-page').classList.add('hidden');
                // 点击后才启动漂浮系统
                if (window.FloaterSystem) window.FloaterSystem.init();
            };

            startBtn.addEventListener('click', handleStart);
            startBtn.addEventListener('touchend', handleStart);
        } else {
            // 如果没找到按钮（异常情况），直接启动
            if (window.FloaterSystem) window.FloaterSystem.init();
        }
    },

    // 显示等待消息状态 (一直 loading，不自动结束)
    showWaitingState() {
        const overlay = document.getElementById('loading-overlay');
        const overlayText = document.getElementById('loading-text');

        if (!overlay || !overlayText) return;

        // 确保 overlay 可见
        overlay.classList.remove('hidden');
        overlay.style.display = '';

        // 显示等待文案
        overlayText.innerText = '排队中，请稍候……';
        overlayText.classList.remove('highlight');

        // 显示 spinner
        const spinner = document.querySelector('.spinner');
        if (spinner) spinner.classList.remove('hidden');

        console.log('[Loading] Waiting for message...');
    },

    // 静态配置数据 (来自 config.json)
    configData: null,

    async loadConfig() {
        try {
            const response = await fetch('config.json');
            this.configData = await response.json();
            console.log('[H5] Config loaded:', this.configData.version);
        } catch (error) {
            console.error('[H5] Failed to load config.json:', error);
            // 简单兜底，防止报错白屏，实际数据可以先放空
            this.configData = { styles: {}, words: {}, prompts: {} };
        }
    },

    // 监听 PostMessage
    setupPostMessageListener() {
        window.addEventListener('message', (event) => {
            const msg = event.data;
            console.log('[H5] Received message:', msg);

            if (msg.cmd === 'py_btc_ai2_3_4') {
                console.log('[H5] Protocol Validated: Received [py_btc_ai2_3_4] via Real PostMessage.');
                this.updateConfig(msg.content);
            }
        });
    },

    // 更新配置并触发重绘
    updateConfig(newConfig) {
        if (!newConfig) return;

        // 兼容处理：如果传过来的是字符串，转为数组 (防止旧代码报错)
        if (newConfig.greeting_words && typeof newConfig.greeting_words === 'string') {
            newConfig.greeting_words = [newConfig.greeting_words];
        }

        // 合并配置
        this.config = Object.assign({}, this.config, newConfig);
        console.log('[H5] Config updated:', this.config);

        // 同步更新封面页收件人
        const coverRecipEl = document.getElementById('cover-recipient');
        if (coverRecipEl && this.config.recipient) {
            coverRecipEl.innerText = this.config.recipient;
        }

        // 如果还在等待消息状态，收到消息后启动 loading 序列
        if (this.isWaiting) {
            this.isWaiting = false;
            console.log('[H5] Message received, starting loading sequence...');
            this.initLoadingSequence();
        }

        // 通知各子系统更新
        // 1. 更新漂浮系统 (重新生成挂件)
        if (window.FloaterSystem) {
            window.FloaterSystem.refresh(this.config.greeting_words);
        }

        // 2. 更新贺卡内容 (不打开，只是更新数据)
        if (window.CardSystem) {
            window.CardSystem.updateData(this.config);
        }

        // 3. 更新全局背景 (Style Dependent)
        this.updateBackground();
    },

    // 更新背景图
    updateBackground() {
        if (this.configData && this.configData.styles && this.configData.styles[this.config.card_style]) {
            const styleConfig = this.configData.styles[this.config.card_style];
            const bgUrl = styleConfig.background;

            const bgLayer = document.getElementById('background-layer');
            if (bgLayer && bgUrl) {
                bgLayer.style.backgroundImage = `url('${bgUrl}')`;
                bgLayer.style.backgroundSize = 'cover';
                bgLayer.style.backgroundPosition = 'center';
                console.log(`[H5] Background updated to: ${bgUrl}`);
            }
        }
    },

    // 发送 ready 事件（通知父容器 H5 已加载完成）
    sendReady() {
        // 模仿核桃官方 H5 的消息格式，添加 source: 'h5'
        const msg = {
            source: 'h5',
            cmd: 'ready'
        };

        // 向父容器发送消息（触发 walnut_webview 的 onReady 回调）
        // 根据 c2-legacy 源码，官方使用 window.parent.postMessage
        // 但为了确保穿透 webview/iframe 嵌套，我们优先尝试 window.top
        // 且必须包含 source: 'h5' 字段
        if (window.top) {
            window.top.postMessage(msg, '*');
        } else {
            window.parent.postMessage(msg, '*');
        }

        // 同时发送到当前窗口（供 Mock 监听）
        window.postMessage(msg, '*');

        console.log('[H5] Ready event sent:', msg);
    },

    // 发送完成事件 (h5_card_completed)
    // 用户点击"接受祝福"后调用，通知父容器交互完成
    sendResult(params = {}) {
        const msg = {
            source: 'h5',
            cmd: 'h5_card_completed',
            content: {
                status: 'completed',
                greeting_words: this.config.greeting_words,
                card_style: this.config.card_style,
                recipient: this.config.recipient,
                ...params
            }
        };

        // 暴露全局变量，供外部读取
        window.H5Result = msg;

        // 向父容器发送消息（优先 window.top）
        if (window.top) {
            window.top.postMessage(msg, '*');
        } else {
            window.parent.postMessage(msg, '*');
        }

        // 同时发送到当前窗口（供 Mock 监听）
        window.postMessage(msg, '*');

        console.log('[H5] h5_card_completed sent:', msg);
    },

    // 响应式布局：终极适配 (Zoom / Scale)
    setupResponsiveLayout() {
        const wrapper = document.getElementById('main-window'); // 目标改为 main-window
        if (!wrapper) return;

        // 设计稿尺寸（舞台 + 标题栏）
        // 舞台宽 1000
        // 舞台高 750 + 标题栏 48 = 798
        const designWidth = 1000;
        const designHeight = 750 + 48;

        // 获取视口尺寸
        const clientWidth = document.documentElement.clientWidth;
        const clientHeight = document.documentElement.clientHeight;

        // 计算缩放比例 (Contain 模式)
        // 缩小舞台尺寸：安全边距调整为 0.85 (85%)
        const isMobile = clientWidth < 800;
        const safeMarginX = isMobile ? 0.95 : 0.85;
        const safeMarginY = isMobile ? 0.95 : 0.85;

        const scaleX = (clientWidth * safeMarginX) / designWidth;
        const scaleY = (clientHeight * safeMarginY) / designHeight;

        // 取较小值，保证完整放入
        const scale = Math.min(scaleX, scaleY);

        // 应用缩放
        // 方案：动态调整 REM 基准值
        // Design: 1000px width => 10rem. Base: 100px = 1rem.
        const fontSize = scale * 100;
        document.documentElement.style.fontSize = fontSize + 'px';

        // 针对 Chrome 59+ 优化：使用 zoom 属性替代 transform: scale
        if ('zoom' in wrapper.style) {
            // 确保 Window 居中
            wrapper.style.zoom = '';
            wrapper.style.transform = '';
            wrapper.style.position = 'relative'; // Flex item
            wrapper.style.top = '';
            wrapper.style.left = '';
        } else {
            // Fallback (Scaling via Transform if needed, but REM should handle size)
            // If we use REM, we don't need transform scale for size, 
            // BUT we might need it if the browser doesn't support REM (very rare).
            // Actually, if we use REM, the elements naturally shrink.
            // So we just clear the transform fallback too.
            wrapper.style.position = 'relative';
            wrapper.style.top = '';
            wrapper.style.left = '';
            wrapper.style.transform = '';
        }

        // 布局计算完成后显示舞台
        wrapper.style.opacity = '1';

        // Update global scale to 1 (coordinates are now 1:1 with screen pixels)
        this.scale = 1;

        console.log(`Layout updated (REM Mode): scale=${scale.toFixed(4)}, fontSize=${fontSize.toFixed(2)}px`);
    },

    // 绑定全局事件
    setupGlobalEvents() {
        // 全局关闭按钮已移除
    },

    // --- Loading 序列逻辑 ---
    initLoadingSequence() {
        const overlay = document.getElementById('loading-overlay');
        const overlayText = document.getElementById('loading-text');
        const spinner = document.querySelector('.spinner');
        const coverPage = document.getElementById('cover-page');

        if (!overlay || !overlayText) return;

        // Phase 1: 排队中 (HTML 初始状态)
        console.log('[Loading] Phase 1: Queueing...');

        // 模拟资源预加载 (改为真实预加载)
        const doPreload = () => {
            const promises = [];

            // 1. 最小等待时间 (3秒)
            promises.push(new Promise(resolve => setTimeout(resolve, 3000)));

            // 2. 真实加载贺卡序列帧 (包含所有单词)
            if (window.CardSystem && this.config) {
                let words = this.config.greeting_words;
                if (!Array.isArray(words)) words = [words];

                words.forEach(wordKey => {
                    promises.push(window.CardSystem.preloadFrames(this.config.card_style, wordKey));
                });
            }

            // 3. 真实加载漂浮挂件素材 (针对所有单词)
            if (window.FloaterSystem && this.config) {
                let words = this.config.greeting_words;
                if (!Array.isArray(words)) words = [words];

                words.forEach(w => {
                    promises.push(window.FloaterSystem.preloadAssets(this.config.card_style, w));
                });
            }

            // 4. 加载背景图 (如果有)
            if (this.configData && this.configData.styles && this.configData.styles[this.config.card_style]) {
                const bgUrl = this.configData.styles[this.config.card_style].background;
                if (bgUrl) {
                    promises.push(new Promise(r => {
                        const img = new Image();
                        img.src = bgUrl;
                        img.onload = img.onerror = r;
                    }));
                }
            }

            return Promise.all(promises);
        };

        // 逻辑优化：
        // 1. 保持 "排队中" 一小会儿 (500ms)
        // 2. 切换到 "制作中" 并开始加载资源
        // 3. 加载完成 -> "制作完成"

        // 逻辑优化：
        // 收到消息后立即切换到 "制作中" 并开始加载资源
        // 不需要额外等待，因为 "排队中" 已经是初始状态

        // Phase 2: 正在制作中
        console.log('[Loading] Phase 2: Processing...');
        overlayText.innerText = '正在制作中……很快完成';

        // 开始加载资源
        doPreload().then(() => {
            // Phase 3: 制作完成
            console.log('[Loading] Phase 3: Done!');
            overlayText.innerText = '制作完成！';
            overlayText.classList.add('highlight');
            spinner.classList.add('hidden');

            // 停留 0.8 秒展示“完成”
            setTimeout(() => {
                // Phase 4: Fade Out & Reveal
                console.log('[Loading] Phase 4: Reveal');
                overlay.classList.add('hidden');

                if (coverPage) coverPage.classList.remove('hidden');

                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 800);
            }, 800);
        });
    },

};

// 暴露给全局，方便其他模块调用
window.AppState = AppState;

// 启动
document.addEventListener('DOMContentLoaded', () => {
    AppState.init();
});
