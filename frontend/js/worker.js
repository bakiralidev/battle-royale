// Web Worker for Achievements Processing
// This offloads the logic for keeping track of achievements from the main thread.

let stats = {
  firstBlood: false,
  kills: 0,
  streak: 0,
  lastKillTime: 0
};

self.onmessage = function(e) {
  const msg = e.data;
  
  if (msg.type === 'GAME_START') {
    stats.firstBlood = false;
    stats.kills = 0;
    stats.streak = 0;
    stats.lastKillTime = 0;
  }
  
  if (msg.type === 'KILL_EVENT') {
    const { isMe, isFirstBloodInGame, time } = msg.payload;
    
    if (isFirstBloodInGame && isMe && !stats.firstBlood) {
      stats.firstBlood = true;
      self.postMessage({ type: 'ACHIEVEMENT_UNLOCKED', achievement: 'First Blood!' });
    }
    
    if (isMe) {
      stats.kills++;
      
      // Streak calculation (kills within 15 seconds)
      if (time - stats.lastKillTime < 15000 || stats.streak === 0) {
        stats.streak++;
      } else {
        stats.streak = 1;
      }
      
      stats.lastKillTime = time;
      
      if (stats.streak === 3) {
        self.postMessage({ type: 'ACHIEVEMENT_UNLOCKED', achievement: 'Sharpshooter! (3 ketma-ket)' });
      }
      
      if (stats.kills === 5) {
        self.postMessage({ type: 'ACHIEVEMENT_UNLOCKED', achievement: 'Terminator! (5 ta qotillik)' });
      }
    }
  }
};
