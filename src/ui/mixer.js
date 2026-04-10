import { TRACKS, FX, state, setMasterVolume } from '../state/store.js';

let vuTimer = null;

export function renderMixer() {
  const mc = document.getElementById('mixChannels');
  if (!mc) return;
  mc.innerHTML = '';

  TRACKS.forEach((t, ti) => {
    const ch = document.createElement('div');
    ch.className = 'mix-ch';
    ch.innerHTML = `
      <div class="mix-ch-name" style="color:${t.color}" title="${t.name}">${t.name}</div>
      <div class="mix-fader-area">
        <div class="mix-vu" title="VU meter"><div class="mix-vu-bar" id="vu${ti}" style="height:20%"></div></div>
        <input class="mix-fader" type="range" min="0" max="100" value="${Math.round(t.vol * 100)}" title="Volume" data-mixer-vol="${ti}">
      </div>
      <div class="mix-val" id="fv${ti}">${Math.round(t.vol * 100)}</div>
      <div class="mix-btn${t.muted ? ' on' : ''}" data-mixer-mute="${ti}">M</div>
      <div class="mix-btn${t.soloed ? ' on' : ''}" data-mixer-solo="${ti}">S</div>
      <div class="mix-btn" data-mixer-fx="rev">REV</div>
      <div class="mix-btn" data-mixer-fx="dly">DLY</div>
      ${ti === 4 || ti === 5 ? `<div class="mix-btn sc on" title="Sidechain from kick">SC \u2190 KICK</div>` : ''}
    `;

    // Fader
    ch.querySelector(`[data-mixer-vol="${ti}"]`).addEventListener('input', function () {
      TRACKS[ti].vol = this.value / 100;
      document.getElementById('fv' + ti).textContent = Math.round(this.value);
    });

    // Mute
    ch.querySelector(`[data-mixer-mute="${ti}"]`).addEventListener('click', function () {
      TRACKS[ti].muted = !TRACKS[ti].muted;
      this.classList.toggle('on', TRACKS[ti].muted);
    });

    // Solo
    ch.querySelector(`[data-mixer-solo="${ti}"]`).addEventListener('click', function () {
      TRACKS[ti].soloed = !TRACKS[ti].soloed;
      this.classList.toggle('on', TRACKS[ti].soloed);
    });

    // FX toggles
    ch.querySelectorAll('[data-mixer-fx]').forEach(btn => {
      btn.addEventListener('click', () => btn.classList.toggle('on'));
    });

    // SC toggle
    const scBtn = ch.querySelector('.mix-btn.sc');
    if (scBtn) scBtn.addEventListener('click', () => scBtn.classList.toggle('on'));

    mc.appendChild(ch);
  });

  // Master channel
  const master = document.createElement('div');
  master.className = 'mix-ch master';
  master.innerHTML = `
    <div class="mix-ch-name" style="color:var(--cy)">MASTER</div>
    <div class="mix-fader-area">
      <div class="mix-vu"><div class="mix-vu-bar" id="vuM" style="height:40%"></div></div>
      <input class="mix-fader" type="range" min="0" max="100" value="${Math.round(state.masterVolume * 100)}" title="Master volume" id="mixMasterFader">
    </div>
    <div class="mix-val">${Math.round(state.masterVolume * 100)}</div>
    <div style="font-size:7px;color:var(--dm);text-align:center;letter-spacing:.5px">COMP<br>${FX.compThr}dB/${FX.compRat}:1</div>
  `;

  master.querySelector('#mixMasterFader').addEventListener('input', function () {
    setMasterVolume(this.value);
  });

  mc.appendChild(master);
}

export function startVU() {
  clearInterval(vuTimer);
  vuTimer = setInterval(() => {
    TRACKS.forEach((t, ti) => {
      const bar = document.getElementById('vu' + ti);
      if (!bar) return;
      const base = state.isPlaying && !t.muted ? t.vol * 50 + 8 : 3;
      const h = Math.min(98, base + Math.random() * 25);
      bar.style.height = h + '%';
    });
    const bm = document.getElementById('vuM');
    if (bm) {
      const h = state.isPlaying ? 55 + Math.random() * 30 : 5;
      bm.style.height = h + '%';
    }
  }, 70);
}
