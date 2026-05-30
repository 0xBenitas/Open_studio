export const SCALES = {
  'Am': [0, 2, 3, 5, 7, 8, 10],
  'Cm': [0, 2, 3, 5, 7, 8, 10],
  'Dm': [0, 2, 3, 5, 7, 9, 10],
  'Em': [0, 2, 3, 5, 7, 8, 10],
  'Gm': [0, 2, 3, 5, 7, 8, 10],
  'Amaj': [0, 2, 4, 5, 7, 9, 11],
  'Dmaj': [0, 2, 4, 5, 7, 9, 11],
  'Emaj': [0, 2, 4, 5, 7, 9, 11],
  'Pentatonic': [0, 2, 4, 7, 9],
  'Blues': [0, 3, 5, 6, 7, 10],
  'Phrygian': [0, 1, 3, 5, 7, 8, 10],
};

export const KEY_NAMES = Object.keys(SCALES);

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const CELL_H = 14;

export const PR_NOTES = [];
for (let o = 7; o >= 1; o--) {
  for (let n = 11; n >= 0; n--) {
    PR_NOTES.push({ note: n, octave: o, name: NOTE_NAMES[n] + o });
  }
}

export const TRACK_DEFAULTS = [
  { name: 'KICK', color: '#00ffd2', wave: 'kick', vol: 0.9 },
  { name: 'HI-HAT', color: '#ffd600', wave: 'hat', vol: 0.65 },
  { name: 'CLAP', color: '#ff8a00', wave: 'clap', vol: 0.75 },
  { name: 'OPEN HH', color: '#ff44cc', wave: 'openhat', vol: 0.5 },
  { name: 'BASSLINE', color: '#a855f7', wave: 'sawtooth', vol: 0.85 },
  { name: 'ACID', color: '#22dd88', wave: 'sawtooth', vol: 0.75 },
  { name: 'SYNTH 1', color: '#00b4ff', wave: 'square', vol: 0.65 },
  { name: 'SYNTH 2', color: '#ff3355', wave: 'triangle', vol: 0.55 },
];

