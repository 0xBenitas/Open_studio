import { TRACKS, LP, state } from '../state/store.js';
import { fxParam, toggleFx, toggleSidechain, scParam } from '../audio/fx.js';
import { KICK_PRESETS, CLAP_PRESETS, HAT_PRESETS, OPENHAT_PRESETS } from '../utils/constants.js';

// ==================== SYNTH UI ====================
export function updateSynthUI() {
  const t = TRACKS[state.selectedTrack];
  const s = t.sp;
  const synthName = document.getElementById('synthTrackName');
  if (synthName) synthName.textContent = t.name;

  // Drawer header: track colour dot + waveform pill
  const TRK_VARS = ['--trk-kick', '--trk-hat', '--trk-clap', '--trk-openhh', '--trk-bass', '--trk-acid', '--trk-syn1', '--trk-syn2'];
  const dotVar = `var(${TRK_VARS[state.selectedTrack] || '--accent'})`;
  const selDot = document.getElementById('selDot');
  if (selDot) selDot.style.background = dotVar;
  const selWaveDot = document.getElementById('selWaveDot');
  if (selWaveDot) selWaveDot.style.background = dotVar;
  const waveLbl = ({ sawtooth: 'SAW', square: 'SQ', sine: 'SIN', triangle: 'TRI', kick: 'KICK', clap: 'CLAP', hat: 'HAT', openhat: 'OPEN HH' })[s.wave] || (s.wave || '').toUpperCase();
  const selWaveLbl = document.getElementById('selWaveLbl');
  if (selWaveLbl) selWaveLbl.textContent = waveLbl;

  // Mobile soundbar (ouvre le bottom-sheet)
  const sbDot = document.getElementById('sbDot');
  if (sbDot) sbDot.style.background = dotVar;
  const sbName = document.getElementById('sbName');
  if (sbName) sbName.textContent = t.name;
  const sbDesc = document.getElementById('sbDesc');
  if (sbDesc) sbDesc.textContent = `${waveLbl} · cutoff ${s.cutoff} Hz`;

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

  // Show/hide drum preset rows
  const presetRows = [
    { id: 'kickPresetRow', wave: 'kick', btnsId: 'kickPresetBtns', attr: 'kick', key: 'kickPreset' },
    { id: 'clapPresetRow', wave: 'clap', btnsId: 'clapPresetBtns', attr: 'clap', key: 'clapPreset' },
    { id: 'hatPresetRow', wave: 'hat', btnsId: 'hatPresetBtns', attr: 'hat', key: 'hatPreset' },
    { id: 'openhatPresetRow', wave: 'openhat', btnsId: 'openhatPresetBtns', attr: 'openhat', key: 'hatPreset' },
  ];
  presetRows.forEach(({ id, wave, btnsId, attr, key }) => {
    const row = document.getElementById(id);
    if (!row) return;
    row.style.display = s.wave === wave ? 'flex' : 'none';
    if (s.wave === wave) {
      const idx = t[key] || 0;
      document.querySelectorAll(`#${btnsId} .wb`).forEach(b => {
        b.classList.toggle('on', +b.dataset[attr] === idx);
      });
    }
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
  // Update drum preset visibility
  const rows = { kickPresetRow: 'kick', clapPresetRow: 'clap', hatPresetRow: 'hat', openhatPresetRow: 'openhat' };
  Object.entries(rows).forEach(([id, wave]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = w === wave ? 'flex' : 'none';
  });
}

function setKickPreset(idx, btn) {
  const t = TRACKS[state.selectedTrack];
  if (t.sp.wave !== 'kick') return;
  t.kickPreset = idx;
  document.querySelectorAll('#kickPresetBtns .wb').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
}

function setDrumPreset(key, idx, btnsSelector, dataAttr, btn) {
  const t = TRACKS[state.selectedTrack];
  t[key] = idx;
  document.querySelectorAll(`${btnsSelector} .wb`).forEach(b => b.classList.remove('on'));
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

// ==================== DRAWER TABS (Synthèse / LFO / FX / Sidechain) ====================
function initDrawerTabs() {
  const ptabs = document.getElementById('ptabs');
  if (!ptabs) return;
  ptabs.addEventListener('click', e => {
    const b = e.target.closest('button[data-ptab]');
    if (!b) return;
    ptabs.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('.params .ptab-panel').forEach(p => { p.hidden = p.dataset.panel !== b.dataset.ptab; });
  });
}

// ==================== MOBILE BOTTOM-SHEET ====================
function initSheet() {
  const app = document.querySelector('.app');
  if (!app) return;
  const open = () => app.classList.add('sheet-open');
  const close = () => app.classList.remove('sheet-open');
  document.getElementById('soundbarOpen')?.addEventListener('click', open);
  document.getElementById('sheetClose')?.addEventListener('click', close);
  document.getElementById('seqScrim')?.addEventListener('click', close);
}

// ==================== INIT PANELS ====================
export function initPanels() {
  initDrawerTabs();
  initSheet();
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

  // Kick preset buttons
  document.querySelectorAll('#kickPresetBtns .wb').forEach(btn => {
    btn.addEventListener('click', () => setKickPreset(+btn.dataset.kick, btn));
  });

  // Clap preset buttons
  document.querySelectorAll('#clapPresetBtns .wb').forEach(btn => {
    btn.addEventListener('click', () => setDrumPreset('clapPreset', +btn.dataset.clap, '#clapPresetBtns', 'clap', btn));
  });

  // Hat preset buttons
  document.querySelectorAll('#hatPresetBtns .wb').forEach(btn => {
    btn.addEventListener('click', () => setDrumPreset('hatPreset', +btn.dataset.hat, '#hatPresetBtns', 'hat', btn));
  });

  // Open hat preset buttons
  document.querySelectorAll('#openhatPresetBtns .wb').forEach(btn => {
    btn.addEventListener('click', () => setDrumPreset('hatPreset', +btn.dataset.openhat, '#openhatPresetBtns', 'openhat', btn));
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
    ['fxDistAmt', 'distAmt'], ['fxDistTone', 'distTone'],
    ['fxRevSz', 'revSz'], ['fxRevMix', 'revMix'],
    ['fxDlyT', 'dlyT'], ['fxDlyFb', 'dlyFb'], ['fxDlyDamp', 'dlyDamp'],
    ['fxChoRate', 'choRate'], ['fxChoDepth', 'choDepth'], ['fxChoMix', 'choMix'],
    ['fxBitDepth', 'bitDepth'], ['fxBitRate', 'bitRate'],
    ['fxPhaRate', 'phaRate'], ['fxPhaDepth', 'phaDepth'], ['fxPhaFb', 'phaFb'],
  ];
  fxParams.forEach(([id, param]) => {
    document.getElementById(id).addEventListener('input', function () {
      fxParam(param, this.value);
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
  });
  document.getElementById('compRat').addEventListener('input', function () {
    fxParam('compRat', this.value);
  });
}
