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
    this.accumulator = 0;
    this.lastFrameTime = 0;
    this.previousSnake = null;

    this.state = this.createInitialState();
    this.spawnFood();
    this.bindUI();
    this.renderer.draw(this.state, null, 0, performance.now(), false);
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
    this.ui.els.startBtn.addEventListener("click", () => this.handlePrimaryAction());
    this.ui.els.overlayBtn.addEventListener("click", () => this.handlePrimaryAction());
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

  handlePrimaryAction() {
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
  }

  isSamePosition(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  isOnSnake(position) {
    return this.state.snake.some((seg) => this.isSamePosition(seg, position));
  }

  spawnFood() {
    const maxCells = GRID_SIZE * GRID_SIZE;
    if (this.state.snake.length >= maxCells) return;

    let newFood;
    let attempts = 0;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      attempts += 1;
    } while (this.isOnSnake(newFood) && attempts < maxCells);

    this.state.food = newFood;
  }

  snapSnake() {
    return this.state.snake.map((s) => ({ x: s.x, y: s.y }));
  }

  /** Build a pre-step snapshot; extend it when the snake grows so interpolation never breaks. */
  extendSnapshotForGrowth(snapshot) {
    const tail = snapshot[snapshot.length - 1];
    snapshot.push({ x: tail.x, y: tail.y });
    return snapshot;
  }

  reset() {
    this.state = this.createInitialState();
    this.spawnFood();
    this.previousSnake = null;
    this.accumulator = 0;
    this.lastFrameTime = 0;
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
    this.accumulator = 0;
    this.lastFrameTime = 0;
    this.previousSnake = this.snapSnake();
    this.ui.hideOverlay();
    this.ui.setStatus(GAME_STATUS.PLAYING);
    this.ui.updateButtons(GAME_STATUS.PLAYING);
    this.sound.play("start");
  }

  togglePause() {
    if (this.status === GAME_STATUS.PLAYING) {
      this.status = GAME_STATUS.PAUSED;
      this.accumulator = 0;
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
    this.accumulator = 0;
    this.lastFrameTime = 0;
    this.previousSnake = this.snapSnake();
    this.ui.hideOverlay();
    this.ui.setStatus(GAME_STATUS.PLAYING);
    this.ui.updateButtons(GAME_STATUS.PLAYING);
    this.sound.play("start");
  }

  handleDirection(direction) {
    if (this.status !== GAME_STATUS.PLAYING) return;

    this.state.nextDirection = this.input.setDirection(
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

  isSelfCollision(head, willEat) {
    const body = willEat ? this.state.snake : this.state.snake.slice(0, -1);
    return body.some((seg) => this.isSamePosition(seg, head));
  }

  /**
   * Pure movement step — no DOM or audio side effects.
   * Returns false when the run should stop (game over / victory).
   */
  step() {
    this.state.direction = this.state.nextDirection;
    const newHead = this.getNewHead();
    const willEat = this.isSamePosition(newHead, this.state.food);

    if (this.isWallCollision(newHead) || this.isSelfCollision(newHead, willEat)) {
      this.endGame(GAME_STATUS.GAME_OVER);
      return false;
    }

    this.state.snake.unshift(newHead);

    if (willEat) {
      this.state.score += 1;
      const eatenFood = { x: this.state.food.x, y: this.state.food.y };

      if (this.state.snake.length >= GRID_SIZE * GRID_SIZE) {
        this.onFoodEaten(eatenFood);
        this.endGame(GAME_STATUS.VICTORY);
        return false;
      }

      this.spawnFood();
      this.onFoodEaten(eatenFood);
    } else {
      this.state.snake.pop();
    }

    return true;
  }

  /** Side effects decoupled from the simulation tick so layout/audio never block the loop. */
  onFoodEaten(food) {
    this.renderer.addEatEffect(food.x, food.y);
    this.sound.play("eat");

    requestAnimationFrame(() => {
      this.ui.setScore(this.state.score);
      this.ui.setFireMode(this.isFireMode());
    });
  }

  endGame(status) {
    this.status = status;
    this.accumulator = 0;
    const best = saveHighScore(this.state.score);
    this.ui.setHighScore(Math.max(best, getHighScore()));

    this.ui.setStatus(status);
    this.ui.updateButtons(status);
    this.ui.revealOverlay();
    this.ui.showOverlay(status === GAME_STATUS.VICTORY ? "victory" : "gameover", {
      score: this.state.score,
      highScore: this.ui.highScore,
    });

    this.sound.play(status === GAME_STATUS.VICTORY ? "victory" : "gameOver");
  }

  startLoop() {
    const loop = (timestamp) => {
      if (!this.lastFrameTime) this.lastFrameTime = timestamp;
      const frameDelta = Math.min(timestamp - this.lastFrameTime, 250);
      this.lastFrameTime = timestamp;

      if (this.status === GAME_STATUS.PLAYING) {
        this.accumulator += frameDelta;

        while (this.accumulator >= TICK_MS) {
          let snapshot = this.snapSnake();
          const lengthBefore = this.state.snake.length;
          const stillPlaying = this.step();

          if (this.state.snake.length > lengthBefore) {
            snapshot = this.extendSnapshotForGrowth(snapshot);
          }

          this.previousSnake = snapshot;
          this.accumulator -= TICK_MS;

          if (!stillPlaying || this.status !== GAME_STATUS.PLAYING) break;
        }
      } else {
        this.accumulator = 0;
      }

      const progress =
        this.status === GAME_STATUS.PLAYING
          ? Math.min(this.accumulator / TICK_MS, 1)
          : 1;

      this.renderer.draw(
        this.state,
        this.previousSnake,
        progress,
        timestamp,
        this.isFireMode()
      );

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

new SnakeGame();
