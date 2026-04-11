import { TRACKS, state, setSelectedTrack, setCurrentSteps } from '../state/store.js';
import { makePat, makeNoteGrid, getPatIdx } from '../utils/helpers.js';
import { initAudio, ctx } from '../audio/engine.js';
import { triggerTrack } from '../audio/synth.js';
import { getStepW } from '../audio/scheduler.js';
import { updateSynthUI } from './panels.js';
import { pushUndo } from '../utils/history.js';

// ==================== CACHED DOM REFS ====================
let elTrkList, elGridTracks, elBarLabels, elVelStrip;

function cacheDom() {
  elTrkList = document.getElementById('trkList');
  elGridTracks = document.getElementById('gridTracks');
  elBarLabels = document.getElementById('barLabels');
  elVelStrip = document.getElementById('velStrip');
}

// ==================== RENDER TRACKS ====================
export function renderTracks() {
  if (!elTrkList) cacheDom();
  if (!elTrkList || !elGridTracks || !elBarLabels) return;
  elTrkList.innerHTML = '';
  elGridTracks.innerHTML = '';
  elBarLabels.innerHTML = '';
  const sw = getStepW();

  for (let i = 0; i < state.currentSteps; i++) {
    const b = document.createElement('div');
    b.className = 'bar-lbl';
    b.style.width = sw + 'px';
    if (i % 4 === 0) b.textContent = (i / 4 + 1) + '.';
    elBarLabels.appendChild(b);
  }

  TRACKS.forEach((t, ti) => {
    // Track row
    const row = document.createElement('div');
    row.className = 'trk-row' + (ti === state.selectedTrack ? ' sel' : '');
    row.dataset.track = ti;
    row.innerHTML = `<div class="trk-dot" style="background:${t.color};color:${t.color}"></div>
      <div class="trk-name" style="color:${t.color}" data-track="${ti}">${t.name}</div>
      <button class="tmb${t.muted ? ' on' : ''}" data-mute="${ti}">M</button>
      <button class="tsl${t.soloed ? ' on' : ''}" data-solo="${ti}">S</button>
      <input class="trk-vol" type="range" min="0" max="100" value="${Math.round(t.vol * 100)}" data-vol="${ti}">`;
    elTrkList.appendChild(row);

    // Grid row
    const gRow = document.createElement('div');
    gRow.className = 'grid-trk-row';
    gRow.dataset.track = ti;
    gRow.style.width = (sw * state.currentSteps) + 'px';
    const pat = t.patterns[getPatIdx(t)];

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
      gRow.appendChild(s);
    }
    elGridTracks.appendChild(gRow);
  });

  renderVelStrip();
  renderPatBtns();
  updateSynthUI();
}

// ==================== UPDATE SINGLE GRID ROW ====================
function updateGridRow(ti) {
  const t = TRACKS[ti];
  const pat = t.patterns[getPatIdx(t)];
  for (let i = 0; i < state.currentSteps; i++) {
    const el = document.getElementById(`s${ti}_${i}`);
    if (!el) continue;
    const act = i < pat.acts.length && pat.acts[i];
    const vel = i < pat.vels.length ? pat.vels[i] : 0.8;
    el.classList.toggle('active', act);
    el.style.background = act ? t.color : '';
    el.style.opacity = act ? 0.55 + vel * 0.45 : '';
  }
}

// ==================== VELOCITY STRIP ====================
export function renderVelStrip() {
  if (!elVelStrip) elVelStrip = document.getElementById('velStrip');
  if (!elVelStrip) return;
  elVelStrip.innerHTML = '';
  const t = TRACKS[state.selectedTrack];
  const pat = t.patterns[getPatIdx(t)];
  const sw = getStepW();

  for (let i = 0; i < state.currentSteps; i++) {
    const act = i < pat.acts.length && pat.acts[i];
    const vel = i < pat.vels.length ? pat.vels[i] : 0.5;
    const vb = document.createElement('div');
    vb.className = 'vb' + (act ? ' on' : '');
    vb.id = `vb_${i}`;
    vb.style.width = (sw - 1) + 'px';
    vb.style.height = Math.round(vel * 40 + 3) + 'px';
    vb.style.background = t.color;
    elVelStrip.appendChild(vb);
  }
}

// ==================== UPDATE SINGLE VEL BAR ====================
function updateVelBar(si) {
  const t = TRACKS[state.selectedTrack];
  const pat = t.patterns[getPatIdx(t)];
  const vb = document.getElementById(`vb_${si}`);
  if (!vb) return;
  const act = si < pat.acts.length && pat.acts[si];
  const vel = si < pat.vels.length ? pat.vels[si] : 0.5;
  vb.className = 'vb' + (act ? ' on' : '');
  vb.style.height = Math.round(vel * 40 + 3) + 'px';
  vb.style.background = t.color;
}

// ==================== VELOCITY DRAG ====================
let velDrag = { on: false };

