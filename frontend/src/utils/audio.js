// Synthesized pleasant hospital chime using Web Audio API
// Guarantees reliable audio chime without external file dependencies

class SoundEffects {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Two-tone airport / hospital chime for patient call
  playCallChime() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // First tone (higher note)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Second tone (lower note)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(440, now + 0.25); // A4
      gain2.gain.setValueAtTime(0.25, now + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 0.9);

      // Third tone (resolving chord)
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(659.25, now + 0.5); // E5
      gain3.gain.setValueAtTime(0.28, now + 0.5);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc3.connect(gain3);
      gain3.connect(this.ctx.destination);
      osc3.start(now + 0.5);
      osc3.stop(now + 1.2);
    } catch (e) {
      console.warn("Audio playback not allowed yet without user interaction:", e);
    }
  }

  // Subtle pleasant notification beep
  playNotice() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      // ignore
    }
  }

  // Mobile vibration helper
  vibrate(pattern = [300, 150, 300]) {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // ignore
      }
    }
  }
}

export const sounds = new SoundEffects();

