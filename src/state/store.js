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
  kickPreset: d.wave === 'kick' ? 0 : undefined,
  clapPreset: d.wave === 'clap' ? 0 : undefined,
  hatPreset: (d.wave === 'hat' || d.wave === 'openhat') ? 0 : undefined,
  sendRev: true,
  sendDly: true,
  sendSc: d.wave === 'sawtooth' && (d.name === 'BASSLINE' || d.name === 'ACID'),
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
  distAmt: 25, distTone: 80, revSz: 30, revMix: 25,
  dlyT: 250, dlyFb: 40, dlyDamp: 70,
  choRate: 1.5, choDepth: 40, choMix: 50,
  bitDepth: 8, bitRate: 50,
  phaRate: 0.5, phaDepth: 60, phaFb: 40,
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

// ==================== SAVE / LOAD ====================
export function exportProject() {
  return {
    tracks: TRACKS.map(t => ({
      name: t.name, vol: t.vol, muted: t.muted, soloed: t.soloed,
      kickPreset: t.kickPreset, sendRev: t.sendRev, sendDly: t.sendDly, sendSc: t.sendSc,
      sp: { ...t.sp },
      patterns: t.patterns.map(p => ({
        acts: [...p.acts], vels: [...p.vels], probs: [...p.probs],
      })),
      pats: [...t.pats],
      noteGrid: t.noteGrid.map(n => ({ ...n })),
    })),
    fx: { ...FX },
    lp: { ...LP },
    sc: { ...SC },
    state: {
      bpm: state.bpm, swingAmt: state.swingAmt, masterVolume: state.masterVolume,
      currentSteps: state.currentSteps, scaleLock: state.scaleLock,
      glideOn: state.glideOn, keyIdx: state.keyIdx, currentKey: state.currentKey,
    },
  };
}

export function importProject(data) {
  if (!data) return;
  // Tracks
  if (data.tracks) {
    data.tracks.forEach((td, ti) => {
      if (!TRACKS[ti]) return;
      const t = TRACKS[ti];
      if (td.vol !== undefined) t.vol = td.vol;
      if (td.muted !== undefined) t.muted = td.muted;
      if (td.soloed !== undefined) t.soloed = td.soloed;
      if (td.kickPreset !== undefined) t.kickPreset = td.kickPreset;
      if (td.sendRev !== undefined) t.sendRev = td.sendRev;
      if (td.sendDly !== undefined) t.sendDly = td.sendDly;
      if (td.sendSc !== undefined) t.sendSc = td.sendSc;
      if (td.sp) Object.assign(t.sp, td.sp);
      if (td.patterns) {
        td.patterns.forEach((p, pi) => {
          if (t.patterns[pi]) {
            t.patterns[pi].acts = p.acts || t.patterns[pi].acts;
            t.patterns[pi].vels = p.vels || t.patterns[pi].vels;
            t.patterns[pi].probs = p.probs || t.patterns[pi].probs;
          }
        });
      }
      if (td.pats) t.pats = td.pats;
      if (td.noteGrid) t.noteGrid = td.noteGrid;
    });
  }
  // FX
  if (data.fx) Object.assign(FX, data.fx);
  // LFO
  if (data.lp) Object.assign(LP, data.lp);
  // Sidechain
  if (data.sc) Object.assign(SC, data.sc);
  // State
  if (data.state) {
    if (data.state.bpm) state.bpm = data.state.bpm;
    if (data.state.swingAmt !== undefined) state.swingAmt = data.state.swingAmt;
    if (data.state.masterVolume !== undefined) state.masterVolume = data.state.masterVolume;
    if (data.state.currentSteps) state.currentSteps = data.state.currentSteps;
    if (data.state.scaleLock !== undefined) state.scaleLock = data.state.scaleLock;
    if (data.state.glideOn !== undefined) state.glideOn = data.state.glideOn;
    if (data.state.keyIdx !== undefined) state.keyIdx = data.state.keyIdx;
    if (data.state.currentKey) state.currentKey = data.state.currentKey;
  }
  emit('project-loaded');
}

export function saveProject(name) {
  const key = 'os_project_' + (name || 'default');
  localStorage.setItem(key, JSON.stringify(exportProject()));
}

export function loadProject(name) {
  const key = 'os_project_' + (name || 'default');
  const raw = localStorage.getItem(key);
  if (!raw) return false;
  try {
    importProject(JSON.parse(raw));
    return true;
  } catch (e) { return false; }
}

export function listProjects() {
  const projects = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith('os_project_')) {
      projects.push(k.replace('os_project_', ''));
    }
  }
  return projects;
}
