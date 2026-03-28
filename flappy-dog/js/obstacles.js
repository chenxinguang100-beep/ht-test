/**
 * ObstacleManager — 障碍物系统
 *
 * 障碍物类型：
 *   'block'   — 地面方块（需要起跳越过）
 *   'hang'    — 从天花板悬挂（保持安静/不跳，低身通过）
 *   'pipe'    — 上下管道对（需跳至缺口高度通过，类 Flappy Bird）
 */
class ObstacleManager {
  constructor(canvas, groundY) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.groundY = groundY;  // 地面顶部 Y

    this.obstacles = [];
    this.score = 0;

    // 生成控制（基于移动距离）
    this.travelDist = 0;
    this.nextSpawnAt = 420;  // 开局给足起步空间
    this.speed = 3;

    // 随难度调整
    this.minGap = 280;
    this.maxGap = 430;
  }

  reset() {
    this.obstacles = [];
    this.score = 0;
    this.travelDist = 0;
    this.nextSpawnAt = 420;
    this.speed = 3;
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  /** isActive: 只有柴犬在动时才滚动（声音控制世界） */
  update(isActive) {
    if (!isActive) return;

    const spd = this.speed;

    // 所有障碍物向左移动
    for (const o of this.obstacles) o.x -= spd;

    // 移出屏幕则删除
    this.obstacles = this.obstacles.filter(o => o.x + o.w > -60);

    // 计分：非下管道的障碍物通过柴犬 X=140
    for (const o of this.obstacles) {
      if (!o.scored && o.type !== 'pipe-bot' && o.x + o.w < 120) {
        o.scored = true;
        this.score++;
      }
    }

    // 生成新障碍
    this.travelDist += spd;
    if (this.travelDist >= this.nextSpawnAt) {
      this._spawn();
      this.travelDist = 0;
      this.nextSpawnAt = this.minGap + Math.random() * (this.maxGap - this.minGap);
    }
  }

  _spawn() {
    const r = Math.random();
    if (r < 0.45) {
      this._spawnBlock();
    } else if (r < 0.72) {
      this._spawnHang();
    } else {
      this._spawnPipe();
    }
  }

  _spawnBlock() {
    const w = 42 + Math.random() * 36;   // 42-78px
    const h = 38 + Math.random() * 58;   // 38-96px
    this.obstacles.push({
      type: 'block',
      x: this.canvas.width + 30,
      y: this.groundY - h,
      w, h,
      scored: false,
    });
  }

  _spawnHang() {
    const w = 55 + Math.random() * 45;   // 55-100px
    const h = 55 + Math.random() * 70;   // 55-125px
    this.obstacles.push({
      type: 'hang',
      x: this.canvas.width + 30,
      y: 0,
      w, h,
      scored: false,
    });
  }

  _spawnPipe() {
    const W = this.canvas.width;
    const gapH = 100 + Math.random() * 40;       // 缺口高度 100-140px
    // 缺口中心 Y（在中上区域，确保可以跳过地面管道）
    const gapCY = 130 + Math.random() * (this.groundY - 260);
    const pipeW = 58;
    const x = W + 30;

    // 上管道
    this.obstacles.push({
      type: 'pipe-top',
      x, y: 0,
      w: pipeW,
      h: gapCY - gapH / 2,
      scored: false,
    });
    // 下管道（不单独计分，与上管道共享得分）
    this.obstacles.push({
      type: 'pipe-bot',
      x, y: gapCY + gapH / 2,
      w: pipeW,
      h: this.groundY - (gapCY + gapH / 2),
      scored: true,
    });
  }

  /** AABB 碰撞检测 */
  checkCollision(hb) {
    for (const o of this.obstacles) {
      if (
        hb.x < o.x + o.w &&
        hb.x + hb.w > o.x &&
        hb.y < o.y + o.h &&
        hb.y + hb.h > o.y
      ) return true;
    }
    return false;
  }

  draw() {
    const ctx = this.ctx;
    for (const o of this.obstacles) {
      switch (o.type) {
        case 'block':    this._drawBlock(ctx, o); break;
        case 'hang':     this._drawHang(ctx, o);  break;
        case 'pipe-top': this._drawPipeTop(ctx, o); break;
        case 'pipe-bot': this._drawPipeBot(ctx, o); break;
      }
    }
  }

  // ── 绘制各类障碍物 ──────────────────────────────────────

  _drawBlock(ctx, o) {
    // 主体
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    // 顶部帽（突出，深色）
    ctx.fillStyle = '#795548';
    ctx.fillRect(o.x - 4, o.y, o.w + 8, 13);
    // 高光竖条
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(o.x + 3, o.y + 14, 7, o.h - 14);
    // 砖缝横线
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    for (let yy = o.y + 26; yy < o.y + o.h; yy += 20) {
      ctx.beginPath();
      ctx.moveTo(o.x, yy);
      ctx.lineTo(o.x + o.w, yy);
      ctx.stroke();
    }
  }

  _drawHang(ctx, o) {
    // 主体（深紫色石头感）
    ctx.fillStyle = '#4A1560';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    // 底部帽
    ctx.fillStyle = '#6A2380';
    ctx.fillRect(o.x - 4, o.y + o.h - 13, o.w + 8, 13);
    // 钟乳石尖
    ctx.fillStyle = '#6A2380';
    const tipW = 11;
    const count = Math.floor(o.w / (tipW + 6));
    for (let i = 0; i < count; i++) {
      const tx = o.x + 5 + i * (tipW + 6);
      ctx.beginPath();
      ctx.moveTo(tx, o.y + o.h);
      ctx.lineTo(tx + tipW / 2, o.y + o.h + 18);
      ctx.lineTo(tx + tipW, o.y + o.h);
      ctx.fill();
    }
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(o.x + 3, o.y, 7, o.h);
  }

  _drawPipeTop(ctx, o) {
    // 管体
    ctx.fillStyle = '#2E7D32';
    ctx.fillRect(o.x + 5, o.y, o.w - 10, o.h);
    // 底部管口帽
    ctx.fillStyle = '#1B5E20';
    ctx.fillRect(o.x, o.y + o.h - 16, o.w, 16);
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(o.x + 7, o.y, 9, o.h - 16);
  }

  _drawPipeBot(ctx, o) {
    // 顶部管口帽
    ctx.fillStyle = '#1B5E20';
    ctx.fillRect(o.x, o.y, o.w, 16);
    // 管体
    ctx.fillStyle = '#2E7D32';
    ctx.fillRect(o.x + 5, o.y + 16, o.w - 10, o.h - 16);
    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(o.x + 7, o.y + 16, 9, o.h - 16);
  }
}
