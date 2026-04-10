import { FX, state } from '../state/store.js';
import { on } from '../state/events.js';
import { startSpectrum } from '../visualization/spectrum.js';
import { startWaveform } from '../visualization/waveform.js';

const AC = window.AudioContext || window.webkitAudioContext;

export let ctx = null;
export let masterGain = null;
export let compressor = null;
export let analyser = null;
export let distNode = null;
export let distToneFilter = null;
export let delayNode = null;
export let delayFb = null;
export let delayDampFilter = null;
export let reverbNode = null;
export let reverbGain = null;
export let reverbPreDelay = null;
export let scGainNode = null;

// New effects
export let chorusNode = null;
export let chorusDryGain = null;
export let chorusWetGain = null;
export let chorusLfoL = null;
export let chorusLfoR = null;
export let chorusDelayL = null;
export let chorusDelayR = null;
export let chorusMerger = null;

export let bitcrusherNode = null;

export let phaserInput = null;
export let phaserFilters = [];
export let phaserLfo = null;
export let phaserLfoGain = null;
export let phaserFbGain = null;
export let phaserDryGain = null;
export let phaserWetGain = null;
export let phaserOutput = null;

// EQ
export let eqFilters = [];

export function initAudio() {
  if (ctx) return;
  ctx = new AC();

  masterGain = ctx.createGain();
  masterGain.gain.value = state.masterVolume;

  compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = FX.compThr;
  compressor.ratio.value = FX.compRat;
  compressor.knee.value = 10;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.1;

  analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;

  // ── Distortion (improved: waveshaper + tone filter) ──
  distNode = ctx.createWaveShaper();
  setDistCurve(FX.distAmt);
  distToneFilter = ctx.createBiquadFilter();
  distToneFilter.type = 'lowpass';
  distToneFilter.frequency.value = 1000 + (FX.distTone / 100) * 19000;
  distToneFilter.Q.value = 0.7;

  // ── Delay (improved: damping filter in feedback loop) ──
  delayNode = ctx.createDelay(2);
  delayNode.delayTime.value = FX.dlyT / 1000;
  delayDampFilter = ctx.createBiquadFilter();
  delayDampFilter.type = 'lowpass';
  delayDampFilter.frequency.value = 800 + (FX.dlyDamp / 100) * 19200;
  delayDampFilter.Q.value = 0.5;
  delayFb = ctx.createGain();
  delayFb.gain.value = FX.dlyFb / 100;
  delayNode.connect(delayDampFilter);
  delayDampFilter.connect(delayFb);
  delayFb.connect(delayNode);

  // ── Reverb (improved: variable size via revSz, pre-delay, better IR) ──
  const revDur = 0.5 + (FX.revSz / 100) * 4.5;
  reverbPreDelay = ctx.createDelay(0.1);
  reverbPreDelay.delayTime.value = 0.02;
  reverbNode = buildReverb(revDur);
  reverbGain = ctx.createGain();
  reverbGain.gain.value = FX.revMix / 100;
  reverbPreDelay.connect(reverbNode);
  reverbNode.connect(reverbGain);

  // ── Sidechain ──
  scGainNode = ctx.createGain();
  scGainNode.gain.value = 1;

  // ── Chorus ──
  buildChorus();

  // ── Bitcrusher ──
  buildBitcrusher();

  // ── Phaser ──
  buildPhaser();

  // ── 5-Band EQ ──
  buildEQ();

  // ── Master routing ──
  // master → sidechain → chorus → bitcrusher → phaser → distortion → tone → compressor → EQ → analyser → out
  masterGain.connect(scGainNode);
  connectFxChain();

  startSpectrum();
  startWaveform();
}

