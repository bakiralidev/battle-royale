// UI Management Module

export class UIManager {
  constructor() {
    this.lobby = document.getElementById('lobby');
    this.gameWrapper = document.getElementById('gameWrapper');
    this.colorRow = document.getElementById('colorRow');
    this.nameInput = document.getElementById('nameInput');
    this.startBtn = document.getElementById('startBtn');
    
    this.zoneTimer = document.getElementById('zoneTimer');
    this.aliveCount = document.getElementById('aliveCount');
    this.weaponInfo = document.getElementById('weaponInfo');
    this.hpInfo = document.getElementById('hpInfo');
    this.playersPanel = document.getElementById('playersPanel');
    
    this.overlay = document.getElementById('overlay');
    this.overlayTitle = document.getElementById('overlayTitle');
    this.overlayMsg = document.getElementById('overlayMsg');
    this.restartBtn = document.getElementById('restartBtn');
    
    this.selectedColor = null;
  }

  initColorPicker(colors, colorNames, defaultIndex = 0) {
    this.colorRow.innerHTML = '';
    this.selectedColor = colors[defaultIndex];

    colors.forEach((color, index) => {
      const btn = document.createElement('button');
      btn.className = 'color-btn' + (index === defaultIndex ? ' selected' : '');
      btn.style.backgroundColor = color;
      btn.style.background = color;
      btn.title = colorNames[index];
      btn.type = 'button';
      
      btn.onclick = () => {
        const buttons = this.colorRow.querySelectorAll('.color-btn');
        buttons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedColor = color;
        // Update avatar preview if present
        const avatar = document.getElementById('setupAvatar');
        if (avatar) avatar.style.background = color;
      };
      
      this.colorRow.appendChild(btn);
    });
  }

  getPlayerName() {
    return this.nameInput.value.trim() || 'O\'yinchi';
  }

  getSelectedColor() {
    return this.selectedColor;
  }

  showGame() {
    this.lobby.style.display = 'none';
    this.gameWrapper.style.display = 'flex';
  }

  showLobby() {
    this.overlay.style.display = 'none';
    this.gameWrapper.style.display = 'none';
    this.lobby.style.display = 'flex';
  }

  updateHUD(zoneTime, alive, total, player) {
    this.zoneTimer.textContent = `${zoneTime}s`;
    this.aliveCount.textContent = `${alive}/${total}`;
    
    if (player && player.alive) {
      this.weaponInfo.textContent = player.weapon 
        ? `${player.weapon.emoji} ${player.weapon.name}` 
        : 'Yo\'q';
      
      const currentHp = Math.ceil(player.hp);
      this.hpInfo.textContent = currentHp;
      
      // Visual feedback for critical health
      if (currentHp <= 25) {
        this.hpInfo.classList.add('critical-hp');
      } else {
        this.hpInfo.classList.remove('critical-hp');
      }
    } else {
      this.weaponInfo.textContent = '—';
      this.hpInfo.textContent = '0';
      this.hpInfo.classList.remove('critical-hp');
    }
  }

  updatePlayerList(players, mainPlayer) {
    this.playersPanel.innerHTML = '';
    
    players.forEach(p => {
      const pDiv = document.createElement('div');
      pDiv.className = 'pinfo';
      
      if (p.alive) {
        pDiv.style.backgroundColor = p.color;
        pDiv.style.opacity = '1';
        pDiv.textContent = `${p === mainPlayer ? '★ ' : ''}${p.name} (${Math.ceil(p.hp)} HP)`;
      } else {
        pDiv.style.backgroundColor = '#2c2c3e';
        pDiv.style.opacity = '0.4';
        pDiv.textContent = `${p === mainPlayer ? '★ ' : ''}${p.name} ✕`;
      }
      
      this.playersPanel.appendChild(pDiv);
    });
  }

  showEndGame(win, message) {
    this.overlayTitle.textContent = win ? '🏆 G\'ALABA!' : '💀 O\'YIN TUGADI';
    this.overlayMsg.textContent = message;
    this.overlay.style.display = 'flex';
  }
}