function startVelDrag(ti, si, e) {
  const pat = TRACKS[ti].patterns[getPatIdx(TRACKS[ti])];
  velDrag = { on: true, ti, si, sy: e.clientY, sv: pat.vels[si] || 0.8 };
  e.preventDefault();
}

document.addEventListener('mousemove', e => {
  if (!velDrag.on) return;
  const { ti, si, sy, sv } = velDrag;
  const pat = TRACKS[ti].patterns[getPatIdx(TRACKS[ti])];
  let v = Math.max(0.05, Math.min(1, sv - (e.clientY - sy) / 60));
  pat.vels[si] = v;
  // Update only the single velocity bar being dragged
  const vb = document.getElementById(`vb_${si}`);
  if (vb) {
    vb.style.height = Math.round(v * 40 + 3) + 'px';
  }
  const el = document.getElementById(`s${ti}_${si}`);
  if (el && pat.acts[si]) el.style.opacity = 0.55 + v * 0.45;
});
document.addEventListener('mouseup', () => { velDrag.on = false; });

// ==================== STEP TOGGLE ====================
function toggleStep(ti, si) {
  initAudio();
  const t = TRACKS[ti];
  const pat = t.patterns[getPatIdx(t)];
  while (pat.acts.length <= si) { pat.acts.push(false); pat.vels.push(0.8); pat.probs.push(1); }
  pat.acts[si] = !pat.acts[si];
  const el = document.getElementById(`s${ti}_${si}`);
  if (el) {
    el.classList.toggle('active', pat.acts[si]);
    el.style.background = pat.acts[si] ? t.color : '';
    el.style.opacity = pat.acts[si] ? 0.55 + pat.vels[si] * 0.45 : '';
  }
  if (pat.acts[si] && !state.isPlaying) triggerTrack(ti, pat.vels[si], ctx.currentTime);
  // Update only the single velocity bar
  if (ti === state.selectedTrack) updateVelBar(si);
}

// ==================== DRAG-TO-PAINT ====================
let paintState = { active: false, mode: null, trackIdx: null };

function handleGridPointerDown(e) {
  const step = e.target.closest('.step');
  if (!step) return;
  const [ti, si] = step.id.replace('s', '').split('_').map(Number);

  initAudio();
  const t = TRACKS[ti];
  const pat = t.patterns[getPatIdx(t)];
  while (pat.acts.length <= si) { pat.acts.push(false); pat.vels.push(0.8); pat.probs.push(1); }

  pushUndo();

  // Determine paint mode: if step was off, we paint ON; if on, we paint OFF
  const wasActive = pat.acts[si];
  paintState = { active: true, mode: wasActive ? 'off' : 'on', trackIdx: ti, visited: new Set([si]) };

  pat.acts[si] = !wasActive;
  const el = document.getElementById(`s${ti}_${si}`);
  if (el) {
    el.classList.toggle('active', pat.acts[si]);
    el.style.background = pat.acts[si] ? t.color : '';
    el.style.opacity = pat.acts[si] ? 0.55 + pat.vels[si] * 0.45 : '';
  }
  if (pat.acts[si] && !state.isPlaying) triggerTrack(ti, pat.vels[si], ctx.currentTime);
  if (ti === state.selectedTrack) updateVelBar(si);

  e.preventDefault();
}

function handleGridPointerMove(e) {
  if (!paintState.active) return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (!el) return;
  const step = el.closest('.step');
  if (!step) return;
  const [ti, si] = step.id.replace('s', '').split('_').map(Number);
  if (ti !== paintState.trackIdx) return;
  if (paintState.visited.has(si)) return;
  paintState.visited.add(si);

  const t = TRACKS[ti];
  const pat = t.patterns[getPatIdx(t)];
  while (pat.acts.length <= si) { pat.acts.push(false); pat.vels.push(0.8); pat.probs.push(1); }

  const newState = paintState.mode === 'on';
  if (pat.acts[si] === newState) return;
  pat.acts[si] = newState;

  step.classList.toggle('active', newState);
  step.style.background = newState ? t.color : '';
  step.style.opacity = newState ? 0.55 + pat.vels[si] * 0.45 : '';

  if (ti === state.selectedTrack) updateVelBar(si);
}

function handleGridPointerUp() {
  paintState.active = false;
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
function toggleMute(ti) {
  TRACKS[ti].muted = !TRACKS[ti].muted;
  const btn = document.querySelector(`[data-mute="${ti}"]`);
  if (btn) btn.classList.toggle('on', TRACKS[ti].muted);
}

function toggleSolo(ti) {
  TRACKS[ti].soloed = !TRACKS[ti].soloed;
  const btn = document.querySelector(`[data-solo="${ti}"]`);
  if (btn) btn.classList.toggle('on', TRACKS[ti].soloed);
}

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
    b.addEventListener('click', () => switchPattern(i));
    pb.appendChild(b);
  }
}

