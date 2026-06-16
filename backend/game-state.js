// Server-Side Game Engine and State Manager (Room-based)

class SpatialHashGrid {
  constructor(cellSize, width, height) {
    this.cellSize = cellSize;
    this.width = width;
    this.height = height;
    this.cells = new Map();
  }

  hash(x, y) {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
  }

  insert(client) {
    const key = this.hash(client.x, client.y);
    if (!this.cells.has(key)) this.cells.set(key, []);
    this.cells.get(key).push(client);
  }

  clear() {
    this.cells.clear();
  }

  query(x, y, radius) {
    const results = [];
    const minCol = Math.floor((x - radius) / this.cellSize);
    const maxCol = Math.floor((x + radius) / this.cellSize);
    const minRow = Math.floor((y - radius) / this.cellSize);
    const maxRow = Math.floor((y + radius) / this.cellSize);

    for (let c = minCol; c <= maxCol; c++) {
      for (let r = minRow; r <= maxRow; r++) {
        const cell = this.cells.get(`${c},${r}`);
        if (cell) results.push(...cell);
      }
    }
    return results;
  }
}

export class ServerObstacle {
  constructor(x, y, radius, type) {
    this.id = Math.random();
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.type = type; // 'bush'
  }
  serialize() {
    return {
      i: this.id,
      x: Math.round(this.x),
      y: Math.round(this.y),
      r: this.radius,
      t: this.type
    };
  }
}

export class ServerVehicle {
  constructor(x, y, type = 'hoverboard') {
    this.id = Math.random();
    this.x = x;
    this.y = y;
    this.type = type;
    this.hp = 150;
    this.maxHp = 150;
    this.radius = 25;
    this.angle = 0;
    this.speed = 0;
    this.driverId = null; // id of the player driving it
  }

  serialize() {
    return {
      i: this.id,
      x: Math.round(this.x),
      y: Math.round(this.y),
      t: this.type,
      h: Math.round(this.hp),
      mh: this.maxHp,
      a: Number(this.angle.toFixed(2)),
      d: this.driverId
    };
  }
}

// Constants
export const COLORS = [
  '#e94560', // Vibrant Red
  '#4da6ff', // Bright Blue
  '#2ecc71', // Emerald Green
  '#f39c12', // Warm Orange
  '#9b59b6', // Amethyst Purple
  '#1abc9c', // Turquoise Cyan
  '#e67e22', // Carrot Orange
  '#e74c3c', // Alizarin Red
  '#3498db', // Peter River Blue
  '#27ae60', // Nephritis Green
  '#f1c40f', // Sunflower Yellow
  '#fd79a8'  // Pink Glamour
];

export const COLOR_NAMES = [
  'Qizil',
  'Ko\'k',
  'Yashil',
  'To\'q sariq',
  'Binafsha',
  'Zangori',
  'To\'q to\'q',
  'Qirmizi',
  'Havorang',
  'Qoʻngʻir',
  'Sariq',
  'Pushti'
];

export const BOT_NAMES = [
  'Alisher',
  'Bobur',
  'Kamol',
  'Jasur',
  'Nodira',
  'Sarvar',
  'Dilnoza',
  'Umid',
  'Maftuna',
  'Jahongir',
  'Bekzod'
];

export const WEAPON_TYPES = [
  { name: 'Pichoq', dmg: 20, color: '#aaa', emoji: '🔪', isRanged: false, maxAmmo: 0, spread: 0, recoil: 0 },
  { name: 'Pistolet', dmg: 15, color: '#f39c12', emoji: '🔫', isRanged: true, maxAmmo: 6, spread: 0.1, recoil: 2 },
  { name: 'Miltiq', dmg: 20, color: '#e74c3c', emoji: '🪃', isRanged: true, maxAmmo: 6, spread: 0.05, recoil: 3 },
  { name: 'Sniper', dmg: 40, color: '#9b59b6', emoji: '🎯', isRanged: true, maxAmmo: 3, spread: 0, recoil: 6 },
  { name: 'Shotgun', dmg: 12, color: '#e67e22', emoji: '💥', isRanged: true, maxAmmo: 5, spread: 0.3, recoil: 5 },
  { name: 'Rocket', dmg: 50, color: '#c0392b', emoji: '🚀', isRanged: true, maxAmmo: 2, isExplosive: true, spread: 0.05, recoil: 8 },
  { name: 'SMG', dmg: 8, color: '#2ecc71', emoji: '🔫', isRanged: true, maxAmmo: 20, spread: 0.15, recoil: 1, fireRate: 80 },
  { name: 'Granat', dmg: 35, color: '#f1c40f', emoji: '💣', isRanged: true, maxAmmo: 2, isExplosive: true, fuseTime: 2.5, spread: 0.2, recoil: 0 },
  { name: 'Kamon', dmg: 30, color: '#1abc9c', emoji: '🏹', isRanged: true, maxAmmo: 8, spread: 0, recoil: 0, isPiercing: true }
];

export const GAME_CONFIG = {
  WIDTH: 2720,
  HEIGHT: 1920,
  MAX_BOTS: 11,
  TOTAL_PLAYERS: 12,
  ZONE_DURATION: 60, // seconds per zone phase
  ZONE_SHRINK_FACTOR: 0.75,
  ZONE_DAMAGE_RATE: 8, // damage per second out of zone
  PUSHBACK_FORCE: 2.5,
  ATTACK_COOLDOWN: 1200, // ms between attacks
  MAX_MEDKIT_SPAWN: 15,
  MAX_WEAPON_SPAWN: 35,
  MAX_SHIELD_SPAWN: 10,
  MAX_SPEED_SPAWN: 10,
  ITEM_LIFETIME: 10, // seconds
  MEDKIT_HEAL: 25,
  PLAYER_SPEED: 2.8,
  BOT_SPEED: 1.8
};

export class ServerPlayer {
  constructor(id, name, color, x, y, isBot = false, avatar = null, customEmojis = null, customSmiley = null, skin = 'default') {
    this.id = id;
    this.name = name;
    this.color = color;
    this.x = x;
    this.y = y;
    this.hp = 100;
    this.maxHp = 100;
    this.kills = 0;
    this.damageDealt = 0;
    this.skin = skin;
    this.dx = 0;
    this.dy = 0;
    this.weapon = null;
    this.weaponAngle = 0;
    this.isBot = isBot;
    this.alive = true;
    this.pushDx = 0;
    this.pushDy = 0;
    this.radius = 18;
    this.inBush = false;
    
    // Shield, Speed, Weapon and Ability mechanics
    this.speedTimer = 0;
    this.shieldTimer = 0;
    this.ammo = 0;
    this.meleeTimer = 0;
    
    // Ability states
    this.abilityTimer = 0;
    this.abilityCooldown = 0;
    this.buildCooldown = 0;
    this.invisible = false;
    this.inSpeedZone = false;

    // Bot-specific AI variables
    this.aimTimer = 0;

    // Custom Profile details
    this.avatar = avatar;
    this.customEmojis = customEmojis;
    this.customSmiley = customSmiley;

    this.squadId = null;
  }

