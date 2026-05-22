// Server-Side Game Engine and State Manager (Room-based)

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
  { name: 'Pichoq', dmg: 20, color: '#aaa', emoji: '🔪', isRanged: false, maxAmmo: 0 },
  { name: 'Pistolet', dmg: 15, color: '#f39c12', emoji: '🔫', isRanged: true, maxAmmo: 6 },
  { name: 'Miltiq', dmg: 20, color: '#e74c3c', emoji: '🪃', isRanged: true, maxAmmo: 6 },
  { name: 'Sniper', dmg: 35, color: '#9b59b6', emoji: '🎯', isRanged: true, maxAmmo: 3 }
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
  ITEM_LIFETIME: 10, // seconds
  MEDKIT_HEAL: 25,
  PLAYER_SPEED: 2.8,
  BOT_SPEED: 1.8
};

export class ServerPlayer {
  constructor(id, name, color, x, y, isBot = false, avatar = null, customEmojis = null, customSmiley = null) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.x = x;
    this.y = y;
    this.hp = 100;
    this.maxHp = 100;
    this.dx = 0;
    this.dy = 0;
    this.weapon = null;
    this.weaponAngle = 0;
    this.isBot = isBot;
    this.alive = true;
    this.pushDx = 0;
    this.pushDy = 0;
    this.radius = 18;
    
    // Shield and Weapon mechanics
    this.shieldTimer = 0;
    this.ammo = 0;
    this.meleeTimer = 0;

    // Bot-specific AI variables
    this.aimTimer = 0;

    // Custom Profile details
    this.avatar = avatar;
    this.customEmojis = customEmojis;
    this.customSmiley = customSmiley;
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

  updatePhysics(dt) {
    if (!this.alive) return;

    // Decay shield timer
    if (this.shieldTimer > 0) {
      this.shieldTimer = Math.max(0, this.shieldTimer - dt);
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
    const speed = this.isBot ? GAME_CONFIG.BOT_SPEED : GAME_CONFIG.PLAYER_SPEED;
    const nx = this.x + this.dx * speed * dt * 60;
    const ny = this.y + this.dy * speed * dt * 60;
    
    // Boundary containment
    this.x = Math.max(this.radius, Math.min(GAME_CONFIG.WIDTH - this.radius, nx));
    this.y = Math.max(this.radius, Math.min(GAME_CONFIG.HEIGHT - this.radius, ny));

    // Rotate weapon
    if (this.weapon) {
      this.weaponAngle = (this.weaponAngle + dt * 2.5) % (Math.PI * 2);
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

      // If bot has a weapon or no items exist, target closest player
      if (!target || this.weapon) {
        alivePlayers.forEach(q => {
          if (q === this) return;
          const d = Math.hypot(q.x - this.x, q.y - this.y);
          if (d < minD) {
            minD = d;
            target = { x: q.x, y: q.y };
          }
        });
      }

      // Keep bot inside safe zone
      const distCenter = Math.hypot(this.x - zoneCx, this.y - zoneCy);
      if (distCenter > zoneR - 50) {
        const ang = Math.atan2(zoneCy - this.y, zoneCx - this.x);
        this.dx = Math.cos(ang) * 1.6;
        this.dy = Math.sin(ang) * 1.6;
      } else if (target) {
        const ang = Math.atan2(target.y - this.y, target.x - this.x);
        const spd = 0.8 + Math.random() * 0.8;
        this.dx = Math.cos(ang) * spd;
        this.dy = Math.sin(ang) * spd;
      }
    }

    // Bot shooting logic
    if (this.weapon && this.weapon.isRanged && this.ammo > 0) {
      let closestEnemy = null;
      let minEnemyDist = 500;
      alivePlayers.forEach(q => {
        if (q === this) return;
        const d = Math.hypot(q.x - this.x, q.y - this.y);
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

  serialize() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      x: this.x,
      y: this.y,
      hp: this.hp,
      maxHp: this.maxHp,
      weapon: this.weapon,
      weaponAngle: this.weaponAngle,
      isBot: this.isBot,
      alive: this.alive,
      ammo: this.ammo,
      meleeTimer: this.meleeTimer,
      shieldTimer: this.shieldTimer,
      avatar: this.avatar,
      customEmojis: this.customEmojis,
      customSmiley: this.customSmiley
    };
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
      id: this.id,
      x: this.x,
      y: this.y,
      type: this.type,
      wt: this.wt,
      angle: this.angle,
      timer: this.timer
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
      id: this.id,
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      bounces: this.bounces,
      radius: this.radius
    };
  }
}

export class ServerBullet {
  constructor(id, x, y, angle, dmg, ownerId) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = 4;
    this.dmg = dmg;
    this.ownerId = ownerId;
    this.life = 1.5;
    
    const speed = 550;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    
    if (this.x < 0 || this.x > GAME_CONFIG.WIDTH || this.y < 0 || this.y > GAME_CONFIG.HEIGHT) {
      return false;
    }
    
    return this.life > 0;
  }

  serialize() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      radius: this.radius
    };
  }
}

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

