/**
 * Tactile Chalkboard Audio Synthesizer
 * Uses Web Audio API to procedurally synthesize chalk friction, chalk taps, eraser wipes,
 * and snap sounds in real-time with zero external audio assets.
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setChalkSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isChalkSoundEnabled(): boolean {
  return soundEnabled;
}

/**
 * Play a gentle procedural chalk tap/touch sound
 */
export function playChalkTap(pressure: number = 0.5) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(600 + Math.random() * 400, now);
    filter.Q.setValueAtTime(4, now);

    osc.type = "triangle";
    osc.frequency.setValueAtTime(220 + pressure * 180, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

    gain.gain.setValueAtTime(0.08 * pressure, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch (err) {
    // Ignore audio playback errors if user hasn't interacted
  }
}

/**
 * Play continuous gentle chalk friction scrape
 */
let lastScrapeTime = 0;
export function playChalkFriction(speed: number = 1.0, pressure: number = 0.5) {
  if (!soundEnabled) return;
  const nowMs = performance.now();
  if (nowMs - lastScrapeTime < 60) return; // throttle
  lastScrapeTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // White noise burst through high-pass filter
    const bufferSize = ctx.sampleRate * 0.04;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400 + speed * 300, now);
    filter.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    const volume = Math.min(0.06, 0.02 + pressure * 0.04);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.04);
  } catch (err) {}
}

/**
 * Play eraser swipe soft woosh sound
 */
export function playEraserSwipe(speed: number = 10) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = Math.max(0.04, Math.min(0.12, 0.05 + speed * 0.002));
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + duration);

    const gain = ctx.createGain();
    const vol = Math.min(0.08, 0.03 + (speed / 50) * 0.04);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  } catch (err) {}
}

/**
 * Play Smart Pen shape snap chime
 */
export function playShapeSnapChime() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C Major chord
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);

      gain.gain.setValueAtTime(0.04, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.03 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.25);
    });
  } catch (err) {}
}
