import { state, setBpm, setSwing, setMasterVolume, cycleKey, togglePlay, stopPlayback, toggleRec, saveProject, loadProject, listProjects } from '../state/store.js';
import { initAudio, ctx } from '../audio/engine.js';
import { startStep, stopStep, updatePlayhead } from '../audio/scheduler.js';
import { renderPianoRoll } from './piano-roll.js';
import { renderMixer, startVU } from './mixer.js';
import { renderLive } from './live.js';
import { renderTracks } from './sequencer.js';
import { updateSynthUI } from './panels.js';

export function initHeader() {
  // Transport buttons
  document.getElementById('btnPlay').addEventListener('click', handleTogglePlay);
  document.getElementById('btnStop').addEventListener('click', handleStop);
  document.getElementById('btnRec').addEventListener('click', handleToggleRec);

  // BPM drag
  const bpmEl = document.getElementById('bpmVal');
  let bpmDrag = { on: false };
  bpmEl.addEventListener('mousedown', e => {
    bpmDrag = { on: true, sy: e.clientY, sb: state.bpm };
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!bpmDrag.on) return;
    const newBpm = Math.max(60, Math.min(220, Math.round(bpmDrag.sb - (e.clientY - bpmDrag.sy) * 0.5)));
    setBpm(newBpm);
    bpmEl.textContent = state.bpm;
  });
  document.addEventListener('mouseup', () => { bpmDrag.on = false; });

  // Swing
  document.getElementById('swingKnob').addEventListener('input', function () {
    setSwing(this.value);
    document.getElementById('swingVal').textContent = this.value;
  });

  // Probability
  document.getElementById('probKnob').addEventListener('input', function () {
    document.getElementById('probVal').textContent = this.value;
  });

  // Master volume
  document.getElementById('masterVol').addEventListener('input', function () {
    setMasterVolume(this.value);
    document.getElementById('mvVal').textContent = this.value;
  });

  // Key selector
  document.getElementById('keyDisplay').addEventListener('click', () => {
    cycleKey();
    document.getElementById('keyDisplay').textContent = state.currentKey + ' \u25B8';
    if (document.getElementById('vpiano').classList.contains('on')) renderPianoRoll();
  });

  // View tabs
  document.querySelectorAll('.htab[data-view]').forEach(tab => {
    tab.addEventListener('click', () => showView(tab.dataset.view, tab));
  });

  // Save / Load
  document.getElementById('btnSave').addEventListener('click', () => {
    const name = prompt('Project name:', 'My Project');
    if (name) {
      saveProject(name);
      alert('Project "' + name + '" saved!');
    }
  });
  document.getElementById('btnLoad').addEventListener('click', () => {
    const projects = listProjects();
    if (projects.length === 0) {
      alert('No saved projects found.');
      return;
    }
    const name = prompt('Load project:\n\nSaved projects:\n' + projects.map((p, i) => (i + 1) + '. ' + p).join('\n') + '\n\nEnter name:');
    if (name) {
      if (loadProject(name)) {
        refreshUI();
        alert('Project "' + name + '" loaded!');
      } else {
        alert('Project "' + name + '" not found.');
      }
    }
  });
}

export function handleTogglePlay() {
  initAudio();
  if (ctx.state === 'suspended') ctx.resume();
  togglePlay();
  const btn = document.getElementById('btnPlay');
  btn.textContent = state.isPlaying ? '\u23F8' : '\u25B6';
  btn.classList.toggle('on', state.isPlaying);
  if (state.isPlaying) {
    state.currentStep = 0;
    startStep();
  } else {
    stopStep();
    updatePlayhead(-1);
  }
}

export function handleStop() {
  stopPlayback();
  stopStep();
  const btn = document.getElementById('btnPlay');
  btn.textContent = '\u25B6';
  btn.classList.remove('on');
  updatePlayhead(-1);
}

function handleToggleRec() {
  toggleRec();
  document.getElementById('btnRec').classList.toggle('on', state.isRec);
}

function refreshUI() {
  document.getElementById('bpmVal').textContent = state.bpm;
  document.getElementById('swingKnob').value = state.swingAmt;
  document.getElementById('swingVal').textContent = state.swingAmt;
  document.getElementById('masterVol').value = Math.round(state.masterVolume * 100);
  document.getElementById('mvVal').textContent = Math.round(state.masterVolume * 100);
  document.getElementById('keyDisplay').textContent = state.currentKey + ' \u25B8';
  renderTracks();
  updateSynthUI();
}

function showView(v, btn) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('on'));
  document.querySelectorAll('.htab').forEach(b => b.classList.remove('on'));
  document.getElementById('v' + v).classList.add('on');
  btn.classList.add('on');
  if (v === 'piano') renderPianoRoll();
  if (v === 'mix') { renderMixer(); startVU(); }
  if (v === 'live') renderLive();
}
