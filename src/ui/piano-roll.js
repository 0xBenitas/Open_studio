import { TRACKS, state } from '../state/store.js';
import { SCALES, PR_NOTES, CELL_H } from '../utils/constants.js';
import { isBlack } from '../utils/helpers.js';
import { initAudio, ctx } from '../audio/engine.js';
import { triggerTrack } from '../audio/synth.js';
import { renderTracks } from './sequencer.js';

export function renderPianoRoll() {
  const tSel = document.getElementById('prTrackSel');
  if (!tSel) return;
  if (!tSel.options.length) {
    TRACKS.forEach((t, i) => { tSel.add(new Option(t.name, i)); });
  }
  const ti = +tSel.value;
  const t = TRACKS[ti];
  const zoom = +document.getElementById('prZoom').value;
  const stepW = Math.round(28 * zoom);
  const steps = state.currentSteps;
  const nN = PR_NOTES.length;
  const W = stepW * steps + 1;
  const H = CELL_H * nN + 1;

  const keys = document.getElementById('prKeys');
  keys.innerHTML = '';
  keys.style.height = H + 'px';
  PR_NOTES.forEach(n => {
    const k = document.createElement('div');
    k.className = 'pr-key ' + (isBlack(n.note) ? 'black' : 'white') + (n.note === 0 ? ' croot' : '');
    k.style.height = CELL_H + 'px';
    if (n.note === 0) k.textContent = n.name;
    keys.appendChild(k);
  });

  const canvas = document.getElementById('prCanvas');
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  const cc = canvas.getContext('2d');
  const scale = SCALES[state.currentKey] || [];

  // Draw grid background
  PR_NOTES.forEach((n, ri) => {
    const y = ri * CELL_H;
    const inScale = scale.includes(n.note);
    let bg = isBlack(n.note) ? '#0a0e14' : '#111a24';
    if (state.scaleLock && !inScale) bg = '#070910';
    if (n.note === 0) bg = isBlack(n.note) ? bg : '#0d1820';
    cc.fillStyle = bg;
    cc.fillRect(0, y, W, CELL_H - 1);
    if (inScale && state.scaleLock) {
      cc.fillStyle = 'rgba(0,255,210,.025)';
      cc.fillRect(0, y, W, CELL_H - 1);
    }
    cc.strokeStyle = '#121d2a';
    cc.lineWidth = 0.5;
    cc.beginPath();
    cc.moveTo(0, y);
    cc.lineTo(W, y);
    cc.stroke();
  });

  // Vertical grid lines
  for (let s = 0; s <= steps; s++) {
    cc.strokeStyle = s % 16 === 0 ? '#2a3d54' : s % 4 === 0 ? '#1e2e44' : s % 2 === 0 ? '#141e2c' : '#0f1822';
    cc.lineWidth = s % 4 === 0 ? 1 : 0.5;
    cc.beginPath();
    cc.moveTo(s * stepW, 0);
    cc.lineTo(s * stepW, H);
    cc.stroke();
  }

  // Draw notes
  const patIdx = t.pats.findIndex(p => p);
  const pat = t.patterns[patIdx < 0 ? 0 : patIdx];
  for (let s = 0; s < steps; s++) {
    if (!pat.acts[s]) continue;
    const ng = t.noteGrid[s];
    if (!ng) continue;
    const ri = PR_NOTES.findIndex(n => n.note === ng.note && n.octave === ng.octave);
    if (ri < 0) continue;
    const y = ri * CELL_H + 1;
    const len = Math.max(1, ng.len || 1);
    const nw = Math.min(stepW * len - 2, W - s * stepW - 2);
    cc.fillStyle = TRACKS[ti].color;
    cc.globalAlpha = 0.82;
    cc.fillRect(s * stepW + 1, y, nw, CELL_H - 2);
    cc.globalAlpha = 1;

    // Glide lines
    if (state.glideOn && s < steps - 1 && pat.acts[s + 1]) {
      cc.strokeStyle = TRACKS[ti].color;
      cc.lineWidth = 1.5;
      cc.globalAlpha = 0.4;
      const ny2 = ri * CELL_H + CELL_H / 2;
      const ng2 = t.noteGrid[s + 1];
      const ri2 = ng2 ? PR_NOTES.findIndex(n => n.note === ng2.note && n.octave === ng2.octave) : ri;
      const ny3 = ri2 * CELL_H + CELL_H / 2;
      cc.beginPath();
      cc.moveTo((s + len) * stepW, ny2);
      cc.lineTo((s + len) * stepW + 4, ny3);
      cc.stroke();
      cc.globalAlpha = 1;
    }
  }

  // Playhead
  if (state.isPlaying) {
    const psi = state.currentStep % steps;
    cc.fillStyle = 'rgba(0,255,210,.25)';
    cc.fillRect(psi * stepW, 0, stepW, H);
  }

  // Click handler
  canvas.onmousedown = e => {
    initAudio();
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const si = Math.floor(x / stepW);
    const ri = Math.floor(y / CELL_H);
    if (si < 0 || si >= steps || ri < 0 || ri >= PR_NOTES.length) return;
    const n = PR_NOTES[ri];
    if (state.scaleLock && !scale.includes(n.note)) return;
    const patIdx2 = t.pats.findIndex(p => p);
    const pat2 = t.patterns[patIdx2 < 0 ? 0 : patIdx2];
    const noteLen = +document.getElementById('prNoteLen').value;
    const already = pat2.acts[si] && t.noteGrid[si] && t.noteGrid[si].note === n.note && t.noteGrid[si].octave === n.octave;
    pat2.acts[si] = !already;
    if (!already) t.noteGrid[si] = { note: n.note, octave: n.octave, on: true, vel: 0.8, len: noteLen };
    triggerTrack(ti, 0.8, ctx.currentTime);
    renderPianoRoll();
    renderTracks();
  };
}

