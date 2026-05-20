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
  { name: 'Pichoq', dmg: 15, color: '#aaa', emoji: '🔪' },
  { name: 'Pistolet', dmg: 25, color: '#f39c12', emoji: '🔫' },
  { name: 'Miltiq', dmg: 35, color: '#e74c3c', emoji: '🪃' }
];

export const GAME_CONFIG = {
  WIDTH: 680,
  HEIGHT: 480,
  MAX_BOTS: 11,
  TOTAL_PLAYERS: 12,
  ZONE_DURATION: 60, // seconds per zone phase
  ZONE_SHRINK_FACTOR: 0.75,
  ZONE_DAMAGE_RATE: 8, // damage per second out of zone
  PUSHBACK_FORCE: 2.5,
  ATTACK_COOLDOWN: 1200, // ms between attacks
  MAX_MEDKIT_SPAWN: 5,
  MAX_WEAPON_SPAWN: 14,
  ITEM_LIFETIME: 10, // seconds
  MEDKIT_HEAL: 25, // how much HP medkit restores (original was +10, let's make it 25 for better gameplay)
  PLAYER_SPEED: 1.8,
  BOT_SPEED: 1.2
};