export const KICK_PRESETS = [
  { name: '808',    startFreq: 180, midFreq: 55,  endFreq: 30, pitchDecay: 0.12, clickAmt: 0.1,  clickFreq: 800,  decay: 0.6,  drive: 0 },
  { name: '909',    startFreq: 250, midFreq: 80,  endFreq: 45, pitchDecay: 0.06, clickAmt: 0.4,  clickFreq: 3000, decay: 0.35, drive: 0.15 },
  { name: 'HARD',   startFreq: 300, midFreq: 90,  endFreq: 35, pitchDecay: 0.04, clickAmt: 0.7,  clickFreq: 4500, decay: 0.3,  drive: 0.5 },
  { name: 'DEEP',   startFreq: 150, midFreq: 45,  endFreq: 25, pitchDecay: 0.15, clickAmt: 0.05, clickFreq: 600,  decay: 0.7,  drive: 0 },
  { name: 'TIGHT',  startFreq: 220, midFreq: 70,  endFreq: 40, pitchDecay: 0.03, clickAmt: 0.3,  clickFreq: 2000, decay: 0.15, drive: 0.1 },
  { name: 'ELECTRO',startFreq: 350, midFreq: 100, endFreq: 50, pitchDecay: 0.05, clickAmt: 0.6,  clickFreq: 5000, decay: 0.25, drive: 0.3 },
  { name: 'BOOM',   startFreq: 160, midFreq: 50,  endFreq: 35, pitchDecay: 0.10, clickAmt: 0.25, clickFreq: 1200, decay: 0.55, drive: 0.05 },
  { name: 'GABBER', startFreq: 400, midFreq: 120, endFreq: 40, pitchDecay: 0.03, clickAmt: 0.8,  clickFreq: 5500, decay: 0.28, drive: 0.85 },
  { name: 'TRAP',   startFreq: 170, midFreq: 50,  endFreq: 28, pitchDecay: 0.14, clickAmt: 0.15, clickFreq: 1500, decay: 0.8,  drive: 0 },
  { name: 'TECHNO', startFreq: 240, midFreq: 65,  endFreq: 38, pitchDecay: 0.05, clickAmt: 0.35, clickFreq: 2500, decay: 0.3,  drive: 0.2 },
  { name: 'VINYL',  startFreq: 140, midFreq: 60,  endFreq: 35, pitchDecay: 0.09, clickAmt: 0.08, clickFreq: 500,  decay: 0.4,  drive: 0.08 },
  { name: 'DNB',    startFreq: 280, midFreq: 85,  endFreq: 50, pitchDecay: 0.02, clickAmt: 0.55, clickFreq: 3500, decay: 0.12, drive: 0.25 },
  { name: 'HOUSE',  startFreq: 200, midFreq: 60,  endFreq: 40, pitchDecay: 0.07, clickAmt: 0.3,  clickFreq: 2200, decay: 0.32, drive: 0.1 },
  { name: 'GARAGE', startFreq: 190, midFreq: 55,  endFreq: 32, pitchDecay: 0.08, clickAmt: 0.2,  clickFreq: 1800, decay: 0.45, drive: 0.05 },
  { name: 'REGGTN', startFreq: 210, midFreq: 65,  endFreq: 35, pitchDecay: 0.06, clickAmt: 0.45, clickFreq: 2800, decay: 0.25, drive: 0.12 },
  { name: 'INDUS',  startFreq: 380, midFreq: 110, endFreq: 55, pitchDecay: 0.03, clickAmt: 0.9,  clickFreq: 6000, decay: 0.22, drive: 0.7 },
  { name: 'LOFI',   startFreq: 130, midFreq: 48,  endFreq: 28, pitchDecay: 0.11, clickAmt: 0.06, clickFreq: 400,  decay: 0.35, drive: 0.15 },
  { name: 'STOMP',  startFreq: 260, midFreq: 75,  endFreq: 42, pitchDecay: 0.04, clickAmt: 0.5,  clickFreq: 3800, decay: 0.2,  drive: 0.35 },
  { name: 'MINML',  startFreq: 200, midFreq: 58,  endFreq: 36, pitchDecay: 0.05, clickAmt: 0.12, clickFreq: 1000, decay: 0.18, drive: 0 },
  { name: 'PERC',   startFreq: 320, midFreq: 95,  endFreq: 60, pitchDecay: 0.02, clickAmt: 0.65, clickFreq: 4200, decay: 0.1,  drive: 0.18 },
  // --- NEW KICKS ---
  { name: 'ACID',   startFreq: 260, midFreq: 72,  endFreq: 36, pitchDecay: 0.04, clickAmt: 0.4,  clickFreq: 3200, decay: 0.28, drive: 0.45 },
  { name: 'JUNGLE', startFreq: 290, midFreq: 88,  endFreq: 48, pitchDecay: 0.025,clickAmt: 0.6,  clickFreq: 3800, decay: 0.14, drive: 0.3 },
  { name: 'DSTEP',  startFreq: 160, midFreq: 42,  endFreq: 22, pitchDecay: 0.18, clickAmt: 0.2,  clickFreq: 900,  decay: 0.9,  drive: 0.1 },
  { name: 'GRIME',  startFreq: 230, midFreq: 68,  endFreq: 34, pitchDecay: 0.05, clickAmt: 0.5,  clickFreq: 2600, decay: 0.35, drive: 0.4 },
  { name: 'PSYTR',  startFreq: 340, midFreq: 95,  endFreq: 42, pitchDecay: 0.035,clickAmt: 0.7,  clickFreq: 4800, decay: 0.2,  drive: 0.55 },
  { name: 'BROKE',  startFreq: 270, midFreq: 78,  endFreq: 44, pitchDecay: 0.03, clickAmt: 0.45, clickFreq: 3000, decay: 0.16, drive: 0.2 },
  { name: 'AFRO',   startFreq: 185, midFreq: 58,  endFreq: 33, pitchDecay: 0.08, clickAmt: 0.22, clickFreq: 1600, decay: 0.42, drive: 0.08 },
  { name: 'DRILL',  startFreq: 195, midFreq: 52,  endFreq: 26, pitchDecay: 0.13, clickAmt: 0.18, clickFreq: 1100, decay: 0.75, drive: 0.05 },
  { name: 'JUKE',   startFreq: 310, midFreq: 82,  endFreq: 46, pitchDecay: 0.03, clickAmt: 0.55, clickFreq: 3400, decay: 0.18, drive: 0.28 },
  { name: 'MIAMI',  startFreq: 175, midFreq: 52,  endFreq: 30, pitchDecay: 0.11, clickAmt: 0.12, clickFreq: 700,  decay: 0.55, drive: 0.02 },
  { name: 'RAVE',   startFreq: 360, midFreq: 105, endFreq: 45, pitchDecay: 0.04, clickAmt: 0.75, clickFreq: 5200, decay: 0.24, drive: 0.6 },
  { name: 'FUTURE', startFreq: 220, midFreq: 62,  endFreq: 32, pitchDecay: 0.07, clickAmt: 0.3,  clickFreq: 2000, decay: 0.38, drive: 0.15 },
  { name: 'TRIBAL', startFreq: 245, midFreq: 70,  endFreq: 38, pitchDecay: 0.06, clickAmt: 0.35, clickFreq: 2400, decay: 0.28, drive: 0.12 },
  { name: 'AMENS',  startFreq: 275, midFreq: 80,  endFreq: 50, pitchDecay: 0.025,clickAmt: 0.5,  clickFreq: 3600, decay: 0.13, drive: 0.22 },
  { name: 'DISKO',  startFreq: 195, midFreq: 58,  endFreq: 36, pitchDecay: 0.07, clickAmt: 0.28, clickFreq: 1900, decay: 0.36, drive: 0.06 },
  { name: 'UK-G',   startFreq: 205, midFreq: 60,  endFreq: 35, pitchDecay: 0.065,clickAmt: 0.25, clickFreq: 2100, decay: 0.4,  drive: 0.08 },
  { name: 'BMORE',  startFreq: 285, midFreq: 82,  endFreq: 44, pitchDecay: 0.035,clickAmt: 0.52, clickFreq: 3300, decay: 0.17, drive: 0.25 },
  { name: 'CUMBIA', startFreq: 175, midFreq: 55,  endFreq: 32, pitchDecay: 0.09, clickAmt: 0.15, clickFreq: 1300, decay: 0.38, drive: 0.04 },
  { name: 'FOOTW',  startFreq: 330, midFreq: 90,  endFreq: 48, pitchDecay: 0.03, clickAmt: 0.62, clickFreq: 4000, decay: 0.15, drive: 0.32 },
  { name: 'PHONK',  startFreq: 155, midFreq: 46,  endFreq: 24, pitchDecay: 0.16, clickAmt: 0.1,  clickFreq: 800,  decay: 0.85, drive: 0.2 },
];

