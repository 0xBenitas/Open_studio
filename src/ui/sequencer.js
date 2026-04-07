import { TRACKS, state, setSelectedTrack, setCurrentSteps } from '../state/store.js';
import { makePat, makeNoteGrid } from '../utils/helpers.js';
import { initAudio, ctx } from '../audio/engine.js';
import { triggerTrack } from '../audio/synth.js';
import { getStepW } from '../audio/scheduler.js';
import { updateSynthUI } from './panels.js';

// ==================== RENDER TRACKS ====================
export function renderTracks() {
  const tl = document.getElementById('trkList');
  const gt = document.getElementById('gridTracks');
  const bl = document.getElementById('barLabels');
  if (!tl || !gt || !bl) return;
  tl.innerHTML = '';
  gt.innerHTML = '';
  bl.innerHTML = '';
  const sw = getStepW();

  for (let i = 0; i < state.currentSteps; i++) {
    const b = document.createElement('div');
    b.className = 'bar-lbl';
    b.style.width = sw + 'px';
    if (i % 4 === 0) b.textContent = (i / 4 + 1) + '.';
    bl.appendChild(b);
  }

  TRACKS.forEach((t, ti) => {
    // Track row
    const row = document.createElement('div');
    row.className = 'trk-row' + (ti === state.selectedTrack ? ' sel' : '');
    row.innerHTML = `<div class="trk-dot" style="background:${t.color};color:${t.color}"></div>
      <div class="trk-name" style="color:${t.color}" data-track="${ti}">${t.name}</div>
      <button class="tmb${t.muted ? ' on' : ''}" data-mute="${ti}">M</button>
      <button class="tsl${t.soloed ? ' on' : ''}" data-solo="${ti}">S</button>
      <input class="trk-vol" type="range" min="0" max="100" value="${Math.round(t.vol * 100)}" data-vol="${ti}">`;

    // Event listeners
    row.querySelector('.trk-name').addEventListener('click', () => selectTrack(ti));
    row.querySelector('.tmb').addEventListener('click', e => { e.stopPropagation(); toggleMute(ti); });
    row.querySelector('.tsl').addEventListener('click', e => { e.stopPropagation(); toggleSolo(ti); });
    row.querySelector('.trk-vol').addEventListener('input', function (e) { e.stopPropagation(); setTrackVol(ti, this.value); });
    tl.appendChild(row);

    // Grid row
    const gRow = document.createElement('div');
    gRow.className = 'grid-trk-row';
    gRow.style.width = (sw * state.currentSteps) + 'px';
    const patIdx = t.pats.findIndex(p => p);
    const pat = t.patterns[patIdx < 0 ? 0 : patIdx];

    for (let i = 0; i < state.currentSteps; i++) {
      const s = document.createElement('div');
      let cls = 'step';
      if (i % 16 === 0) cls += ' b8';
      else if (i % 4 === 0) cls += ' b4';
      s.className = cls;
      s.style.width = sw + 'px';
      s.id = `s${ti}_${i}`;
      const act = i < pat.acts.length && pat.acts[i];
      const vel = i < pat.vels.length ? pat.vels[i] : 0.8;
      if (act) {
        s.classList.add('active');
        s.style.background = t.color;
        s.style.opacity = 0.55 + vel * 0.45;
      }
      s.addEventListener('click', () => toggleStep(ti, i));
      s.addEventListener('contextmenu', e => { e.preventDefault(); startVelEdit(ti, i); });
      gRow.appendChild(s);
    }
    gt.appendChild(gRow);
  });

  renderVelStrip();
  renderPatBtns();
  updateSynthUI();
}

