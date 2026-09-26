// =========================================================================
// MAGI SUPERCOMPUTER // WEB AUDIO SYNTHESIZER
// 90s NERV Terminal Electronic Beeps & Acoustic Teletext Sound Design
// Zero External Audio File Dependencies (Pure Web Audio API)
// =========================================================================
import { STORAGE_KEYS } from '../core/constants.js';
import { state } from '../core/state.js';

let audioCtx = null;
let audioToggleBtnRef = null;

export function isAudioEnabled() {
  return state.ui.audioEnabled;
}

export function setAudioEnabled(enabled) {
  state.ui.audioEnabled = !!enabled;
  localStorage.setItem(STORAGE_KEYS.AUDIO_ENABLED, enabled ? 'true' : 'false');
  updateAudioButtonUI();
}

export function toggleAudio(labelOn = 'AUDIO: ON', labelOff = 'AUDIO: OFF') {
  setAudioEnabled(!state.ui.audioEnabled);
  updateAudioButtonUI(labelOn, labelOff);
  if (state.ui.audioEnabled) {
    ensureAudioContext();
    playBeep(660, 0.06, 'triangle');
  }
}

export function updateAudioButtonUI(labelOn = 'AUDIO: ON', labelOff = 'AUDIO: OFF') {
  if (!audioToggleBtnRef) return;
  if (state.ui.audioEnabled) {
    audioToggleBtnRef.textContent = labelOn;
    audioToggleBtnRef.classList.add('active');
  } else {
    audioToggleBtnRef.textContent = labelOff;
    audioToggleBtnRef.classList.remove('active');
  }
}

export function ensureAudioContext() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch {
    // AudioContext unsupported or blocked
  }
}

export function playBeep(freq = 880, duration = 0.04, type = 'sine') {
  if (!state.ui.audioEnabled) return;
  try {
    ensureAudioContext();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // AudioContext error suppressed
  }
}

// Authentic 90s NERV Terminal "Beep-Beep-Beep" Electronic Triplet
export function playNervTripletBeep(type = 'approve') {
  if (!state.ui.audioEnabled) return;
  try {
    ensureAudioContext();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    // Vintage 90s Supercomputer Electronic Frequencies
    let freqs = [1860, 2340, 2780]; // Affirmative ascending high-tech computer burst
    let wave = 'square';
    let peakGain = 0.040;

    if (type === 'reject') {
      freqs = [620, 480, 370];       // Low alert electronic dissonance burst
      wave = 'sawtooth';
      peakGain = 0.050;
    } else if (type === 'conditional') {
      freqs = [1400, 1180, 1620];     // Amber analytical tones
      wave = 'square';
      peakGain = 0.035;
    } else if (type === 'processing') {
      freqs = [2200, 2600];          // Soft teletext calculation blips
      wave = 'sine';
      peakGain = 0.012;
    }

    freqs.forEach((freq, i) => {
      const startTime = now + (i * 0.045);
      const duration = 0.028;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      // 90s CRT / terminal speaker acoustic emulation (3.6kHz lowpass cutoff)
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3600, startTime);

      osc.type = wave;
      osc.frequency.setValueAtTime(freq, startTime);

      // Crisp staccato envelope: instantaneous attack with rapid decay
      gain.gain.setValueAtTime(peakGain, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.005);
    });
  } catch {
    // AudioContext error suppressed
  }
}

export function playConsensusChime() {
  if (!state.ui.audioEnabled) return;
  playBeep(523, 0.08, 'triangle'); // C5
  setTimeout(() => playBeep(659, 0.12, 'triangle'), 80); // E5
}

export function playImpasseAlarm() {
  if (!state.ui.audioEnabled) return;
  playBeep(260, 0.12, 'sawtooth');
  setTimeout(() => playBeep(220, 0.20, 'sawtooth'), 120);
}

export function initAudio(toggleBtnElement, getTranslations) {
  audioToggleBtnRef = toggleBtnElement;

  // Browser Autoplay Policy: Unlock AudioContext on first user interaction anywhere
  window.addEventListener('click', ensureAudioContext, { once: true });
  window.addEventListener('keydown', ensureAudioContext, { once: true });

  if (audioToggleBtnRef) {
    const t = typeof getTranslations === 'function' ? getTranslations() : null;
    updateAudioButtonUI(t?.audio_on, t?.audio_off);

    audioToggleBtnRef.addEventListener('click', () => {
      const currentT = typeof getTranslations === 'function' ? getTranslations() : null;
      toggleAudio(currentT?.audio_on, currentT?.audio_off);
    });
  }
}