// ==================== CLAP PRESETS ====================
// dur=buffer length, freq=bandpass center, Q=resonance, decay=env constant (higher=slower),
// layers=flam bursts, spread=time between layers, drive=saturation, body=low-end mix
export const CLAP_PRESETS = [
  { name: '808',    dur: 0.18, freq: 1100, Q: 2,   decay: 800,  layers: 1, spread: 0,     drive: 0,    body: 0 },
  { name: '909',    dur: 0.28, freq: 1200, Q: 1.5, decay: 600,  layers: 3, spread: 0.008, drive: 0.1,  body: 0.1 },
  { name: 'HARD',   dur: 0.30, freq: 1500, Q: 1,   decay: 500,  layers: 4, spread: 0.01,  drive: 0.5,  body: 0.25 },
  { name: 'THICK',  dur: 0.38, freq: 800,  Q: 1.2, decay: 400,  layers: 5, spread: 0.012, drive: 0.35, body: 0.45 },
  { name: 'SNAP',   dur: 0.10, freq: 2200, Q: 3,   decay: 1400, layers: 1, spread: 0,     drive: 0.15, body: 0 },
  { name: 'TRASH',  dur: 0.35, freq: 900,  Q: 0.8, decay: 350,  layers: 6, spread: 0.015, drive: 0.8,  body: 0.5 },
  { name: 'VINYL',  dur: 0.22, freq: 1000, Q: 1.8, decay: 700,  layers: 2, spread: 0.006, drive: 0.05, body: 0.15 },
  { name: 'TIGHT',  dur: 0.08, freq: 1800, Q: 2.5, decay: 1800, layers: 1, spread: 0,     drive: 0.2,  body: 0 },
  { name: 'GRIME',  dur: 0.32, freq: 700,  Q: 1,   decay: 450,  layers: 4, spread: 0.018, drive: 0.65, body: 0.55 },
  { name: 'TRAP',   dur: 0.25, freq: 1300, Q: 1.8, decay: 550,  layers: 2, spread: 0.005, drive: 0.2,  body: 0.1 },
  { name: 'BIG',    dur: 0.45, freq: 600,  Q: 0.7, decay: 300,  layers: 6, spread: 0.02,  drive: 0.4,  body: 0.6 },
  { name: 'STACK',  dur: 0.40, freq: 950,  Q: 1,   decay: 380,  layers: 8, spread: 0.008, drive: 0.5,  body: 0.35 },
  { name: 'RAVE',   dur: 0.30, freq: 1600, Q: 1.2, decay: 520,  layers: 3, spread: 0.01,  drive: 0.7,  body: 0.2 },
  { name: 'LOFI',   dur: 0.20, freq: 900,  Q: 2,   decay: 650,  layers: 2, spread: 0.007, drive: 0.15, body: 0.3 },
  { name: 'INDUS',  dur: 0.35, freq: 500,  Q: 0.6, decay: 320,  layers: 5, spread: 0.025, drive: 0.9,  body: 0.7 },
  { name: 'CRISP',  dur: 0.15, freq: 2500, Q: 2.8, decay: 1000, layers: 1, spread: 0,     drive: 0.25, body: 0 },
  { name: 'STOMP',  dur: 0.20, freq: 400,  Q: 0.5, decay: 500,  layers: 1, spread: 0,     drive: 0.3,  body: 0.8 },
  { name: 'DRILL',  dur: 0.28, freq: 1100, Q: 1.5, decay: 480,  layers: 3, spread: 0.009, drive: 0.4,  body: 0.2 },
  { name: 'FUTURE', dur: 0.22, freq: 1400, Q: 2,   decay: 600,  layers: 2, spread: 0.006, drive: 0.3,  body: 0.05 },
  { name: 'GABBER', dur: 0.30, freq: 800,  Q: 0.8, decay: 400,  layers: 4, spread: 0.012, drive: 0.95, body: 0.4 },
];

