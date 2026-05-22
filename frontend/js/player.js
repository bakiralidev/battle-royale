// Frontend Player Entity Class (Rendering Shell)

function hexToHue(hex) {
  if (!hex || typeof hex !== 'string') return 50; // base yellow
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  if (hex.length !== 6) return 50;
  
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h = 0;

  if (max !== min) {
    let d = max - min;
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return Math.round(h * 360);
}

const smileyImageCache = {};

export class Player {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.color = data.color;
    this.x = data.x;
    this.y = data.y;
    this.hp = data.hp;
    this.maxHp = data.maxHp || 100;
    this.weapon = data.weapon;
    this.weaponAngle = data.weaponAngle || 0;
    this.isBot = data.isBot || false;
    this.alive = data.alive;
    this.radius = 18; // Enlarged player radius (authoritative)
    this.shieldTimer = data.shieldTimer || 0;
    this.customEmojis = data.customEmojis || null;
    this.customSmiley = data.customSmiley || null;
  }

  draw(ctx, isMainPlayer) {
    if (!this.alive) {
      // Draw death marker (ghostly body or cross)
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();
      
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
      ctx.fillText('✕', this.x, this.y);
      return;
    }

    const hpFrac = this.hp / this.maxHp;

    // Background sphere and shadow removed as requested to show only the smileys

    // Smiley face emoticon inside player circle based on health and weapon
    let customSmileyDrawn = false;
    if (this.customSmiley) {
      let cached = smileyImageCache[this.customSmiley];
      if (!cached) {
        cached = { loaded: false, img: new Image() };
        cached.img.onload = () => {
          cached.loaded = true;
        };
        cached.img.src = this.customSmiley;
        smileyImageCache[this.customSmiley] = cached;
      }
      if (cached.loaded) {
        ctx.save();
        ctx.drawImage(cached.img, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
        customSmileyDrawn = true;
      }
    }

    if (!customSmileyDrawn) {
      ctx.save();
      
      // Apply hue shift filter to colorize the yellow emoji
      const targetHue = hexToHue(this.color);
      const hueShift = (targetHue - 50 + 360) % 360;
      ctx.filter = `hue-rotate(${hueShift}deg)`;

      ctx.fillStyle = '#000000'; // Ensure visibility if emoji renders as monochrome
      ctx.font = '34px "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let smiley = '😊'; // Default happy
      const emojis = this.customEmojis || {};

      if (this.weapon) {
        // If player has a weapon, show a scary/angry look
        if (this.weapon.name === 'Pichoq') {
          smiley = emojis.melee || '😈'; // Scary/mischievous devil face for melee weapon
        } else if (this.weapon.name === 'Pistolet' || this.weapon.name === 'Miltiq') {
          smiley = emojis.gun || '😡'; // Angry face for pistol/rifle
        } else if (this.weapon.name === 'Sniper') {
          smiley = emojis.sniper || '🤬'; // Mad face for sniper
        }
      } else {
        // If player has no weapon, show face based on HP level
        if (hpFrac >= 0.75) {
          smiley = emojis.happy || '😊'; // Happy smiling face when healthy
        } else if (hpFrac >= 0.40) {
          smiley = emojis.neutral || '😐'; // Neutral face when medium health
        } else {
          smiley = emojis.sad || '😢'; // Sad crying face when low health
        }
      }
      // Emojis on Windows (Segoe UI Emoji) render with a vertical offset in Canvas.
      // Shift up slightly to center it inside the player's circle.
      const isWindows = typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('Windows');
      const yOffset = isWindows ? -3.5 : 0;
      ctx.fillText(smiley, this.x, this.y + yOffset);
      ctx.restore();
    }


    // Weapon orbit representation
    if (this.weapon) {
      const wx = this.x + Math.cos(this.weaponAngle) * (this.radius + 10);
      const wy = this.y + Math.sin(this.weaponAngle) * (this.radius + 10);
      ctx.save();
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.weapon.emoji, wx, wy);
      ctx.restore();
    }

    // Glowing Neon Invincibility Shield Bubble
    if (this.shieldTimer > 0) {
      ctx.save();
      const pulse = 1 + Math.sin(performance.now() / 80) * 0.04;
      const shieldRad = (this.radius + 9) * pulse;
      
      const gradient = ctx.createRadialGradient(
        this.x, this.y, this.radius,
        this.x, this.y, shieldRad
      );
      gradient.addColorStop(0, 'rgba(0, 191, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(0, 191, 255, 0.20)');
      gradient.addColorStop(1, 'rgba(0, 191, 255, 0.65)');

      ctx.fillStyle = gradient;
      ctx.strokeStyle = '#00bfff';
      ctx.lineWidth = 3 * pulse;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00bfff';

      ctx.beginPath();
      ctx.arc(this.x, this.y, shieldRad, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // HP Bar background
    const bw = 32;
    const bh = 5;
    const bx = this.x - bw / 2;
    const by = this.y - this.radius - 10;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(bx, by, bw, bh);

    // HP Bar value
    ctx.fillStyle = hpFrac > 0.5 ? '#2ecc71' : hpFrac > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(bx, by, bw * hpFrac, bh);

    // Name plate
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText(this.name, this.x, this.y - this.radius - 16);
  }
}
