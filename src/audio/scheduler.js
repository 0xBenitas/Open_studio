import { ctx } from './engine.js';
import { triggerTrack } from './synth.js';
import { TRACKS, state } from '../state/store.js';
import { getPatIdx } from '../utils/helpers.js';

const lookahead = 25;
const scheduleAheadTime = 0.1;
let nextStepTime = 0;
let stepTimer = null;

// ==================== CACHED DOM REFS ====================
let cachedProbEl = null;
let cachedHdr = null;
let cachedBpmVal = null;
let cachedPlayhead = null;
let cachedGridScroll = null;
let cachedStepW = 0;

function cacheSchedulerDOM() {
  cachedProbEl = document.getElementById('probKnob');
  cachedHdr = document.querySelector('.hdr');
  cachedBpmVal = document.getElementById('bpmVal');
  cachedPlayhead = document.getElementById('playhead');
  cachedGridScroll = document.getElementById('gridScroll');
  cachedStepW = computeStepW();
}

export function invalidateStepWCache() {
  cachedStepW = 0;
}

function computeStepW() {
  const gw = cachedGridScroll?.offsetWidth || document.getElementById('gridScroll')?.offsetWidth || 600;
  return Math.max(22, Math.min(50, Math.floor(gw / state.currentSteps)));
}

function scheduler() {
  const spb = 60 / state.bpm;
  const s16 = spb / 4;
  while (nextStepTime < ctx.currentTime + scheduleAheadTime) {
    const si = state.currentStep % state.currentSteps;
    const probVal = cachedProbEl ? +cachedProbEl.value / 100 : 1;
    const soloOn = TRACKS.some(t => t.soloed);

    TRACKS.forEach((t, ti) => {
      if (t.muted) return;
      if (soloOn && !t.soloed) return;
      const pat = t.patterns[getPatIdx(t)];
      if (si < pat.acts.length && pat.acts[si]) {
        const prob = (pat.probs[si] || 1) * probVal;
        if (Math.random() < prob) {
          const swOff = (si % 2 === 1 && state.swingAmt > 0) ? state.swingAmt / 100 * s16 * 0.45 : 0;
          triggerTrack(ti, pat.vels[si] || 0.8, nextStepTime + swOff);
        }
      }
    });

    nextStepTime += s16;
    state.currentStep++;
  }
}

export function startStep() {
  cacheSchedulerDOM();
  nextStepTime = ctx.currentTime + 0.05;
  stepTimer = setInterval(() => {
    scheduler();

    const si = state.currentStep % state.currentSteps;
    updatePlayhead(si > 0 ? si - 1 : state.currentSteps - 1);

    // Beat indicator flash (no forced reflow)
    const displaySi = (state.currentStep - 1 + state.currentSteps) % state.currentSteps;
    if (displaySi % 4 === 0 && cachedHdr) {
      cachedHdr.classList.remove('beat-flash');
      requestAnimationFrame(() => {
        if (cachedHdr) cachedHdr.classList.add('beat-flash');
      });
      if (displaySi === 0 && cachedBpmVal) {
        cachedBpmVal.classList.add('downbeat');
        setTimeout(() => { if (cachedBpmVal) cachedBpmVal.classList.remove('downbeat'); }, 150);
      }
    }

    // Flash playing steps - batched
    const prev = (state.currentStep - 1 + state.currentSteps) % state.currentSteps;
    const flashEls = [];
    TRACKS.forEach((t, ti) => {
      const pat = t.patterns[getPatIdx(t)];
      if (pat.acts[prev]) {
        const el = document.getElementById(`s${ti}_${prev}`);
        if (el) flashEls.push(el);
      }
    });
    if (flashEls.length > 0) {
      flashEls.forEach(el => el.classList.add('playing'));
      setTimeout(() => flashEls.forEach(el => el.classList.remove('playing')), 80);
    }
  }, lookahead);
}

export function stopStep() {
  clearInterval(stepTimer);
  stepTimer = null;
}

function updatePlayhead(si) {
  if (!cachedPlayhead) cachedPlayhead = document.getElementById('playhead');
  if (!cachedPlayhead) return;
  if (si < 0) { cachedPlayhead.style.left = '-4px'; return; }
  if (!cachedStepW) cachedStepW = computeStepW();
  cachedPlayhead.style.left = (si * cachedStepW) + 'px';
}

function getStepW() {
  if (cachedStepW) return cachedStepW;
  cachedStepW = computeStepW();
  return cachedStepW;
}

export { getStepW, updatePlayhead };