  takeDamage(amount) {
    if (!this.alive) return;
    if (this.shieldTimer > 0) return; // Invulnerable when shield is active
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  updatePhysics(dt, isDriving = false) {
    if (!this.alive) return;
    this.inSpeedZone = false;

    // Decay shield timer
    if (this.shieldTimer > 0) {
      this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    }
    
    // Decay speed timer
    if (this.speedTimer > 0) {
      this.speedTimer = Math.max(0, this.speedTimer - dt);
    }
    
    // Decay ability states
    if (this.abilityCooldown > 0) {
      this.abilityCooldown = Math.max(0, this.abilityCooldown - dt);
    }
    if (this.buildCooldown > 0) {
      this.buildCooldown = Math.max(0, this.buildCooldown - dt);
    }
    if (this.abilityTimer > 0) {
      this.abilityTimer = Math.max(0, this.abilityTimer - dt);
      if (this.abilityTimer === 0 && this.skin === 'ninja') {
        this.invisible = false;
      }
    }

    // Decay melee weapon timer (melee weapon disappears after 10s)
    if (this.weapon && !this.weapon.isRanged) {
      this.meleeTimer -= dt;
      if (this.meleeTimer <= 0) {
        this.weapon = null;
      }
    }

    // Apply pushback momentum from collisions
    if (Math.abs(this.pushDx) > 0.01) {
      this.pushDx *= 0.85;
      this.x += this.pushDx * dt * 60;
    } else {
      this.pushDx = 0;
    }

    if (Math.abs(this.pushDy) > 0.01) {
      this.pushDy *= 0.85;
      this.y += this.pushDy * dt * 60;
    } else {
      this.pushDy = 0;
    }

    // Normal movement
    let speed = this.isBot ? GAME_CONFIG.BOT_SPEED : GAME_CONFIG.PLAYER_SPEED;
    if (this.speedTimer > 0 || this.inSpeedZone) speed *= 1.5; // 50% speed boost
    if (isDriving) speed *= 2.5; // Hoverboard speed boost

    let nx = this.x + this.dx * speed * dt * 60;
    let ny = this.y + this.dy * speed * dt * 60;
    
    // Boundary containment
    nx = Math.max(this.radius, Math.min(GAME_CONFIG.WIDTH - this.radius, nx));
    ny = Math.max(this.radius, Math.min(GAME_CONFIG.HEIGHT - this.radius, ny));

    this.x = nx;
    this.y = ny;

    // Rotate weapon
    if (this.weapon) {
      this.weaponAngle = (this.weaponAngle + dt * 2.5) % (Math.PI * 2);
    }
  }

  checkBushes(obstacles) {
    if (!this.alive) return;
    this.inBush = false;
    for (const obs of obstacles) {
      const dist = Math.hypot(this.x - obs.x, this.y - obs.y);
      if (obs.type === 'bush' && dist < obs.radius) {
        this.inBush = true;
      }
      
      // Collision check for solid obstacles
      if (obs.type === 'wood_wall' || obs.type === 'shield_wall') {
        if (dist < obs.radius + this.radius) {
          const overlap = (obs.radius + this.radius) - dist;
          const ang = Math.atan2(this.y - obs.y, this.x - obs.x);
          this.x += Math.cos(ang) * overlap;
          this.y += Math.sin(ang) * overlap;
        }
      }
    }
  }

  updateZoneDamage(zoneCx, zoneCy, zoneR, dt) {
    if (!this.alive) return;
    
    const distZ = Math.hypot(this.x - zoneCx, this.y - zoneCy);
    if (distZ > zoneR) {
      // Push back inwards slightly
      const ang = Math.atan2(zoneCy - this.y, zoneCx - this.x);
      this.x += Math.cos(ang) * 2.5;
      this.y += Math.sin(ang) * 2.5;
      
      // Inflict zone damage (shield blocks storm damage since it is complete invincibility)
      this.takeDamage(GAME_CONFIG.ZONE_DAMAGE_RATE * dt);
    }
  }

  checkItemPickups(items) {
    if (!this.alive) return items;

    return items.filter(it => {
      const d = Math.hypot(it.x - this.x, it.y - this.y);
      if (d < this.radius + 6) { // Pick up radius
        if (it.type === 'weapon' && !this.weapon) {
          this.weapon = it.wt;
          if (it.wt.isRanged) {
            this.ammo = it.wt.maxAmmo;
          } else {
            this.meleeTimer = 10;
          }
          return false;
        }
        if (it.type === 'medkit') {
          this.hp = Math.min(this.maxHp, this.hp + GAME_CONFIG.MEDKIT_HEAL);
          return false;
        }
        if (it.type === 'shield') {
          this.shieldTimer = 7;
          return false;
        }
        if (it.type === 'speed_boost') {
          this.speedTimer = 5;
          return false;
        }
      }
      return true;
    });
  }

  updateAI(alivePlayers, items, zoneCx, zoneCy, zoneR, dt, shootCallback) {
    if (!this.alive) return;

    this.aimTimer -= dt;
    if (this.aimTimer <= 0) {
      this.aimTimer = 0.6 + Math.random() * 0.8;
      
      let target = null;
      let minD = 9999;

      // Target closest player (enemies)
      let closestEnemy = null;
      let closestEnemyDist = 9999;
      alivePlayers.forEach(q => {
        if (q === this) return;
        const d = Math.hypot(q.x - this.x, q.y - this.y);
        if (q.inBush && d > 80) return; // Ignore enemies hidden in bush unless very close
        if (d < closestEnemyDist) {
          closestEnemyDist = d;
          closestEnemy = q;
        }
      });

      // If bot has no weapon, look for nearest item (prefer weapon, then shield, then medkit)
      if (!this.weapon) {
        items.forEach(it => {
          const d = Math.hypot(it.x - this.x, it.y - this.y);
          if (d < minD) {
            minD = d;
            target = { x: it.x, y: it.y };
          }
        });
      }

      // If bot has a weapon or no items exist, target closest enemy
      if ((!target || this.weapon) && closestEnemy) {
        target = { x: closestEnemy.x, y: closestEnemy.y };
        minD = closestEnemyDist;
      }

      // Medkit izlash (HP < 50 da)
      if (this.hp < 50) {
        let nearestMedkit = null;
        let medkitD = 9999;
        items.forEach(it => {
          if (it.type === 'medkit') {
            const d = Math.hypot(it.x - this.x, it.y - this.y);
            if (d < medkitD) {
              medkitD = d;
              nearestMedkit = it;
            }
          }
        });
        if (nearestMedkit) {
          target = { x: nearestMedkit.x, y: nearestMedkit.y };
          minD = medkitD;
        }
      }

      // Keep bot inside safe zone
      const distCenter = Math.hypot(this.x - zoneCx, this.y - zoneCy);
      if (distCenter > zoneR - 50) {
        const ang = Math.atan2(zoneCy - this.y, zoneCx - this.x);
        let runSpeed = 1.6;
        if (distCenter > zoneR) runSpeed = 2.0; // Sprint if taking zone damage
        this.dx = Math.cos(ang) * runSpeed;
        this.dy = Math.sin(ang) * runSpeed;
      } else if (target) {
        const ang = Math.atan2(target.y - this.y, target.x - this.x);
        const spd = 0.8 + Math.random() * 0.8;
        
        // 1. Zigzag / strafe harakat qo'shing
        this.strafeAngle = (this.strafeAngle || 0) + dt * 2.5;
        const strafeOffset = Math.cos(this.strafeAngle) * 0.6;
        this.dx = Math.cos(ang) * spd + Math.cos(ang + Math.PI / 2) * strafeOffset;
        this.dy = Math.sin(ang) * spd + Math.sin(ang + Math.PI / 2) * strafeOffset;
        
        // 2. HP past bo'lsa qochish
        if (this.hp < 30 && closestEnemyDist < 200 && closestEnemy) {
          const escapeAng = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x);
          this.dx = -Math.cos(escapeAng) * 1.5;
          this.dy = -Math.sin(escapeAng) * 1.5;
        }
      }
    }

    // Bot shooting logic
    if (this.weapon && this.weapon.isRanged && this.ammo > 0) {
      let closestEnemy = null;
      let minEnemyDist = 500;
      alivePlayers.forEach(q => {
        if (q === this) return;
        const d = Math.hypot(q.x - this.x, q.y - this.y);
        if (q.inBush && d > 80) return; // Cannot shoot at hidden enemy
        if (d < minEnemyDist) {
          minEnemyDist = d;
          closestEnemy = q;
        }
      });

      if (closestEnemy) {
        if (Math.random() < 0.12) { // 12% chance per tick to shoot if enemy in range
          const angle = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x);
          shootCallback(this.id, angle);
        }
      }
    }
  }

  serialize(isFull = true) {
    const data = {
      i: this.id,
      x: Math.round(this.x),
      y: Math.round(this.y),
      h: Math.round(this.hp),
      wa: Number(this.weaponAngle.toFixed(2)),
      a: this.alive,
      w: this.weapon,
      sq: this.squadId,
      inv: this.invisible
    };

    if (isFull) {
      data.n = this.name;
      data.c = this.color;
      data.mh = this.maxHp;
      data.b = this.isBot;
      data.ib = this.inBush;
      data.am = this.ammo;
      data.mt = this.meleeTimer;
      data.st = this.shieldTimer;
      data.spt = this.speedTimer;
      data.k = this.kills;
      data.sk = this.skin;
      data.av = this.avatar;
      data.ce = this.customEmojis;
      data.cs = this.customSmiley;
    }
    
    return data;
  }
}

