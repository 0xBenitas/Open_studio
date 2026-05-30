import { ctx, masterGain, reverbNode, reverbPreDelay, delayNode, reverbGain, scGainNode } from './engine.js';
import { TRACKS, FX, LP, SC, state } from '../state/store.js';
import { KICK_PRESETS, CLAP_PRESETS, HAT_PRESETS, OPENHAT_PRESETS } from '../utils/constants.js';
import { noteFreq } from '../utils/helpers.js';

export function triggerTrack(ti, vel, time) {
  if (!ctx) return;
  const t = TRACKS[ti];
  const out = ctx.createGain();
  out.gain.value = t.vol;
  const s = t.sp;

  if (s.wave === 'kick') {
    const preset = KICK_PRESETS[t.kickPreset || 0];

    // ── Body oscillator (sine sweep) ──
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(preset.startFreq, time);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(preset.midFreq, 1), time + preset.pitchDecay * 0.4
    );
    o.frequency.exponentialRampToValueAtTime(
      Math.max(preset.endFreq, 1), time + preset.pitchDecay + preset.decay * 0.5
    );
    g.gain.setValueAtTime(vel, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + preset.decay);
    o.connect(g);

    // ── Click layer (noise transient) ──
    if (preset.clickAmt > 0.01) {
      const clickDur = 0.012;
      const clickBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * clickDur), ctx.sampleRate);
      const cd = clickBuf.getChannelData(0);
      for (let i = 0; i < cd.length; i++) {
        cd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (cd.length * 0.2));
      }
      const clickSrc = ctx.createBufferSource();
      clickSrc.buffer = clickBuf;
      const clickHpf = ctx.createBiquadFilter();
      clickHpf.type = 'highpass';
      clickHpf.frequency.value = preset.clickFreq;
      clickHpf.Q.value = 1;
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(vel * preset.clickAmt, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + clickDur);
      clickSrc.connect(clickHpf);
      clickHpf.connect(clickGain);
      clickGain.connect(out);
      clickSrc.start(time);
      clickSrc.stop(time + clickDur + 0.005);
    }

    // ── Drive (saturation on kick body) ──
    if (preset.drive > 0.01) {
      const driveWs = ctx.createWaveShaper();
      const n = 256;
      const curve = new Float32Array(n);
      const k = preset.drive * 10;
      for (let i = 0; i < n; i++) {
        const x = i * 2 / n - 1;
        curve[i] = x * (k + 1) / (1 + k * Math.abs(x));
      }
      driveWs.curve = curve;
      g.connect(driveWs);
      driveWs.connect(out);
    } else {
      g.connect(out);
    }

    o.start(time);
    o.stop(time + preset.decay + 0.05);
    if (SC.on && TRACKS.some(tr => tr.sendSc)) triggerSidechain(time);

  } else if (s.wave === 'hat' || s.wave === 'openhat') {
    const presets = s.wave === 'hat' ? HAT_PRESETS : OPENHAT_PRESETS;
    const preset = presets[t.hatPreset || 0] || presets[0];
    const dur = preset.dur;

    // ── Noise layer ──
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * (preset.decay / (ctx.sampleRate * dur))));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = preset.hpf;
    hpf.Q.value = preset.Q;
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = preset.tone;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel * 0.7, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    src.connect(hpf);
    hpf.connect(lpf);
    lpf.connect(g);
    g.connect(out);
    src.start(time);
    src.stop(time + dur + 0.01);

    // ── Metallic oscillator layer ──
    if (preset.metalAmt > 0 && preset.metalFreqs.length > 0) {
      preset.metalFreqs.forEach(f => {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = f;
        const mg = ctx.createGain();
        mg.gain.setValueAtTime(vel * preset.metalAmt * 0.15, time);
        mg.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.8);
        const mhpf = ctx.createBiquadFilter();
        mhpf.type = 'highpass';
        mhpf.frequency.value = preset.hpf;
        osc.connect(mhpf);
        mhpf.connect(mg);
        mg.connect(out);
        osc.start(time);
        osc.stop(time + dur + 0.01);
      });
    }

  } else if (s.wave === 'clap') {
    const preset = CLAP_PRESETS[t.clapPreset || 0] || CLAP_PRESETS[0];
    const dur = preset.dur;
    const numLayers = preset.layers;

    for (let layer = 0; layer < numLayers; layer++) {
      const layerTime = time + layer * preset.spread;
      const layerDur = dur - layer * preset.spread;
      if (layerDur <= 0) break;

      const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * layerDur), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / preset.decay);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;

      const bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = preset.freq;
      bpf.Q.value = preset.Q;

      let lastNode;

      // ── Drive (saturation) ──
      if (preset.drive > 0.01) {
        const ws = ctx.createWaveShaper();
        const n = 256;
        const curve = new Float32Array(n);
        const k = preset.drive * 12;
        for (let i = 0; i < n; i++) {
          const x = i * 2 / n - 1;
          curve[i] = x * (k + 1) / (1 + k * Math.abs(x));
        }
        ws.curve = curve;
        bpf.connect(ws);
        lastNode = ws;
      } else {
        lastNode = bpf;
      }

      const g = ctx.createGain();
      const layerVel = vel * (1 - layer * 0.1); // slight fade per layer
      g.gain.setValueAtTime(layerVel / numLayers, layerTime);
      g.gain.exponentialRampToValueAtTime(0.001, layerTime + layerDur);

      src.connect(bpf);
      lastNode.connect(g);
      g.connect(out);
      src.start(layerTime);
      src.stop(layerTime + layerDur + 0.01);
    }

    // ── Body layer (low-end thump) ──
    if (preset.body > 0.05) {
      const bodyDur = dur * 0.6;
      const bodyBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * bodyDur), ctx.sampleRate);
      const bd = bodyBuf.getChannelData(0);
      for (let i = 0; i < bd.length; i++) {
        bd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (preset.decay * 0.5));
      }
      const bodySrc = ctx.createBufferSource();
      bodySrc.buffer = bodyBuf;
      const bodyLpf = ctx.createBiquadFilter();
      bodyLpf.type = 'lowpass';
      bodyLpf.frequency.value = 300;
      bodyLpf.Q.value = 1;
      const bodyGain = ctx.createGain();
      bodyGain.gain.setValueAtTime(vel * preset.body * 0.6, time);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, time + bodyDur);
      bodySrc.connect(bodyLpf);
      bodyLpf.connect(bodyGain);
      bodyGain.connect(out);
      bodySrc.start(time);
      bodySrc.stop(time + bodyDur + 0.01);
    }

  } else {
    const ng = t.noteGrid[state.currentStep % state.currentSteps] || { note: 0, octave: 3 };
    const freq = noteFreq(ng.note + (s.detune || 0) / 100, ng.octave);
    const osc = ctx.createOscillator();
    osc.type = s.wave || 'sawtooth';

    // ── Glide / Portamento ──
    if (state.glideOn && t._lastFreq && t._lastFreq !== freq) {
      const glideTime = Math.min(s.atk / 1000, 0.08) || 0.05;
      osc.frequency.setValueAtTime(t._lastFreq, time);
      osc.frequency.exponentialRampToValueAtTime(Math.max(freq, 1), time + glideTime);
    } else {
      osc.frequency.value = freq;
    }
    t._lastFreq = freq;

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

    // ── EnvMod: filter cutoff envelope ──
    const envModAmt = s.envmod / 100;
    if (Math.abs(envModAmt) > 0.01) {
      const peak = s.cutoff + envModAmt * (20000 - s.cutoff) * 0.5;
      const safePeak = Math.max(20, Math.min(20000, peak));
      const susLevel = s.cutoff + (safePeak - s.cutoff) * sus;
      filt.frequency.setValueAtTime(s.cutoff, time);
      filt.frequency.linearRampToValueAtTime(safePeak, time + atk);
      filt.frequency.linearRampToValueAtTime(susLevel, time + atk + dec);
      filt.frequency.setValueAtTime(susLevel, time + noteLen);
      filt.frequency.linearRampToValueAtTime(s.cutoff, time + noteLen + rel);
    }

    // ── LFO modulation (all targets) ──
    let outputNode = env; // default routing: filt → env → out
    if (LP.depth > 0) {
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.type = LP.wave;
      lfo.frequency.value = LP.rate;

      switch (LP.target) {
        case 'cutoff':
          lg.gain.value = LP.depth * (s.cutoff / 100);
          lfo.connect(lg);
          lg.connect(filt.frequency);
          break;
        case 'pitch':
          lg.gain.value = LP.depth * freq * 0.02;
          lfo.connect(lg);
          lg.connect(osc.frequency);
          break;
        case 'vol':
          lg.gain.value = (LP.depth / 100) * vel * 0.5;
          lfo.connect(lg);
          lg.connect(env.gain);
          break;
        case 'pan': {
          const panner = ctx.createStereoPanner();
          lg.gain.value = LP.depth / 100;
          lfo.connect(lg);
          lg.connect(panner.pan);
          // Insert panner: env → panner → out
          outputNode = panner;
          env.connect(panner);
          break;
        }
      }
      lfo.start(time);
      lfo.stop(time + noteLen + rel + 0.1);
    }

    osc.connect(filt);
    filt.connect(env);
    if (outputNode === env) {
      env.connect(out);
    } else {
      // panner case: env already connected to panner above
      outputNode.connect(out);
    }
    osc.start(time);
    osc.stop(time + noteLen + rel + 0.15);
  }

  // Route through FX sends (per-track)
  if (FX.rev && t.sendRev) out.connect(reverbPreDelay);
  if (FX.dly && t.sendDly) out.connect(delayNode);
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
