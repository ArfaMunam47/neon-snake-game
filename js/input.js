import { KEY_DIRECTIONS, OPPOSITE } from "./config.js";

export class InputController {
  constructor(onDirection, onPause) {
    this.onDirection = onDirection;
    this.onPause = onPause;
    this._boundKeyDown = this._handleKeyDown.bind(this);
    document.addEventListener("keydown", this._boundKeyDown);
    this._bindTouchControls();
  }

  _bindTouchControls() {
    document.querySelectorAll(".touch-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const direction = btn.dataset.direction;
        if (direction) this.onDirection(direction);
      });
    });
  }

  _handleKeyDown(event) {
    if (event.code === "Space") {
      event.preventDefault();
      this.onPause();
      return;
    }

    const direction = KEY_DIRECTIONS[event.key];
    if (!direction) return;

    event.preventDefault();
    this.onDirection(direction);
  }

  setDirection(currentDirection, nextDirection, newDirection) {
    if (OPPOSITE[currentDirection] !== newDirection) {
      return newDirection;
    }
    return nextDirection;
  }

  destroy() {
    document.removeEventListener("keydown", this._boundKeyDown);
  }
}