export class ServerItem {
  constructor(x, y, type, wt = null) {
    this.x = x;
    this.y = y;
    this.type = type; // 'weapon' | 'medkit' | 'shield'
    this.wt = wt;     // details if type is 'weapon'
    this.id = Math.random();
    this.timer = GAME_CONFIG.ITEM_LIFETIME;
    this.angle = 0;
  }

  update(dt) {
    this.timer -= dt;
    if (this.type === 'weapon') {
      this.angle = (this.angle + dt * 1.2) % (Math.PI * 2);
    }
    return this.timer > 0;
  }

  serialize() {
    return {
      i: this.id,
      x: Math.round(this.x),
      y: Math.round(this.y),
      t: this.type,
      w: this.wt,
      a: Number(this.angle.toFixed(2)),
      tm: Number(this.timer.toFixed(1))
    };
  }
}

export class ServerAirdrop {
  constructor(x, y, type = 'airdrop') {
    this.id = Math.random();
    this.x = x;
    this.y = y;
    this.radius = type === 'loot_crate' ? 18 : 25;
    this.opened = false;
    this.type = type;
  }
  serialize() {
    return {
      i: this.id,
      x: Math.round(this.x),
      y: Math.round(this.y),
      o: this.opened,
      t: this.type
    };
  }
}

export class ServerBomb {
  constructor(x, y) {
    this.id = Math.random();
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.bounces = 0;
    
    const angle = Math.random() * Math.PI * 2;
    const speed = 120 + Math.random() * 60;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    let bounced = false;
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx = -this.vx;
      bounced = true;
    } else if (this.x + this.radius > GAME_CONFIG.WIDTH) {
      this.x = GAME_CONFIG.WIDTH - this.radius;
      this.vx = -this.vx;
      bounced = true;
    }

    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy = -this.vy;
      bounced = true;
    } else if (this.y + this.radius > GAME_CONFIG.HEIGHT) {
      this.y = GAME_CONFIG.HEIGHT - this.radius;
      this.vy = -this.vy;
      bounced = true;
    }

    if (bounced) {
      this.bounces++;
    }

    return this.bounces < 3;
  }

  serialize() {
    return {
      i: this.id,
      x: Math.round(this.x),
      y: Math.round(this.y),
      r: this.radius
    };
  }
}

export class ServerBullet {
  constructor(id, x, y, angle, dmg, ownerId, isExplosive = false) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = isExplosive ? 8 : 4;
    this.dmg = dmg;
    this.ownerId = ownerId;
    this.isExplosive = isExplosive;
    this.life = 1.5;
    
    const speed = isExplosive ? 350 : 550;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    
    this.isGrenade = false;
    this.isPiercing = false;
    this.piercedPlayers = [];
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    if (this.isGrenade) {
      this.vx *= 0.92;
      this.vy *= 0.92;
    }
    
    this.life -= dt;
    
    if (this.x < 0 || this.x > GAME_CONFIG.WIDTH || this.y < 0 || this.y > GAME_CONFIG.HEIGHT) {
      return false;
    }
    
    return this.life > 0;
  }

  serialize() {
    return {
      i: this.id,
      x: Math.round(this.x),
      y: Math.round(this.y),
      r: this.radius
    };
  }
}

class BulletPool {
  constructor() {
    this.pool = [];
  }
  
  get(id, x, y, angle, dmg, ownerId, isExplosive = false) {
    if (this.pool.length > 0) {
      const b = this.pool.pop();
      b.id = id;
      b.x = x;
      b.y = y;
      b.radius = isExplosive ? 8 : 4;
      b.dmg = dmg;
      b.ownerId = ownerId;
      b.isExplosive = isExplosive;
      b.life = 1.5;
      
      const speed = isExplosive ? 350 : 550;
      b.vx = Math.cos(angle) * speed;
      b.vy = Math.sin(angle) * speed;
      
      b.isGrenade = false;
      b.isPiercing = false;
      b.piercedPlayers = [];
      return b;
    }
    return new ServerBullet(id, x, y, angle, dmg, ownerId, isExplosive);
  }
  
  release(b) {
    this.pool.push(b);
  }
}
export const bulletPool = new BulletPool();


function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max));
}

function spawnBombs(numBombs, zoneR, zoneCx, zoneCy) {
  const bombs = [];
  for (let i = 0; i < numBombs; i++) {
    let x, y, tries = 0;
    do {
      x = rand(60, GAME_CONFIG.WIDTH - 60);
      y = rand(60, GAME_CONFIG.HEIGHT - 60);
      tries++;
    } while (tries < 50 && Math.hypot(x - zoneCx, y - zoneCy) > zoneR - 30);
    bombs.push(new ServerBomb(x, y));
  }
  return bombs;
}

function spawnItems(zoneR, zoneCx, zoneCy, numWeapons = GAME_CONFIG.MAX_WEAPON_SPAWN, numMedkits = GAME_CONFIG.MAX_MEDKIT_SPAWN, numShields = GAME_CONFIG.MAX_SHIELD_SPAWN, numSpeed = GAME_CONFIG.MAX_SPEED_SPAWN) {
  const items = [];
  
  for (let i = 0; i < numWeapons; i++) {
    let x, y, tries = 0;
    do {
      x = rand(60, GAME_CONFIG.WIDTH - 60);
      y = rand(60, GAME_CONFIG.HEIGHT - 60);
      tries++;
    } while (tries < 50 && Math.hypot(x - zoneCx, y - zoneCy) > zoneR - 30);
    
    const wt = WEAPON_TYPES[randInt(0, WEAPON_TYPES.length)];
    items.push(new ServerItem(x, y, 'weapon', wt));
  }

  for (let i = 0; i < numMedkits; i++) {
    let x, y, tries = 0;
    do {
      x = rand(60, GAME_CONFIG.WIDTH - 60);
      y = rand(60, GAME_CONFIG.HEIGHT - 60);
      tries++;
    } while (tries < 50 && Math.hypot(x - zoneCx, y - zoneCy) > zoneR - 30);
    
    items.push(new ServerItem(x, y, 'medkit'));
  }

  for (let i = 0; i < numShields; i++) {
    let x, y, tries = 0;
    do {
      x = rand(60, GAME_CONFIG.WIDTH - 60);
      y = rand(60, GAME_CONFIG.HEIGHT - 60);
      tries++;
    } while (tries < 50 && Math.hypot(x - zoneCx, y - zoneCy) > zoneR - 30);
    
    items.push(new ServerItem(x, y, 'shield'));
  }

  for (let i = 0; i < numSpeed; i++) {
    let x, y, tries = 0;
    do {
      x = rand(60, GAME_CONFIG.WIDTH - 60);
      y = rand(60, GAME_CONFIG.HEIGHT - 60);
      tries++;
    } while (tries < 50 && Math.hypot(x - zoneCx, y - zoneCy) > zoneR - 30);
    
    items.push(new ServerItem(x, y, 'speed_boost'));
  }

  return items;
}