// ==================== VELOCITY STRIP ====================
export function renderVelStrip() {
  const vs = document.getElementById('velStrip');
  if (!vs) return;
  vs.innerHTML = '';
  const t = TRACKS[state.selectedTrack];
  const patIdx = t.pats.findIndex(p => p);
  const pat = t.patterns[patIdx < 0 ? 0 : patIdx];
  const sw = getStepW();

  for (let i = 0; i < state.currentSteps; i++) {
    const act = i < pat.acts.length && pat.acts[i];
    const vel = i < pat.vels.length ? pat.vels[i] : 0.5;
    const vb = document.createElement('div');
    vb.className = 'vb' + (act ? ' on' : '');
    vb.style.width = (sw - 1) + 'px';
    vb.style.height = Math.round(vel * 40 + 3) + 'px';
    vb.style.background = t.color;
    vb.addEventListener('mousedown', e => startVelDrag(state.selectedTrack, i, e));
    vs.appendChild(vb);
  }
}

// ==================== VELOCITY DRAG ====================
let velDrag = { on: false };

function startVelDrag(ti, si, e) {
  const patIdx = TRACKS[ti].pats.findIndex(p => p);
  const pat = TRACKS[ti].patterns[patIdx < 0 ? 0 : patIdx];
  velDrag = { on: true, ti, si, sy: e.clientY, sv: pat.vels[si] || 0.8 };
  e.preventDefault();
}

function startVelEdit(ti, si) {
  const patIdx = TRACKS[ti].pats.findIndex(p => p);
  const pat = TRACKS[ti].patterns[patIdx < 0 ? 0 : patIdx];
  if (!pat.acts[si]) return;
  selectTrack(ti);
}

document.addEventListener('mousemove', e => {
  if (!velDrag.on) return;
  const { ti, si, sy, sv } = velDrag;
  const patIdx = TRACKS[ti].pats.findIndex(p => p);
  const pat = TRACKS[ti].patterns[patIdx < 0 ? 0 : patIdx];
  let v = Math.max(0.05, Math.min(1, sv - (e.clientY - sy) / 60));
  pat.vels[si] = v;
  renderVelStrip();
  const el = document.getElementById(`s${ti}_${si}`);
  if (el && pat.acts[si]) el.style.opacity = 0.55 + v * 0.45;
});
document.addEventListener('mouseup', () => { velDrag.on = false; });

// ==================== STEP TOGGLE ====================
function toggleStep(ti, si) {
  initAudio();
  const t = TRACKS[ti];
  const patIdx = t.pats.findIndex(p => p);
  const pat = t.patterns[patIdx < 0 ? 0 : patIdx];
  while (pat.acts.length <= si) { pat.acts.push(false); pat.vels.push(0.8); pat.probs.push(1); }
  pat.acts[si] = !pat.acts[si];
  const el = document.getElementById(`s${ti}_${si}`);
  if (el) {
    el.classList.toggle('active', pat.acts[si]);
    el.style.background = pat.acts[si] ? t.color : '';
    el.style.opacity = pat.acts[si] ? 0.55 + pat.vels[si] * 0.45 : '';
  }
  if (pat.acts[si] && !state.isPlaying) triggerTrack(ti, pat.vels[si], ctx.currentTime);
  renderVelStrip();
}

// ==================== TRACK SELECTION ====================
export function selectTrack(ti) {
  setSelectedTrack(ti);
  document.querySelectorAll('.trk-row').forEach((r, i) => r.classList.toggle('sel', i === ti));
  renderVelStrip();
  renderPatBtns();
  updateSynthUI();
}

// ==================== MUTE/SOLO ====================
function toggleMute(ti) { TRACKS[ti].muted = !TRACKS[ti].muted; renderTracks(); }
function toggleSolo(ti) { TRACKS[ti].soloed = !TRACKS[ti].soloed; renderTracks(); }
function setTrackVol(ti, v) { TRACKS[ti].vol = v / 100; }

