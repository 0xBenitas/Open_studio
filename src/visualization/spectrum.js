import { analyser } from '../audio/engine.js';

let specRaf;

export function startSpectrum() {
  const canvas = document.getElementById('specCanvas');
  if (!canvas || !analyser) return;

  function resize() {
    canvas.width = canvas.offsetWidth || 130;
    canvas.height = canvas.offsetHeight || 70;
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  const cc = canvas.getContext('2d');
  const buf = new Uint8Array(analyser.frequencyBinCount);

  function draw() {
    specRaf = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(buf);
    const w = canvas.width, h = canvas.height;
    cc.fillStyle = 'rgba(6,9,14,.85)';
    cc.fillRect(0, 0, w, h);
    const bw = w / buf.length;
    for (let i = 0; i < buf.length; i++) {
      const v = buf[i] / 255;
      const hue = Math.round(180 - v * 160);
      cc.fillStyle = `hsl(${hue},100%,${35 + v * 35}%)`;
      cc.fillRect(i * bw, h - v * h, Math.max(1, bw - .5), v * h);
    }
  }
  draw();
}
