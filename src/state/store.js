import { TRACK_DEFAULTS, KEY_NAMES } from '../utils/constants.js';
import { makePat, makeNoteGrid } from '../utils/helpers.js';
import { emit } from './events.js';

// ==================== TRACKS ====================
export const TRACKS = TRACK_DEFAULTS.map(d => ({
  ...d,
  steps: 16,
  patterns: Array.from({ length: 8 }, () => makePat(16)),
  pats: Array.from({ length: 8 }, (_, i) => i === 0),
  vol: d.vol,
  muted: false,
  soloed: false,
  noteGrid: makeNoteGrid(16),
  sp: {
    wave: d.wave, cutoff: 800, res: 5,
    atk: 5, dec: 200, sus: 60, rel: 300,
    envmod: 40, detune: 0,
  },
}));

// ==================== FX STATE ====================
export const FX = {
  dist: true, rev: true, dly: true,
  cho: false, bit: false, pha: false,
  distAmt: 25, revSz: 30, revMix: 25,
  dlyT: 250, dlyFb: 40,
  compThr: -12, compRat: 4,
};

// ==================== LFO STATE ====================
export const LP = { rate: 2, depth: 30, wave: 'sine', target: 'cutoff' };

// ==================== SIDECHAIN STATE ====================
export const SC = { on: true, amt: 70, atk: 5, rel: 120 };

// ==================== TRANSPORT & UI STATE ====================
export const state = {
  isPlaying: false,
  isRec: false,
  bpm: 135,
  swingAmt: 0,
  masterVolume: 0.8,
  currentStep: 0,
  currentSteps: 16,
  selectedTrack: 0,
  selectedPat: 0,
  scaleLock: true,
  glideOn: false,
  keyIdx: 0,
  currentKey: 'Am',
};

// ==================== SETTERS ====================
export function setBpm(v) {
  state.bpm = Math.max(60, Math.min(220, Math.round(v)));
  emit('bpm-changed', state.bpm);
}

export function setSwing(v) {
  state.swingAmt = +v;
}

export function setMasterVolume(v) {
  state.masterVolume = v / 100;
  emit('master-volume-changed', state.masterVolume);
}

export function setSelectedTrack(ti) {
  state.selectedTrack = ti;
  emit('track-selected', ti);
}

export function setCurrentSteps(n) {
  state.currentSteps = n;
  TRACKS.forEach(t => {
    t.steps = n;
    t.patterns.forEach(p => {
      while (p.acts.length < n) { p.acts.push(false); p.vels.push(0.8); p.probs.push(1); }
    });
    while (t.noteGrid.length < n) {
      t.noteGrid.push({ note: 0, octave: 3, on: false, vel: 0.8, len: 1 });
    }
  });
  emit('steps-changed', n);
}

export function cycleKey() {
  state.keyIdx = (state.keyIdx + 1) % KEY_NAMES.length;
  state.currentKey = KEY_NAMES[state.keyIdx];
  emit('key-changed', state.currentKey);
}

export function togglePlay() {
  state.isPlaying = !state.isPlaying;
  emit('transport-changed', { isPlaying: state.isPlaying });
}

export function stopPlayback() {
  state.isPlaying = false;
  state.currentStep = 0;
  emit('transport-changed', { isPlaying: false, stopped: true });
}

export function toggleRec() {
  state.isRec = !state.isRec;
  emit('rec-changed', state.isRec);
}

export function toggleScaleLock() {
  state.scaleLock = !state.scaleLock;
  emit('scale-lock-changed', state.scaleLock);
}

export function toggleGlide() {
  state.glideOn = !state.glideOn;
  emit('glide-changed', state.glideOn);
}
