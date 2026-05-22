// Game Configuration and Constants

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