// Rebuild the insert FX chain based on current toggle states
export function connectFxChain() {
  if (!ctx) return;

  // Disconnect everything from scGainNode onward
  scGainNode.disconnect();
  if (chorusDryGain) chorusDryGain.disconnect();
  if (chorusWetGain) chorusWetGain.disconnect();
  if (chorusDelayL) chorusDelayL.disconnect();
  if (chorusDelayR) chorusDelayR.disconnect();
  if (chorusMerger) chorusMerger.disconnect();
  if (bitcrusherNode) bitcrusherNode.disconnect();
  if (phaserOutput) phaserOutput.disconnect();
  if (phaserDryGain) phaserDryGain.disconnect();
  if (phaserWetGain) phaserWetGain.disconnect();
  phaserFilters.forEach(f => f.disconnect());
  if (phaserFbGain) phaserFbGain.disconnect();
  if (phaserInput) phaserInput.disconnect();
  distNode.disconnect();
  distToneFilter.disconnect();
  compressor.disconnect();
  eqFilters.forEach(f => f.disconnect());
  analyser.disconnect();

  // Build chain: sc → [chorus] → [bitcrusher] → [phaser] → dist → tone → comp → analyser → dest
  let current = scGainNode;

  // Chorus
  if (FX.cho && chorusDryGain) {
    current.connect(chorusDryGain);
    current.connect(chorusDelayL);
    current.connect(chorusDelayR);
    chorusDelayL.connect(chorusMerger, 0, 0);
    chorusDelayR.connect(chorusMerger, 0, 1);
    chorusMerger.connect(chorusWetGain);
    chorusDryGain.connect(distNode);
    chorusWetGain.connect(distNode);
  } else {
    current.connect(distNode);
  }

  // Distortion + tone
  distNode.connect(distToneFilter);
  current = distToneFilter;

  // Bitcrusher
  if (FX.bit && bitcrusherNode) {
    current.connect(bitcrusherNode);
    current = bitcrusherNode;
  }

  // Phaser
  if (FX.pha && phaserInput) {
    current.connect(phaserInput);
    // Dry path
    phaserInput.connect(phaserDryGain);
    phaserDryGain.connect(phaserOutput);
    // Wet path through allpass chain
    let ap = phaserInput;
    for (const f of phaserFilters) {
      ap.connect(f);
      ap = f;
    }
    ap.connect(phaserWetGain);
    phaserWetGain.connect(phaserOutput);
    // Feedback
    ap.connect(phaserFbGain);
    phaserFbGain.connect(phaserFilters[0]);
    current = phaserOutput;
  }

  current.connect(compressor);
  // Route through EQ chain
  if (eqFilters.length > 0) {
    compressor.connect(eqFilters[0]);
    for (let i = 0; i < eqFilters.length - 1; i++) {
      eqFilters[i].connect(eqFilters[i + 1]);
    }
    eqFilters[eqFilters.length - 1].connect(analyser);
  } else {
    compressor.connect(analyser);
  }
  analyser.connect(ctx.destination);
}

// ── Distortion curve ──
export function setDistCurve(amt) {
  const n = 512;
  const c = new Float32Array(n);
  const k = amt * 5;
  for (let i = 0; i < n; i++) {
    const x = i * 2 / n - 1;
    // Asymmetric soft clipping for warmer harmonics
    const asym = x >= 0 ? 1.0 : 0.9;
    c[i] = asym * x * (k + 1) / (1 + k * Math.abs(x));
  }
  if (distNode) distNode.curve = c;
}

// ── Reverb IR builder (improved with early reflections) ──
export function buildReverb(dur) {
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    // Early reflections (discrete taps in first 40ms)
    const earlyEnd = Math.min(Math.ceil(ctx.sampleRate * 0.04), len);
    const taps = [0.007, 0.013, 0.022, 0.031, 0.037];
    for (const tap of taps) {
      const idx = Math.floor(tap * ctx.sampleRate);
      if (idx < len) {
        const amp = 0.4 * (1 - tap / 0.04);
        d[idx] += (Math.random() > 0.5 ? amp : -amp);
      }
    }
    // Late diffuse tail with smoother decay
    for (let i = earlyEnd; i < len; i++) {
      const t = i / len;
      const envelope = Math.pow(1 - t, 2.2) * Math.exp(-3 * t);
      d[i] = (Math.random() * 2 - 1) * envelope;
    }
  }
  const n = ctx.createConvolver();
  n.buffer = buf;
  return n;
}

// Rebuild reverb with new size
export function rebuildReverb() {
  if (!ctx || !reverbPreDelay) return;
  reverbNode.disconnect();
  const revDur = 0.5 + (FX.revSz / 100) * 4.5;
  reverbNode = buildReverb(revDur);
  reverbPreDelay.disconnect();
  reverbPreDelay.connect(reverbNode);
  reverbNode.connect(reverbGain);
}