function spawnBuilding(bx, by, width, height, obstacles) {
  const wallRadius = 25;
  const step = 40; // distance between wall circles
  
  // Top and bottom walls
  for (let x = bx; x <= bx + width; x += step) {
    // Leave a gap for the door on the bottom wall in the middle
    if (x < bx + width/2 - 30 || x > bx + width/2 + 30) {
      obstacles.push(new ServerObstacle(x, by, wallRadius, 'wood_wall')); // top wall
    }
    obstacles.push(new ServerObstacle(x, by + height, wallRadius, 'wood_wall')); // bottom wall
  }
  
  // Left and right walls
  for (let y = by + step; y < by + height; y += step) {
    obstacles.push(new ServerObstacle(bx, y, wallRadius, 'wood_wall')); // left wall
    obstacles.push(new ServerObstacle(bx + width, y, wallRadius, 'wood_wall')); // right wall
  }
}

export class GameStateManager {
  constructor(roomCode, hostId, useBots = true, botCount = 11) {
    this.roomCode = roomCode;
    this.hostId = hostId;
    this.useBots = useBots;
    this.botCount = Number(botCount);

    this.lobbyPlayers = new Map(); // socket.id -> { id, name, color, isHost }
    this.activePlayers = []; // ServerPlayer list
    this.items = [];
    this.bullets = [];
    this.bombs = [];
    this.obstacles = [];
    this.vehicles = [];
    this.airdrops = [];
    this.grid = new SpatialHashGrid(150, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    
    // Zone config
    this.zoneCx = GAME_CONFIG.WIDTH / 2;
    this.zoneCy = GAME_CONFIG.HEIGHT / 2;
    this.zoneR = 0;
    this.zoneTargetR = 0;
    this.zoneTimer = GAME_CONFIG.ZONE_DURATION;
    this.zoneLastTick = 0;

    this.status = 'lobby'; // 'lobby' | 'countdown' | 'playing' | 'ended'
    this.countdownSeconds = 5;
    this.countdownTimerId = null;

    this.lobbyTimer = 0; // seconds before resetting to lobby
    this.itemSpawnTimer = 0;
    this.airdropTimer = 0;
    this.mapEventTimer = 0;
    this.attackTimers = {};
    
    this.lastUpdate = 0;
    this.tickCount = 0;
  }

  addLobbyPlayer(socketId, name, color, avatar = null, customEmojis = null, customSmiley = null, skin = 'default') {
    const isHost = (socketId === this.hostId);
    this.lobbyPlayers.set(socketId, { id: socketId, name, color, isHost, avatar, customEmojis, customSmiley, skin });
  }

  removeLobbyPlayer(socketId) {
    this.lobbyPlayers.delete(socketId);
    
    // If the leaving player was the host, assign hostship to someone else in the lobby
    if (socketId === this.hostId && this.lobbyPlayers.size > 0) {
      const nextSocketId = this.lobbyPlayers.keys().next().value;
      this.hostId = nextSocketId;
      const nextPlayer = this.lobbyPlayers.get(nextSocketId);
      if (nextPlayer) {
        nextPlayer.isHost = true;
      }
    }

    // Remove from active players as well if game in progress
    const idx = this.activePlayers.findIndex(p => p.id === socketId);
    if (idx !== -1) {
      this.activePlayers[idx].alive = false;
      this.activePlayers[idx].hp = 0;
    }
  }

  handlePlayerAction(socketId) {
    if (this.status !== 'playing') return;
    const player = this.activePlayers.find(p => p.id === socketId);
    if (!player || !player.alive) return;

    // Check if driving
    const drivingVehicle = this.vehicles.find(v => v.driverId === socketId);
    if (drivingVehicle) {
      // Dismount
      drivingVehicle.driverId = null;
      return;
    }

    // Mount nearest empty vehicle
    const emptyVehicle = this.vehicles.find(v => !v.driverId && Math.hypot(v.x - player.x, v.y - player.y) < 60);
    if (emptyVehicle) {
      emptyVehicle.driverId = socketId;
      player.x = emptyVehicle.x;
      player.y = emptyVehicle.y;
      return;
    }

    // Open nearest unopened airdrop / loot crate
    const airdrop = this.airdrops.find(a => !a.opened && Math.hypot(a.x - player.x, a.y - player.y) < 60);
    if (airdrop) {
      airdrop.opened = true;
      if (airdrop.type === 'loot_crate') {
        const midWeapons = WEAPON_TYPES.filter(w => w.name === 'SMG' || w.name === 'Miltiq' || w.name === 'Shotgun' || w.name === 'Kamon');
        const dropWeapon = midWeapons[randInt(0, midWeapons.length)];
        this.items.push(new ServerItem(airdrop.x + rand(-15, 15), airdrop.y + rand(-15, 15), 'weapon', dropWeapon));
        if (Math.random() > 0.5) {
          const type = Math.random() > 0.5 ? 'shield' : 'speed_boost';
          this.items.push(new ServerItem(airdrop.x + rand(-15, 15), airdrop.y + rand(-15, 15), type));
        } else {
          this.items.push(new ServerItem(airdrop.x + rand(-15, 15), airdrop.y + rand(-15, 15), 'medkit'));
        }
      } else {
        const topWeapons = WEAPON_TYPES.filter(w => w.name === 'Sniper' || w.name === 'Rocket' || w.name === 'Granat');
        const dropWeapon = topWeapons[randInt(0, topWeapons.length)];
        this.items.push(new ServerItem(airdrop.x + rand(-20, 20), airdrop.y + rand(-20, 20), 'weapon', dropWeapon));
        this.items.push(new ServerItem(airdrop.x + rand(-20, 20), airdrop.y + rand(-20, 20), 'medkit'));
        if (Math.random() > 0.3) {
          this.items.push(new ServerItem(airdrop.x + rand(-20, 20), airdrop.y + rand(-20, 20), 'shield'));
        }
      }
    }
  }

  handlePlayerAbility(playerId) {
    if (this.status !== 'playing') return;
    const player = this.activePlayers.find(p => p.id === playerId);
    if (!player || !player.alive || player.abilityCooldown > 0) return;

    player.abilityCooldown = 15; // 15 seconds cooldown for all abilities
    
    switch (player.skin) {
      case 'ninja':
        // Ninja: Invisibility for 5 seconds
        player.invisible = true;
        player.abilityTimer = 5;
        break;
      case 'robot':
        // Robot: Shield Wall
        // Spawn a temporary destructible obstacle directly in front of the player
        const wallX = player.x + Math.cos(player.weaponAngle) * 60;
        const wallY = player.y + Math.sin(player.weaponAngle) * 60;
        const wall = new ServerObstacle(wallX, wallY, 30, 'shield_wall');
        wall.timer = 10; // lasts 10 seconds
        this.obstacles.push(wall);
        break;
      case 'zombie':
        // Zombie: Toxic Cloud (radius 100, lasts 8 seconds)
        const cloud = new ServerObstacle(player.x, player.y, 100, 'toxic_cloud');
        cloud.ownerId = player.id;
        cloud.timer = 8;
        this.obstacles.push(cloud);
        break;
      case 'default':
      default:
        // Default: Speed Boost and Radar (represented by emitting an event or just speed)
        player.speedTimer = 8; // 8 seconds of sprint
        break;
    }
  }

  handlePlayerBuildWall(playerId) {
    if (this.status !== 'playing') return;
    const player = this.activePlayers.find(p => p.id === playerId);
    if (!player || !player.alive || player.buildCooldown > 0) return;

    player.buildCooldown = 5; // 5 seconds cooldown for building walls

    const wallX = player.x + Math.cos(player.weaponAngle) * 50;
    const wallY = player.y + Math.sin(player.weaponAngle) * 50;
    const wall = new ServerObstacle(wallX, wallY, 25, 'wood_wall');
    wall.timer = 15; // Wall stays for 15 seconds
    this.obstacles.push(wall);
  }

  handlePlayerInput(socketId, dx, dy) {
    const player = this.activePlayers.find(p => p.id === socketId);
    if (player && player.alive) {
      let ndx = dx;
      let ndy = dy;
      if (ndx !== 0 && ndy !== 0) {
        ndx *= 0.7071;
        ndy *= 0.7071;
      }
      player.dx = ndx;
      player.dy = ndy;
    }
  }

  handlePlayerShoot(socketId, angle) {
    if (this.status !== 'playing') return false;
    const player = this.activePlayers.find(p => p.id === socketId);
    if (!player || !player.alive) return false;
    if (!player.weapon || !player.weapon.isRanged) return false;
    if (player.ammo <= 0) return false;

    const now = Date.now();
    const lastShot = this.attackTimers[`shoot-${socketId}`] || 0;
    
    let cooldown = player.weapon.fireRate || 350;
    if (!player.weapon.fireRate) {
      if (player.weapon.name === 'Sniper') cooldown = 800;
      else if (player.weapon.name === 'Shotgun') cooldown = 600;
      else if (player.weapon.name === 'Rocket') cooldown = 1200;
      else if (player.weapon.name === 'Granat') cooldown = 800;
      else if (player.weapon.name === 'Kamon') cooldown = 700;
    }

    if (now - lastShot < cooldown) return false;
    this.attackTimers[`shoot-${socketId}`] = now;

    player.ammo--;

    const spawnDist = player.radius + 6;
    const bx = player.x + Math.cos(angle) * spawnDist;
    const by = player.y + Math.sin(angle) * spawnDist;

    const spread = player.weapon.spread || 0;
    const recoil = player.weapon.recoil || 0;

    // Apply recoil to player
    if (recoil > 0) {
      player.pushDx -= Math.cos(angle) * recoil;
      player.pushDy -= Math.sin(angle) * recoil;
    }

    if (player.weapon.name === 'Shotgun') {
      const shotSpread = spread || 0.25; // ~15 degrees
      this.bullets.push(bulletPool.get(Math.random(), bx, by, angle - shotSpread, player.weapon.dmg, socketId, false));
      this.bullets.push(bulletPool.get(Math.random(), bx, by, angle, player.weapon.dmg, socketId, false));
      this.bullets.push(bulletPool.get(Math.random(), bx, by, angle + shotSpread, player.weapon.dmg, socketId, false));
    } else {
      const actualAngle = angle + (Math.random() - 0.5) * spread * 2;
      const isGrenade = (player.weapon.name === 'Granat');
      const bullet = bulletPool.get(Math.random(), bx, by, actualAngle, player.weapon.dmg, socketId, player.weapon.isExplosive);
      
      if (isGrenade) {
        bullet.isGrenade = true;
        bullet.life = player.weapon.fuseTime || 2.5;
        const throwSpeed = 200;
        bullet.vx = Math.cos(actualAngle) * throwSpeed;
        bullet.vy = Math.sin(actualAngle) * throwSpeed;
      }
      
      if (player.weapon.isPiercing) {
        bullet.isPiercing = true;
        bullet.piercedPlayers = [];
      }
      
      this.bullets.push(bullet);
    }

    if (player.ammo <= 0) {
      player.weapon = null;
    }
    return true;
  }

  startCountdown(callback) {
    if (this.status !== 'lobby') return;
    this.status = 'countdown';
    this.countdownSeconds = 5;

    const tickCountdown = () => {
      if (this.status !== 'countdown') return;
      
      if (callback) callback('countdown', this.countdownSeconds);

      if (this.countdownSeconds <= 0) {
        this.startGame(callback);
      } else {
        this.countdownSeconds--;
        this.countdownTimerId = setTimeout(tickCountdown, 1000);
      }
    };
    
    tickCountdown();
  }

  cancelCountdown() {
    if (this.status === 'countdown') {
      clearTimeout(this.countdownTimerId);
      this.status = 'lobby';
    }
  }

  startGame(eventCallback) {
    this.status = 'playing';
    
    const initialZoneR = Math.min(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT) / 2 - 10;
    this.zoneR = initialZoneR;
    this.zoneTargetR = initialZoneR;
    this.zoneTimer = GAME_CONFIG.ZONE_DURATION;
    this.zoneLastTick = Date.now();
    this.lastUpdate = Date.now();
    this.itemSpawnTimer = 8;
    this.airdropTimer = 0;
    this.mapEventTimer = 15; // first event in 15 seconds!
    this.attackTimers = {};
    
    // Spawn static obstacles (bushes)
    this.obstacles = [];
    for (let i = 0; i < 40; i++) {
      const x = rand(80, GAME_CONFIG.WIDTH - 80);
      const y = rand(80, GAME_CONFIG.HEIGHT - 80);
      this.obstacles.push(new ServerObstacle(x, y, rand(45, 60), 'bush'));
    }
    
    this.items = spawnItems(initialZoneR, this.zoneCx, this.zoneCy);
    this.bullets = [];
    this.bombs = spawnBombs(6, initialZoneR, this.zoneCx, this.zoneCy);

    // Spawn Buildings and Loot Crates inside them
    spawnBuilding(this.zoneCx - 350, this.zoneCy - 250, 160, 120, this.obstacles);
    spawnBuilding(this.zoneCx + 150, this.zoneCy - 250, 160, 120, this.obstacles);
    spawnBuilding(this.zoneCx - 80, this.zoneCy + 150, 160, 120, this.obstacles);

    // Place a loot crate in the center of each building
    this.airdrops.push(new ServerAirdrop(this.zoneCx - 270, this.zoneCy - 190, 'loot_crate'));
    this.airdrops.push(new ServerAirdrop(this.zoneCx + 230, this.zoneCy - 190, 'loot_crate'));
    this.airdrops.push(new ServerAirdrop(this.zoneCx, this.zoneCy + 210, 'loot_crate'));

    // Place random loot crates on the map
    for (let i = 0; i < 4; i++) {
      let x = rand(100, GAME_CONFIG.WIDTH - 100);
      let y = rand(100, GAME_CONFIG.HEIGHT - 100);
      this.airdrops.push(new ServerAirdrop(x, y, 'loot_crate'));
    }
    
    // Spawn Vehicles
    this.vehicles = [];
    for (let i = 0; i < 8; i++) {
      const x = rand(200, GAME_CONFIG.WIDTH - 200);
      const y = rand(200, GAME_CONFIG.HEIGHT - 200);
      const type = Math.random() > 0.5 ? 'car' : 'hoverboard';
      this.vehicles.push(new ServerVehicle(x, y, type));
    }

    this.activePlayers = [];
    
    let colorIndex = 0;
    
    // Spawn human players
    this.lobbyPlayers.forEach((lp, socketId) => {
      this.activePlayers.push(new ServerPlayer(
        socketId,
        lp.name,
        lp.color,
        GAME_CONFIG.WIDTH / 2 + (Math.random() - 0.5) * 160,
        GAME_CONFIG.HEIGHT / 2 + (Math.random() - 0.5) * 160,
        false,
        lp.avatar,
        lp.customEmojis,
        lp.customSmiley,
        lp.skin
      ));
      colorIndex++;
    });

    // Spawn bot fillers only if bots are enabled
    if (this.useBots && this.botCount > 0) {
      const botsToSpawn = Math.min(15, this.botCount);
      for (let i = 0; i < botsToSpawn; i++) {
        const botColor = COLORS[(colorIndex + i) % COLORS.length];
        const botName = BOT_NAMES[i % BOT_NAMES.length] || `Bot ${i + 1}`;
        
        this.activePlayers.push(new ServerPlayer(
          `bot-${i}`,
          botName,
          botColor,
          60 + Math.random() * (GAME_CONFIG.WIDTH - 120),
          60 + Math.random() * (GAME_CONFIG.HEIGHT - 120),
          true
        ));
      }
    }

    // Assign Squads (Max 4 per squad)
    let currentSquad = 1;
    let membersInSquad = 0;
    this.activePlayers.forEach(p => {
      p.squadId = currentSquad;
      membersInSquad++;
      if (membersInSquad >= 4) {
        currentSquad++;
        membersInSquad = 0;
      }
    });

    if (eventCallback) {
      eventCallback('game_started');
    }
  }

  explodeBullet(bullet, eventCallback) {
    const splashPotentials = this.grid.query(bullet.x, bullet.y, 80 + 25);
    for (const p of splashPotentials) {
      const attacker = this.activePlayers.find(ap => ap.id === bullet.ownerId);
      if (attacker && attacker.squadId === p.squadId) continue; // Friendly fire off

      const dist = Math.hypot(p.x - bullet.x, p.y - bullet.y);
      if (dist < 80) { // explosion radius
         const wasAlive = p.alive;
         const oldHp = p.hp;
         p.takeDamage(bullet.dmg);
         const damageTaken = oldHp - p.hp;
         if (attacker && damageTaken > 0) {
           attacker.damageDealt = (attacker.damageDealt || 0) + damageTaken;
         }
         if (wasAlive && !p.alive && attacker) attacker.kills++;
         
         const ang = Math.atan2(p.y - bullet.y, p.x - bullet.x);
         p.pushDx += Math.cos(ang) * 4;
         p.pushDy += Math.sin(ang) * 4;

         if (eventCallback) {
           eventCallback('combat_hit', {
             a: attacker ? { id: attacker.id, name: attacker.name } : { id: 'unknown', name: 'Unknown' },
             b: { id: p.id, name: p.name }
           });
           if (wasAlive && !p.alive) {
             eventCallback('kill_event', {
               killer: attacker ? attacker.name : 'Unknown',
               victim: p.name,
               weapon: bullet.isGrenade ? 'Granat' : (attacker && attacker.weapon ? attacker.weapon.name : 'Rocket')
             });
           }
         }
      }
    }
  }

  update(dt, eventCallback) {
    if (this.status !== 'playing') return;

    this.tickCount++;
    const now = Date.now();

    if (now - this.zoneLastTick >= 1000) {
      this.zoneTimer--;
      this.zoneLastTick = now;
      
      if (this.zoneTimer <= 0) {
        this.zoneTimer = GAME_CONFIG.ZONE_DURATION;
        this.zoneTargetR = Math.max(60, this.zoneR * GAME_CONFIG.ZONE_SHRINK_FACTOR);
      }
    }

    if (this.zoneR > this.zoneTargetR) {
      this.zoneR = Math.max(this.zoneTargetR, this.zoneR - 8 * dt);
    }

    this.items = this.items.filter(it => it.update(dt));

    // Update obstacles (timers, toxic clouds)
    this.obstacles = this.obstacles.filter(obs => {
      if (obs.timer !== undefined) {
        obs.timer -= dt;
        if (obs.timer <= 0) return false;
      }
      return true;
    });

    const alivePlayers = this.activePlayers.filter(p => p.alive);

    // Apply heal_zone, speed_zone and toxic_cloud effects
    for (const p of alivePlayers) {
      for (const obs of this.obstacles) {
        const dist = Math.hypot(p.x - obs.x, p.y - obs.y);
        if (dist <= obs.radius) {
          if (obs.type === 'toxic_cloud') {
            if (p.id !== obs.ownerId || p.skin !== 'zombie') {
              p.takeDamage(10 * dt); // 10 damage per second
            }
          } else if (obs.type === 'heal_zone') {
            p.hp = Math.min(p.maxHp, p.hp + 12 * dt); // Heal 12 HP/sec
          } else if (obs.type === 'speed_zone') {
            p.inSpeedZone = true;
          }
        }
      }
    }

    this.itemSpawnTimer -= dt;
    if (this.itemSpawnTimer <= 0) {
      this.itemSpawnTimer = 6 + Math.random() * 4;
      const newBatch = spawnItems(this.zoneR, this.zoneCx, this.zoneCy, 1, 1, 1);
      this.items.push(...newBatch);
    }

    // Update Spatial Hash Grid
    this.grid.clear();
    alivePlayers.forEach(p => this.grid.insert(p));

    // Player updates
    for (const p of this.activePlayers) {
      const isDriving = this.vehicles.some(v => v.driverId === p.id);
      
      if (p.isBot && p.alive) {
        p.updateAI(alivePlayers, this.items, this.zoneCx, this.zoneCy, this.zoneR, dt, (botId, angle) => {
          this.handlePlayerShoot(botId, angle);
          if (eventCallback) {
            eventCallback('shoot_sound', { playerId: botId, weaponType: p.weapon ? p.weapon.name : 'Unknown' });
          }
        });
      }
      p.updatePhysics(dt, isDriving);
      p.checkBushes(this.obstacles);
      p.updateZoneDamage(this.zoneCx, this.zoneCy, this.zoneR, dt);
      this.items = p.checkItemPickups(this.items);
    }

    // Sync vehicles with driving players
    for (const v of this.vehicles) {
      if (v.driverId) {
        const driver = this.activePlayers.find(p => p.id === v.driverId);
        if (driver && driver.alive) {
          v.x = driver.x;
          v.y = driver.y;
          // Calculate angle from driver's velocity
          if (driver.dx !== 0 || driver.dy !== 0) {
            v.angle = Math.atan2(driver.dy, driver.dx);
          }
        } else {
          v.driverId = null; // Driver died or disconnected
        }
      }
    }

    // Bouncing bombs movement and boundary reflections
    this.bombs = this.bombs.filter(bomb => bomb.update(dt));

    // Bomb-to-bomb collision check
    for (let i = 0; i < this.bombs.length; i++) {
      for (let j = i + 1; j < this.bombs.length; j++) {
        const b1 = this.bombs[i];
        const b2 = this.bombs[j];
        const dist = Math.hypot(b1.x - b2.x, b1.y - b2.y);
        if (dist < 24) { // 2 * radius (12)
          const tempVx = b1.vx;
          const tempVy = b1.vy;
          b1.vx = b2.vx;
          b1.vy = b2.vy;
          b2.vx = tempVx;
          b2.vy = tempVy;

          b1.bounces++;
          b2.bounces++;

          const overlap = 24 - dist;
          const angle = Math.atan2(b2.y - b1.y, b2.x - b1.x);
          b1.x -= Math.cos(angle) * overlap / 2;
          b1.y -= Math.sin(angle) * overlap / 2;
          b2.x += Math.cos(angle) * overlap / 2;
          b2.y += Math.sin(angle) * overlap / 2;
        }
      }
    }

    // Bomb-to-player collision check
    this.bombs = this.bombs.filter(bomb => {
      const potentials = this.grid.query(bomb.x, bomb.y, bomb.radius + 20);
      for (const p of potentials) {
        const dist = Math.hypot(p.x - bomb.x, p.y - bomb.y);
        if (dist < p.radius + bomb.radius) {
          p.takeDamage(80);
          if (eventCallback) {
            eventCallback('combat_hit', {
              a: { id: 'bomb', name: '💣 Bomba' },
              b: { id: p.id, name: p.name }
            });
          }
          return false; // destroy bomb
        }
      }
      return bomb.bounces < 3;
    });

    // Auto-replenish bombs if too few
    if (this.bombs.length < 5) {
      const newBomb = spawnBombs(1, this.zoneR, this.zoneCx, this.zoneCy)[0];
      if (newBomb) this.bombs.push(newBomb);
    }

    // Bullet updates and collision checks with Spatial Hashing
    const activeBullets = [];
    for (const bullet of this.bullets) {
      const active = bullet.update(dt);
      if (!active) {
        if (bullet.isGrenade) {
          this.explodeBullet(bullet, eventCallback);
        }
        bulletPool.release(bullet);
        continue;
      }

      let hit = false;
      // Use spatial hash to get potential players
      const potentials = this.grid.query(bullet.x, bullet.y, bullet.radius + 25);
      
      for (const p of potentials) {
        if (p.id === bullet.ownerId) continue;
        const attacker = this.activePlayers.find(ap => ap.id === bullet.ownerId);
        if (attacker && attacker.squadId === p.squadId) continue; // Ignore teammates
        if (bullet.piercedPlayers && bullet.piercedPlayers.includes(p.id)) continue;
        
        const dist = Math.hypot(p.x - bullet.x, p.y - bullet.y);
        if (dist < p.radius + bullet.radius) {
          hit = true;
          break;
        }
      }
      
      if (hit) {
        const attacker = this.activePlayers.find(ap => ap.id === bullet.ownerId);
        const hitPlayer = potentials.find(p => {
          if (p.id === bullet.ownerId) return false;
          if (attacker && attacker.squadId === p.squadId) return false;
          if (bullet.piercedPlayers && bullet.piercedPlayers.includes(p.id)) return false;
          const dist = Math.hypot(p.x - bullet.x, p.y - bullet.y);
          return dist < p.radius + bullet.radius;
        });

        if (hitPlayer) {
          if (bullet.isExplosive) {
            this.explodeBullet(bullet, eventCallback);
            bulletPool.release(bullet);
            continue;
          } else {
            const wasAlive = hitPlayer.alive;
            const oldHp = hitPlayer.hp;
            hitPlayer.takeDamage(bullet.dmg);
            const damageTaken = oldHp - hitPlayer.hp;
            if (attacker && damageTaken > 0) {
              attacker.damageDealt = (attacker.damageDealt || 0) + damageTaken;
            }
            if (wasAlive && !hitPlayer.alive && attacker) attacker.kills++;

            if (eventCallback) {
              eventCallback('combat_hit', {
                a: attacker ? { id: attacker.id, name: attacker.name } : { id: 'unknown', name: 'Unknown' },
                b: { id: hitPlayer.id, name: hitPlayer.name }
              });
              if (wasAlive && !hitPlayer.alive) {
                eventCallback('kill_event', {
                  killer: attacker ? attacker.name : 'Unknown',
                  victim: hitPlayer.name,
                  weapon: attacker && attacker.weapon ? attacker.weapon.name : 'Qurol'
                });
              }
            }

            if (bullet.isPiercing) {
              bullet.piercedPlayers.push(hitPlayer.id);
            } else {
              bulletPool.release(bullet);
              continue;
            }
          }
        }
      }
      activeBullets.push(bullet);
    }
    this.bullets = activeBullets;

    // Player-to-player pushback collisions & orbiting melee hits
    for (const a of alivePlayers) {
      const neighbors = this.grid.query(a.x, a.y, 50);
      for (const b of neighbors) {
        if (a.id === b.id) continue;

        // Body boundary pushback (apply only if a.id < b.id to prevent duplicate application)
        if (a.id < b.id) {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 36) {
            const ang = Math.atan2(b.y - a.y, b.x - a.x);
            a.pushDx -= Math.cos(ang) * GAME_CONFIG.PUSHBACK_FORCE;
            a.pushDy -= Math.sin(ang) * GAME_CONFIG.PUSHBACK_FORCE;
            b.pushDx += Math.cos(ang) * GAME_CONFIG.PUSHBACK_FORCE;
            b.pushDy += Math.sin(ang) * GAME_CONFIG.PUSHBACK_FORCE;
          }
        }

        // Orbiting melee damage (knife only hits when its orbiting position intersects opponent)
        // A hits B
        if (a.weapon && !a.weapon.isRanged) {
          const wx = a.x + Math.cos(a.weaponAngle) * (a.radius + 8);
          const wy = a.y + Math.sin(a.weaponAngle) * (a.radius + 8);
          const distToB = Math.hypot(wx - b.x, wy - b.y);
          if (distToB < b.radius + 6 && a.squadId !== b.squadId) {
            const combatKey = `${a.id}-hits-${b.id}`;
            if (!this.attackTimers[combatKey] || now - this.attackTimers[combatKey] > GAME_CONFIG.ATTACK_COOLDOWN) {
              this.attackTimers[combatKey] = now;
              const wasAlive = b.alive;
              const oldHp = b.hp;
              b.takeDamage(a.weapon.dmg);
              const damageTaken = oldHp - b.hp;
              if (damageTaken > 0) {
                a.damageDealt = (a.damageDealt || 0) + damageTaken;
              }
              if (wasAlive && !b.alive) a.kills++;
              if (eventCallback) {
                eventCallback('combat_hit', {
                  a: { id: a.id, name: a.name },
                  b: { id: b.id, name: b.name }
                });
                if (wasAlive && !b.alive) {
                  eventCallback('kill_event', {
                    killer: a.name,
                    victim: b.name,
                    weapon: a.weapon ? a.weapon.name : 'Pichoq'
                  });
                }
              }
            }
          }
        }
      }
    }

    // Airdrop Spawning
    this.airdropTimer += dt;
    if (this.airdropTimer > 45) { // Every 45 seconds
      this.airdropTimer = 0;
      let x, y, tries = 0;
      do {
        x = rand(60, GAME_CONFIG.WIDTH - 60);
        y = rand(60, GAME_CONFIG.HEIGHT - 60);
        tries++;
      } while (tries < 50 && Math.hypot(x - this.zoneCx, y - this.zoneCy) > this.zoneR - 50);
      this.airdrops.push(new ServerAirdrop(x, y));
      if (eventCallback) {
         eventCallback('kill_event', {
           killer: 'SYSTEM',
           victim: 'Airdrop tushdi!',
           weapon: '🪂'
         });
      }
    }

    // Map Events Loop
    this.mapEventTimer -= dt;
    if (this.mapEventTimer <= 0) {
      this.mapEventTimer = 35 + Math.random() * 15; // Every 35-50 seconds
      
      const MAP_EVENTS = ['airdrop_wave', 'bomb_rain', 'heal_zone', 'speed_zone'];
      const eventType = MAP_EVENTS[Math.floor(Math.random() * MAP_EVENTS.length)];
      
      if (eventType === 'airdrop_wave') {
        for (let i = 0; i < 3; i++) {
          let x, y, tries = 0;
          do {
            x = rand(60, GAME_CONFIG.WIDTH - 60);
            y = rand(60, GAME_CONFIG.HEIGHT - 60);
            tries++;
          } while (tries < 50 && Math.hypot(x - this.zoneCx, y - this.zoneCy) > this.zoneR - 50);
          this.airdrops.push(new ServerAirdrop(x, y));
        }
        if (eventCallback) {
          eventCallback('kill_event', {
            killer: 'EVENT',
            victim: 'Airdrop to\'lqini tushdi! (3x 🪂)',
            weapon: '📦'
          });
        }
      } else if (eventType === 'bomb_rain') {
        const newBombs = spawnBombs(8, this.zoneR, this.zoneCx, this.zoneCy);
        this.bombs.push(...newBombs);
        if (eventCallback) {
          eventCallback('kill_event', {
            killer: 'EVENT',
            victim: 'Bomba yomg\'iri boshlandi! (8x 💣)',
            weapon: '⚡'
          });
        }
      } else if (eventType === 'heal_zone') {
        let x, y, tries = 0;
        do {
          x = rand(100, GAME_CONFIG.WIDTH - 100);
          y = rand(100, GAME_CONFIG.HEIGHT - 100);
          tries++;
        } while (tries < 50 && Math.hypot(x - this.zoneCx, y - this.zoneCy) > this.zoneR - 100);
        
        const zone = new ServerObstacle(x, y, 200, 'heal_zone');
        zone.timer = 15;
        this.obstacles.push(zone);
        
        if (eventCallback) {
          eventCallback('kill_event', {
            killer: 'EVENT',
            victim: 'Shifo hududi faollashdi! (➕)',
            weapon: '💚'
          });
        }
      } else if (eventType === 'speed_zone') {
        let x, y, tries = 0;
        do {
          x = rand(100, GAME_CONFIG.WIDTH - 100);
          y = rand(100, GAME_CONFIG.HEIGHT - 100);
          tries++;
        } while (tries < 50 && Math.hypot(x - this.zoneCx, y - this.zoneCy) > this.zoneR - 100);
        
        const zone = new ServerObstacle(x, y, 150, 'speed_zone');
        zone.timer = 12;
        this.obstacles.push(zone);
        
        if (eventCallback) {
          eventCallback('kill_event', {
            killer: 'EVENT',
            victim: 'Tezlik hududi faollashdi! (⚡)',
            weapon: '💛'
          });
        }
      }
    }

    const currentAlive = this.activePlayers.filter(p => p.alive).length;
    const totalActive = this.activePlayers.length;

    // End match conditions
    if (currentAlive === 0 || (currentAlive === 1 && totalActive > 1)) {
      this.status = 'ended';
      
      let winner = null;
      let msg = '';
      
      const lastPlayer = this.activePlayers.find(p => p.alive);
      if (lastPlayer) {
        winner = { name: lastPlayer.name, color: lastPlayer.color };
        msg = `Tabriklaymiz, ${lastPlayer.name}! Xonadagi o'yinda g'olib bo'ldi! 🏆`;
      } else {
        msg = "Hamma halok bo'ldi! O'yin durang bilan yakunlandi.";
      }

      if (eventCallback) {
        eventCallback('game_ended', { winner, msg });
      }
      
      this.lobbyTimer = 8;
      const resetTick = () => {
        if (this.status !== 'ended') return;
        if (this.lobbyTimer <= 0) {
          this.status = 'lobby';
          this.activePlayers = [];
          this.items = [];
          if (this.bullets) {
            this.bullets.forEach(b => bulletPool.release(b));
          }
          this.bullets = [];
          this.bombs = [];
          if (eventCallback) eventCallback('lobby_reset');
        } else {
          this.lobbyTimer--;
          setTimeout(resetTick, 1000);
        }
      };
      setTimeout(resetTick, 1000);
    }
  }

