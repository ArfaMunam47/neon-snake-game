import { GAME_STATUS, OVERLAY_CONTENT } from "./config.js";
import { getHighScore } from "./storage.js";

export class UIController {
  constructor() {
    this.els = {
      score: document.getElementById("score"),
      highScore: document.getElementById("highScore"),
      gameStatus: document.getElementById("gameStatus"),
      overlay: document.getElementById("overlay"),
      overlayIcon: document.getElementById("overlayIcon"),
      overlayTitle: document.getElementById("overlayTitle"),
      overlayMessage: document.getElementById("overlayMessage"),
      overlayScore: document.getElementById("overlayScore"),
      startBtn: document.getElementById("startBtn"),
      pauseBtn: document.getElementById("pauseBtn"),
      restartBtn: document.getElementById("restartBtn"),
      soundToggle: document.getElementById("soundToggle"),
      scoreCard: document.getElementById("scoreCard"),
      fireModeIcon: document.getElementById("fireModeIcon"),
    };

    this.highScore = getHighScore();
    this.els.highScore.textContent = String(this.highScore);
    this.setStatus(GAME_STATUS.READY);
    this.showOverlay("ready");
  }

  setScore(score) {
    this.els.score.textContent = String(score);

    if (!this.els.scoreCard) return;

    this.els.scoreCard.classList.remove("score-pop");
    void this.els.scoreCard.offsetWidth;
    this.els.scoreCard.classList.add("score-pop");
  }

  setFireMode(active) {
    if (!this.els.fireModeIcon) return;
    this.els.fireModeIcon.classList.toggle("hidden", !active);
  }

  setHighScore(score) {
    this.highScore = score;
    this.els.highScore.textContent = String(score);
  }

  setStatus(status) {
    const labels = {
      [GAME_STATUS.READY]: "Ready",
      [GAME_STATUS.PLAYING]: "Playing",
      [GAME_STATUS.PAUSED]: "Paused",
      [GAME_STATUS.GAME_OVER]: "Game Over",
      [GAME_STATUS.VICTORY]: "Victory",
    };

    const el = this.els.gameStatus;
    el.textContent = labels[status] || status;
    el.classList.toggle("is-danger", status === GAME_STATUS.GAME_OVER);
    el.classList.toggle("is-gold", status === GAME_STATUS.VICTORY);
  }

  showOverlay(type, extra = {}) {
    const content = OVERLAY_CONTENT[type];
    if (!content) return;

    this.els.overlay.className = "overlay";
    if (content.className) {
      this.els.overlay.classList.add(content.className);
    }

    this.els.overlayIcon.textContent = content.icon;
    this.els.overlayTitle.textContent = content.title;
    this.els.overlayMessage.textContent = content.message;

    if (extra.score !== undefined) {
      this.els.overlayScore.textContent = `Final Score: ${extra.score}`;
      this.els.overlayScore.classList.remove("hidden");
    } else {
      this.els.overlayScore.classList.add("hidden");
    }

    if (extra.highScore !== undefined && extra.highScore > 0) {
      this.els.overlayScore.textContent += ` · Best: ${extra.highScore}`;
    }
  }

  hideOverlay() {
    this.els.overlay.classList.add("overlay--hidden");
  }

  revealOverlay() {
    this.els.overlay.classList.remove("overlay--hidden");
  }

  updateButtons(status) {
    const { startBtn, pauseBtn, restartBtn } = this.els;

    switch (status) {
      case GAME_STATUS.READY:
        startBtn.disabled = false;
        startBtn.innerHTML = '<span class="btn-icon" aria-hidden="true">▶</span> Start';
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '<span class="btn-icon" aria-hidden="true">❚❚</span> Pause';
        break;

      case GAME_STATUS.PLAYING:
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        pauseBtn.innerHTML = '<span class="btn-icon" aria-hidden="true">❚❚</span> Pause';
        restartBtn.disabled = false;
        break;

      case GAME_STATUS.PAUSED:
        startBtn.disabled = false;
        startBtn.innerHTML = '<span class="btn-icon" aria-hidden="true">▶</span> Resume';
        pauseBtn.disabled = true;
        break;

      case GAME_STATUS.GAME_OVER:
      case GAME_STATUS.VICTORY:
        startBtn.disabled = false;
        startBtn.innerHTML = '<span class="btn-icon" aria-hidden="true">▶</span> Play Again';
        pauseBtn.disabled = true;
        restartBtn.disabled = false;
        break;

      default:
        break;
    }
  }

  setSoundEnabled(enabled) {
    this.els.soundToggle.setAttribute("aria-pressed", String(enabled));
    this.els.soundToggle.querySelector(".sound-on").classList.toggle("hidden", !enabled);
    this.els.soundToggle.querySelector(".sound-off").classList.toggle("hidden", enabled);
  }
}