// ── Chorus ──
function buildChorus() {
  chorusDryGain = ctx.createGain();
  chorusDryGain.gain.value = 1 - (FX.choMix / 100) * 0.5;
  chorusWetGain = ctx.createGain();
  chorusWetGain.gain.value = (FX.choMix / 100) * 0.5;

  chorusDelayL = ctx.createDelay(0.05);
  chorusDelayL.delayTime.value = 0.015;
  chorusDelayR = ctx.createDelay(0.05);
  chorusDelayR.delayTime.value = 0.017;

  chorusMerger = ctx.createChannelMerger(2);

  // LFOs for stereo modulation
  chorusLfoL = ctx.createOscillator();
  chorusLfoL.type = 'sine';
  chorusLfoL.frequency.value = FX.choRate;
  const lfoGainL = ctx.createGain();
  lfoGainL.gain.value = (FX.choDepth / 100) * 0.005;
  chorusLfoL.connect(lfoGainL);
  lfoGainL.connect(chorusDelayL.delayTime);
  chorusLfoL.start();

  chorusLfoR = ctx.createOscillator();
  chorusLfoR.type = 'sine';
  chorusLfoR.frequency.value = FX.choRate;
  // Phase offset for stereo: start slightly later
  const lfoGainR = ctx.createGain();
  lfoGainR.gain.value = (FX.choDepth / 100) * 0.005;
  chorusLfoR.connect(lfoGainR);
  lfoGainR.connect(chorusDelayR.delayTime);
  chorusLfoR.start(ctx.currentTime + 1 / (FX.choRate * 4));

  // Store LFO gains for parameter updates
  chorusDelayL._lfoGain = lfoGainL;
  chorusDelayR._lfoGain = lfoGainR;
}

// ── Bitcrusher (ScriptProcessor fallback) ──
function buildBitcrusher() {
  const bufSize = 2048;
  bitcrusherNode = ctx.createScriptProcessor(bufSize, 1, 1);
  let lastSample = 0;
  let counter = 0;
  bitcrusherNode.onaudioprocess = function(e) {
    const input = e.inputBuffer.getChannelData(0);
    const output = e.outputBuffer.getChannelData(0);
    const bits = FX.bitDepth;
    const step = Math.max(1, Math.floor((1 - FX.bitRate / 100) * 32));
    const levels = Math.pow(2, bits);
    for (let i = 0; i < input.length; i++) {
      counter++;
      if (counter >= step) {
        counter = 0;
        // Quantize
        lastSample = Math.round(input[i] * levels) / levels;
      }
      output[i] = lastSample;
    }
  };
}

// ── Phaser ──
function buildPhaser() {
  phaserInput = ctx.createGain();
  phaserInput.gain.value = 1;
  phaserOutput = ctx.createGain();
  phaserOutput.gain.value = 1;

  phaserDryGain = ctx.createGain();
  phaserDryGain.gain.value = 0.5;
  phaserWetGain = ctx.createGain();
  phaserWetGain.gain.value = 0.5;

  // 4 allpass filters
  phaserFilters = [];
  const baseFreqs = [200, 600, 1400, 3200];
  for (let i = 0; i < 4; i++) {
    const ap = ctx.createBiquadFilter();
    ap.type = 'allpass';
    ap.frequency.value = baseFreqs[i];
    ap.Q.value = 0.5;
    phaserFilters.push(ap);
  }

  // LFO sweeps allpass frequencies
  phaserLfo = ctx.createOscillator();
  phaserLfo.type = 'sine';
  phaserLfo.frequency.value = FX.phaRate;

  // Each filter gets its own LFO gain for different sweep ranges
  for (let i = 0; i < phaserFilters.length; i++) {
    const lg = ctx.createGain();
    lg.gain.value = (FX.phaDepth / 100) * baseFreqs[i] * 0.8;
    phaserLfo.connect(lg);
    lg.connect(phaserFilters[i].frequency);
    phaserFilters[i]._lfoGain = lg;
  }
  phaserLfo.start();

  // Feedback
  phaserFbGain = ctx.createGain();
  phaserFbGain.gain.value = FX.phaFb / 100 * 0.9;
}

// ── 5-Band EQ ──
function buildEQ() {
  const bands = [
    { type: 'lowshelf', freq: 200, Q: 0.7, gain: 0 },
    { type: 'peaking', freq: 800, Q: 0.7, gain: 0 },
    { type: 'peaking', freq: 2500, Q: 0.7, gain: 0 },
    { type: 'highshelf', freq: 8000, Q: 0.7, gain: 0 },
    { type: 'peaking', freq: 14000, Q: 0.5, gain: -3 },
  ];
  eqFilters = bands.map(b => {
    const f = ctx.createBiquadFilter();
    f.type = b.type;
    f.frequency.value = b.freq;
    f.Q.value = b.Q;
    f.gain.value = b.gain;
    return f;
  });
}

export function setEqBand(index, gainDb) {
  if (eqFilters[index]) {
    eqFilters[index].gain.value = gainDb;
  }
}

// React to master volume changes
on('master-volume-changed', (v) => {
  if (masterGain) masterGain.gain.value = v;
});
