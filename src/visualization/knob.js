const COLOR_MAP = {
  cy: '#00ffd2',
  pu: '#a855f7',
  mg: '#ff2d9b',
  or: '#ff6b2b',
};

export function drawKnob(canvas, v, color, valEl) {
  const cc = canvas.getContext('2d');
  const cx = 40, cy = 40, r = 32;
  cc.clearRect(0, 0, 80, 80);

  // Background circle
  cc.beginPath();
  cc.arc(cx, cy, r, 0, Math.PI * 2);
  cc.fillStyle = '#0d1520';
  cc.fill();
  cc.strokeStyle = '#1e2e44';
  cc.lineWidth = 2;
  cc.stroke();

  // Value arc
  const sa = Math.PI * 0.75;
  const ea = sa + v * Math.PI * 1.5;
  cc.beginPath();
  cc.arc(cx, cy, r - 5, sa, ea);

  let strokeColor;
  if (color.startsWith('var')) {
    const key = color.slice(6, -1);
    strokeColor = COLOR_MAP[key] || '#00ffd2';
  } else {
    strokeColor = color;
  }
  cc.strokeStyle = strokeColor;
  cc.lineWidth = 6;
  cc.lineCap = 'round';
  cc.stroke();

  // Indicator dot
  const nx = cx + Math.cos(ea) * (r - 5);
  const ny = cy + Math.sin(ea) * (r - 5);
  cc.beginPath();
  cc.arc(nx, ny, 3.5, 0, Math.PI * 2);
  cc.fillStyle = '#fff';
  cc.fill();

  // Center value text
  cc.fillStyle = '#dceef5';
  cc.font = 'bold 13px JetBrains Mono';
  cc.textAlign = 'center';
  cc.textBaseline = 'middle';
  cc.fillText(Math.round(v * 100), cx, cy);

  if (valEl) valEl.textContent = Math.round(v * 100);
}