function spawnItems(zoneR, zoneCx, zoneCy, numWeapons = GAME_CONFIG.MAX_WEAPON_SPAWN, numMedkits = GAME_CONFIG.MAX_MEDKIT_SPAWN, numShields = GAME_CONFIG.MAX_SHIELD_SPAWN) {
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

  return items;
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
    this.attackTimers = {};
    
    this.lastUpdate = 0;
  }

  addLobbyPlayer(socketId, name, color, avatar = null, customEmojis = null, customSmiley = null) {
    const isHost = (socketId === this.hostId);
    this.lobbyPlayers.set(socketId, { id: socketId, name, color, isHost, avatar, customEmojis, customSmiley });
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
    if (now - lastShot < 350) return false; // 350ms cooldown between shots
    this.attackTimers[`shoot-${socketId}`] = now;

    player.ammo--;

    const spawnDist = player.radius + 6;
    const bx = player.x + Math.cos(angle) * spawnDist;
    const by = player.y + Math.sin(angle) * spawnDist;

    const bulletId = Math.random();
    this.bullets.push(new ServerBullet(bulletId, bx, by, angle, player.weapon.dmg, socketId));

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
    this.attackTimers = {};
    
    this.items = spawnItems(initialZoneR, this.zoneCx, this.zoneCy);
    this.bullets = [];
    this.bombs = spawnBombs(6, initialZoneR, this.zoneCx, this.zoneCy);
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
        lp.customSmiley
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

    if (eventCallback) {
      eventCallback('game_started');
    }
  }

  update(dt, eventCallback) {
    if (this.status !== 'playing') return;

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

    this.itemSpawnTimer -= dt;
    if (this.itemSpawnTimer <= 0) {
      this.itemSpawnTimer = 6 + Math.random() * 4;
      const newBatch = spawnItems(this.zoneR, this.zoneCx, this.zoneCy, 1, 1, 1);
      this.items.push(...newBatch);
    }

    const alivePlayers = this.activePlayers.filter(p => p.alive);

    alivePlayers.forEach(p => {
      if (p.isBot) {
        p.updateAI(alivePlayers, this.items, this.zoneCx, this.zoneCy, this.zoneR, dt, (botId, angle) => {
          this.handlePlayerShoot(botId, angle);
          if (eventCallback) {
            eventCallback('shoot_sound', { playerId: botId, weaponType: p.weapon ? p.weapon.name : 'Unknown' });
          }
        });
      }
      p.updatePhysics(dt);
      p.updateZoneDamage(this.zoneCx, this.zoneCy, this.zoneR, dt);
      this.items = p.checkItemPickups(this.items);
    });

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
      for (const p of alivePlayers) {
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

    // Bullet updates and collision checks
    this.bullets = this.bullets.filter(bullet => {
      const active = bullet.update(dt);
      if (!active) return false;

      for (const p of alivePlayers) {
        if (p.id === bullet.ownerId) continue;
        const dist = Math.hypot(p.x - bullet.x, p.y - bullet.y);
        if (dist < p.radius + bullet.radius) {
          p.takeDamage(bullet.dmg);
          if (eventCallback) {
            const attacker = this.activePlayers.find(ap => ap.id === bullet.ownerId);
            eventCallback('combat_hit', {
              a: attacker ? { id: attacker.id, name: attacker.name } : { id: 'unknown', name: 'Unknown' },
              b: { id: p.id, name: p.name }
            });
          }
          return false; // destroy bullet
        }
      }
      return true;
    });

    // Player-to-player pushback collisions & orbiting melee hits
    for (let i = 0; i < alivePlayers.length; i++) {
      for (let j = i + 1; j < alivePlayers.length; j++) {
        const a = alivePlayers[i];
        const b = alivePlayers[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);

        // Body boundary pushback (radius is 18, so 2 * radius = 36)
        if (dist < 36) {
          const ang = Math.atan2(b.y - a.y, b.x - a.x);
          a.pushDx -= Math.cos(ang) * GAME_CONFIG.PUSHBACK_FORCE;
          a.pushDy -= Math.sin(ang) * GAME_CONFIG.PUSHBACK_FORCE;
          b.pushDx += Math.cos(ang) * GAME_CONFIG.PUSHBACK_FORCE;
          b.pushDy += Math.sin(ang) * GAME_CONFIG.PUSHBACK_FORCE;
        }

        // Orbiting melee damage (knife only hits when its orbiting position intersects opponent)
        // A hits B
        if (a.weapon && !a.weapon.isRanged) {
          const wx = a.x + Math.cos(a.weaponAngle) * (a.radius + 8);
          const wy = a.y + Math.sin(a.weaponAngle) * (a.radius + 8);
          const distToB = Math.hypot(wx - b.x, wy - b.y);
          if (distToB < b.radius + 6) {
            const combatKey = `${a.id}-hits-${b.id}`;
            if (!this.attackTimers[combatKey] || now - this.attackTimers[combatKey] > GAME_CONFIG.ATTACK_COOLDOWN) {
              this.attackTimers[combatKey] = now;
              b.takeDamage(a.weapon.dmg);
              if (eventCallback) {
                eventCallback('combat_hit', {
                  a: { id: a.id, name: a.name },
                  b: { id: b.id, name: b.name }
                });
              }
            }
          }
        }

        // B hits A
        if (b.weapon && !b.weapon.isRanged) {
          const wx = b.x + Math.cos(b.weaponAngle) * (b.radius + 8);
          const wy = b.y + Math.sin(b.weaponAngle) * (b.radius + 8);
          const distToA = Math.hypot(wx - a.x, wy - a.y);
          if (distToA < a.radius + 6) {
            const combatKey = `${b.id}-hits-${a.id}`;
            if (!this.attackTimers[combatKey] || now - this.attackTimers[combatKey] > GAME_CONFIG.ATTACK_COOLDOWN) {
              this.attackTimers[combatKey] = now;
              a.takeDamage(b.weapon.dmg);
              if (eventCallback) {
                eventCallback('combat_hit', {
                  a: { id: b.id, name: b.name },
                  b: { id: a.id, name: a.name }
                });
              }
            }
          }
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
