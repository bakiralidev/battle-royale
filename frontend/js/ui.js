// UI Management Module

export class UIManager {
  constructor() {
    this.lobby = document.getElementById('lobby');
    this.gameWrapper = document.getElementById('gameWrapper');
    this.colorRow = document.getElementById('colorRow');
    this.nameInput = document.getElementById('nameInput');
    this.startBtn = document.getElementById('startBtn');
    
    this.zoneTimer = document.getElementById('zoneTimer');
    this.zoneProgressCircle = document.getElementById('zoneProgressCircle');
    this.zoneTimerText = document.getElementById('zoneTimerText');
    this.squadHPPanel = document.getElementById('squadHPPanel');
    
    this.aliveCount = document.getElementById('aliveCount');
    this.weaponInfo = document.getElementById('weaponInfo');
    this.hpInfo = document.getElementById('hpInfo');
    this.playersPanel = document.getElementById('playersPanel');
    this.hudLeaderboardList = document.getElementById('hudLeaderboardList');
    
    this.overlay = document.getElementById('overlay');
    this.overlayTitle = document.getElementById('overlayTitle');
    this.overlayMsg = document.getElementById('overlayMsg');
    this.restartBtn = document.getElementById('restartBtn');
    
    this.selectedColor = null;
    this.selectedSkin = 'default';
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

  initSkinPicker() {
    const skinButtons = document.querySelectorAll('.skin-btn');
    skinButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        skinButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedSkin = btn.dataset.skin;
      });
    });
  }

  getSelectedSkin() {
    return this.selectedSkin;
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
    if (this.zoneTimer) this.zoneTimer.textContent = `${zoneTime}s`;
    this.aliveCount.textContent = `${alive}/${total}`;

    // Circular Zone Timer update
    if (this.zoneTimerText) {
      this.zoneTimerText.textContent = zoneTime;
    }
    if (this.zoneProgressCircle) {
      const maxDuration = 60; // GAME_CONFIG.ZONE_DURATION
      const pct = Math.max(0, Math.min(1.0, zoneTime / maxDuration));
      const offset = 138 * (1 - pct);
      this.zoneProgressCircle.style.strokeDashoffset = offset;
    }
    
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

  updateMiniLeaderboard(players) {
    if (!this.hudLeaderboardList) return;
    
    // Sort by kills (descending), take top 5
    const topPlayers = [...players].sort((a, b) => (b.kills || 0) - (a.kills || 0)).slice(0, 5);
    
    this.hudLeaderboardList.innerHTML = '';
    topPlayers.forEach(p => {
      if (!p.kills) return; // Hide if 0 kills maybe? Let's show even if 0 if we want, but better to show only those with >0 kills or top 3 anyway.
      const li = document.createElement('li');
      const nameSpan = document.createElement('span');
      nameSpan.className = 'name';
      nameSpan.textContent = p.name;
      nameSpan.style.color = p.color;
      
      const killsSpan = document.createElement('span');
      killsSpan.className = 'kills';
      killsSpan.textContent = p.kills + ' ☠️';
      
      li.appendChild(nameSpan);
      li.appendChild(killsSpan);
      this.hudLeaderboardList.appendChild(li);
    });
  }

  showEndGame(win, message) {
    this.overlayTitle.textContent = win ? '🏆 G\'ALABA!' : '💀 O\'YIN TUGADI';
    this.overlayMsg.textContent = message;
    this.overlay.style.display = 'flex';
  }

  updateSquadPanel(players, mainPlayer) {
    if (!this.squadHPPanel) return;
    this.squadHPPanel.innerHTML = '';
    
    if (!mainPlayer || !mainPlayer.squadId) {
      this.squadHPPanel.style.display = 'none';
      return;
    }
    this.squadHPPanel.style.display = 'flex';
    
    // Get all players in the same squad
    const squadMembers = players.filter(p => p.squadId === mainPlayer.squadId);
    
    squadMembers.forEach(p => {
      const card = document.createElement('div');
      card.className = 'squad-card' + (p.alive ? '' : ' dead');
      card.style.borderLeft = `4px solid ${p.color}`;
      
      const name = document.createElement('div');
      name.className = 'squad-name';
      name.textContent = `${p.id === mainPlayer.id ? '★ ' : ''}${p.name}`;
      
      const hpBarWrap = document.createElement('div');
      hpBarWrap.className = 'squad-hp-wrap';
      
      const hpBarFill = document.createElement('div');
      hpBarFill.className = 'squad-hp-fill';
      const hpPct = p.alive ? Math.max(0, Math.min(100, p.hp)) : 0;
      hpBarFill.style.width = `${hpPct}%`;
      
      // Color based on HP
      if (hpPct > 50) hpBarFill.style.backgroundColor = '#2ecc71';
      else if (hpPct > 20) hpBarFill.style.backgroundColor = '#f1c40f';
      else hpBarFill.style.backgroundColor = '#e74c3c';
      
      hpBarWrap.appendChild(hpBarFill);
      card.appendChild(name);
      card.appendChild(hpBarWrap);
      this.squadHPPanel.appendChild(card);
    });
  }
}
