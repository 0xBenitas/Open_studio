import { TRACKS, state, setSelectedTrack, setCurrentSteps } from '../state/store.js';
import { makePat, makeNoteGrid, getPatIdx } from '../utils/helpers.js';
import { initAudio, ctx } from '../audio/engine.js';
import { triggerTrack } from '../audio/synth.js';
import { updateSynthUI } from './panels.js';
import { pushUndo } from '../utils/history.js';
import { KICK_PRESETS, CLAP_PRESETS, HAT_PRESETS, OPENHAT_PRESETS } from '../utils/constants.js';

// Calm track hues (design tokens) keyed by lane index; fallback = accent.
const TRK_VARS = ['--trk-kick', '--trk-hat', '--trk-clap', '--trk-openhh', '--trk-bass', '--trk-acid', '--trk-syn1', '--trk-syn2'];
const trackVar = ti => `var(${TRK_VARS[ti] || '--accent'})`;

function velClass(v) { return v < 0.6 ? ' v-soft' : (v < 0.82 ? ' v-mid' : ''); }

// ==================== CACHED DOM REFS ====================
let elLanes, elRuler, elVelStrip;

function cacheDom() {
  elLanes = document.getElementById('lanes');
  elRuler = document.getElementById('ruler');
  elVelStrip = document.getElementById('velStrip');
}

// ==================== RENDER TRACKS ====================
export function renderTracks() {
  if (!elLanes) cacheDom();
  if (!elLanes || !elRuler) return;
  const n = state.currentSteps;
  elLanes.style.setProperty('--steps', n);
  elRuler.style.setProperty('--steps', n);
  elLanes.innerHTML = '';
  elRuler.innerHTML = '';

  // ruler
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    if (i % 4 === 0) { s.className = 'b'; s.textContent = (i / 4 + 1); }
    elRuler.appendChild(s);
  }

  const lbl = document.getElementById('laneHeadLbl');
  if (lbl) lbl.textContent = `${TRACKS.length} piste${TRACKS.length > 1 ? 's' : ''} · ${state.currentKey || ''}`.trim();

  TRACKS.forEach((t, ti) => {
    const lane = document.createElement('div');
    lane.className = 'lane' + (ti === state.selectedTrack ? ' sel' : '');
    lane.dataset.track = ti;
    lane.style.setProperty('--tc', trackVar(ti));

    const info = document.createElement('div');
    info.className = 'info';
    info.innerHTML = `<span class="dot"></span>
      <div><div class="nm" data-track="${ti}">${t.name}</div><div class="ins">${instLabel(t)}</div></div>
      <div class="ctl"><div class="ms"><button class="m${t.muted ? ' on' : ''}" data-mute="${ti}">M</button><button class="s${t.soloed ? ' on' : ''}" data-solo="${ti}">S</button></div>
      <input type="range" class="slider vol-mini" min="0" max="100" value="${Math.round(t.vol * 100)}" data-vol="${ti}"></div>`;

    const steps = document.createElement('div');
    steps.className = 'steps';
    const pat = t.patterns[getPatIdx(t)];
    for (let i = 0; i < n; i++) {
      const cell = document.createElement('div');
      const act = i < pat.acts.length && pat.acts[i];
      const vel = i < pat.vels.length ? pat.vels[i] : 0.8;
      cell.className = 'step' + (i % 4 === 0 ? ' beat' : '') + (act ? ' on' + velClass(vel) : '');
      cell.id = `s${ti}_${i}`;
      steps.appendChild(cell);
    }
    lane.appendChild(info);
    lane.appendChild(steps);
    elLanes.appendChild(lane);
  });

  renderVelStrip();
  renderPatBtns();
  updateSynthUI();
}

function instLabel(t) {
  const w = t.sp?.wave;
  if (w === 'kick') return KICK_PRESETS[t.kickPreset || 0]?.name || 'KICK';
  if (w === 'clap') return CLAP_PRESETS[t.clapPreset || 0]?.name || 'CLAP';
  if (w === 'hat') return HAT_PRESETS[t.hatPreset || 0]?.name || 'HAT';
  if (w === 'openhat') return OPENHAT_PRESETS[t.hatPreset || 0]?.name || 'OPEN HH';
  return ({ sawtooth: 'SAW', square: 'SQ', sine: 'SIN', triangle: 'TRI' })[w] || (w || '');
}

