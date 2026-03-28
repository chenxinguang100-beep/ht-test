/**
 * Game — 主游戏控制器
 *
 * 机制总结：
 *   有声音 → 世界向左滚动（柴犬前进）
 *   大声/高音 → 柴犬起跳
 *   保持安静 → 一切暂停（可以原地等待障碍物经过）
 *   障碍物：
 *     地面方块 → 起跳越过
 *     悬挂石钟乳 → 保持安静低头通过（跳跃会撞上）
 *     管道对 → 跳至缺口高度通过
 */
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    const W = this.canvas.width;
    const H = this.canvas.height;

    this.groundY = H - 70;

    this.audio = new AudioAnalyzer();
    this.dog = new Dog(this.canvas);
    this.obstacles = new ObstacleManager(this.canvas, this.groundY);

    // 游戏状态: 'start' | 'playing' | 'dying' | 'over'
    this.state = 'start';
    this.score = 0;
    this.best = 0;
    this.frame = 0;

    // 背景元素
    this.clouds = this._makeClouds();
    this.bgTrees = this._makeTrees();
    this.scrollX = 0;  // 地面草纹滚动

    this._bindUI();
    this._loop();
  }

  // ── 初始化 ──────────────────────────────────────────────

  _makeClouds() {
    return Array.from({ length: 6 }, (_, i) => ({
      x: 80 + i * 135,
      y: 25 + Math.random() * 90,
      r: 18 + Math.random() * 18,
      spd: 0.25 + Math.random() * 0.3,
    }));
  }

  _makeTrees() {
    return Array.from({ length: 9 }, (_, i) => ({
      x: i * 110 + 20,
      y: this.groundY,
      h: 38 + Math.random() * 55,
      cw: 22 + Math.random() * 18,  // 树冠半径
    }));
  }

  _bindUI() {
    document.getElementById('startBtn').addEventListener('click', () => this._startGame());
    document.getElementById('restartBtn').addEventListener('click', () => this._startGame());
  }

  // ── 游戏流程 ────────────────────────────────────────────

  async _startGame() {
    // 初始化麦克风（只做一次）
    if (!this.audio.isReady) {
      try {
        await this.audio.init();
      } catch {
        alert('需要麦克风权限才能玩游戏！\n请在浏览器中允许麦克风访问后重试。');
        return;
      }
    }

    // 重置
    this.dog.reset();
    this.obstacles.reset();
    this.score = 0;
    this.frame = 0;
    this.scrollX = 0;
    this.state = 'playing';

    this._show('hud');
    this._hide('startScreen');
    this._hide('gameOverScreen');
  }

  _triggerDeath() {
    if (this.state !== 'playing') return;
    this.state = 'dying';
    this.dog.die();

    if (this.score > this.best) this.best = this.score;

    setTimeout(() => {
      this.state = 'over';
      this._hide('hud');
      document.getElementById('finalScore').textContent =
        `得分：${this.score}`;
      document.getElementById('bestScore').textContent =
        this.best > 0 ? `最高纪录：${this.best}` : '';
      this._show('gameOverScreen');
    }, 1600);
  }

  // ── 主循环 ──────────────────────────────────────────────

  _loop() {
    this._update();
    this._draw();
    requestAnimationFrame(() => this._loop());
  }

  _update() {
    if (this.state !== 'playing' && this.state !== 'dying') return;

    this.audio.update();

    const active = this.audio.isActive;
    const jump = this.audio.shouldJump;

    if (this.state === 'playing') {
      // 速度随得分递增，上限 9
      const spd = Math.min(3 + Math.floor(this.score / 6) * 0.5, 9);
      this.obstacles.setSpeed(spd);

      // 只在有声时滚动地面
      if (active) {
        this.scrollX += spd;
        this.obstacles.update(true);
        this.score = this.obstacles.score;
        document.getElementById('score').textContent = this.score;
      } else {
        this.obstacles.update(false);
      }

      // 碰撞检测
      if (this.obstacles.checkCollision(this.dog.hitbox())) {
        this._triggerDeath();
      }
    }

    // 柴犬物理（dying 状态也继续运动）
    this.dog.update(active, jump && this.state === 'playing');

    // 更新音量条
    this._updateHUD();

    this.frame++;
  }

  _updateHUD() {
    const pct = Math.min(100, this.audio.volumePercent);
    document.getElementById('volumeBar').style.width = pct + '%';
    document.getElementById('volumeBar').style.background =
      this.audio.shouldJump ? '#FF5722'
      : this.audio.isActive ? '#4CAF50'
      : '#555';

    const hz = this.audio.pitch;
    document.getElementById('pitchDisplay').textContent =
      hz > 0 ? Math.round(hz) + ' Hz' : '';
  }

  // ── 绘制 ────────────────────────────────────────────────

  _draw() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    // 天空渐变
    const sky = ctx.createLinearGradient(0, 0, 0, this.groundY);
    sky.addColorStop(0, '#5BA3D9');
    sky.addColorStop(1, '#B8DCF0');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, this.groundY);

    // 云
    this._drawClouds(ctx, W);

    // 背景树（视差较慢）
    this._drawTrees(ctx);

    // 地面
    this._drawGround(ctx, W, H);

    // 障碍物
    this.obstacles.draw();

    // 柴犬
    this.dog.draw();

    // 开始引导提示（游戏中但未发声）
    if (this.state === 'playing' && !this.audio.isActive) {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 26px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎤  发出声音，让柴犬跑起来！', W / 2, H / 2 - 10);
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('大声喊叫 → 起跳', W / 2, H / 2 + 22);
      ctx.textAlign = 'left';
    }
  }

  _drawClouds(ctx, W) {
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    for (const c of this.clouds) {
      if (this.state === 'playing') {
        c.x -= c.spd;
        if (c.x + c.r * 3.5 < 0) {
          c.x = W + c.r * 2;
          c.y = 25 + Math.random() * 90;
        }
      }
      ctx.beginPath();
      ctx.arc(c.x,              c.y,              c.r,       0, Math.PI * 2);
      ctx.arc(c.x + c.r * 0.9, c.y - c.r * 0.35, c.r * 0.8, 0, Math.PI * 2);
      ctx.arc(c.x + c.r * 1.8, c.y,              c.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawTrees(ctx) {
    for (const t of this.bgTrees) {
      if (this.state === 'playing' && this.audio.isActive) {
        t.x -= 0.8;  // 慢速视差
        if (t.x + t.cw < 0) {
          t.x = this.canvas.width + t.cw;
          t.h = 38 + Math.random() * 55;
        }
      }
      // 树干
      ctx.fillStyle = '#6D4C41';
      ctx.fillRect(t.x - 5, t.y - t.h, 10, t.h);
      // 树冠（两层，营造立体感）
      ctx.fillStyle = '#388E3C';
      ctx.beginPath();
      ctx.arc(t.x, t.y - t.h, t.cw, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2E7D32';
      ctx.beginPath();
      ctx.arc(t.x - 4, t.y - t.h - 8, t.cw * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawGround(ctx, W, H) {
    const gY = this.groundY;

    // 草地条纹
    ctx.fillStyle = '#66BB6A';
    ctx.fillRect(0, gY, W, 12);

    // 草叶纹（随 scrollX 滚动）
    ctx.fillStyle = '#4CAF50';
    const offset = this.scrollX % 22;
    for (let x = -offset; x < W; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, gY);
      ctx.lineTo(x + 6, gY - 9);
      ctx.lineTo(x + 12, gY);
      ctx.fill();
    }

    // 泥土
    const dirt = ctx.createLinearGradient(0, gY + 12, 0, H);
    dirt.addColorStop(0, '#8D6E63');
    dirt.addColorStop(1, '#5D4037');
    ctx.fillStyle = dirt;
    ctx.fillRect(0, gY + 12, W, H - gY - 12);

    // 泥土横纹
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    for (let y = gY + 28; y < H; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  // ── 工具 ────────────────────────────────────────────────

  _show(id) { document.getElementById(id).classList.remove('hidden'); }
  _hide(id) { document.getElementById(id).classList.add('hidden'); }
}

window.addEventListener('DOMContentLoaded', () => new Game());
