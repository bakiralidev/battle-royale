// Frontend Player Entity Class (Rendering Shell)

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
    this.radius = 12;
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
      
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
      ctx.fillText('✕', this.x, this.y);
      return;
    }

    // Shadow
    ctx.beginPath();
    ctx.arc(this.x, this.y + 2, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Main Player Ring Indicator
    if (isMainPlayer) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Weapon orbit representation
    if (this.weapon) {
      const wx = this.x + Math.cos(this.weaponAngle) * (this.radius + 8);
      const wy = this.y + Math.sin(this.weaponAngle) * (this.radius + 8);
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.weapon.emoji, wx, wy);
    }

    // HP Bar background
    const bw = 26;
    const bh = 4;
    const bx = this.x - bw / 2;
    const by = this.y - this.radius - 8;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(bx, by, bw, bh);

    // HP Bar value
    const hpFrac = this.hp / this.maxHp;
    ctx.fillStyle = hpFrac > 0.5 ? '#2ecc71' : hpFrac > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(bx, by, bw * hpFrac, bh);

    // Name plate
    ctx.font = '500 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(this.name, this.x, this.y - this.radius - 12);
  }
}
