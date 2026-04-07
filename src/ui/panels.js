import { TRACKS, FX, LP, SC, state } from '../state/store.js';
import { fxParam, toggleFx, toggleSidechain, scParam } from '../audio/fx.js';
import { setDistCurve } from '../audio/engine.js';

// ==================== SYNTH UI ====================
export function updateSynthUI() {
  const t = TRACKS[state.selectedTrack];
  const s = t.sp;
  const synthName = document.getElementById('synthTrackName');
  if (synthName) synthName.textContent = t.name;

  const map = {
    sCutoff: s.cutoff, sRes: s.res,
    sAtk: s.atk, sDec: s.dec,
    sSus: s.sus, sRel: s.rel,
  };
  const valMap = {
    sCutoff: 'vCutoff', sRes: 'vRes',
    sAtk: 'vAtk', sDec: 'vDec',
    sSus: 'vSus', sRel: 'vRel',
  };

  for (const [inputId, value] of Object.entries(map)) {
    const el = document.getElementById(inputId);
    const valEl = document.getElementById(valMap[inputId]);
    if (el) el.value = value;
    if (valEl) valEl.textContent = value;
  }

  const envModEl = document.getElementById('vEnvMod');
  if (envModEl) envModEl.textContent = s.envmod;
  const detuneEl = document.getElementById('vDetune');
  if (detuneEl) detuneEl.textContent = s.detune || 0;

  // Wave buttons
  document.querySelectorAll('#waveBtns .wb').forEach(b => {
    const w = b.dataset.wave;
    b.classList.toggle('on',
      w === s.wave ||
      (w === 'sawtooth' && ['kick', 'hat', 'clap', 'openhat'].includes(s.wave))
    );
  });
}

export function synthParam(p, el) {
  const v = +(typeof el === 'object' ? el.value : el);
  TRACKS[state.selectedTrack].sp[p] = v;
  const valMap = {
    cutoff: 'vCutoff', res: 'vRes',
    atk: 'vAtk', dec: 'vDec',
    sus: 'vSus', rel: 'vRel',
    envmod: 'vEnvMod', detune: 'vDetune',
  };
  if (valMap[p]) document.getElementById(valMap[p]).textContent = v;
}

function setWave(w, btn) {
  TRACKS[state.selectedTrack].sp.wave = w;
  document.querySelectorAll('#waveBtns .wb').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
}

function lfoParam(p, el) {
  LP[p] = el.tagName === 'SELECT' ? el.value : +el.value;
  const valMap = { rate: 'vLRate', depth: 'vLDepth' };
  if (valMap[p]) {
    document.getElementById(valMap[p]).textContent = parseFloat(el.value).toFixed(p === 'rate' ? 1 : 0);
  }
}

function setLfoWave(w, btn) {
  LP.wave = w;
  document.querySelectorAll('#lfoBtns .wb').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
}

// ==================== INIT PANELS ====================
export function initPanels() {
  // Synth params
  const synthParams = [
    ['sCutoff', 'cutoff'], ['sRes', 'res'],
    ['sAtk', 'atk'], ['sDec', 'dec'],
    ['sSus', 'sus'], ['sRel', 'rel'],
  ];
  synthParams.forEach(([id, param]) => {
    document.getElementById(id).addEventListener('input', function () {
      synthParam(param, this);
    });
  });

  // Env mod & detune
  document.getElementById('envMod').addEventListener('input', function () {
    synthParam('envmod', this);
  });
  document.getElementById('sDetune').addEventListener('input', function () {
    synthParam('detune', this);
  });

  // Wave buttons
  document.querySelectorAll('#waveBtns .wb').forEach(btn => {
    btn.addEventListener('click', () => setWave(btn.dataset.wave, btn));
  });

  // LFO wave buttons
  document.querySelectorAll('#lfoBtns .wb').forEach(btn => {
    btn.addEventListener('click', () => setLfoWave(btn.dataset.lfoWave, btn));
  });

  // LFO params
  document.getElementById('lfoRate').addEventListener('input', function () { lfoParam('rate', this); });
  document.getElementById('lfoDepth').addEventListener('input', function () { lfoParam('depth', this); });
  document.getElementById('lfoTarget').addEventListener('change', function () { lfoParam('target', this); });

  // FX toggles
  document.querySelectorAll('.fx-row .fxb[data-fx]').forEach(btn => {
    btn.addEventListener('click', () => {
      const isOn = toggleFx(btn.dataset.fx);
      btn.classList.toggle('on', isOn);
    });
  });

  // FX params
  const fxParams = [
    ['fxDistAmt', 'distAmt'], ['fxRevSz', 'revSz'], ['fxRevMix', 'revMix'],
    ['fxDlyT', 'dlyT'], ['fxDlyFb', 'dlyFb'],
  ];
  fxParams.forEach(([id, param]) => {
    document.getElementById(id).addEventListener('input', function () {
      fxParam(param, this.value);
      const valMap = {
        distAmt: 'vDistAmt', revSz: 'vRevSz', revMix: 'vRevMix',
        dlyT: 'vDlyT', dlyFb: 'vDlyFb',
      };
      if (valMap[param]) document.getElementById(valMap[param]).textContent = this.value;
    });
  });

  // Sidechain
  document.getElementById('scBtn').addEventListener('click', () => {
    const isOn = toggleSidechain();
    const btn = document.getElementById('scBtn');
    btn.classList.toggle('on', isOn);
    btn.textContent = isOn ? 'ON' : 'OFF';
  });

  // Sidechain params
  const scParams = [['scAmt', 'amt'], ['scAtk', 'atk'], ['scRel', 'rel']];
  scParams.forEach(([id, param]) => {
    document.getElementById(id).addEventListener('input', function () {
      scParam(param, this.value);
      const valMap = { amt: 'vScAmt', atk: 'vScAtk', rel: 'vScRel' };
      if (valMap[param]) document.getElementById(valMap[param]).textContent = this.value;
    });
  });

  // Compressor params
  document.getElementById('compThr').addEventListener('input', function () {
    fxParam('compThr', this.value);
    document.getElementById('vCompThr').textContent = this.value;
  });
  document.getElementById('compRat').addEventListener('input', function () {
    fxParam('compRat', this.value);
    document.getElementById('vCompRat').textContent = this.value;
  });
}
