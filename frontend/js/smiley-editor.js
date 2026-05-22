// Custom Smiley Creator Frontend Module
import { api } from './api.js';

// Helper to darken colors for gradients and borders
function darkenColor(hex, percent) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  r = Math.max(0, Math.floor(r * (1 - percent)));
  g = Math.max(0, Math.floor(g * (1 - percent)));
  b = Math.max(0, Math.floor(b * (1 - percent)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Draw heart helper
function drawHeart(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.3);
  ctx.bezierCurveTo(x - size * 0.5, y - size * 0.6, x - size * 1.2, y + size * 0.1, x, y + size * 1.0);
  ctx.bezierCurveTo(x + size * 1.2, y + size * 0.1, x + size * 0.5, y - size * 0.6, x, y + size * 0.3);
  ctx.closePath();
  ctx.fill();
}

// Vector Smiley Drawing System
export function drawSmiley(ctx, cx, cy, radius, options) {
  ctx.clearRect(0, 0, cx * 2, cy * 2);

  // Default values
  const baseColor = options.baseColor || '#ffcc00';
  const ears = options.ears || 'none';
  const hair = options.hair || 'none';
  const mask = options.mask || 'none';
  const eyes = options.eyes || 'normal';
  const eyebrows = options.eyebrows || 'none';
  const eyelashes = options.eyelashes || 'none';
  const mouth = options.mouth || 'happy';
  const mustache = options.mustache || 'none';
  const hat = options.hat || 'none';

  // 1. Draw Ears (Behind the head)
  if (ears === 'round') {
    // Left ear
    ctx.beginPath();
    ctx.arc(cx - radius * 0.95, cy, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = baseColor;
    ctx.fill();
    ctx.strokeStyle = darkenColor(baseColor, 0.2);
    ctx.lineWidth = radius * 0.05;
    ctx.stroke();
    // Inner left
    ctx.beginPath();
    ctx.arc(cx - radius * 0.95, cy, radius * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fill();

    // Right ear
    ctx.beginPath();
    ctx.arc(cx + radius * 0.95, cy, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = baseColor;
    ctx.fill();
    ctx.stroke();
    // Inner right
    ctx.beginPath();
    ctx.arc(cx + radius * 0.95, cy, radius * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fill();
  } else if (ears === 'elf') {
    ctx.fillStyle = baseColor;
    ctx.strokeStyle = darkenColor(baseColor, 0.2);
    ctx.lineWidth = radius * 0.05;
    // Left elf ear
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.8, cy - radius * 0.2);
    ctx.quadraticCurveTo(cx - radius * 1.4, cy - radius * 0.5, cx - radius * 1.5, cy - radius * 0.7);
    ctx.quadraticCurveTo(cx - radius * 1.1, cy + radius * 0.1, cx - radius * 0.8, cy + radius * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Right elf ear
    ctx.beginPath();
    ctx.moveTo(cx + radius * 0.8, cy - radius * 0.2);
    ctx.quadraticCurveTo(cx + radius * 1.4, cy - radius * 0.5, cx + radius * 1.5, cy - radius * 0.7);
    ctx.quadraticCurveTo(cx + radius * 1.1, cy + radius * 0.1, cx + radius * 0.8, cy + radius * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (ears === 'cat') {
    ctx.fillStyle = baseColor;
    ctx.strokeStyle = darkenColor(baseColor, 0.2);
    ctx.lineWidth = radius * 0.05;
    // Left cat ear
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.7, cy - radius * 0.5);
    ctx.lineTo(cx - radius * 0.85, cy - radius * 1.1);
    ctx.lineTo(cx - radius * 0.3, cy - radius * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner left
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.65, cy - radius * 0.55);
    ctx.lineTo(cx - radius * 0.78, cy - radius * 0.98);
    ctx.lineTo(cx - radius * 0.38, cy - radius * 0.76);
    ctx.closePath();
    ctx.fillStyle = '#ffb3d9';
    ctx.fill();

    // Right cat ear
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(cx + radius * 0.7, cy - radius * 0.5);
    ctx.lineTo(cx + radius * 0.85, cy - radius * 1.1);
    ctx.lineTo(cx + radius * 0.3, cy - radius * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner right
    ctx.beginPath();
    ctx.moveTo(cx + radius * 0.65, cy - radius * 0.55);
    ctx.lineTo(cx + radius * 0.78, cy - radius * 0.98);
    ctx.lineTo(cx + radius * 0.38, cy - radius * 0.76);
    ctx.closePath();
    ctx.fillStyle = '#ffb3d9';
    ctx.fill();
  }

  // 2. Draw Head Base Circle
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
  grad.addColorStop(0, baseColor);
  grad.addColorStop(1, darkenColor(baseColor, 0.16));
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = darkenColor(baseColor, 0.25);
  ctx.lineWidth = radius * 0.055;
  ctx.stroke();

  // 3. Draw Hair (Overlapping head top)
  ctx.save();
  if (hair === 'spiky') {
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.7, cy - radius * 0.6);
    ctx.lineTo(cx - radius * 0.9, cy - radius * 1.0);
    ctx.lineTo(cx - radius * 0.5, cy - radius * 0.8);
    ctx.lineTo(cx - radius * 0.4, cy - radius * 1.25);
    ctx.lineTo(cx - radius * 0.1, cy - radius * 0.85);
    ctx.lineTo(cx, cy - radius * 1.3);
    ctx.lineTo(cx + radius * 0.1, cy - radius * 0.85);
    ctx.lineTo(cx + radius * 0.4, cy - radius * 1.25);
    ctx.lineTo(cx + radius * 0.5, cy - radius * 0.8);
    ctx.lineTo(cx + radius * 0.9, cy - radius * 1.0);
    ctx.lineTo(cx + radius * 0.7, cy - radius * 0.6);
    ctx.closePath();
    ctx.fill();
  } else if (hair === 'afro') {
    ctx.fillStyle = '#1e1e1e';
    const points = [
      { x: cx - radius * 0.7, y: cy - radius * 0.5, r: radius * 0.35 },
      { x: cx - radius * 0.85, y: cy - radius * 0.8, r: radius * 0.38 },
      { x: cx - radius * 0.55, y: cy - radius * 1.1, r: radius * 0.45 },
      { x: cx, y: cy - radius * 1.2, r: radius * 0.5 },
      { x: cx + radius * 0.55, y: cy - radius * 1.1, r: radius * 0.45 },
      { x: cx + radius * 0.85, y: cy - radius * 0.8, r: radius * 0.38 },
      { x: cx + radius * 0.7, y: cy - radius * 0.5, r: radius * 0.35 }
    ];
    points.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (hair === 'curly') {
    ctx.fillStyle = '#5c3a21'; // brown
    const curls = [
      { x: cx - radius * 0.7, y: cy - radius * 0.6, r: radius * 0.25 },
      { x: cx - radius * 0.8, y: cy - radius * 0.8, r: radius * 0.25 },
      { x: cx - radius * 0.5, y: cy - radius * 0.98, r: radius * 0.25 },
      { x: cx - radius * 0.2, y: cy - radius * 1.08, r: radius * 0.25 },
      { x: cx + radius * 0.2, y: cy - radius * 1.08, r: radius * 0.25 },
      { x: cx + radius * 0.5, y: cy - radius * 0.98, r: radius * 0.25 },
      { x: cx + radius * 0.8, y: cy - radius * 0.8, r: radius * 0.25 },
      { x: cx + radius * 0.7, y: cy - radius * 0.6, r: radius * 0.25 }
    ];
    curls.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (hair === 'short') {
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.02, Math.PI * 1.15, Math.PI * 1.85);
    ctx.lineTo(cx + radius * 0.75, cy - radius * 0.45);
    ctx.lineTo(cx - radius * 0.75, cy - radius * 0.45);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 4. Draw Face Paint / Mask (Lower elements layer)
  ctx.save();
  if (mask === 'hero') {
    ctx.fillStyle = '#e94560'; // glowing pink-red domino mask
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.8, cy - radius * 0.15);
    ctx.bezierCurveTo(cx - radius * 0.8, cy - radius * 0.45, cx - radius * 0.1, cy - radius * 0.45, cx - radius * 0.05, cy - radius * 0.15);
    ctx.bezierCurveTo(cx - radius * 0.1, cy + radius * 0.12, cx - radius * 0.8, cy + radius * 0.12, cx - radius * 0.8, cy - radius * 0.15);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + radius * 0.8, cy - radius * 0.15);
    ctx.bezierCurveTo(cx + radius * 0.8, cy - radius * 0.45, cx + radius * 0.1, cy - radius * 0.45, cx + radius * 0.05, cy - radius * 0.15);
    ctx.bezierCurveTo(cx + radius * 0.1, cy + radius * 0.12, cx + radius * 0.8, cy + radius * 0.12, cx + radius * 0.8, cy - radius * 0.15);
    ctx.closePath();
    ctx.fill();

    // bridge
    ctx.fillRect(cx - radius * 0.12, cy - radius * 0.24, radius * 0.24, radius * 0.15);
  } else if (mask === 'blush') {
    const gradL = ctx.createRadialGradient(cx - radius * 0.45, cy + radius * 0.12, 0, cx - radius * 0.45, cy + radius * 0.12, radius * 0.22);
    gradL.addColorStop(0, 'rgba(233, 69, 96, 0.4)');
    gradL.addColorStop(1, 'rgba(233, 69, 96, 0)');
    ctx.fillStyle = gradL;
    ctx.beginPath();
    ctx.arc(cx - radius * 0.45, cy + radius * 0.12, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();

    const gradR = ctx.createRadialGradient(cx + radius * 0.45, cy + radius * 0.12, 0, cx + radius * 0.45, cy + radius * 0.12, radius * 0.22);
    gradR.addColorStop(0, 'rgba(233, 69, 96, 0.4)');
    gradR.addColorStop(1, 'rgba(233, 69, 96, 0)');
    ctx.fillStyle = gradR;
    ctx.beginPath();
    ctx.arc(cx + radius * 0.45, cy + radius * 0.12, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
  } else if (mask === 'scar') {
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = radius * 0.04;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + radius * 0.22, cy - radius * 0.35);
    ctx.lineTo(cx + radius * 0.35, cy + radius * 0.15);
    ctx.stroke();

    ctx.lineWidth = radius * 0.02;
    for (let i = 0; i < 3; i++) {
      const sy = cy - radius * 0.22 + i * radius * 0.12;
      const sx = cx + radius * 0.26 + i * radius * 0.035;
      ctx.beginPath();
      ctx.moveTo(sx - radius * 0.06, sy - radius * 0.02);
      ctx.lineTo(sx + radius * 0.06, sy + radius * 0.02);
      ctx.stroke();
    }
  } else if (mask === 'ninja') {
    ctx.fillStyle = '#141430'; // dark ninja mask
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.98, Math.PI * 0.05, Math.PI * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = radius * 0.04;
    ctx.stroke();
  }
  ctx.restore();

  // 5. Draw Eyes
  ctx.save();
  const exL = cx - radius * 0.28;
  const eyL = cy - radius * 0.12;
  const exR = cx + radius * 0.28;
  const eyR = cy - radius * 0.12;

  if (eyes === 'normal') {
    // Left eye
    ctx.beginPath();
    ctx.arc(exL, eyL, radius * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(exL - radius * 0.04, eyL - radius * 0.04, radius * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Right eye
    ctx.beginPath();
    ctx.arc(exR, eyR, radius * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(exR - radius * 0.04, eyR - radius * 0.04, radius * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  } else if (eyes === 'angry') {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = radius * 0.06;
    ctx.lineCap = 'round';
    // Diagonal lines
    ctx.beginPath();
    ctx.moveTo(exL - radius * 0.08, eyL - radius * 0.04);
    ctx.lineTo(exL + radius * 0.08, eyL + radius * 0.04);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(exR + radius * 0.08, eyR - radius * 0.04);
    ctx.lineTo(exR - radius * 0.08, eyR + radius * 0.04);
    ctx.stroke();
  } else if (eyes === 'cool') {
    // Sunglasses
    ctx.fillStyle = '#0f0f1b';
    ctx.strokeStyle = '#4da6ff';
    ctx.lineWidth = radius * 0.04;
    // Left lens
    ctx.beginPath();
    ctx.moveTo(exL - radius * 0.24, eyL - radius * 0.08);
    ctx.lineTo(exL + radius * 0.20, eyL - radius * 0.08);
    ctx.lineTo(exL + radius * 0.15, eyL + radius * 0.15);
    ctx.quadraticCurveTo(exL - radius * 0.02, eyL + radius * 0.2, exL - radius * 0.20, eyL + radius * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Right lens
    ctx.beginPath();
    ctx.moveTo(exR + radius * 0.24, eyR - radius * 0.08);
    ctx.lineTo(exR - radius * 0.20, eyR - radius * 0.08);
    ctx.lineTo(exR - radius * 0.15, eyR + radius * 0.15);
    ctx.quadraticCurveTo(exR + radius * 0.02, eyR + radius * 0.2, exR + radius * 0.20, eyR + radius * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Bridge
    ctx.beginPath();
    ctx.moveTo(exL + radius * 0.18, eyL - radius * 0.06);
    ctx.lineTo(exR - radius * 0.18, eyR - radius * 0.06);
    ctx.stroke();
    // Glass reflect
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = radius * 0.025;
    ctx.beginPath();
    ctx.moveTo(exL - radius * 0.14, eyL - radius * 0.02);
    ctx.lineTo(exL - radius * 0.04, eyL + radius * 0.1);
    ctx.moveTo(exR - radius * 0.14, eyR - radius * 0.02);
    ctx.lineTo(exR - radius * 0.04, eyR + radius * 0.1);
    ctx.stroke();
  } else if (eyes === 'cute') {
    ctx.fillStyle = '#ff2a5f';
    drawHeart(ctx, exL, eyL, radius * 0.15);
    drawHeart(ctx, exR, eyR, radius * 0.15);
  } else if (eyes === 'closed') {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = radius * 0.065;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(exL, eyL + radius * 0.02, radius * 0.09, Math.PI * 1.15, Math.PI * 1.85, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(exR, eyR + radius * 0.02, radius * 0.09, Math.PI * 1.15, Math.PI * 1.85, false);
    ctx.stroke();
  } else if (eyes === 'dead') {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = radius * 0.065;
    ctx.lineCap = 'round';
    // Left X
    ctx.beginPath();
    ctx.moveTo(exL - radius * 0.09, eyL - radius * 0.09);
    ctx.lineTo(exL + radius * 0.09, eyL + radius * 0.09);
    ctx.moveTo(exL + radius * 0.09, eyL - radius * 0.09);
    ctx.lineTo(exL - radius * 0.09, eyL + radius * 0.09);
    ctx.stroke();
    // Right X
    ctx.beginPath();
    ctx.moveTo(exR - radius * 0.09, eyR - radius * 0.09);
    ctx.lineTo(exR + radius * 0.09, eyR + radius * 0.09);
    ctx.moveTo(exR + radius * 0.09, eyR - radius * 0.09);
    ctx.lineTo(exR - radius * 0.09, eyR + radius * 0.09);
    ctx.stroke();
  }
  ctx.restore();

  // 6. Draw Eyebrows
  ctx.save();
  if (eyebrows === 'normal') {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = radius * 0.05;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(exL, eyL - radius * 0.12, radius * 0.14, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(exR, eyR - radius * 0.12, radius * 0.14, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();
  } else if (eyebrows === 'angry') {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = radius * 0.06;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(exL - radius * 0.16, eyL - radius * 0.22);
    ctx.lineTo(exL + radius * 0.08, eyL - radius * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(exR + radius * 0.16, eyR - radius * 0.22);
    ctx.lineTo(exR - radius * 0.08, eyR - radius * 0.12);
    ctx.stroke();
  } else if (eyebrows === 'sad') {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = radius * 0.055;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(exL - radius * 0.14, eyL - radius * 0.12);
    ctx.lineTo(exL + radius * 0.1, eyL - radius * 0.24);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(exR + radius * 0.14, eyR - radius * 0.12);
    ctx.lineTo(exR - radius * 0.1, eyR - radius * 0.24);
    ctx.stroke();
  }
  ctx.restore();

  // 7. Draw Eyelashes
  ctx.save();
  if (eyelashes === 'normal') {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = radius * 0.03;
    ctx.beginPath();
    ctx.moveTo(exL - radius * 0.08, eyL - radius * 0.1);
    ctx.lineTo(exL - radius * 0.15, eyL - radius * 0.18);
    ctx.moveTo(exL + radius * 0.08, eyL - radius * 0.1);
    ctx.lineTo(exL + radius * 0.13, eyL - radius * 0.18);
    ctx.moveTo(exR - radius * 0.08, eyR - radius * 0.1);
    ctx.lineTo(exR - radius * 0.13, eyR - radius * 0.18);
    ctx.moveTo(exR + radius * 0.08, eyR - radius * 0.1);
    ctx.lineTo(exR + radius * 0.15, eyR - radius * 0.18);
    ctx.stroke();
  } else if (eyelashes === 'cute') {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = radius * 0.035;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(exL - radius * 0.08, eyL - radius * 0.08, radius * 0.06, Math.PI * 1.5, Math.PI * 2.0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(exR + radius * 0.08, eyR - radius * 0.08, radius * 0.06, Math.PI * 1.0, Math.PI * 1.5);
    ctx.stroke();
  }
  ctx.restore();

  // 8. Draw Mouth
  ctx.save();
  const mx = cx;
  const my = cy + radius * 0.28;

  if (mouth === 'happy') {
    ctx.fillStyle = '#7a1116';
    ctx.beginPath();
    ctx.arc(mx, my - radius * 0.04, radius * 0.24, 0, Math.PI, false);
    ctx.closePath();
    ctx.fill();
    ctx.clip();
    // teeth
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(mx - radius * 0.25, my - radius * 0.04, radius * 0.5, radius * 0.08);
    // tongue
    ctx.fillStyle = '#ff6688';
    ctx.beginPath();
    ctx.arc(mx, my + radius * 0.12, radius * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = radius * 0.04;
    ctx.beginPath();
    ctx.arc(mx, my - radius * 0.04, radius * 0.24, 0, Math.PI, false);
    ctx.closePath();
    ctx.stroke();
  } else if (mouth === 'neutral') {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = radius * 0.055;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mx - radius * 0.16, my);
    ctx.lineTo(mx + radius * 0.16, my);
    ctx.stroke();
  } else if (mouth === 'sad') {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = radius * 0.055;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(mx, my + radius * 0.14, radius * 0.18, Math.PI * 1.15, Math.PI * 1.85, true);
    ctx.stroke();
  } else if (mouth === 'shocked') {
    ctx.fillStyle = '#5c1212';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = radius * 0.045;
    ctx.beginPath();
    ctx.arc(mx, my + radius * 0.04, radius * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (mouth === 'tongue') {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = radius * 0.05;
    ctx.beginPath();
    ctx.arc(mx, my - radius * 0.05, radius * 0.18, 0, Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#ff6688';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = radius * 0.035;
    ctx.beginPath();
    ctx.moveTo(mx - radius * 0.06, my + radius * 0.02);
    ctx.lineTo(mx - radius * 0.06, my + radius * 0.18);
    ctx.bezierCurveTo(mx - radius * 0.05, my + radius * 0.26, mx + radius * 0.05, my + radius * 0.26, mx + radius * 0.06, my + radius * 0.18);
    ctx.lineTo(mx + radius * 0.06, my + radius * 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // 9. Draw Mustache / Beard
  ctx.save();
  if (mustache === 'classic') {
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.moveTo(mx, my - radius * 0.02);
    ctx.quadraticCurveTo(mx - radius * 0.18, my - radius * 0.12, mx - radius * 0.32, my - radius * 0.02);
    ctx.quadraticCurveTo(mx - radius * 0.45, my + radius * 0.1, mx - radius * 0.32, my + radius * 0.16);
    ctx.quadraticCurveTo(mx - radius * 0.18, my + radius * 0.08, mx, my + radius * 0.02);
    // right
    ctx.quadraticCurveTo(mx + radius * 0.18, my + radius * 0.08, mx + radius * 0.32, my + radius * 0.16);
    ctx.quadraticCurveTo(mx + radius * 0.45, my + radius * 0.1, mx + radius * 0.32, my - radius * 0.02);
    ctx.quadraticCurveTo(mx + radius * 0.18, my - radius * 0.12, mx, my - radius * 0.02);
    ctx.closePath();
    ctx.fill();
  } else if (mustache === 'goatee') {
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.moveTo(mx - radius * 0.08, my + radius * 0.22);
    ctx.lineTo(mx + radius * 0.08, my + radius * 0.22);
    ctx.lineTo(mx, my + radius * 0.45);
    ctx.closePath();
    ctx.fill();
  } else if (mustache === 'beard') {
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.99, Math.PI * 0.1, Math.PI * 0.9, false);
    ctx.quadraticCurveTo(cx, cy + radius * 1.15, cx - radius * 0.9, cy + radius * 0.3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 10. Draw Hat
  ctx.save();
  if (hat === 'cap') {
    ctx.fillStyle = '#4da6ff'; // blue
    ctx.strokeStyle = '#222';
    ctx.lineWidth = radius * 0.04;
    ctx.beginPath();
    ctx.arc(cx, cy - radius * 0.42, radius * 0.65, Math.PI * 1.0, Math.PI * 2.0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(cx + radius * 0.3, cy - radius * 0.44, radius * 0.5, radius * 0.09, Math.PI * 0.06, 0, Math.PI * 2);
    ctx.fill();
  } else if (hat === 'cowboy') {
    ctx.fillStyle = '#8B4513'; // brown
    ctx.strokeStyle = '#5c2d0d';
    ctx.lineWidth = radius * 0.045;
    ctx.beginPath();
    ctx.ellipse(cx, cy - radius * 0.52, radius * 0.96, radius * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.42, cy - radius * 0.52);
    ctx.quadraticCurveTo(cx - radius * 0.3, cy - radius * 1.0, cx, cy - radius * 0.92);
    ctx.quadraticCurveTo(cx + radius * 0.3, cy - radius * 1.0, cx + radius * 0.42, cy - radius * 0.52);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // hat band
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.rect(cx - radius * 0.41, cy - radius * 0.6, radius * 0.82, radius * 0.09);
    ctx.fill();
  } else if (hat === 'crown') {
    ctx.fillStyle = '#ffd700'; // gold
    ctx.strokeStyle = '#cca300';
    ctx.lineWidth = radius * 0.04;
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.5, cy - radius * 0.5);
    ctx.lineTo(cx - radius * 0.6, cy - radius * 0.95);
    ctx.lineTo(cx - radius * 0.25, cy - radius * 0.7);
    ctx.lineTo(cx, cy - radius * 1.05);
    ctx.lineTo(cx + radius * 0.25, cy - radius * 0.7);
    ctx.lineTo(cx + radius * 0.6, cy - radius * 0.95);
    ctx.lineTo(cx + radius * 0.5, cy - radius * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // gems
    const gemX = [cx - radius * 0.48, cx - radius * 0.25, cx, cx + radius * 0.25, cx + radius * 0.48];
    gemX.forEach((gx, idx) => {
      ctx.beginPath();
      ctx.arc(gx, cy - radius * 0.56, radius * 0.05, 0, Math.PI * 2);
      ctx.fillStyle = (idx % 2 === 0) ? '#e94560' : '#4da6ff';
      ctx.fill();
    });

    const peakGems = [
      { x: cx - radius * 0.6, y: cy - radius * 0.95 },
      { x: cx, y: cy - radius * 1.05 },
      { x: cx + radius * 0.6, y: cy - radius * 0.95 }
    ];
    peakGems.forEach(pg => {
      ctx.beginPath();
      ctx.arc(pg.x, pg.y, radius * 0.04, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();
    });
  }
  ctx.restore();
}

// Smiley Editor Controller Class
export class SmileyEditor {
  constructor() {
    this.modal = document.getElementById('smileyCreatorModal');
    this.canvas = document.getElementById('smileyPreviewCanvas');
    this.ctx = this.canvas?.getContext('2d');
    
    // Vector Form Inputs
    this.baseColorInput = document.getElementById('smColorInput');
    this.earsInput = document.getElementById('smEars');
    this.hairInput = document.getElementById('smHair');
    this.maskInput = document.getElementById('smMask');
    this.eyesInput = document.getElementById('smEyes');
    this.eyebrowsInput = document.getElementById('smEyebrows');
    this.eyelashesInput = document.getElementById('smEyelashes');
    this.mouthInput = document.getElementById('smMouth');
    this.mustacheInput = document.getElementById('smMustache');
    this.hatInput = document.getElementById('smHat');
    this.saveNameInput = document.getElementById('smSaveName');
    
    // Photo Upload Inputs
    this.fileInput = document.getElementById('smUploadInput');
    this.cropCanvas = document.getElementById('smileyCropCanvas');
    this.cropCtx = this.cropCanvas?.getContext('2d');
    this.scaleInput = document.getElementById('smScaleInput');
    this.offsetXInput = document.getElementById('smOffsetX');
    this.offsetYInput = document.getElementById('smOffsetY');
    this.uploadSaveNameInput = document.getElementById('smUploadSaveName');
    
    // State Variables
    this.savedSmileys = [];
    this.activeSmiley = null;
    this.uploadedImage = null;
    this.zoomScale = 1.0;
    this.offsetX = 0;
    this.offsetY = 0;
    
    // Active Tab
    this.currentTab = 'design'; // 'design' | 'upload' | 'saved'
  }

  init() {
    if (!this.modal) return;
    this.setupListeners();
    this.renderPreview();
  }

  setupListeners() {
    // Tab switching
    document.querySelectorAll('.sm-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
      });
    });

    // Close button
    document.getElementById('closeSmileyCreatorBtn')?.addEventListener('click', () => {
      this.close();
    });

    // Inputs update preview
    const vectorInputs = [
      this.baseColorInput, this.earsInput, this.hairInput, this.maskInput,
      this.eyesInput, this.eyebrowsInput, this.eyelashesInput, this.mouthInput,
      this.mustacheInput, this.hatInput
    ];
    vectorInputs.forEach(input => {
      input?.addEventListener('change', () => this.renderPreview());
      input?.addEventListener('input', () => this.renderPreview());
    });

    // Save Vector Button
    document.getElementById('smSaveVectorBtn')?.addEventListener('click', () => {
      this.saveVectorSmiley();
    });

    // Photo selection
    this.fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.uploadedImage = new Image();
          this.uploadedImage.onload = () => {
            this.zoomScale = 1.0;
            this.offsetX = 0;
            this.offsetY = 0;
            if (this.scaleInput) this.scaleInput.value = 1.0;
            if (this.offsetXInput) this.offsetXInput.value = 0;
            if (this.offsetYInput) this.offsetYInput.value = 0;
            this.renderCropPreview();
          };
          this.uploadedImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    // Crop sliders
    const cropInputs = [this.scaleInput, this.offsetXInput, this.offsetYInput];
    cropInputs.forEach(input => {
      input?.addEventListener('input', () => {
        this.zoomScale = parseFloat(this.scaleInput?.value || 1.0);
        this.offsetX = parseFloat(this.offsetXInput?.value || 0);
        this.offsetY = parseFloat(this.offsetYInput?.value || 0);
        this.renderCropPreview();
      });
    });

    // Save Cropped Button
    document.getElementById('smSaveCropBtn')?.addEventListener('click', () => {
      this.saveCroppedSmiley();
    });
  }

  switchTab(tabId) {
    this.currentTab = tabId;
    document.querySelectorAll('.sm-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    document.getElementById('smTabDesign').style.display = (tabId === 'design') ? 'block' : 'none';
    document.getElementById('smTabUpload').style.display = (tabId === 'upload') ? 'block' : 'none';
    document.getElementById('smTabSaved').style.display = (tabId === 'saved') ? 'block' : 'none';

    if (tabId === 'saved') {
      this.renderSavedSmileys();
    }
  }

  async open() {
    this.modal.style.display = 'flex';
    this.switchTab('design');
    
    // Fetch latest user details from API
    try {
      const user = await api.fetchMe();
      this.activeSmiley = user.custom_smiley || null;
      this.savedSmileys = user.saved_smileys ? (typeof user.saved_smileys === 'string' ? JSON.parse(user.saved_smileys) : user.saved_smileys) : [];
      this.renderPreview();
    } catch (err) {
      console.error("Foydalanuvchi ma'lumotlarini yuklashda xatolik:", err);
    }
  }

  close() {
    this.modal.style.display = 'none';
  }

  renderPreview() {
    if (!this.ctx) return;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const radius = 95; // radius to fit nice in 256x256 preview canvas
    
    const options = {
      baseColor: this.baseColorInput?.value || '#ffcc00',
      ears: this.earsInput?.value || 'none',
      hair: this.hairInput?.value || 'none',
      mask: this.maskInput?.value || 'none',
      eyes: this.eyesInput?.value || 'normal',
      eyebrows: this.eyebrowsInput?.value || 'none',
      eyelashes: this.eyelashesInput?.value || 'none',
      mouth: this.mouthInput?.value || 'happy',
      mustache: this.mustacheInput?.value || 'none',
      hat: this.hatInput?.value || 'none'
    };

    drawSmiley(this.ctx, cx, cy, radius, options);
  }

  renderCropPreview() {
    if (!this.cropCtx || !this.uploadedImage) return;
    const cw = this.cropCanvas.width;
    const ch = this.cropCanvas.height;
    
    // Clear canvas
    this.cropCtx.clearRect(0, 0, cw, ch);
    
    // Save state
    this.cropCtx.save();
    
    // Draw image with zoom and offset center
    const iw = this.uploadedImage.width;
    const ih = this.uploadedImage.height;
    
    // Calculate draw scale
    const baseScale = Math.min(cw / iw, ch / ih);
    const drawWidth = iw * baseScale * this.zoomScale;
    const drawHeight = ih * baseScale * this.zoomScale;
    
    const dx = (cw - drawWidth) / 2 + this.offsetX;
    const dy = (ch - drawHeight) / 2 + this.offsetY;
    
    // Draw the image
    this.cropCtx.drawImage(this.uploadedImage, dx, dy, drawWidth, drawHeight);
    
    // Restore state
    this.cropCtx.restore();
    
    // Draw circular crop overlay helper
    this.cropCtx.save();
    this.cropCtx.strokeStyle = '#4da6ff';
    this.cropCtx.lineWidth = 3;
    this.cropCtx.setLineDash([6, 6]);
    this.cropCtx.shadowBlur = 10;
    this.cropCtx.shadowColor = '#4da6ff';
    
    this.cropCtx.beginPath();
    this.cropCtx.arc(cw / 2, ch / 2, 95, 0, Math.PI * 2);
    this.cropCtx.stroke();
    
    // Draw dim outline outside circle
    this.cropCtx.restore();
    this.cropCtx.fillStyle = 'rgba(8, 8, 24, 0.6)';
    
    // Draw mask by cutting hole
    this.cropCtx.save();
    this.cropCtx.beginPath();
    this.cropCtx.rect(0, 0, cw, ch);
    this.cropCtx.arc(cw / 2, ch / 2, 95, 0, Math.PI * 2, true); // counterclockwise
    this.cropCtx.closePath();
    this.cropCtx.fill();
    this.cropCtx.restore();
  }

  async saveVectorSmiley() {
    const name = this.saveNameInput?.value.trim() || `Smaylik #${this.savedSmileys.length + 1}`;
    
    // We render the vector smiley on a clean 256x256 canvas with radius 90 (or similar) to export
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 256;
    exportCanvas.height = 256;
    const eCtx = exportCanvas.getContext('2d');
    
    const options = {
      baseColor: this.baseColorInput?.value || '#ffcc00',
      ears: this.earsInput?.value || 'none',
      hair: this.hairInput?.value || 'none',
      mask: this.maskInput?.value || 'none',
      eyes: this.eyesInput?.value || 'normal',
      eyebrows: this.eyebrowsInput?.value || 'none',
      eyelashes: this.eyelashesInput?.value || 'none',
      mouth: this.mouthInput?.value || 'happy',
      mustache: this.mustacheInput?.value || 'none',
      hat: this.hatInput?.value || 'none'
    };
    
    drawSmiley(eCtx, 128, 128, 110, options); // slightly larger radius for perfect crisp export
    
    const base64Data = exportCanvas.toDataURL('image/png');
    
    const newSmiley = {
      id: 'v-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name,
      type: 'vector',
      data: base64Data
    };
    
    this.savedSmileys.push(newSmiley);
    this.activeSmiley = base64Data; // automatically set as active
    
    try {
      const user = api.getUser();
      const newAvatar = (this.activeSmiley && this.activeSmiley.startsWith('data:image/')) ? this.activeSmiley : user.avatar;
      await api.updateProfile(user.display_name, user.color, newAvatar, user.custom_emojis ? JSON.parse(user.custom_emojis) : null, this.activeSmiley, this.savedSmileys);
      alert('Vektorli smaylik muvaffaqiyatli saqlandi va faol qilindi! 🎨');
      if (this.saveNameInput) this.saveNameInput.value = '';
      this.switchTab('saved');
    } catch (err) {
      alert("Xatolik yuz berdi: " + err.message);
    }
  }

  async saveCroppedSmiley() {
    if (!this.uploadedImage) {
      alert('Iltimos, avval rasm tanlang!');
      return;
    }
    
    const name = this.uploadSaveNameInput?.value.trim() || `Foto #${this.savedSmileys.length + 1}`;
    
    // Crop onto a 256x256 canvas inside a perfect circle
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 256;
    exportCanvas.height = 256;
    const eCtx = exportCanvas.getContext('2d');
    
    // Draw masked circle clip
    eCtx.save();
    eCtx.beginPath();
    eCtx.arc(128, 128, 122, 0, Math.PI * 2);
    eCtx.closePath();
    eCtx.clip();
    
    const cw = 256;
    const ch = 256;
    const iw = this.uploadedImage.width;
    const ih = this.uploadedImage.height;
    
    const baseScale = Math.min(cw / iw, ch / ih);
    const drawWidth = iw * baseScale * this.zoomScale;
    const drawHeight = ih * baseScale * this.zoomScale;
    
    // Offset on 256x256 export size
    const exportOffsetX = this.offsetX * (256 / this.cropCanvas.width);
    const exportOffsetY = this.offsetY * (256 / this.cropCanvas.height);
    
    const dx = (cw - drawWidth) / 2 + exportOffsetX;
    const dy = (ch - drawHeight) / 2 + exportOffsetY;
    
    eCtx.drawImage(this.uploadedImage, dx, dy, drawWidth, drawHeight);
    eCtx.restore();
    
    const base64Data = exportCanvas.toDataURL('image/png');
    
    const newSmiley = {
      id: 'p-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name,
      type: 'photo',
      data: base64Data
    };
    
    this.savedSmileys.push(newSmiley);
    this.activeSmiley = base64Data; // set as active
    
    try {
      const user = api.getUser();
      const newAvatar = (this.activeSmiley && this.activeSmiley.startsWith('data:image/')) ? this.activeSmiley : user.avatar;
      await api.updateProfile(user.display_name, user.color, newAvatar, user.custom_emojis ? JSON.parse(user.custom_emojis) : null, this.activeSmiley, this.savedSmileys);
      alert('Foto smaylik muvaffaqiyatli kesildi va faol qilindi! 📸');
      if (this.uploadSaveNameInput) this.uploadSaveNameInput.value = '';
      this.uploadedImage = null;
      if (this.fileInput) this.fileInput.value = '';
      this.cropCtx.clearRect(0, 0, this.cropCanvas.width, this.cropCanvas.height);
      this.switchTab('saved');
    } catch (err) {
      alert("Xatolik yuz berdi: " + err.message);
    }
  }

  async setActive(smiley) {
    this.activeSmiley = smiley ? smiley.data : null;
    try {
      const user = api.getUser();
      const newAvatar = (this.activeSmiley && this.activeSmiley.startsWith('data:image/')) ? this.activeSmiley : user.avatar;
      await api.updateProfile(user.display_name, user.color, newAvatar, user.custom_emojis ? JSON.parse(user.custom_emojis) : null, this.activeSmiley, this.savedSmileys);
      this.renderSavedSmileys();
      alert(smiley ? `"${smiley.name}" faol smaylik qilindi! 🎮` : 'Klassik o\'yin kulgichlari faollashtirildi!');
    } catch (err) {
      alert("Faol qilishda xatolik: " + err.message);
    }
  }

  async deleteSmiley(smiley) {
    if (!confirm(`"${smiley.name}" smayligini o'chirib yubormoqchimisiz?`)) return;
    
    this.savedSmileys = this.savedSmileys.filter(s => s.id !== smiley.id);
    if (this.activeSmiley === smiley.data) {
      this.activeSmiley = null; // reset if deleted active
    }
    
    try {
      const user = api.getUser();
      const newAvatar = (this.activeSmiley && this.activeSmiley.startsWith('data:image/')) ? this.activeSmiley : user.avatar;
      await api.updateProfile(user.display_name, user.color, newAvatar, user.custom_emojis ? JSON.parse(user.custom_emojis) : null, this.activeSmiley, this.savedSmileys);
      this.renderSavedSmileys();
    } catch (err) {
      alert("O'chirishda xatolik yuz berdi: " + err.message);
    }
  }

  renderSavedSmileys() {
    const grid = document.getElementById('savedSmileysGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    // Add default Option: Classic standard emoticons
    const classicCard = document.createElement('div');
    classicCard.className = 'sm-card' + (this.activeSmiley === null ? ' active' : '');
    classicCard.innerHTML = `
      <div class="sm-card-preview" style="font-size: 42px; display: flex; align-items: center; justify-content: center; background: var(--bg2);">
        😊
      </div>
      <div class="sm-card-info">
        <span class="sm-card-name">Klassik (Standart)</span>
      </div>
      <div class="sm-card-actions">
        <button type="button" class="btn-primary-sm use-classic-btn" style="width: 100%;">Asosiy qilish</button>
      </div>
    `;
    classicCard.querySelector('.use-classic-btn').addEventListener('click', () => {
      this.setActive(null);
    });
    grid.appendChild(classicCard);

    if (this.savedSmileys.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.style.gridColumn = '1 / -1';
      empty.textContent = "Sizda hali saqlangan maxsus smayliklar yo'q.";
      grid.appendChild(empty);
      return;
    }
    
    this.savedSmileys.forEach(s => {
      const card = document.createElement('div');
      const isActive = (this.activeSmiley === s.data);
      card.className = 'sm-card' + (isActive ? ' active' : '');
      
      card.innerHTML = `
        <div class="sm-card-preview checkerboard-bg">
          <img src="${s.data}" alt="${s.name}" style="width: 100%; height: 100%; object-fit: contain;" />
          ${isActive ? '<span class="sm-active-badge">Faol</span>' : ''}
        </div>
        <div class="sm-card-info">
          <span class="sm-card-name">${s.name}</span>
          <span class="sm-card-type">${s.type === 'vector' ? '🎨 Vektor' : '📸 Foto'}</span>
        </div>
        <div class="sm-card-actions">
          <button type="button" class="btn-outline-sm use-btn" ${isActive ? 'disabled' : ''}>Asosiy qilish</button>
          <button type="button" class="btn-ghost-sm delete-btn" style="color: var(--red);">O'chirish</button>
        </div>
      `;
      
      card.querySelector('.use-btn').addEventListener('click', () => {
        this.setActive(s);
      });
      card.querySelector('.delete-btn').addEventListener('click', () => {
        this.deleteSmiley(s);
      });
      grid.appendChild(card);
    });
  }
}
