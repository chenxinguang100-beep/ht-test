/**
 * Mock System (调试面板)
 * 职责：模拟 Python 环境发送消息
 */
const MockSystem = {
    panel: null,

    init() {
        this.panel = document.getElementById('debug-panel');
        if (!this.panel) return;

        // URL 参数检查: ?debug=true
        const isDebug = new URLSearchParams(window.location.search).get('debug') === 'true';

        if (!isDebug) {
            this.panel.style.display = 'none';
            return;
        }

        // 默认收起 (collapsed)，配合 CSS 实现 Hover 展开
        this.panel.classList.add('collapsed');

        this.renderUI();
        this.bindEvents();
    },

    renderUI() {
        this.panel.innerHTML = `
            <div class="debug-header" id="debug-toggle">
                <span>🔧 调试面板 (真实协议模拟)</span>
                <span>⬇️</span>
            </div>
            <div class="debug-content">
                <div class="form-group">
                    <label>挂件/贺词类型 (多选)</label>
                    <div id="mock-greeting-group">
                        <label><input type="checkbox" value="snowflake" checked> 瑞雪呈祥</label>
                        <label><input type="checkbox" value="burger" checked> 一堡口福</label>
                        <label><input type="checkbox" value="wealth" checked> 财富自由</label>
                        <label><input type="checkbox" value="fortune"> 好运连连</label>
                        <label><input type="checkbox" value="lucky"> 时来运转</label>
                        <label><input type="checkbox" value="high_fly"> 一飞冲天</label>
                    </div>
                </div>

                <div class="form-group">
                    <label>贺卡风格 (card_style)</label>
                    <select id="mock-style">
                        <option value="frosted_blindbox">磨砂盲盒</option>
                        <option value="felt_craft">手作毛毡</option>
                        <option value="cyber_mecha">赛博机甲</option>
                        <option value="pixel_blocks">像素积木</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>收件人 (recipient)</label>
                    <input type="text" id="mock-recipient" value="妈妈">
                </div>

                <div class="form-group">
                    <label>飞行速度 (秒/次，越小越快)</label>
                    <input type="range" id="mock-speed" min="5" max="30" value="15" step="1">
                    <span id="speed-display" style="font-size: 12px; color: #666; float: right;">15s</span>
                </div>

                <div class="form-group">
                    <label>自动播放 (auto_play)</label>
                    <select id="mock-autoplay">
                        <option value="true">开启</option>
                        <option value="false">关闭</option>
                    </select>
                </div>

                <button id="mock-ready-btn" style="background: #2196F3; margin-bottom: 8px;">📡 发送 Ready 事件</button>
                <button id="mock-send-btn">发送指令 (Simulate PostMessage)</button>

                <div class="form-group" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <label style="color: #888;">📤 事件监听</label>
                    <div id="result-status" style="padding: 10px; background: rgba(0,0,0,0.3); border-radius: 6px; font-size: 12px; color: #999; border: 1px dashed rgba(255,255,255,0.2);">
                        ⏳ 等待 h5_card_completed 事件...
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        // 折叠/展开
        const header = document.getElementById('debug-toggle');
        header.addEventListener('click', () => {
            this.panel.classList.toggle('collapsed');
        });

        // 速度滑块显示数值
        const speedInput = document.getElementById('mock-speed');
        const speedDisplay = document.getElementById('speed-display');
        speedInput.addEventListener('input', (e) => {
            speedDisplay.innerText = e.target.value + 's';
        });

        // 发送 Ready 事件（模拟 H5 告知父容器已加载完成）
        document.getElementById('mock-ready-btn').addEventListener('click', () => {
            const readyMsg = { cmd: 'ready' };

            // 向父容器发送
            window.parent.postMessage(readyMsg, '*');

            console.log('[Mock] Ready event sent:', readyMsg);
            alert('✅ Ready 事件已发送！\n\n在真实环境中，Python 端收到此事件后会调用 _onReady() 发送配置。');
        });

        // 发送指令
        document.getElementById('mock-send-btn').addEventListener('click', () => {
            // 获取多选值
            const checkedBoxes = document.querySelectorAll('#mock-greeting-group input:checked');
            const selectedGreetings = Array.from(checkedBoxes).map(cb => cb.value);

            // 至少选一个
            if (selectedGreetings.length === 0) {
                alert('请至少选择一个挂件类型！');
                return;
            }

            const style = document.getElementById('mock-style').value;
            const recipient = document.getElementById('mock-recipient').value;
            const autoPlay = document.getElementById('mock-autoplay').value === 'true';
            const speed = parseInt(document.getElementById('mock-speed').value);

            // 构造消息包
            const msg = {
                cmd: 'py_btc_ai2_3_4',
                content: {
                    greeting_words: selectedGreetings, // 发送数组
                    card_style: style,
                    recipient: recipient,
                    auto_play: autoPlay,
                    float_speed: speed,
                    message_body: `亲爱的${recipient}，这是来自Mock系统的测试祝福...`,
                    sender: '开发者'
                }
            };

            // 模拟发送
            window.postMessage(msg, '*');

            // 重置 result 状态显示
            const statusEl = document.getElementById('result-status');
            if (statusEl) {
                statusEl.style.color = '#999';
                statusEl.style.borderColor = 'rgba(255,255,255,0.2)';
                statusEl.innerHTML = '⏳ 等待 h5_card_completed 事件...';
            }

            // 简单的反馈
            console.log('[Mock] Sent:', msg);
        });

        // 监听 h5_card_completed 事件
        window.addEventListener('message', (event) => {
            const msg = event.data;
            if (msg && msg.cmd === 'h5_card_completed') {
                const statusEl = document.getElementById('result-status');
                if (statusEl) {
                    statusEl.style.color = '#4caf50';
                    statusEl.style.borderColor = '#4caf50';
                    statusEl.innerHTML = `✅ 已收到完成事件<br>
                        <small style="color:#888;">状态: ${msg.content.status}</small><br>
                        <small style="color:#888;">风格: ${msg.content.card_style}</small>`;
                }
                console.log('[Mock] Received h5_card_completed:', msg);
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    MockSystem.init();
});
