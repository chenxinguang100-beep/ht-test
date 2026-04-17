// 总控：串联 engine + stage + rack + controls

import { Engine } from './audio/engine.js';
import { Stage } from './ui/stage.js';
import { CardRack } from './ui/card-rack.js';
import { Controls } from './ui/controls.js';
import { LOOPS_BY_CATEGORY, CATEGORIES } from './audio/loops.js';

function waitForTone() {
  return new Promise((resolve) => {
    if (window.Tone) return resolve();
    const t = setInterval(() => {
      if (window.Tone) { clearInterval(t); resolve(); }
    }, 50);
  });
}

async function boot() {
  await waitForTone();

  const engine = new Engine();
  const stage  = new Stage(document.getElementById('stage'));
  const rack   = new CardRack(document.getElementById('rack'));
  const controls = new Controls(engine);

  // 同一 loopId 的点击（卡片 or 角色槽）= 切换激活状态
  const toggleLoop = (loopId) => {
    if (engine.isActive(loopId)) {
      engine.deactivate(loopId);
      stage.empty(loopId);
      rack.setActive(loopId, false);
    } else {
      if (engine.activate(loopId)) {
        stage.fill(loopId);
        rack.setActive(loopId, true);
      }
    }
  };

  rack.onCardClick = toggleLoop;
  stage.onSlotClick = toggleLoop;

  // ===== 顶部按钮 =====
  const btnPlay   = document.getElementById('btn-play');
  const btnStop   = document.getElementById('btn-stop');
  const btnClear  = document.getElementById('btn-clear');
  const btnRandom = document.getElementById('btn-random');
  const btnEnter  = document.getElementById('btn-enter');
  const startMask = document.getElementById('start-mask');

  const startEngine = async () => {
    if (engine.isRunning()) return;
    await engine.start();
    controls.setPlayingState(true);
  };

  btnEnter.addEventListener('click', async () => {
    await startEngine();
    startMask.classList.add('hidden');
    // 启动后默认激活一段节奏 + 一段低音 + 一段和声，有立即的声音反馈
    setTimeout(() => {
      toggleLoop('beat_kick');
      toggleLoop('beat_hat');
      toggleLoop('bass_pulse');
      toggleLoop('harm_pad_prog');
    }, 200);
  });

  btnPlay.addEventListener('click', async () => {
    if (!engine.isRunning()) {
      await startEngine();
    } else {
      window.Tone.Transport.pause();
      controls.setPlayingState(false);
    }
    if (engine.isRunning()) controls.setPlayingState(true);
  });

  btnStop.addEventListener('click', () => {
    engine.stop();
    controls.setPlayingState(false);
  });

  btnClear.addEventListener('click', () => {
    for (const id of rack.getAllLoopIds()) {
      if (engine.isActive(id)) {
        engine.deactivate(id);
        stage.empty(id);
        rack.setActive(id, false);
      }
    }
  });

  btnRandom.addEventListener('click', async () => {
    if (!engine.isRunning()) await startEngine();
    // 每个分类随机抽 1-2 条
    CATEGORIES.forEach(cat => {
      const pool = LOOPS_BY_CATEGORY[cat.key];
      // 先清空本分类
      pool.forEach(l => {
        if (engine.isActive(l.id)) {
          engine.deactivate(l.id);
          stage.empty(l.id);
          rack.setActive(l.id, false);
        }
      });
      const pickCount = cat.key === 'rhythm' ? 2 : (cat.key === 'melody' ? 1 : 1);
      const picked = [];
      while (picked.length < pickCount) {
        const l = pool[Math.floor(Math.random() * pool.length)];
        if (!picked.includes(l)) picked.push(l);
      }
      picked.forEach(l => {
        engine.activate(l.id);
        stage.fill(l.id);
        rack.setActive(l.id, true);
      });
    });
  });

  // 暴露到 window 方便调试
  window.__engine = engine;
  window.__stage = stage;
  window.__rack = rack;
}

boot().catch(err => {
  console.error('启动失败', err);
  alert('启动失败：' + err.message);
});