// ==================== PATTERN BUTTONS ====================
export function renderPatBtns() {
  const pb = document.getElementById('patBtns');
  if (!pb) return;
  pb.innerHTML = '';
  const t = TRACKS[state.selectedTrack];
  for (let i = 0; i < 8; i++) {
    const b = document.createElement('div');
    const isActive = t.pats[i];
    const hasDat = t.patterns[i].acts.some(a => a);
    b.className = 'pat-btn' + (isActive ? ' on' : hasDat ? ' has' : '');
    b.textContent = i + 1;
    b.addEventListener('click', () => {
      TRACKS.forEach(tr => { tr.pats = Array(8).fill(false); tr.pats[i] = true; });
      state.selectedPat = i;
      renderTracks();
    });
    pb.appendChild(b);
  }
}

// ==================== STEP COUNT ====================
export function initStepButtons() {
  document.querySelectorAll('[data-steps]').forEach(btn => {
    btn.addEventListener('click', () => {
      const n = +btn.dataset.steps;
      setCurrentSteps(n);
      document.querySelectorAll('[data-steps]').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      renderTracks();
    });
  });
}

// ==================== PATTERN TOOLS ====================
export function randomizePattern() {
  const t = TRACKS[state.selectedTrack];
  const patIdx = t.pats.findIndex(p => p);
  const pat = t.patterns[patIdx < 0 ? 0 : patIdx];
  const densities = [0.3, 0.5, 0.3, 0.2, 0.45, 0.5, 0.4, 0.35];
  const density = densities[state.selectedTrack] || 0.4;
  for (let i = 0; i < state.currentSteps; i++) {
    pat.acts[i] = Math.random() < density;
    pat.vels[i] = 0.5 + Math.random() * 0.5;
  }
  if (state.selectedTrack === 0) pat.acts[0] = true;
  renderTracks();
}

export function mutatePattern() {
  const t = TRACKS[state.selectedTrack];
  const patIdx = t.pats.findIndex(p => p);
  const pat = t.patterns[patIdx < 0 ? 0 : patIdx];
  const muts = Math.max(1, Math.floor(state.currentSteps * 0.18));
  for (let m = 0; m < muts; m++) {
    const i = Math.floor(Math.random() * state.currentSteps);
    if (Math.random() < 0.6) {
      if (pat.acts.filter(Boolean).length > 2 || !pat.acts[i]) pat.acts[i] = !pat.acts[i];
    } else {
      pat.vels[i] = Math.max(0.15, Math.min(1, pat.vels[i] + (Math.random() * 0.4 - 0.2)));
    }
  }
  renderTracks();
}

export function clearPattern() {
  const t = TRACKS[state.selectedTrack];
  const patIdx = t.pats.findIndex(p => p);
  const pat = t.patterns[patIdx < 0 ? 0 : patIdx];
  pat.acts.fill(false);
  renderTracks();
}

export function addTrack() {
  const colors = ['#ff00aa', '#00ffaa', '#ffaa00', '#0055ff'];
  const t = {
    name: 'TRACK ' + (TRACKS.length + 1),
    color: colors[TRACKS.length % 4],
    wave: 'sawtooth',
    vol: 0.7,
    steps: state.currentSteps,
    patterns: Array.from({ length: 8 }, () => makePat(state.currentSteps)),
    pats: Array.from({ length: 8 }, (_, i) => i === 0),
    muted: false, soloed: false,
    noteGrid: makeNoteGrid(state.currentSteps),
    sp: { wave: 'sawtooth', cutoff: 800, res: 5, atk: 5, dec: 200, sus: 60, rel: 300, envmod: 40, detune: 0 },
  };
  TRACKS.push(t);
  renderTracks();
}

// ==================== INIT SEQUENCER CONTROLS ====================
export function initSequencer() {
  initStepButtons();
  document.getElementById('btnRandom').addEventListener('click', randomizePattern);
  document.getElementById('btnMutate').addEventListener('click', mutatePattern);
  document.getElementById('btnClear').addEventListener('click', clearPattern);
  document.getElementById('btnAddTrack').addEventListener('click', addTrack);
}
