// Frontend Item Entity Class (Rendering Shell)

export class Item {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.type = data.type; // 'weapon' | 'medkit'
    this.wt = data.wt;     // Weapon type details if type is 'weapon'
    this.id = data.id;
    this.timer = data.timer;
    this.angle = data.angle || 0;
  }

  draw(ctx) {
    ctx.save();
    
    // We hardcode the maximum lifetime here as 10s to match the server configuration
    const maxLifetime = 10;
    const frac = Math.max(0, this.timer / maxLifetime);

    if (this.type === 'weapon' && this.wt) {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.wt.emoji, 0, 0);
      ctx.restore();
      
      // Timer bar under the weapon
      ctx.fillStyle = 'rgba(255, 200, 0, 0.6)';
      ctx.fillRect(this.x - 10, this.y + 12, 20 * frac, 3);
    } else if (this.type === 'medkit') {
      // Medkit item
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💊', this.x, this.y);
      ctx.restore();
      
      // Timer bar under the medkit
      ctx.fillStyle = 'rgba(0, 220, 120, 0.6)';
      ctx.fillRect(this.x - 10, this.y + 12, 20 * frac, 3);
    } else if (this.type === 'shield') {
      // Shield item
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🛡️', this.x, this.y);
      ctx.restore();
      
      // Timer bar under the shield
      ctx.fillStyle = 'rgba(0, 191, 255, 0.6)';
      ctx.fillRect(this.x - 10, this.y + 12, 20 * frac, 3);
    } else {
      ctx.restore();
    }
  }
}
