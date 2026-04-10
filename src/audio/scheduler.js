import { ctx } from './engine.js';
import { triggerTrack } from './synth.js';
import { TRACKS, state } from '../state/store.js';

const lookahead = 25;
const scheduleAheadTime = 0.1;
let nextStepTime = 0;
let stepTimer = null;
let flashQueue = [];

function scheduler() {
  const spb = 60 / state.bpm;
  const s16 = spb / 4;
  while (nextStepTime < ctx.currentTime + scheduleAheadTime) {
    const si = state.currentStep % state.currentSteps;
    const probEl = document.getElementById('probKnob');
    const probVal = probEl ? +probEl.value / 100 : 1;
    const soloOn = TRACKS.some(t => t.soloed);

    TRACKS.forEach((t, ti) => {
      if (t.muted) return;
      if (soloOn && !t.soloed) return;
      const patIdx = t.pats.findIndex(p => p);
      const pat = t.patterns[patIdx < 0 ? 0 : patIdx];
      if (si < pat.acts.length && pat.acts[si]) {
        const prob = (pat.probs[si] || 1) * probVal;
        if (Math.random() < prob) {
          const swOff = (si % 2 === 1 && state.swingAmt > 0) ? state.swingAmt / 100 * s16 * 0.45 : 0;
          triggerTrack(ti, pat.vels[si] || 0.8, nextStepTime + swOff);
        }
      }
    });

    flashQueue.push({ si, time: nextStepTime });
    nextStepTime += s16;
    state.currentStep++;
  }
}

export function startStep() {
  nextStepTime = ctx.currentTime + 0.05;
  stepTimer = setInterval(() => {
    scheduler();

    const si = state.currentStep % state.currentSteps;
    updatePlayhead(si > 0 ? si - 1 : state.currentSteps - 1);

    // Beat indicator flash
    const displaySi = (state.currentStep - 1 + state.currentSteps) % state.currentSteps;
    if (displaySi % 4 === 0) {
      const hdr = document.querySelector('.hdr');
      hdr.classList.remove('beat-flash');
      void hdr.offsetWidth;
      hdr.classList.add('beat-flash');
      if (displaySi === 0) {
        const bv = document.getElementById('bpmVal');
        if (bv) {
          bv.classList.add('downbeat');
          setTimeout(() => bv.classList.remove('downbeat'), 150);
        }
      }
    }

    // Flash playing steps
    TRACKS.forEach((t, ti) => {
      const patIdx = t.pats.findIndex(p => p);
      const pat = t.patterns[patIdx < 0 ? 0 : patIdx];
      const prev = (state.currentStep - 1 + state.currentSteps) % state.currentSteps;
      if (pat.acts[prev]) {
        const el = document.getElementById(`s${ti}_${prev}`);
        if (el) {
          el.classList.add('playing');
          setTimeout(() => el.classList.remove('playing'), 80);
        }
      }
    });
  }, lookahead);
}

export function stopStep() {
  clearInterval(stepTimer);
  stepTimer = null;
}

function updatePlayhead(si) {
  const ph = document.getElementById('playhead');
  if (!ph) return;
  if (si < 0) { ph.style.left = '-4px'; return; }
  const sw = getStepW();
  ph.style.left = (si * sw) + 'px';
}

function getStepW() {
  const gw = document.getElementById('gridScroll')?.offsetWidth || 600;
  return Math.max(22, Math.min(50, Math.floor(gw / state.currentSteps)));
}

export { getStepW, updatePlayhead };