// apply on/velocity classes to one step cell
function paintCell(el, act, vel) {
  el.classList.toggle('on', act);
  el.classList.remove('v-soft', 'v-mid');
  if (act && vel < 0.6) el.classList.add('v-soft');
  else if (act && vel < 0.82) el.classList.add('v-mid');
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
    paintCell(el, act, vel);
  }
}

// ==================== VELOCITY STRIP ====================
export function renderVelStrip() {
  if (!elVelStrip) elVelStrip = document.getElementById('velStrip');
  if (!elVelStrip) return;
  const t = TRACKS[state.selectedTrack];
  elVelStrip.style.setProperty('--steps', state.currentSteps);
  elVelStrip.style.setProperty('--tc', trackVar(state.selectedTrack));
  elVelStrip.innerHTML = '';
  const pat = t.patterns[getPatIdx(t)];
  for (let i = 0; i < state.currentSteps; i++) {
    const act = i < pat.acts.length && pat.acts[i];
    const vel = i < pat.vels.length ? pat.vels[i] : 0.5;
    const b = document.createElement('i');
    b.id = `vb_${i}`;
    if (act) b.style.height = Math.round(vel * 44 + 4) + 'px';
    else b.className = 'off';
    elVelStrip.appendChild(b);
  }
  const vn = document.getElementById('velTrkName');
  if (vn) vn.textContent = t.name;
}

function updateVelBar(si) {
  const t = TRACKS[state.selectedTrack];
  const pat = t.patterns[getPatIdx(t)];
  const vb = document.getElementById(`vb_${si}`);
  if (!vb) return;
  const act = si < pat.acts.length && pat.acts[si];
  const vel = si < pat.vels.length ? pat.vels[si] : 0.5;
  vb.className = act ? '' : 'off';
  vb.style.height = act ? Math.round(vel * 44 + 4) + 'px' : '';
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
  const vb = document.getElementById(`vb_${si}`);
  if (vb && pat.acts[si]) vb.style.height = Math.round(v * 44 + 4) + 'px';
  const el = document.getElementById(`s${ti}_${si}`);
  if (el && pat.acts[si]) paintCell(el, true, v);
});
document.addEventListener('mouseup', () => { velDrag.on = false; });

// ==================== DRAG-TO-PAINT ====================
let paintState = { active: false, mode: null, trackIdx: null };

function handleGridPointerDown(e) {
  const step = e.target.closest('.step');
  if (!step) return;
  const [ti, si] = step.id.replace('s', '').split('_').map(Number);

  initAudio();
  selectTrack(ti);
  const t = TRACKS[ti];
  const pat = t.patterns[getPatIdx(t)];
  while (pat.acts.length <= si) { pat.acts.push(false); pat.vels.push(0.8); pat.probs.push(1); }

  pushUndo();
  const wasActive = pat.acts[si];
  paintState = { active: true, mode: wasActive ? 'off' : 'on', trackIdx: ti, visited: new Set([si]) };

  pat.acts[si] = !wasActive;
  paintCell(step, pat.acts[si], pat.vels[si]);
  if (pat.acts[si] && !state.isPlaying) triggerTrack(ti, pat.vels[si], ctx.currentTime);
  updateVelBar(si);
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
  paintCell(step, newState, pat.vels[si]);
  updateVelBar(si);
}

function handleGridPointerUp() { paintState.active = false; }

