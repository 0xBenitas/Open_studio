import { FX, SC } from '../state/store.js';
import { setDistCurve, delayNode, delayFb, reverbGain, compressor } from './engine.js';

const FX_VAL_MAP = {
  distAmt: 'vDistAmt', revSz: 'vRevSz', revMix: 'vRevMix',
  dlyT: 'vDlyT', dlyFb: 'vDlyFb', compThr: 'vCompThr', compRat: 'vCompRat',
};

export function fxParam(p, value) {
  FX[p] = +value;
  // Update value display span
  const valId = FX_VAL_MAP[p];
  if (valId) {
    const el = document.getElementById(valId);
    if (el) el.textContent = value;
  }
  if (p === 'distAmt') setDistCurve(FX.distAmt);
  if (p === 'dlyT' && delayNode) delayNode.delayTime.value = FX.dlyT / 1000;
  if (p === 'dlyFb' && delayFb) delayFb.gain.value = FX.dlyFb / 100;
  if (p === 'revMix' && reverbGain) reverbGain.gain.value = FX.revMix / 100;
  if (p === 'compThr' && compressor) compressor.threshold.value = FX.compThr;
  if (p === 'compRat' && compressor) compressor.ratio.value = FX.compRat;
}

export function toggleFx(f) {
  FX[f] = !FX[f];
  return FX[f];
}

export function toggleSidechain() {
  SC.on = !SC.on;
  return SC.on;
}

export function scParam(p, value) {
  SC[p] = +value;
}