export function prQuantize() {
  const ti = +document.getElementById('prTrackSel').value;
  TRACKS[ti].noteGrid.forEach(n => { if (n) n.len = 1; });
  renderPianoRoll();
}

export function prGenMelody() {
  const ti = +document.getElementById('prTrackSel').value;
  const t = TRACKS[ti];
  const patIdx = t.pats.findIndex(p => p);
  const pat = t.patterns[patIdx < 0 ? 0 : patIdx];
  const scale = SCALES[state.currentKey] || [0, 2, 3, 5, 7, 8, 10];
  const octaves = [2, 3, 3, 4];
  const noteLen = +document.getElementById('prNoteLen').value;
  for (let i = 0; i < state.currentSteps; i++) {
    const density = ti >= 4 ? 0.5 : 0.35;
    pat.acts[i] = Math.random() < density;
    if (pat.acts[i]) {
      const note = scale[Math.floor(Math.random() * scale.length)];
      const octave = octaves[Math.floor(Math.random() * octaves.length)];
      t.noteGrid[i] = { note, octave, on: true, vel: 0.5 + Math.random() * 0.5, len: noteLen };
    }
  }
  renderPianoRoll();
  renderTracks();
}

export function initPianoRoll() {
  document.getElementById('prTrackSel').addEventListener('change', renderPianoRoll);
  document.getElementById('prZoom').addEventListener('input', renderPianoRoll);
  document.getElementById('btnQuantize').addEventListener('click', prQuantize);
  document.getElementById('btnGenMelody').addEventListener('click', prGenMelody);

  document.getElementById('scaleLockBtn').addEventListener('click', () => {
    state.scaleLock = !state.scaleLock;
    const b = document.getElementById('scaleLockBtn');
    b.textContent = state.scaleLock ? 'ON' : 'OFF';
    b.classList.toggle('on', state.scaleLock);
    renderPianoRoll();
  });

  document.getElementById('glideBtn').addEventListener('click', () => {
    state.glideOn = !state.glideOn;
    const b = document.getElementById('glideBtn');
    b.textContent = state.glideOn ? 'ON' : 'OFF';
    b.classList.toggle('on', state.glideOn);
  });
}