// ==================== HAT PRESETS ====================
// dur=duration, hpf=highpass freq, Q=filter Q, decay=env constant,
// metalFreqs=tuned oscillator freqs for metallic character, metalAmt=metallic mix,
// tone=lowpass cutoff to shape brightness
export const HAT_PRESETS = [
  { name: '808',    dur: 0.06, hpf: 7000,  Q: 1,   decay: 1200, metalFreqs: [],                    metalAmt: 0,    tone: 20000 },
  { name: '909',    dur: 0.05, hpf: 7500,  Q: 1.5, decay: 1600, metalFreqs: [800, 1340, 3266],     metalAmt: 0.3,  tone: 18000 },
  { name: 'CRISP',  dur: 0.04, hpf: 9000,  Q: 2,   decay: 2000, metalFreqs: [],                    metalAmt: 0,    tone: 20000 },
  { name: 'DARK',   dur: 0.07, hpf: 4500,  Q: 0.8, decay: 900,  metalFreqs: [],                    metalAmt: 0,    tone: 8000 },
  { name: 'METAL',  dur: 0.06, hpf: 6000,  Q: 1.2, decay: 1100, metalFreqs: [587, 845, 1506, 4200],metalAmt: 0.5,  tone: 16000 },
  { name: 'DIRTY',  dur: 0.08, hpf: 5000,  Q: 0.7, decay: 700,  metalFreqs: [400, 1200],           metalAmt: 0.2,  tone: 10000 },
  { name: 'TIGHT',  dur: 0.03, hpf: 10000, Q: 2,   decay: 2500, metalFreqs: [],                    metalAmt: 0,    tone: 20000 },
  { name: 'ELEC',   dur: 0.05, hpf: 8000,  Q: 1.8, decay: 1800, metalFreqs: [2200, 5500],          metalAmt: 0.4,  tone: 20000 },
  { name: 'VINYL',  dur: 0.07, hpf: 5500,  Q: 1,   decay: 800,  metalFreqs: [],                    metalAmt: 0,    tone: 9000 },
  { name: 'TRAP',   dur: 0.04, hpf: 8500,  Q: 1.5, decay: 2000, metalFreqs: [],                    metalAmt: 0,    tone: 18000 },
  { name: 'TEKNO',  dur: 0.05, hpf: 7000,  Q: 1.2, decay: 1400, metalFreqs: [600, 1000, 3000],     metalAmt: 0.35, tone: 15000 },
  { name: 'LOFI',   dur: 0.08, hpf: 4000,  Q: 0.6, decay: 600,  metalFreqs: [],                    metalAmt: 0,    tone: 6000 },
  { name: 'FIZZ',   dur: 0.06, hpf: 6500,  Q: 1,   decay: 1000, metalFreqs: [3500, 7000, 9500],    metalAmt: 0.6,  tone: 20000 },
  { name: 'HOUSE',  dur: 0.05, hpf: 7500,  Q: 1.3, decay: 1500, metalFreqs: [800, 1500],           metalAmt: 0.25, tone: 16000 },
  { name: 'DNB',    dur: 0.04, hpf: 8000,  Q: 1.8, decay: 1900, metalFreqs: [],                    metalAmt: 0,    tone: 20000 },
];

