import { GRID_SIZE, TICK_MS, GAME_STATUS, FIRE_MODE_SCORE } from "./config.js";
import { Renderer } from "./renderer.js";
import { UIController } from "./ui.js";
import { InputController } from "./input.js";
import { SoundManager } from "./sound.js";
import { getHighScore, saveHighScore } from "./storage.js";

class SnakeGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.renderer = new Renderer(this.canvas);
    this.ui = new UIController();
    this.sound = new SoundManager();
    this.input = new InputController(
      (dir) => this.handleDirection(dir),
      () => this.togglePause()
    );

    this.status = GAME_STATUS.READY;
    this.lastTickTime = 0;
    this.previousSnake = null;
    this.rafId = null;

    this.state = this.createInitialState();
    this.spawnFood();
    this.bindUI();
    this.renderer.draw(this.state, null, 1, performance.now(), false);
    this.startLoop();
  }

  createInitialState() {
    const center = Math.floor(GRID_SIZE / 2);
    return {
      snake: [{ x: center, y: center }],
      direction: "right",
      nextDirection: "right",
      food: { x: 0, y: 0 },
      score: 0,
    };
  }

  isFireMode() {
    return this.state.score >= FIRE_MODE_SCORE;
  }

  bindUI() {
    this.ui.els.startBtn.addEventListener("click", () => {
      if (this.status === GAME_STATUS.PLAYING) return;

      if (this.status === GAME_STATUS.PAUSED) {
        this.resume();
      } else if (
        this.status === GAME_STATUS.GAME_OVER ||
        this.status === GAME_STATUS.VICTORY
      ) {
        this.reset();
        this.start();
      } else {
        this.start();
      }
    });

    this.ui.els.pauseBtn.addEventListener("click", () => this.togglePause());

    this.ui.els.restartBtn.addEventListener("click", () => {
      this.reset();
      this.ui.hideOverlay();
      this.ui.showOverlay("ready");
    });

    this.ui.els.soundToggle.addEventListener("click", () => {
      const enabled = this.sound.toggle();
      this.ui.setSoundEnabled(enabled);
      if (enabled) this.sound.play("start");
    });
  }

  isSamePosition(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  isOnSnake(position) {
    return this.state.snake.some((seg) => this.isSamePosition(seg, position));
  }

  spawnFood() {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (this.isOnSnake(newFood));
    this.state.food = newFood;
  }

  snapSnake() {
    return this.state.snake.map((s) => ({ x: s.x, y: s.y }));
  }

  /**
   * After the snake grows, extend previousSnake so it matches current length.
   * The new segment's prior position is the old tail cell (where it appeared).
   */
  padPreviousSnakeAfterGrowth() {
    if (!this.previousSnake) return;

    while (this.previousSnake.length < this.state.snake.length) {
      const tail = this.previousSnake[this.previousSnake.length - 1];
      this.previousSnake.push({ x: tail.x, y: tail.y });
    }
  }

  reset() {
    this.state = this.createInitialState();
    this.spawnFood();
    this.previousSnake = null;
    this.lastTickTime = 0;
    this.status = GAME_STATUS.READY;
    this.renderer.clearTrails();
    this.ui.setScore(0);
    this.ui.setFireMode(false);
    this.ui.setStatus(GAME_STATUS.READY);
    this.ui.updateButtons(GAME_STATUS.READY);
    this.ui.revealOverlay();
    this.ui.showOverlay("ready");
  }

  start() {
    this.status = GAME_STATUS.PLAYING;
    this.lastTickTime = performance.now();
    this.previousSnake = this.snapSnake();
    this.ui.hideOverlay();
    this.ui.setStatus(GAME_STATUS.PLAYING);
    this.ui.updateButtons(GAME_STATUS.PLAYING);
    this.sound.play("start");
  }

  togglePause() {
    if (this.status === GAME_STATUS.PLAYING) {
      this.status = GAME_STATUS.PAUSED;
      this.ui.setStatus(GAME_STATUS.PAUSED);
      this.ui.updateButtons(GAME_STATUS.PAUSED);
      this.ui.revealOverlay();
      this.ui.showOverlay("paused");
      this.sound.play("pause");
    } else if (this.status === GAME_STATUS.PAUSED) {
      this.resume();
    }
  }

  resume() {
    this.status = GAME_STATUS.PLAYING;
    this.lastTickTime = performance.now();
    this.previousSnake = this.snapSnake();
    this.ui.hideOverlay();
    this.ui.setStatus(GAME_STATUS.PLAYING);
    this.ui.updateButtons(GAME_STATUS.PLAYING);
    this.sound.play("start");
  }

  handleDirection(direction) {
    if (this.status !== GAME_STATUS.PLAYING) return;

    this.state.nextDirection = this.input.setDirection(
      this.state.direction,
      this.state.nextDirection,
      direction
    );
  }

  getNewHead() {
    const head = this.state.snake[0];
    const newHead = { x: head.x, y: head.y };

    switch (this.state.direction) {
      case "up": newHead.y -= 1; break;
      case "down": newHead.y += 1; break;
      case "left": newHead.x -= 1; break;
      case "right": newHead.x += 1; break;
      default: break;
    }

    return newHead;
  }

  isWallCollision(head) {
    return head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE;
  }

  /**
   * When the snake won't eat, the tail moves away — exclude it from collision.
   */
  isSelfCollision(head, willEat) {
    const body = willEat ? this.state.snake : this.state.snake.slice(0, -1);
    return body.some((seg) => this.isSamePosition(seg, head));
  }

  tick() {
    this.state.direction = this.state.nextDirection;
    const newHead = this.getNewHead();
    const willEat = this.isSamePosition(newHead, this.state.food);

    if (this.isWallCollision(newHead) || this.isSelfCollision(newHead, willEat)) {
      this.endGame(GAME_STATUS.GAME_OVER);
      return false;
    }

    const snakeLengthBefore = this.state.snake.length;
    this.state.snake.unshift(newHead);

    if (willEat) {
      this.state.score += 1;
      this.ui.setScore(this.state.score);
      this.ui.setFireMode(this.isFireMode());
      this.renderer.addEatEffect(this.state.food.x, this.state.food.y);
      this.sound.play("eat");

      if (this.state.snake.length >= GRID_SIZE * GRID_SIZE) {
        this.endGame(GAME_STATUS.VICTORY);
        return false;
      }

      this.spawnFood();
    } else {
      this.state.snake.pop();
    }

    if (this.state.snake.length > snakeLengthBefore) {
      this.padPreviousSnakeAfterGrowth();
    }

    return true;
  }

  endGame(status) {
    this.status = status;
    const best = saveHighScore(this.state.score);
    this.ui.setHighScore(Math.max(best, getHighScore()));

    this.ui.setStatus(status);
    this.ui.updateButtons(status);
    this.ui.revealOverlay();

    const overlayType = status === GAME_STATUS.VICTORY ? "victory" : "gameover";
    this.ui.showOverlay(overlayType, {
      score: this.state.score,
      highScore: this.ui.highScore,
    });

    this.sound.play(status === GAME_STATUS.VICTORY ? "victory" : "gameOver");
  }

  startLoop() {
    const loop = (timestamp) => {
      if (this.status === GAME_STATUS.PLAYING) {
        if (!this.lastTickTime) this.lastTickTime = timestamp;

        while (timestamp - this.lastTickTime >= TICK_MS) {
          this.previousSnake = this.snapSnake();
          const stillPlaying = this.tick();
          this.lastTickTime += TICK_MS;

          if (!stillPlaying || this.status !== GAME_STATUS.PLAYING) break;
        }
      }

      const progress =
        this.status === GAME_STATUS.PLAYING
          ? Math.min((timestamp - this.lastTickTime) / TICK_MS, 1)
          : 1;

      this.renderer.draw(
        this.state,
        this.previousSnake,
        progress,
        timestamp,
        this.isFireMode()
      );

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }
}

new SnakeGame();
