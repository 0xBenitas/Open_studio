// ==================== STYLES ====================
import './styles/main.css';
import './styles/header.css';
import './styles/sequencer.css';
import './styles/piano-roll.css';
import './styles/mixer.css';
import './styles/live.css';
import './styles/panels.css';

// ==================== MODULES ====================
import { TRACKS, state, toggleRec } from './state/store.js';
import { initHeader, handleTogglePlay, handleStop } from './ui/header.js';
import { renderTracks, initSequencer, selectTrack, switchPattern, copyPattern, pastePattern, clearPattern, randomizePattern, mutatePattern } from './ui/sequencer.js';
import { initPianoRoll } from './ui/piano-roll.js';
import { initPanels } from './ui/panels.js';
import { undo, redo } from './utils/history.js';
import { invalidateStepWCache } from './audio/scheduler.js';

// ==================== INIT ====================
initHeader();
initSequencer();
initPianoRoll();
initPanels();
renderTracks();

// Populate piano roll track selector
setTimeout(() => {
  const tSel = document.getElementById('prTrackSel');
  if (tSel && !tSel.options.length) {
    TRACKS.forEach((t, i) => tSel.add(new Option(t.name, i)));
  }
}, 50);

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

  // Transport
  if (e.code === 'Space') { e.preventDefault(); handleTogglePlay(); }
  if (e.code === 'Escape') handleStop();
  if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
    toggleRec();
    document.getElementById('btnRec').classList.toggle('on', state.isRec);
  }

  // Pattern selection: 1-8
  if (e.code >= 'Digit1' && e.code <= 'Digit8' && !e.ctrlKey && !e.metaKey) {
    const patIdx = +e.code.replace('Digit', '') - 1;
    switchPattern(patIdx);
  }

  // Mute/Solo selected track
  if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey) {
    TRACKS[state.selectedTrack].muted = !TRACKS[state.selectedTrack].muted;
    const btn = document.querySelector(`[data-mute="${state.selectedTrack}"]`);
    if (btn) btn.classList.toggle('on', TRACKS[state.selectedTrack].muted);
  }
  if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
    TRACKS[state.selectedTrack].soloed = !TRACKS[state.selectedTrack].soloed;
    const btn = document.querySelector(`[data-solo="${state.selectedTrack}"]`);
    if (btn) btn.classList.toggle('on', TRACKS[state.selectedTrack].soloed);
  }

  // Undo/Redo
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
    e.preventDefault();
    undo(renderTracks);
  }
  if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey))) {
    e.preventDefault();
    redo(renderTracks);
  }

  // Copy/Paste pattern
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyC') {
    e.preventDefault();
    copyPattern();
  }
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyV') {
    e.preventDefault();
    pastePattern();
  }

  // Delete/Backspace to clear pattern
  if (e.code === 'Delete' || e.code === 'Backspace') {
    e.preventDefault();
    clearPattern();
  }

  // Arrow up/down to switch track
  if (e.code === 'ArrowUp' && state.selectedTrack > 0) {
    e.preventDefault();
    selectTrack(state.selectedTrack - 1);
  }
  if (e.code === 'ArrowDown' && state.selectedTrack < TRACKS.length - 1) {
    e.preventDefault();
    selectTrack(state.selectedTrack + 1);
  }
});

// ==================== RESIZE (DEBOUNCED) ====================
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  invalidateStepWCache();
  resizeTimer = setTimeout(renderTracks, 150);
});