  getStatePayload() {
    return {
      roomCode: this.roomCode,
      hostId: this.hostId,
      useBots: this.useBots,
      botCount: this.botCount,
      status: this.status,
      players: this.activePlayers.map(p => p.serialize()),
      items: this.items.map(it => it.serialize()),
      bullets: (this.bullets || []).map(b => b.serialize()),
      bombs: (this.bombs || []).map(b => b.serialize()),
      obstacles: (this.obstacles || []).map(o => o.serialize()),
      vehicles: (this.vehicles || []).map(v => v.serialize()),
      airdrops: (this.airdrops || []).map(a => a.serialize()),
      zone: {
        cx: this.zoneCx,
        cy: this.zoneCy,
        r: this.zoneR,
        targetR: this.zoneTargetR,
        timer: this.zoneTimer
      },
      lobbyPlayers: Array.from(this.lobbyPlayers.values()),
      countdownSeconds: this.countdownSeconds,
      lobbyResetSeconds: this.lobbyTimer
    };
  }
  getStatePayloadFor(playerId) {
    const player = this.activePlayers.find(p => p.id === playerId);
    
    let filteredPlayers = this.activePlayers;
    let filteredItems = this.items;
    let filteredBullets = this.bullets || [];
    let filteredBombs = this.bombs || [];
    let filteredObstacles = this.obstacles || [];
    let filteredVehicles = this.vehicles || [];
    let filteredAirdrops = this.airdrops || [];

    // Interest Management: Only send entities within 1500px if player is alive
    if (player && player.alive) {
      const MAX_DIST = 1500;
      filteredPlayers = this.activePlayers.filter(p => p.id === playerId || Math.hypot(p.x - player.x, p.y - player.y) <= MAX_DIST);
      filteredItems = this.items.filter(it => Math.hypot(it.x - player.x, it.y - player.y) <= MAX_DIST);
      filteredBullets = filteredBullets.filter(b => Math.hypot(b.x - player.x, b.y - player.y) <= MAX_DIST);
      filteredBombs = filteredBombs.filter(b => Math.hypot(b.x - player.x, b.y - player.y) <= MAX_DIST);
      filteredObstacles = filteredObstacles.filter(o => Math.hypot(o.x - player.x, o.y - player.y) <= MAX_DIST);
      filteredVehicles = filteredVehicles.filter(v => Math.hypot(v.x - player.x, v.y - player.y) <= MAX_DIST);
      filteredAirdrops = filteredAirdrops.filter(a => Math.hypot(a.x - player.x, a.y - player.y) <= MAX_DIST);
    }

    const isFull = (this.tickCount % 10 === 0);

    return {
      roomCode: this.roomCode,
      hostId: this.hostId,
      useBots: this.useBots,
      botCount: this.botCount,
      status: this.status,
      players: filteredPlayers.map(p => p.serialize(isFull)),
      items: filteredItems.map(it => it.serialize()),
      bullets: filteredBullets.map(b => b.serialize()),
      bombs: filteredBombs.map(b => b.serialize()),
      obstacles: filteredObstacles.map(o => o.serialize()),
      vehicles: filteredVehicles.map(v => v.serialize()),
      airdrops: filteredAirdrops.map(a => a.serialize()),
      zone: {
        cx: this.zoneCx,
        cy: this.zoneCy,
        r: this.zoneR,
        targetR: this.zoneTargetR,
        timer: this.zoneTimer
      },
      lobbyPlayers: Array.from(this.lobbyPlayers.values()),
      countdownSeconds: this.countdownSeconds,
      lobbyResetSeconds: this.lobbyTimer
    };
  }
}