// ==================== TRACK SELECTION ====================
export function selectTrack(ti) {
  setSelectedTrack(ti);
  document.querySelectorAll('.lane').forEach(l => l.classList.toggle('sel', +l.dataset.track === ti));
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

// ==================== PATTERN BUTTONS (A–H) ====================
const PAT_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export function renderPatBtns() {
  const pb = document.getElementById('patBtns');
  if (!pb) return;
  pb.innerHTML = '';
  const t = TRACKS[state.selectedTrack];
  for (let i = 0; i < 8; i++) {
    const b = document.createElement('button');
    const isActive = t.pats[i];
    const hasDat = t.patterns[i].acts.some(a => a);
    b.className = 'pat' + (isActive ? ' on' : hasDat ? ' has' : '');
    b.textContent = PAT_LABELS[i];
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
      const num = +btn.dataset.steps;
      setCurrentSteps(num);
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

let patternClipboard = null;
export function copyPattern() {
  const t = TRACKS[state.selectedTrack];
  const pat = t.patterns[getPatIdx(t)];
  patternClipboard = { acts: [...pat.acts], vels: [...pat.vels], probs: [...pat.probs] };
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

// ==================== INSTRUMENT PICKER ====================
let pickerEl = null;

const INSTRUMENT_CATEGORIES = [
  { name: 'KICKS', icon: '⬤', wave: 'kick', presets: KICK_PRESETS, presetKey: 'kickPreset', color: '#00ffd2' },
  { name: 'CLAPS', icon: '✋', wave: 'clap', presets: CLAP_PRESETS, presetKey: 'clapPreset', color: '#ff8a00' },
  { name: 'HI-HATS', icon: '▲', wave: 'hat', presets: HAT_PRESETS, presetKey: 'hatPreset', color: '#ffd600' },
  { name: 'OPEN HH', icon: '◇', wave: 'openhat', presets: OPENHAT_PRESETS, presetKey: 'hatPreset', color: '#ff44cc' },
  { name: 'SYNTHS', icon: '♪', items: [
    { name: 'SAW', wave: 'sawtooth', color: '#a855f7' },
    { name: 'SQUARE', wave: 'square', color: '#00b4ff' },
    { name: 'SINE', wave: 'sine', color: '#22dd88' },
    { name: 'TRIANGLE', wave: 'triangle', color: '#ff3355' },
  ]},
];

function createPicker() {
  pickerEl = document.createElement('div');
  pickerEl.className = 'inst-picker';
  pickerEl.id = 'instPicker';

  INSTRUMENT_CATEGORIES.forEach(cat => {
    const catDiv = document.createElement('div');
    catDiv.className = 'inst-cat';
    const hdr = document.createElement('div');
    hdr.className = 'inst-cat-hdr';
    hdr.innerHTML = `<span class="cat-icon">${cat.icon}</span>${cat.name}`;
    catDiv.appendChild(hdr);
    const grid = document.createElement('div');
    grid.className = 'inst-cat-grid';
    if (cat.presets) {
      cat.presets.forEach((preset, idx) => {
        const item = document.createElement('div');
        item.className = 'inst-item';
        item.textContent = preset.name;
        item.dataset.wave = cat.wave;
        item.dataset.presetKey = cat.presetKey;
        item.dataset.presetIdx = idx;
        item.dataset.color = cat.color;
        item.dataset.instName = preset.name;
        grid.appendChild(item);
      });
    } else if (cat.items) {
      cat.items.forEach(s => {
        const item = document.createElement('div');
        item.className = 'inst-item';
        item.textContent = s.name;
        item.dataset.wave = s.wave;
        item.dataset.color = s.color;
        item.dataset.instName = s.name;
        grid.appendChild(item);
      });
    }
    catDiv.appendChild(grid);
    pickerEl.appendChild(catDiv);
  });

  pickerEl.addEventListener('click', e => {
    const item = e.target.closest('.inst-item');
    if (!item) return;
    const ti = +pickerEl.dataset.trackIdx;
    const t = TRACKS[ti];
    t.sp.wave = item.dataset.wave;
    t.color = item.dataset.color;
    t.name = item.dataset.instName;
    if (item.dataset.presetKey) t[item.dataset.presetKey] = +item.dataset.presetIdx;
    closePicker();
    renderTracks();
  });

  document.body.appendChild(pickerEl);

  document.addEventListener('mousedown', e => {
    if (pickerEl && pickerEl.classList.contains('open') && !pickerEl.contains(e.target) && !e.target.closest('.nm')) {
      closePicker();
    }
  });
}

function openPicker(ti, anchorEl) {
  if (!pickerEl) createPicker();
  const t = TRACKS[ti];
  pickerEl.dataset.trackIdx = ti;
  pickerEl.querySelectorAll('.inst-item').forEach(item => {
    let isActive = false;
    if (item.dataset.presetKey) {
      isActive = item.dataset.wave === t.sp.wave && +item.dataset.presetIdx === (t[item.dataset.presetKey] || 0);
    } else {
      isActive = item.dataset.wave === t.sp.wave && !['kick', 'clap', 'hat', 'openhat'].includes(t.sp.wave);
    }
    item.classList.toggle('active', isActive);
  });
  const rect = anchorEl.getBoundingClientRect();
  pickerEl.style.left = (rect.right + 8) + 'px';
  pickerEl.style.top = Math.min(rect.top, window.innerHeight - 440) + 'px';
  pickerEl.classList.add('open');
}

function closePicker() { if (pickerEl) pickerEl.classList.remove('open'); }

// ==================== EVENT DELEGATION ====================
function initDelegation() {
  cacheDom();

  // Steps: paint
  elLanes.addEventListener('pointerdown', handleGridPointerDown);
  document.addEventListener('pointermove', handleGridPointerMove);
  document.addEventListener('pointerup', handleGridPointerUp);

  // Right-click velocity edit
  elLanes.addEventListener('contextmenu', e => {
    const step = e.target.closest('.step');
    if (!step) return;
    e.preventDefault();
    const [ti] = step.id.replace('s', '').split('_').map(Number);
    selectTrack(ti);
  });

  // Lane info: select / instrument picker / mute / solo
  elLanes.addEventListener('click', e => {
    const muteBtn = e.target.closest('[data-mute]');
    if (muteBtn) { e.stopPropagation(); toggleMute(+muteBtn.dataset.mute); return; }
    const soloBtn = e.target.closest('[data-solo]');
    if (soloBtn) { e.stopPropagation(); toggleSolo(+soloBtn.dataset.solo); return; }
    const nameEl = e.target.closest('.nm');
    if (nameEl) { const ti = +nameEl.dataset.track; selectTrack(ti); openPicker(ti, nameEl); return; }
    if (e.target.closest('.step')) return; // handled by pointerdown
    if (e.target.closest('.vol-mini')) return;
    const lane = e.target.closest('.lane');
    if (lane) selectTrack(+lane.dataset.track);
  });

  elLanes.addEventListener('input', e => {
    const volInput = e.target.closest('.vol-mini');
    if (volInput) { e.stopPropagation(); setTrackVol(+volInput.dataset.vol, volInput.value); }
  });

  // Velocity strip drag
  elVelStrip.addEventListener('mousedown', e => {
    const bar = e.target.closest('i');
    if (!bar || !elVelStrip.contains(bar)) return;
    const si = Array.from(elVelStrip.children).indexOf(bar);
    if (si >= 0) startVelDrag(state.selectedTrack, si, e);
  });
}

// ==================== INIT ====================
export function initSequencer() {
  initStepButtons();
  initDelegation();
  document.getElementById('btnRandom').addEventListener('click', randomizePattern);
  document.getElementById('btnMutate').addEventListener('click', mutatePattern);
  document.getElementById('btnClear').addEventListener('click', clearPattern);
  document.getElementById('btnAddTrack').addEventListener('click', addTrack);
  // Quantize / Gen mélodie : ces outils vivent sur l'écran Piano Roll (boutons #btnQuantize / #btnGenMelody).
  const q = document.getElementById('btnSeqQuant');
  const g = document.getElementById('btnSeqGen');
  if (q) q.addEventListener('click', () => document.querySelector('.htab[data-view="piano"]')?.click());
  if (g) g.addEventListener('click', () => document.querySelector('.htab[data-view="piano"]')?.click());
}
