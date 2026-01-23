/**
 * Mock System (调试面板)
 * 职责：模拟 Python 环境发送消息
 */
const MockSystem = {
    panel: null,
    
    init() {
        this.panel = document.getElementById('debug-panel');
        if (!this.panel) return;
        
        this.renderUI();
        this.bindEvents();
    },

    renderUI() {
        this.panel.innerHTML = `
            <div class="debug-header" id="debug-toggle">
                <span>🔧 调试配置 (Mock)</span>
                <span>⬆️</span>
            </div>
            <div class="debug-content">
                <div class="form-group">
                    <label>挂件/贺词类型 (多选)</label>
                    <div id="mock-greeting-group">
                        <label><input type="checkbox" value="burger" checked> 一堡口福</label>
                        <label><input type="checkbox" value="chips"> 薯你最棒</label>
                        <label><input type="checkbox" value="horse" checked> 马到成功</label>
                        <label><input type="checkbox" value="snowflake"> 冰雪聪明</label>
                        <label><input type="checkbox" value="banana" checked> 萌趣纳福</label>
                        <label><input type="checkbox" value="kitty"> 大吉大利</label>
                    </div>
                </div>

                <div class="form-group">
                    <label>贺卡风格 (card_style)</label>
                    <select id="mock-style">
                        <option value="pixel_world">像素世界</option>
                        <option value="felt_doll">毛毡玩偶</option>
                        <option value="frosted_cartoon">磨砂卡通</option>
                        <option value="dreamy_crystal">梦幻水晶</option>
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

                <button id="mock-send-btn">发送指令 (Simulate PostMessage)</button>
            </div>
        `;
    },

    bindEvents() {
        // 折叠/展开
        const header = document.getElementById('debug-toggle');
        header.addEventListener('click', () => {
            this.panel.classList.toggle('collapsed');
            const arrow = header.querySelector('span:last-child');
            arrow.innerText = this.panel.classList.contains('collapsed') ? '⬆️' : '⬇️';
        });

        // 速度滑块显示数值
        const speedInput = document.getElementById('mock-speed');
        const speedDisplay = document.getElementById('speed-display');
        speedInput.addEventListener('input', (e) => {
            speedDisplay.innerText = e.target.value + 's';
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
                cmd: 'update_card',
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
            
            // 简单的反馈
            console.log('[Mock] Sent:', msg);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    MockSystem.init();
});
