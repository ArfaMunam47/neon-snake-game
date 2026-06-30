import { GRID_SIZE, COLORS, MIN_CELL_SIZE, MAX_CELL_SIZE, FIRE_COLORS } from "./config.js";

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.cellSize = 20;
    this.effects = [];
    this.trailParticles = [];
    this._resize();
    window.addEventListener("resize", () => this._resize());
  }

  _resize() {
    const wrapper = this.canvas.parentElement;
    const available = wrapper.clientWidth;
    this.cellSize = Math.floor(
      Math.min(Math.max(available / GRID_SIZE, MIN_CELL_SIZE), MAX_CELL_SIZE)
    );
    const size = this.cellSize * GRID_SIZE;
    this.canvas.width = size;
    this.canvas.height = size;
  }

  clearTrails() {
    this.trailParticles = [];
    this.effects = [];
  }

  addEatEffect(x, y) {
    const cx = x * this.cellSize + this.cellSize / 2;
    const cy = y * this.cellSize + this.cellSize / 2;

    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      this.effects.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        life: 1,
        color: i % 3 === 0 ? COLORS.food : i % 3 === 1 ? COLORS.snakeHead : "#c084fc",
      });
    }
  }

  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  _interpolateSnake(current, previous, progress) {
    if (!previous?.length) {
      return current.map((seg) => ({ x: seg.x, y: seg.y }));
    }

    const t = Math.max(0, Math.min(1, progress));

    return current.map((seg, i) => {
      const prev = previous[i] ?? previous[previous.length - 1] ?? seg;
      return {
        x: this._lerp(prev.x, seg.x, t),
        y: this._lerp(prev.y, seg.y, t),
      };
    });
  }

  _drawBoardBackground() {
    const { ctx, canvas } = this;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#0a1020");
    gradient.addColorStop(0.5, COLORS.board);
    gradient.addColorStop(1, "#0f0820");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  _drawGrid() {
    const { ctx, cellSize } = this;
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;

    for (let i = 0; i <= GRID_SIZE; i++) {
      const pos = i * cellSize + 0.5;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, this.canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(this.canvas.width, pos);
      ctx.stroke();
    }
  }

  _drawRoundedCell(px, py, size, color, glowColor, glowBlur) {
    const { ctx } = this;
    const pad = 1.5;
    const r = size * 0.32;

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowBlur;
    ctx.fillStyle = color;

    const x = px + pad;
    const y = py + pad;
    const w = size - pad * 2;
    const h = size - pad * 2;

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.restore();
  }

  _spawnTrailParticle(x, y) {
    this.trailParticles.push({
      x: x * this.cellSize + this.cellSize / 2 + (Math.random() - 0.5) * 5,
      y: y * this.cellSize + this.cellSize / 2 + (Math.random() - 0.5) * 5,
      life: 1,
      size: 2 + Math.random() * 4,
    });

    if (this.trailParticles.length > 50) {
      this.trailParticles.shift();
    }
  }

  _drawTrailParticles() {
    const remaining = [];
  
    this.trailParticles.forEach((p) => {
      p.life -= 0.03;
  
      if (p.life <= 0) return;
  
      remaining.push(p);
  
      this.ctx.save();
      this.ctx.globalAlpha = p.life * 0.75;
      this.ctx.fillStyle = FIRE_COLORS.trail;
      this.ctx.shadowColor = FIRE_COLORS.bodyGlow;
      this.ctx.shadowBlur = 12;
  
      this.ctx.beginPath();
      this.ctx.arc(
        p.x,
        p.y,
        Math.max(0.1, p.size * p.life),
        0,
        Math.PI * 2
      );
  
      this.ctx.fill();
      this.ctx.restore();
    });
  
    this.trailParticles = remaining;
  }
  _drawSnake(segments, fireMode, direction) {
    const colors = fireMode ? FIRE_COLORS : COLORS;

    segments.forEach((seg, index) => {
      const px = seg.x * this.cellSize;
      const py = seg.y * this.cellSize;
      const isHead = index === 0;

      if (isHead) {
        this._drawRoundedCell(
          px, py, this.cellSize,
          colors.snakeHead ?? colors.head,
          colors.snakeHeadGlow ?? colors.headGlow,
          fireMode ? 22 : 16
        );

        const cx = px + this.cellSize / 2;
        const cy = py + this.cellSize / 2;
        const eyeOffset = this.cellSize * 0.16;
        let ex1 = cx - eyeOffset;
        let ex2 = cx + eyeOffset;
        let ey = cy - eyeOffset * 0.4;

        if (direction === "left") { ex1 -= 2; ex2 -= 2; }
        if (direction === "right") { ex1 += 2; ex2 += 2; }
        if (direction === "up") { ey -= 2; }
        if (direction === "down") { ey += 2; }

        this.ctx.fillStyle = "#070b14";
        this.ctx.beginPath();
        this.ctx.arc(ex1, ey, 2.2, 0, Math.PI * 2);
        this.ctx.arc(ex2, ey, 2.2, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        const fade = 1 - (index / segments.length) * 0.4;
        const bodyColor = fireMode
          ? `rgba(255, 107, 53, ${fade})`
          : `rgba(0, 210, 160, ${fade})`;
        this._drawRoundedCell(
          px, py, this.cellSize,
          bodyColor,
          colors.snakeBodyGlow ?? colors.bodyGlow,
          fireMode ? 12 : 8
        );
      }
    });
  }

  _drawFood(food, timestamp) {
    const pulse = 0.82 + Math.sin(timestamp / 180) * 0.18;
    const cx = food.x * this.cellSize + this.cellSize / 2;
    const cy = food.y * this.cellSize + this.cellSize / 2;
    const outerRadius = (this.cellSize / 2 - 1) * pulse;
    const innerRadius = outerRadius * 0.55;

    const { ctx } = this;

    ctx.save();
    ctx.shadowColor = COLORS.foodGlow;
    ctx.shadowBlur = 22 * pulse;

    ctx.strokeStyle = COLORS.foodRing;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius + 2, 0, Math.PI * 2);
    ctx.stroke();

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerRadius);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.25, COLORS.foodCore);
    gradient.addColorStop(0.65, COLORS.food);
    gradient.addColorStop(1, "rgba(255, 61, 138, 0.15)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(cx - innerRadius * 0.25, cy - innerRadius * 0.25, innerRadius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawEffects() {
    const remaining = [];
  
    this.effects.forEach((fx) => {
      fx.x += fx.vx;
      fx.y += fx.vy;
  
      fx.life -= 0.035;
      fx.vx *= 0.96;
      fx.vy *= 0.96;
  
      // Remove expired particles BEFORE drawing
      if (fx.life <= 0) return;
  
      remaining.push(fx);
  
      this.ctx.save();
      this.ctx.globalAlpha = fx.life;
      this.ctx.fillStyle = fx.color || COLORS.food;
      this.ctx.shadowColor = fx.color || COLORS.foodGlow;
      this.ctx.shadowBlur = 10;
  
      this.ctx.beginPath();
      this.ctx.arc(
        fx.x,
        fx.y,
        Math.max(0.1, 3.5 * fx.life),
        0,
        Math.PI * 2
      );
  
      this.ctx.fill();
      this.ctx.restore();
    });
  
    this.effects = remaining;
  }
  draw(state, previousSnake, progress, timestamp, fireMode = false) {
    this._drawBoardBackground();
    this._drawGrid();

    const interpolated = this._interpolateSnake(state.snake, previousSnake, progress);

    if (fireMode && interpolated.length > 0) {
      const tail = interpolated[interpolated.length - 1];
      this._spawnTrailParticle(tail.x, tail.y);
      this._drawTrailParticles();
    }

    this._drawSnake(interpolated, fireMode, state.direction);
    this._drawFood(state.food, timestamp);
    this._drawEffects();
  }
}
