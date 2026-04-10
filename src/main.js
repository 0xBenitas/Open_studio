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
import { renderTracks, initSequencer } from './ui/sequencer.js';
import { initPianoRoll } from './ui/piano-roll.js';
import { initPanels } from './ui/panels.js';

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
  if (e.code === 'Space') { e.preventDefault(); handleTogglePlay(); }
  if (e.code === 'Escape') handleStop();
  if (e.code === 'KeyR') {
    toggleRec();
    document.getElementById('btnRec').classList.toggle('on', state.isRec);
  }
});

// ==================== RESIZE ====================
window.addEventListener('resize', () => renderTracks());
