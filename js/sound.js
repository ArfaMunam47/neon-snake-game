/**
 * Sound placeholder — structured for future audio file integration.
 * Uses Web Audio API oscillators as lightweight stand-ins (no external files).
 */
export class SoundManager {
  constructor() {
    this.enabled = true;
    this._ctx = null;

    this.sounds = {
      eat: { freq: 880, duration: 0.08, type: "sine" },
      move: { freq: 220, duration: 0.02, type: "triangle", volume: 0.05 },
      gameOver: { freq: 180, duration: 0.4, type: "sawtooth", slide: -80 },
      victory: { freq: 523, duration: 0.6, type: "sine", arpeggio: [523, 659, 784] },
      pause: { freq: 440, duration: 0.06, type: "sine" },
      start: { freq: 330, duration: 0.12, type: "sine", slide: 100 },
    };
  }

  _getContext() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this._ctx;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  /**
   * Play a named sound effect.
   * Replace oscillator logic with `new Audio('assets/eat.mp3').play()` when files are added.
   */
  play(name) {
    if (!this.enabled || !this.sounds[name]) return;

    try {
      const config = this.sounds[name];

      if (config.arpeggio) {
        config.arpeggio.forEach((freq, i) => {
          setTimeout(() => this._beep({ ...config, freq, duration: 0.15, volume: 0.12 }), i * 100);
        });
        return;
      }

      this._beep(config);
    } catch {
      // Audio unavailable — silently ignore
    }
  }

  _beep({ freq, duration, type = "sine", volume = 0.1, slide = 0 }) {
    const ctx = this._getContext();
    if (ctx.state === "suspended") ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slide) {
      osc.frequency.linearRampToValueAtTime(freq + slide, ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }
}
