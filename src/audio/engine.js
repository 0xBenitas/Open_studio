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
export let delayNode = null;
export let delayFb = null;
export let reverbNode = null;
export let reverbGain = null;
export let scGainNode = null;

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

  distNode = ctx.createWaveShaper();
  setDistCurve(FX.distAmt);

  delayNode = ctx.createDelay(2);
  delayNode.delayTime.value = FX.dlyT / 1000;
  delayFb = ctx.createGain();
  delayFb.gain.value = FX.dlyFb / 100;
  delayNode.connect(delayFb);
  delayFb.connect(delayNode);

  reverbNode = buildReverb(2);
  reverbGain = ctx.createGain();
  reverbGain.gain.value = FX.revMix / 100;
  reverbNode.connect(reverbGain);

  scGainNode = ctx.createGain();
  scGainNode.gain.value = 1;

  // Routing: master → sidechain → distortion → compressor → analyser → destination
  masterGain.connect(scGainNode);
  scGainNode.connect(distNode);
  distNode.connect(compressor);
  compressor.connect(analyser);
  analyser.connect(ctx.destination);

  startSpectrum();
  startWaveform();
}

export function setDistCurve(amt) {
  const n = 512;
  const c = new Float32Array(n);
  const k = amt * 5;
  for (let i = 0; i < n; i++) {
    const x = i * 2 / n - 1;
    c[i] = x * (k + 1) / (1 + k * Math.abs(x));
  }
  if (distNode) distNode.curve = c;
}

export function buildReverb(dur) {
  const buf = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.8);
    }
  }
  const n = ctx.createConvolver();
  n.buffer = buf;
  return n;
}

// React to master volume changes
on('master-volume-changed', (v) => {
  if (masterGain) masterGain.gain.value = v;
});
