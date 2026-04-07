import { TRACKS, state } from '../state/store.js';
import { MACRO_DEFS } from '../utils/constants.js';
import { drawKnob } from '../visualization/knob.js';
import { initAudio } from '../audio/engine.js';
import { renderTracks } from './sequencer.js';
import { synthParam } from './panels.js';
import { fxParam } from '../audio/fx.js';

const MACROS = MACRO_DEFS.map(d => ({
  ...d,
  apply: null,
}));

// Wire up macro apply functions
function getMacroApply(mi) {
  const applies = [
    // ENERGY: Filter + Dist
    v => {
      document.getElementById('sCutoff').value = Math.round(100 + v / 100 * 19900);
      synthParam('cutoff', document.getElementById('sCutoff'));
      document.getElementById('fxDistAmt').value = Math.round(v * 0.8);
      fxParam('distAmt', document.getElementById('fxDistAmt').value);
    },
    // SPACE: Reverb + Delay
    v => {
      document.getElementById('fxRevMix').value = Math.round(v * 0.9);
      fxParam('revMix', document.getElementById('fxRevMix').value);
      document.getElementById('fxDlyFb').value = Math.round(v * 0.9);
      fxParam('dlyFb', document.getElementById('fxDlyFb').value);
    },
    // TENSION: Cutoff + Reso
    v => {
      document.getElementById('sCutoff').value = Math.round(50 + v / 100 * 12000);
      synthParam('cutoff', document.getElementById('sCutoff'));
      document.getElementById('sRes').value = (v / 100 * 20).toFixed(1);
      synthParam('res', document.getElementById('sRes'));
    },
    // DRIVE: Sat + Comp
    v => {
      document.getElementById('fxDistAmt').value = Math.round(v);
      fxParam('distAmt', document.getElementById('fxDistAmt').value);
      document.getElementById('compRat').value = Math.round(1 + v / 100 * 18);
      fxParam('compRat', document.getElementById('compRat').value);
    },
  ];
  return applies[mi];
}

export function renderLive() {
  const mr = document.getElementById('macroRow');
  if (!mr) return;
  mr.innerHTML = '';

  MACROS.forEach((m, mi) => {
    m.apply = getMacroApply(mi);
    const wrap = document.createElement('div');
    wrap.className = 'macro-knob';
    const lbl = document.createElement('div');
    lbl.className = 'macro-label';
    lbl.style.color = m.color;
    lbl.textContent = m.name;
    const sub = document.createElement('div');
    sub.className = 'macro-sub';
    sub.textContent = m.sub;
    const cv = document.createElement('canvas');
    cv.width = 80;
    cv.height = 80;
    cv.style.cursor = 'ns-resize';
    const valEl = document.createElement('div');
    valEl.style.cssText = 'font-size:9px;color:var(--dm)';
    valEl.textContent = m.val;
    drawKnob(cv, m.val / 100, m.color, valEl);

    let kd = { on: false, sy: 0, sv: 0 };
    cv.addEventListener('mousedown', e => {
      kd = { on: true, sy: e.clientY, sv: m.val };
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!kd.on) return;
      m.val = Math.max(0, Math.min(100, Math.round(kd.sv - (e.clientY - kd.sy))));
      drawKnob(cv, m.val / 100, m.color, valEl);
      m.apply(m.val);
    });
    document.addEventListener('mouseup', () => { kd.on = false; });

    wrap.appendChild(lbl);
    wrap.appendChild(sub);
    wrap.appendChild(cv);
    wrap.appendChild(valEl);
    mr.appendChild(wrap);
  });

  // Pad grid
  const pg = document.getElementById('padGrid');
  if (!pg) return;
  pg.innerHTML = '';

  TRACKS.forEach((t, ti) => {
    for (let pi = 0; pi < 2; pi++) {
      const pad = document.createElement('div');
      pad.className = 'pad' + (t.pats[pi] ? ' on' : '');
      pad.style.borderColor = t.color;
      pad.style.color = t.color;
      if (t.pats[pi]) pad.style.background = t.color + '22';
      pad.innerHTML = `<div>${t.name.slice(0, 4)}</div><div class="pad-num">P${pi + 1}</div>`;
      pad.addEventListener('click', () => {
        initAudio();
        TRACKS.forEach(tr => { tr.pats = Array(8).fill(false); tr.pats[pi] = true; });
        document.querySelectorAll('.pad').forEach(p => p.classList.remove('on'));
        pad.classList.add('on', 'trig');
        pad.style.background = t.color + '22';
        setTimeout(() => pad.classList.remove('trig'), 150);
        renderTracks();
      });
      pg.appendChild(pad);
    }
  });

  // EQ
  const eq = document.getElementById('eqRow');
  if (!eq) return;
  eq.innerHTML = '';
  const bands = [
    { f: 'LOW', v: 50 }, { f: 'MID', v: 50 },
    { f: 'MID-H', v: 50 }, { f: 'HIGH', v: 50 }, { f: 'AIR', v: 40 },
  ];
  bands.forEach(b => {
    const w = document.createElement('div');
    w.className = 'eq-bar-wrap';
    w.innerHTML = `<input class="eq-bar-input" type="range" orient="vertical" min="0" max="100" value="${b.v}" title="${b.f} EQ">
      <div class="eq-bar-label">${b.f}</div>`;
    eq.appendChild(w);
  });
}
