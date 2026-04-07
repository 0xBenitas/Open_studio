import { ctx, masterGain, reverbNode, delayNode, reverbGain, scGainNode } from './engine.js';
import { TRACKS, FX, LP, SC, state } from '../state/store.js';
import { noteFreq } from '../utils/helpers.js';

export function triggerTrack(ti, vel, time) {
  if (!ctx) return;
  const t = TRACKS[ti];
  const out = ctx.createGain();
  out.gain.value = t.vol;
  const s = t.sp;

  if (s.wave === 'kick') {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(200, time);
    o.frequency.exponentialRampToValueAtTime(40, time + 0.08);
    o.frequency.exponentialRampToValueAtTime(20, time + 0.35);
    g.gain.setValueAtTime(vel, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    o.connect(g);
    g.connect(out);
    o.start(time);
    o.stop(time + 0.42);
    if (SC.on) triggerSidechain(time);
  } else if (s.wave === 'hat' || s.wave === 'openhat') {
    const dur = s.wave === 'hat' ? 0.06 : 0.25;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.7, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    src.connect(hpf);
    hpf.connect(g);
    g.connect(out);
    src.start(time);
    src.stop(time + dur + 0.01);
  } else if (s.wave === 'clap') {
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.18), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 800);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 1100;
    bpf.Q.value = 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    src.connect(bpf);
    bpf.connect(g);
    g.connect(out);
    src.start(time);
    src.stop(time + 0.2);
  } else {
    const ng = t.noteGrid[state.currentStep % state.currentSteps] || { note: 0, octave: 3 };
    const freq = noteFreq(ng.note + (s.detune || 0) / 100, ng.octave);
    const osc = ctx.createOscillator();
    osc.type = s.wave || 'sawtooth';
    osc.frequency.value = freq;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = s.cutoff;
    filt.Q.value = s.res;
    const env = ctx.createGain();
    const atk = s.atk / 1000;
    const dec = s.dec / 1000;
    const rel = s.rel / 1000;
    const sus = s.sus / 100;
    const noteLen = Math.max(0.05, (ng.len || 1) * ((60 / state.bpm) / 4));
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(vel, time + atk);
    env.gain.linearRampToValueAtTime(vel * sus, time + atk + dec);
    env.gain.setValueAtTime(vel * sus, time + noteLen);
    env.gain.linearRampToValueAtTime(0.0001, time + noteLen + rel);

    if (LP.depth > 0 && LP.target === 'cutoff') {
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.type = LP.wave;
      lfo.frequency.value = LP.rate;
      lg.gain.value = LP.depth * (s.cutoff / 100);
      lfo.connect(lg);
      lg.connect(filt.frequency);
      lfo.start(time);
      lfo.stop(time + noteLen + rel + 0.1);
    }

    osc.connect(filt);
    filt.connect(env);
    env.connect(out);
    osc.start(time);
    osc.stop(time + noteLen + rel + 0.15);
  }

  // Route through FX
  if (FX.rev) out.connect(reverbNode);
  if (FX.dly) out.connect(delayNode);
  out.connect(masterGain);
  if (FX.rev) reverbGain.connect(masterGain);
  if (FX.dly) delayNode.connect(masterGain);
}

export function triggerSidechain(time) {
  if (!scGainNode || !SC.on) return;
  const atk = SC.atk / 1000;
  const rel = SC.rel / 1000;
  const lvl = 1 - (SC.amt / 100) * 0.95;
  scGainNode.gain.cancelScheduledValues(time);
  scGainNode.gain.setValueAtTime(1, time);
  scGainNode.gain.linearRampToValueAtTime(lvl, time + atk);
  scGainNode.gain.exponentialRampToValueAtTime(1.0, time + atk + rel);
}
