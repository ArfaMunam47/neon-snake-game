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
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.effects.push({
        x: x * this.cellSize + this.cellSize / 2,
        y: y * this.cellSize + this.cellSize / 2,
        vx: Math.cos(angle) * 2.5,
        vy: Math.sin(angle) * 2.5,
        life: 1,
        color: i % 2 === 0 ? COLORS.food : COLORS.snakeHead,
      });
    }
  }

  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Interpolate every segment, padding missing previous positions when the snake grows.
   */
  _interpolateSnake(current, previous, progress) {
    if (!previous || previous.length === 0) {
      return current.map((seg) => ({ x: seg.x, y: seg.y }));
    }

    return current.map((seg, i) => {
      const prev = previous[i] ?? previous[previous.length - 1] ?? seg;
      return {
        x: this._lerp(prev.x, seg.x, progress),
        y: this._lerp(prev.y, seg.y, progress),
      };
    });
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
    const r = size * 0.28;

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

  _spawnTrailParticle(x, y, timestamp) {
    this.trailParticles.push({
      x: x * this.cellSize + this.cellSize / 2 + (Math.random() - 0.5) * 4,
      y: y * this.cellSize + this.cellSize / 2 + (Math.random() - 0.5) * 4,
      life: 1,
      size: 2 + Math.random() * 3,
    });

    if (this.trailParticles.length > 40) {
      this.trailParticles.shift();
    }
  }

  _drawTrailParticles() {
    this.trailParticles = this.trailParticles.filter((p) => p.life > 0);

    this.trailParticles.forEach((p) => {
      p.life -= 0.035;

      this.ctx.save();
      this.ctx.globalAlpha = p.life * 0.7;
      this.ctx.fillStyle = FIRE_COLORS.trail;
      this.ctx.shadowColor = FIRE_COLORS.bodyGlow;
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  _drawSnake(segments, fireMode) {
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
          fireMode ? 20 : 14
        );

        const cx = px + this.cellSize / 2;
        const cy = py + this.cellSize / 2;
        const eyeOffset = this.cellSize * 0.18;
        this.ctx.fillStyle = "#070b14";
        this.ctx.beginPath();
        this.ctx.arc(cx - eyeOffset, cy - eyeOffset * 0.5, 2, 0, Math.PI * 2);
        this.ctx.arc(cx + eyeOffset, cy - eyeOffset * 0.5, 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        const fade = 1 - (index / segments.length) * 0.35;
        const bodyColor = fireMode
          ? `rgba(255, 107, 53, ${fade})`
          : `rgba(0, 200, 122, ${fade})`;
        this._drawRoundedCell(
          px, py, this.cellSize,
          bodyColor,
          colors.snakeBodyGlow ?? colors.bodyGlow,
          fireMode ? 10 : 6
        );
      }
    });
  }

  _drawFood(food, timestamp) {
    const pulse = 0.85 + Math.sin(timestamp / 200) * 0.15;
    const cx = food.x * this.cellSize + this.cellSize / 2;
    const cy = food.y * this.cellSize + this.cellSize / 2;
    const baseRadius = (this.cellSize / 2 - 3) * pulse;

    const { ctx } = this;

    ctx.save();
    ctx.shadowColor = COLORS.foodGlow;
    ctx.shadowBlur = 18 * pulse;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius);
    gradient.addColorStop(0, COLORS.foodCore);
    gradient.addColorStop(0.6, COLORS.food);
    gradient.addColorStop(1, "rgba(255, 77, 109, 0.2)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawEffects() {
    this.effects = this.effects.filter((fx) => fx.life > 0);

    this.effects.forEach((fx) => {
      fx.x += fx.vx;
      fx.y += fx.vy;
      fx.life -= 0.04;

      this.ctx.save();
      this.ctx.globalAlpha = fx.life;
      this.ctx.fillStyle = fx.color || COLORS.food;
      this.ctx.shadowColor = fx.color || COLORS.foodGlow;
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(fx.x, fx.y, 3 * fx.life, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  draw(state, previousSnake, progress, timestamp, fireMode = false) {
    const { ctx, canvas } = this;

    ctx.fillStyle = COLORS.board;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this._drawGrid();

    const interpolated = this._interpolateSnake(state.snake, previousSnake, progress);

    if (fireMode && interpolated.length > 0) {
      const tail = interpolated[interpolated.length - 1];
      this._spawnTrailParticle(tail.x, tail.y, timestamp);
      this._drawTrailParticles();
    }

    this._drawSnake(interpolated, fireMode);
    this._drawFood(state.food, timestamp);
    this._drawEffects();
  }
}