// ==================== OPEN HAT PRESETS ====================
export const OPENHAT_PRESETS = [
  { name: '808',    dur: 0.25, hpf: 7000,  Q: 1,   decay: 500,  metalFreqs: [],                    metalAmt: 0,    tone: 20000 },
  { name: '909',    dur: 0.40, hpf: 7500,  Q: 1.5, decay: 350,  metalFreqs: [800, 1340, 3266],     metalAmt: 0.3,  tone: 18000 },
  { name: 'WASH',   dur: 0.60, hpf: 5000,  Q: 0.6, decay: 200,  metalFreqs: [],                    metalAmt: 0,    tone: 12000 },
  { name: 'SIZZLE', dur: 0.50, hpf: 8000,  Q: 1.2, decay: 280,  metalFreqs: [2000, 5500, 8200],    metalAmt: 0.5,  tone: 20000 },
  { name: 'CRASH',  dur: 0.80, hpf: 4000,  Q: 0.5, decay: 150,  metalFreqs: [587, 845, 1506, 4200],metalAmt: 0.6,  tone: 16000 },
  { name: 'DARK',   dur: 0.35, hpf: 4500,  Q: 0.8, decay: 400,  metalFreqs: [],                    metalAmt: 0,    tone: 8000 },
  { name: 'TRASH',  dur: 0.55, hpf: 3500,  Q: 0.5, decay: 220,  metalFreqs: [400, 900, 2200],      metalAmt: 0.4,  tone: 10000 },
  { name: 'TIGHT',  dur: 0.18, hpf: 9000,  Q: 2,   decay: 600,  metalFreqs: [],                    metalAmt: 0,    tone: 20000 },
  { name: 'RIDE',   dur: 0.70, hpf: 6000,  Q: 1,   decay: 180,  metalFreqs: [1200, 2800, 5600, 7500],metalAmt: 0.55,tone: 18000 },
  { name: 'LOFI',   dur: 0.30, hpf: 4000,  Q: 0.7, decay: 380,  metalFreqs: [],                    metalAmt: 0,    tone: 6000 },
];

export const MACRO_DEFS = [
  { name: 'ENERGY', sub: 'Filter + Dist', color: 'var(--cy)', val: 50 },
  { name: 'SPACE', sub: 'Reverb + Delay', color: 'var(--pu)', val: 30 },
  { name: 'TENSION', sub: 'Cutoff + Reso', color: 'var(--mg)', val: 40 },
  { name: 'DRIVE', sub: 'Sat + Comp', color: 'var(--or)', val: 60 },
];
