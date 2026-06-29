export const GRID_SIZE = 20;
export const TICK_MS = 130;
export const MAX_CELL_SIZE = 22;
export const MIN_CELL_SIZE = 14;

export const COLORS = {
  board: "#0a1020",
  gridLine: "rgba(255, 255, 255, 0.03)",
  snakeHead: "#00f5a0",
  snakeHeadGlow: "rgba(0, 245, 160, 0.6)",
  snakeBody: "#00c87a",
  snakeBodyGlow: "rgba(0, 200, 122, 0.35)",
  food: "#ff4d6d",
  foodGlow: "rgba(255, 77, 109, 0.65)",
  foodCore: "#ff8fa3",
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
    icon: "▶",
    title: "Ready to Play",
    message: "Press Start and guide the snake to glowing food. Avoid walls and yourself!",
    className: "",
  },
  paused: {
    icon: "❚❚",
    title: "Paused",
    message: "Take a breath. Press Resume or Space to continue.",
    className: "",
  },
  gameover: {
    icon: "✕",
    title: "Game Over",
    message: "The neon trail ends here. Can you beat your best score?",
    className: "overlay--gameover",
  },
  victory: {
    icon: "★",
    title: "Victory!",
    message: "You filled the entire board. Absolute snake mastery!",
    className: "overlay--victory",
  },
};

export const HIGH_SCORE_KEY = "neonSnakeHighScore";
export const FIRE_MODE_SCORE = 10;

export const FIRE_COLORS = {
  head: "#ff9a3c",
  headGlow: "rgba(255, 154, 60, 0.75)",
  body: "#ff6b35",
  bodyGlow: "rgba(255, 107, 53, 0.5)",
  trail: "#ff4d00",
};
