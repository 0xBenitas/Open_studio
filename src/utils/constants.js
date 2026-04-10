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
  { name: 'HI-HAT', color: '#00e6be', wave: 'hat', vol: 0.65 },
  { name: 'CLAP', color: '#00cca8', wave: 'clap', vol: 0.75 },
  { name: 'OPEN HH', color: '#00b393', wave: 'openhat', vol: 0.5 },
  { name: 'BASSLINE', color: '#009a7e', wave: 'sawtooth', vol: 0.85 },
  { name: 'ACID', color: '#008069', wave: 'sawtooth', vol: 0.75 },
  { name: 'SYNTH 1', color: '#006754', wave: 'square', vol: 0.65 },
  { name: 'SYNTH 2', color: '#004d3f', wave: 'triangle', vol: 0.55 },
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
];

export const MACRO_DEFS = [
  { name: 'ENERGY', sub: 'Filter + Dist', color: 'var(--cy)', val: 50 },
  { name: 'SPACE', sub: 'Reverb + Delay', color: 'var(--pu)', val: 30 },
  { name: 'TENSION', sub: 'Cutoff + Reso', color: 'var(--mg)', val: 40 },
  { name: 'DRIVE', sub: 'Sat + Comp', color: 'var(--or)', val: 60 },
];
