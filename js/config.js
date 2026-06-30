export const GRID_SIZE = 20;
export const TICK_MS = 130;
export const MAX_CELL_SIZE = 22;
export const MIN_CELL_SIZE = 14;

export const COLORS = {
  board: "#080d1a",
  gridLine: "rgba(147, 112, 255, 0.06)",
  snakeHead: "#00ffc8",
  snakeHeadGlow: "rgba(0, 255, 200, 0.75)",
  snakeBody: "#00c896",
  snakeBodyGlow: "rgba(0, 200, 150, 0.45)",
  food: "#ff3d8a",
  foodGlow: "rgba(255, 61, 138, 0.75)",
  foodCore: "#ff8fc7",
  foodRing: "rgba(255, 140, 200, 0.35)",
};

export const OPPOSITE = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export const KEY_DIRECTIONS = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  W: "up",
  s: "down",
  S: "down",
  a: "left",
  A: "left",
  d: "right",
  D: "right",
};

export const GAME_STATUS = {
  READY: "ready",
  PLAYING: "playing",
  PAUSED: "paused",
  GAME_OVER: "gameover",
  VICTORY: "victory",
};

export const OVERLAY_CONTENT = {
  ready: {
    icon: "🐍",
    title: "Ready to Slither",
    message: "Collect glowing orbs, grow long, and chase your high score. Arrow keys or touch to move.",
    className: "overlay--ready",
    btnLabel: "Start Game",
  },
  paused: {
    icon: "⏸",
    title: "Game Paused",
    message: "Catch your breath — press Resume or Space to keep going.",
    className: "overlay--paused",
    btnLabel: "Resume",
  },
  gameover: {
    icon: "💀",
    title: "Game Over",
    message: "Your neon trail ends here. Think you can beat your best?",
    className: "overlay--gameover",
    btnLabel: "Play Again",
  },
  victory: {
    icon: "👑",
    title: "Victory!",
    message: "You conquered the entire grid. Absolute snake legend.",
    className: "overlay--victory",
    btnLabel: "Play Again",
  },
};

export const HIGH_SCORE_KEY = "neonSnakeHighScore";
export const FIRE_MODE_SCORE = 10;

export const FIRE_COLORS = {
  head: "#ffb347",
  headGlow: "rgba(255, 179, 71, 0.85)",
  body: "#ff6b35",
  bodyGlow: "rgba(255, 107, 53, 0.6)",
  trail: "#ff4500",
};
