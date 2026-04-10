import { FX, SC } from '../state/store.js';
import {
  setDistCurve, delayNode, delayFb, delayDampFilter, reverbGain,
  compressor, distToneFilter, rebuildReverb, connectFxChain,
  chorusLfoL, chorusLfoR, chorusDelayL, chorusDelayR,
  chorusDryGain, chorusWetGain,
  phaserLfo, phaserFilters, phaserFbGain,
} from './engine.js';

const FX_VAL_MAP = {
  distAmt: 'vDistAmt', distTone: 'vDistTone',
  revSz: 'vRevSz', revMix: 'vRevMix',
  dlyT: 'vDlyT', dlyFb: 'vDlyFb', dlyDamp: 'vDlyDamp',
  choRate: 'vChoRate', choDepth: 'vChoDepth', choMix: 'vChoMix',
  bitDepth: 'vBitDepth', bitRate: 'vBitRate',
  phaRate: 'vPhaRate', phaDepth: 'vPhaDepth', phaFb: 'vPhaFb',
  compThr: 'vCompThr', compRat: 'vCompRat',
};

export function fxParam(p, value) {
  FX[p] = +value;
  // Update value display span
  const valId = FX_VAL_MAP[p];
  if (valId) {
    const el = document.getElementById(valId);
    if (el) el.textContent = value;
  }

  // Distortion
  if (p === 'distAmt') setDistCurve(FX.distAmt);
  if (p === 'distTone' && distToneFilter) {
    distToneFilter.frequency.value = 1000 + (FX.distTone / 100) * 19000;
  }

  // Delay
  if (p === 'dlyT' && delayNode) delayNode.delayTime.value = FX.dlyT / 1000;
  if (p === 'dlyFb' && delayFb) delayFb.gain.value = FX.dlyFb / 100;
  if (p === 'dlyDamp' && delayDampFilter) {
    delayDampFilter.frequency.value = 800 + (FX.dlyDamp / 100) * 19200;
  }

  // Reverb
  if (p === 'revMix' && reverbGain) reverbGain.gain.value = FX.revMix / 100;
  if (p === 'revSz') rebuildReverb();

  // Compressor
  if (p === 'compThr' && compressor) compressor.threshold.value = FX.compThr;
  if (p === 'compRat' && compressor) compressor.ratio.value = FX.compRat;

  // Chorus
  if (p === 'choRate') {
    if (chorusLfoL) chorusLfoL.frequency.value = FX.choRate;
    if (chorusLfoR) chorusLfoR.frequency.value = FX.choRate;
  }
  if (p === 'choDepth') {
    const d = (FX.choDepth / 100) * 0.005;
    if (chorusDelayL && chorusDelayL._lfoGain) chorusDelayL._lfoGain.gain.value = d;
    if (chorusDelayR && chorusDelayR._lfoGain) chorusDelayR._lfoGain.gain.value = d;
  }
  if (p === 'choMix') {
    if (chorusDryGain) chorusDryGain.gain.value = 1 - (FX.choMix / 100) * 0.5;
    if (chorusWetGain) chorusWetGain.gain.value = (FX.choMix / 100) * 0.5;
  }

  // Bitcrusher: params read directly from FX in onaudioprocess

  // Phaser
  if (p === 'phaRate' && phaserLfo) phaserLfo.frequency.value = FX.phaRate;
  if (p === 'phaDepth') {
    const baseFreqs = [200, 600, 1400, 3200];
    phaserFilters.forEach((f, i) => {
      if (f._lfoGain) f._lfoGain.gain.value = (FX.phaDepth / 100) * baseFreqs[i] * 0.8;
    });
  }
  if (p === 'phaFb' && phaserFbGain) phaserFbGain.gain.value = (FX.phaFb / 100) * 0.9;
}

export function toggleFx(f) {
  FX[f] = !FX[f];
  // Reconnect FX chain when toggling insert effects
  if (['dist', 'cho', 'bit', 'pha'].includes(f)) {
    connectFxChain();
  }
  return FX[f];
}

export function toggleSidechain() {
  SC.on = !SC.on;
  return SC.on;
}

export function scParam(p, value) {
  SC[p] = +value;
}
