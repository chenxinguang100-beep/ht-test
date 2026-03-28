/**
 * Dog — 圆滚滚橙色大胖柴犬
 * 用 Canvas 2D 纯绘制，无需外部图片资源
 */
class Dog {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // 物理尺寸
    this.radius = 33;   // 身体半径
    this.legH = 13;     // 腿长

    // 固定 X
    this.x = 140;

    // 地面 Y（地面顶面像素）
    this.groundY = canvas.height - 70;

    // 站立时身体中心 Y
    this.standingY = this.groundY - this.radius - this.legH + 4;

    // 当前位置 & 速度
    this.y = this.standingY;
    this.vy = 0;

    // 物理参数
    this.gravity = 0.55;
    this.jumpForce = -13.5;

    // 状态: 'idle' | 'running' | 'jumping' | 'falling' | 'dead'
    this.state = 'idle';
    this.onGround = true;
    this.jumpReady = true;   // 防止持续触发跳跃

    // 动画
    this.frame = 0;
    this.bounceY = 0;        // 跑步上下抖动
    this._bounceDir = 1;
    this.deathAngle = 0;     // 死亡旋转角
  }

  reset() {
    this.y = this.standingY;
    this.vy = 0;
    this.state = 'idle';
    this.onGround = true;
    this.jumpReady = true;
    this.frame = 0;
    this.bounceY = 0;
    this._bounceDir = 1;
    this.deathAngle = 0;
  }

  update(isActive, shouldJump) {
    if (this.state === 'dead') {
      this.deathAngle += 0.12;
      this.vy += this.gravity;
      this.y += this.vy;
      return;
    }

    // 跳跃触发
    if (shouldJump && this.onGround && this.jumpReady) {
      this.vy = this.jumpForce;
      this.onGround = false;
      this.state = 'jumping';
      this.jumpReady = false;
    }
    if (!shouldJump) this.jumpReady = true;

    // 重力
    this.vy += this.gravity;
    this.y += this.vy;

    // 空中状态
    if (!this.onGround) {
      this.state = this.vy < 0 ? 'jumping' : 'falling';
    }

    // 落地
    if (this.y >= this.standingY) {
      this.y = this.standingY;
      this.vy = 0;
      this.onGround = true;
      this.state = isActive ? 'running' : 'idle';
    }

    // 天花板
    const topLimit = 45 + this.radius;
    if (this.y < topLimit) {
      this.y = topLimit;
      this.vy = Math.abs(this.vy) * 0.2;
    }

    // 在地上时根据输入切换 idle/running
    if (this.onGround) {
      this.state = isActive ? 'running' : 'idle';
    }

    // 动画帧
    this.frame++;

    // 跑步弹跳
    if (this.state === 'running') {
      this.bounceY += 0.18 * this._bounceDir;
      if (Math.abs(this.bounceY) > 2.5) this._bounceDir *= -1;
    } else {
      this.bounceY *= 0.75;
    }
  }

  die() {
    this.state = 'dead';
    this.vy = -9;
  }

  /** 碰撞盒（比视觉稍小，容错） */
  hitbox() {
    const r = this.radius * 0.65;
    return { x: this.x - r, y: this.y - r, w: r * 2, h: r * 2 + this.legH * 0.4 };
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.x, this.y + this.bounceY);
    if (this.state === 'dead') ctx.rotate(this.deathAngle);
    this._drawShiba(ctx);
    ctx.restore();
  }

  // ── 绘制圆滚滚柴犬 ──────────────────────────────────────
  _drawShiba(ctx) {
    const R = this.radius;
    const f = this.frame;
    const s = this.state;

    // 姿态倾斜
    let tilt = 0;
    if (s === 'jumping') tilt = -0.22;
    else if (s === 'falling') tilt = 0.18;
    ctx.rotate(tilt);

    // === 卷尾巴（绘制在身体后面，左侧） ===
    ctx.save();
    ctx.strokeStyle = '#C87C0C';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-R + 4, -8);
    ctx.bezierCurveTo(-R - 28, -25, -R - 38, -58, -R - 8, -62);
    ctx.bezierCurveTo(-R + 12, -67, -R + 16, -50, -R - 2, -42);
    ctx.stroke();
    ctx.restore();

    // === 主身体（大橙色圆） ===
    ctx.fillStyle = '#E8930E';
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();

    // 身体高光（径向渐变）
    const bodyGrad = ctx.createRadialGradient(-9, -12, 4, 0, 0, R);
    bodyGrad.addColorStop(0, 'rgba(255, 220, 130, 0.45)');
    bodyGrad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();

    // === 白色肚皮（下方椭圆） ===
    ctx.fillStyle = '#F7EFE0';
    ctx.beginPath();
    ctx.ellipse(3, 18, 19, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // === 左耳（后侧，深色） ===
    ctx.fillStyle = '#C07808';
    ctx.beginPath();
    ctx.ellipse(-13, -R + 7, 9, 13, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // === 右耳（前侧，含内耳） ===
    ctx.fillStyle = '#D08A0C';
    ctx.beginPath();
    ctx.ellipse(10, -R + 4, 11, 15, 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F0C060';
    ctx.beginPath();
    ctx.ellipse(10, -R + 5, 6, 9, 0.32, 0, Math.PI * 2);
    ctx.fill();

    // === 白色脸部区域（右前方） ===
    ctx.fillStyle = '#F7EFE0';
    ctx.beginPath();
    ctx.ellipse(11, 2, 17, 20, 0.18, 0, Math.PI * 2);
    ctx.fill();

    // === 眼睛 ===
    // 眼白底（让眼睛看起来大一点）
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(15, -8, 7, 0, Math.PI * 2);
    ctx.fill();
    // 瞳孔
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(16, -7, 5, 0, Math.PI * 2);
    ctx.fill();
    // 高光
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(18, -9, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(14, -6, 1, 0, Math.PI * 2);
    ctx.fill();

    // === 鼻子 ===
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.ellipse(25, 3, 6, 5, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.ellipse(23, 1, 2.5, 1.8, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // === 嘴巴（可爱弧线） ===
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(21, 10);
    ctx.quadraticCurveTo(25, 14, 29, 10);
    ctx.stroke();

    // === 腮红 ===
    ctx.fillStyle = 'rgba(255, 120, 90, 0.22)';
    ctx.beginPath();
    ctx.ellipse(23, 11, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // === 腿 ===
    this._drawLegs(ctx, f, s);
  }

  _drawLegs(ctx, frame, state) {
    const R = this.radius;
    ctx.fillStyle = '#E8930E';

    let swing = 0;
    if (state === 'running') {
      swing = Math.sin(frame * 0.28) * 7;
    }

    // 跳跃时腿微微收起
    let baseY = R - 4;
    if (state === 'jumping') baseY = R - 14;
    else if (state === 'falling') baseY = R;

    // 四条短腿
    this._leg(ctx, -21, baseY + swing * 0.9);
    this._leg(ctx, -8,  baseY - swing * 0.9);
    this._leg(ctx, 5,   baseY - swing);
    this._leg(ctx, 18,  baseY + swing);
  }

  _leg(ctx, x, y) {
    const w = 11, h = this.legH, r = 4;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x,     y + h, x,     y + h - r, r);
    ctx.lineTo(x,     y + r);
    ctx.arcTo(x,     y,     x + r, y,         r);
    ctx.closePath();
    ctx.fill();
  }
}
