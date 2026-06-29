import { HIGH_SCORE_KEY } from "./config.js";

export function getHighScore() {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score) {
  try {
    const current = getHighScore();
    if (score > current) {
      localStorage.setItem(HIGH_SCORE_KEY, String(score));
      return score;
    }
    return current;
  } catch {
    return score;
  }
}
