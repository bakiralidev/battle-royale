// Sound Manager utilizing Web Audio API for dynamic retro SFX generation without loading files
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      console.log('🔊 Sound System Initialized');
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(type, customVolume = 1.0, panValue = 0) {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Create master gain
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.15 * customVolume, now); // keep it comfortable

    // Create Stereo Panner
    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      // Clamp panValue between -1 and 1
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, panValue)), now);
      masterGain.connect(panner);
      panner.connect(this.ctx.destination);
    } else {
      masterGain.connect(this.ctx.destination);
    }

    switch (type) {
      case 'shoot_pistol':
      case 'shoot': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.16);
        break;
      }
      case 'shoot_rifle': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(550, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.22);
        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.23);
        break;
      }
      case 'shoot_sniper': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.35);
        gain.gain.setValueAtTime(1.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.36);
        break;
      }
      case 'click': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
        
        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }
      
      case 'hover': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.05);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.start(now);
        osc.stop(now + 0.06);
        break;
      }

      case 'pickup_weapon': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(450, now + 0.07);
        osc.frequency.setValueAtTime(600, now + 0.14);
        
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.setValueAtTime(0.6, now + 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.start(now);
        osc.stop(now + 0.26);
        break;
      }

      case 'pickup_medkit': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.2);
        
        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.start(now);
        osc.stop(now + 0.23);
        break;
      }

      case 'hit_give': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
        
        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.start(now);
        osc.stop(now + 0.11);
        break;
      }

      case 'hit_take': {
        // Synthesize low rumble noise
        const bufferSize = this.ctx.sampleRate * 0.15; // 150ms
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, now);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        
        noise.start(now);
        noise.stop(now + 0.15);
        break;
      }

      case 'countdown': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.start(now);
        osc.stop(now + 0.16);
        break;
      }

      case 'countdown_start': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        
        gain.gain.setValueAtTime(1.0, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.start(now);
        osc.stop(now + 0.41);
        break;
      }

      case 'eliminate': {
        // Exploding noise
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + 0.35);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        
        noise.start(now);
        noise.stop(now + 0.4);
        break;
      }

      case 'win': {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          
          gain.gain.setValueAtTime(0.8, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.4);
          
          osc.connect(gain);
          gain.connect(masterGain);
          
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.42);
        });
        break;
      }

      case 'lose': {
        const notes = [392.00, 370.00, 349.23, 311.13]; // G4, F#4, F4, D#4
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          
          gain.gain.setValueAtTime(0.8, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.3);
          
          osc.connect(gain);
          gain.connect(masterGain);
          
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.32);
        });
        break;
      }
    }
  }

  startAmbient() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx || this.ambientNode) return;
    
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    this.ambientSource = this.ctx.createBufferSource();
    this.ambientSource.buffer = buffer;
    this.ambientSource.loop = true;
    
    this.ambientFilter = this.ctx.createBiquadFilter();
    this.ambientFilter.type = 'lowpass';
    this.ambientFilter.frequency.setValueAtTime(150, this.ctx.currentTime);
    
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    
    this.ambientSource.connect(this.ambientFilter);
    this.ambientFilter.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);
    
    this.ambientSource.start(0);
    this.ambientNode = this.ambientSource;
  }
  
  stopAmbient() {
    if (this.ambientNode) {
      try {
        this.ambientNode.stop();
      } catch (e) {}
      this.ambientNode = null;
    }
  }

  playHeartbeat() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    if (this.lastHeartbeatTime && now - this.lastHeartbeatTime < 0.8) return;
    this.lastHeartbeatTime = now;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(30, now + 0.15);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.15, now);
    
    osc.connect(gain);
    gain.connect(masterGain);
    masterGain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playZoneBurn() {
    this.init();
    this.resume();
    if (this.muted || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    if (this.lastBurnTime && now - this.lastBurnTime < 0.25) return;
    this.lastBurnTime = now;
    
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000 + Math.random() * 1000, now);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start(now);
    noise.stop(now + 0.2);
  }
}

export const sounds = new SoundManager();
// Initialize audio context on first interaction to bypass browser policies
['click', 'keydown', 'mousedown', 'touchstart'].forEach(type => {
  window.addEventListener(type, () => sounds.init(), { once: true });
});
