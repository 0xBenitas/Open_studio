import { analyser } from '../audio/engine.js';

let waveRaf;

export function startWaveform() {
  const canvas = document.getElementById('waveCanvas');
  if (!canvas || !analyser) return;

  function resize() {
    canvas.width = canvas.offsetWidth || 600;
    canvas.height = canvas.offsetHeight || 50;
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  const cc = canvas.getContext('2d');
  const buf = new Uint8Array(analyser.fftSize);

  function draw() {
    waveRaf = requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(buf);
    const w = canvas.width, h = canvas.height;
    cc.fillStyle = 'rgba(10,10,15,.85)';
    cc.fillRect(0, 0, w, h);
    cc.strokeStyle = 'rgba(0,255,210,0.6)';
    cc.lineWidth = 1.5;
    cc.beginPath();
    const sliceW = w / buf.length;
    for (let i = 0; i < buf.length; i++) {
      const v = buf[i] / 128.0;
      const y = (v * h) / 2;
      i === 0 ? cc.moveTo(0, y) : cc.lineTo(i * sliceW, y);
    }
    cc.stroke();
    // Subtle center line
    cc.strokeStyle = 'rgba(255,255,255,0.04)';
    cc.lineWidth = 1;
    cc.beginPath();
    cc.moveTo(0, h / 2);
    cc.lineTo(w, h / 2);
    cc.stroke();
  }
  draw();
}