// ==================== SWITCH PATTERN ====================
export function switchPattern(i) {
  TRACKS.forEach(tr => { tr.pats = Array(8).fill(false); tr.pats[i] = true; });
  state.selectedPat = i;
  renderTracks();
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
  pushUndo();
  const t = TRACKS[state.selectedTrack];
  const pat = t.patterns[getPatIdx(t)];
  const densities = [0.3, 0.5, 0.3, 0.2, 0.45, 0.5, 0.4, 0.35];
  const density = densities[state.selectedTrack] || 0.4;
  for (let i = 0; i < state.currentSteps; i++) {
    pat.acts[i] = Math.random() < density;
    pat.vels[i] = 0.5 + Math.random() * 0.5;
  }
  if (state.selectedTrack === 0) pat.acts[0] = true;
  updateGridRow(state.selectedTrack);
  renderVelStrip();
}

export function mutatePattern() {
  pushUndo();
  const t = TRACKS[state.selectedTrack];
  const pat = t.patterns[getPatIdx(t)];
  const muts = Math.max(1, Math.floor(state.currentSteps * 0.18));
  for (let m = 0; m < muts; m++) {
    const i = Math.floor(Math.random() * state.currentSteps);
    if (Math.random() < 0.6) {
      if (pat.acts.filter(Boolean).length > 2 || !pat.acts[i]) pat.acts[i] = !pat.acts[i];
    } else {
      pat.vels[i] = Math.max(0.15, Math.min(1, pat.vels[i] + (Math.random() * 0.4 - 0.2)));
    }
  }
  updateGridRow(state.selectedTrack);
  renderVelStrip();
}

export function clearPattern() {
  pushUndo();
  const t = TRACKS[state.selectedTrack];
  const pat = t.patterns[getPatIdx(t)];
  pat.acts.fill(false);
  updateGridRow(state.selectedTrack);
  renderVelStrip();
}

export function copyPattern() {
  const t = TRACKS[state.selectedTrack];
  const pat = t.patterns[getPatIdx(t)];
  patternClipboard = {
    acts: [...pat.acts],
    vels: [...pat.vels],
    probs: [...pat.probs],
  };
}

export function pastePattern() {
  if (!patternClipboard) return;
  pushUndo();
  const t = TRACKS[state.selectedTrack];
  const pat = t.patterns[getPatIdx(t)];
  pat.acts = [...patternClipboard.acts];
  pat.vels = [...patternClipboard.vels];
  pat.probs = [...patternClipboard.probs];
  updateGridRow(state.selectedTrack);
  renderVelStrip();
}

let patternClipboard = null;

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

// ==================== EVENT DELEGATION ====================
function initDelegation() {
  cacheDom();

  // Grid: delegated click replaced by pointer events for drag-to-paint
  elGridTracks.addEventListener('pointerdown', handleGridPointerDown);
  document.addEventListener('pointermove', handleGridPointerMove);
  document.addEventListener('pointerup', handleGridPointerUp);

  // Grid: right-click for velocity edit
  elGridTracks.addEventListener('contextmenu', e => {
    e.preventDefault();
    const step = e.target.closest('.step');
    if (!step) return;
    const [ti, si] = step.id.replace('s', '').split('_').map(Number);
    startVelEdit(ti, si);
  });

  // Velocity strip: delegated mousedown
  elVelStrip.addEventListener('mousedown', e => {
    const vb = e.target.closest('.vb');
    if (!vb) return;
    const si = Array.from(elVelStrip.children).indexOf(vb);
    if (si >= 0) startVelDrag(state.selectedTrack, si, e);
  });

  // Track panel: delegated events
  elTrkList.addEventListener('click', e => {
    const nameEl = e.target.closest('.trk-name');
    if (nameEl) { selectTrack(+nameEl.dataset.track); return; }
    const muteBtn = e.target.closest('.tmb');
    if (muteBtn) { e.stopPropagation(); toggleMute(+muteBtn.dataset.mute); return; }
    const soloBtn = e.target.closest('.tsl');
    if (soloBtn) { e.stopPropagation(); toggleSolo(+soloBtn.dataset.solo); return; }
  });

  elTrkList.addEventListener('input', e => {
    const volInput = e.target.closest('.trk-vol');
    if (volInput) { e.stopPropagation(); setTrackVol(+volInput.dataset.vol, volInput.value); }
  });
}

function startVelEdit(ti, si) {
  const pat = TRACKS[ti].patterns[getPatIdx(TRACKS[ti])];
  if (!pat.acts[si]) return;
  selectTrack(ti);
}

// ==================== INIT SEQUENCER CONTROLS ====================
export function initSequencer() {
  initStepButtons();
  initDelegation();
  document.getElementById('btnRandom').addEventListener('click', randomizePattern);
  document.getElementById('btnMutate').addEventListener('click', mutatePattern);
  document.getElementById('btnClear').addEventListener('click', clearPattern);
  document.getElementById('btnAddTrack').addEventListener('click', addTrack);
}
