export class Game3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050510); // Darker night sky

    // Camera - Smooth lerp properties
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 3000);
    this.camera.position.set(0, 450, 350); 
    this.camera.lookAt(0, 0, 0);
    this.cameraTarget = new THREE.Vector3();

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows

    // Lighting (Hemisphere + Directional)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 200, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(200, 400, 150);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -1000;
    dirLight.shadow.camera.right = 1000;
    dirLight.shadow.camera.top = 1000;
    dirLight.shadow.camera.bottom = -1000;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    // Ground - Grid and Grass
    const groundGeo = new THREE.PlaneGeometry(4000, 4000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a331a, roughness: 0.8, metalness: 0.1 });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    const gridHelper = new THREE.GridHelper(4000, 100, 0x000000, 0x000000);
    gridHelper.position.y = 1;
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    // Zone - Energy Wall
    const zoneGeo = new THREE.CylinderGeometry(1, 1, 200, 64, 1, true);
    const zoneMat = new THREE.MeshBasicMaterial({ 
      color: 0xff1a1a, 
      transparent: true, 
      opacity: 0.15, 
      side: THREE.DoubleSide,
      wireframe: true
    });
    this.zone = new THREE.Mesh(zoneGeo, zoneMat);
    this.scene.add(this.zone);

    // Meshes map
    this.playerMeshes = {};
    this.obstacleMeshes = {};
    this.vehicleMeshes = {};
    this.itemMeshes = {};
    this.bulletMeshes = {};
    this.bombMeshes = {};

    // Atmospheric Dust Particles
    const particleCount = 1000;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      dustPos[i] = (Math.random() - 0.5) * 4000;     // X
      dustPos[i+1] = Math.random() * 200;            // Y
      dustPos[i+2] = (Math.random() - 0.5) * 4000;   // Z
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ 
      color: 0x88ffff, 
      size: 4, 
      transparent: true, 
      opacity: 0.5,
      blending: THREE.AdditiveBlending 
    });
    this.dustParticles = new THREE.Points(dustGeo, dustMat);
    this.scene.add(this.dustParticles);

    window.addEventListener('resize', () => {
      if (!this.canvas || this.canvas.style.display === 'none') return;
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  createSpherePlayer(color) {
    const group = new THREE.Group();
    
    // The main sphere body (the sticker)
    const bodyGeo = new THREE.SphereGeometry(15, 32, 32);
    const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 18; // Above pedestal
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Face elements (attached to body so they rotate with it)
    // Eyes
    const eyeGeo = new THREE.CylinderGeometry(2, 2, 2, 16);
    eyeGeo.rotateX(Math.PI / 2);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(5, 3, 14);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-5, 3, 14);
    body.add(eyeR);
    body.add(eyeL);

    // Mouth (A simple smile using a Torus segment)
    const mouthGeo = new THREE.TorusGeometry(5, 1, 8, 16, Math.PI);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -2, 14.5);
    mouth.rotation.x = Math.PI; // flip to smile
    body.add(mouth);

    // Pedestal (Gray base)
    const baseGeo = new THREE.CylinderGeometry(14, 16, 4, 32);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 2;
    base.receiveShadow = true;
    group.add(base);

    // Glowing Base Ring (Cyan)
    const ringGeo = new THREE.TorusGeometry(18, 1.5, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1; 
    group.add(ring);

    // Save refs for animation
    group.userData = { body, ring, walkTime: 0 };
    return group;
  }

  createTextSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.font = 'bold 32px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Outline
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(text, 128, 32);
    
    // Glowing text
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(60, 15, 1);
    sprite.position.y = 50; // Hover above head
    return sprite;
  }

  update(state) {
    if (!state.player) return;

    // Smooth Camera Lerp
    this.cameraTarget.set(state.player.x, 500, state.player.y + 400);
    this.camera.position.lerp(this.cameraTarget, 0.1);
    this.camera.lookAt(state.player.x, 0, state.player.y);

    // Animate atmospheric dust
    if (this.dustParticles) {
      const positions = this.dustParticles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.3; // Float up slowly
        if (positions[i] > 200) {
          positions[i] = 0; // Reset to ground
        }
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
      this.dustParticles.rotation.y += 0.0005; // slowly rotate cloud
    }

    // Update Zone
    this.zone.position.set(state.zoneCx, 100, state.zoneCy);
    this.zone.scale.set(state.zoneR, 1, state.zoneR);
    this.zone.rotation.y += 0.002; // Rotate zone slowly

    // Update Players
    const currentPlayers = new Set();
    state.players.forEach(p => {
      currentPlayers.add(p.id);
      if (!this.playerMeshes[p.id]) {
        const mesh = this.createSpherePlayer(p.color || 0xffffff);
        
        // Add floating name tag
        const nameText = `[${p.level || 1}] ${p.username || 'Bot'}`;
        const nameSprite = this.createTextSprite(nameText);
        mesh.add(nameSprite);
        mesh.userData.nameSprite = nameSprite;
        mesh.userData.lastText = nameText;

        this.scene.add(mesh);
        this.playerMeshes[p.id] = mesh;
      }
      const group = this.playerMeshes[p.id];

      // Update text if level changes
      const currentText = `[${p.level || 1}] ${p.username || 'Bot'}`;
      if (group.userData.lastText !== currentText) {
         group.remove(group.userData.nameSprite);
         const newSprite = this.createTextSprite(currentText);
         group.add(newSprite);
         group.userData.nameSprite = newSprite;
         group.userData.lastText = currentText;
      }
      
      // Interpolate position
      group.position.x += (p.x - group.position.x) * 0.3;
      group.position.z += (p.y - group.position.z) * 0.3;
      
      // Smooth rotation
      let targetRot = -p.weaponAngle;
      // Handle angle wrap
      let diff = targetRot - group.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      group.rotation.y += diff * 0.2;

      // Bobbing animation if moving
      const isMoving = Math.abs(p.x - group.position.x) > 1 || Math.abs(p.y - group.position.z) > 1;
      if (isMoving) {
        group.userData.walkTime += 0.2;
        const wave = Math.sin(group.userData.walkTime);
        group.userData.body.position.y = 18 + Math.abs(wave) * 3;
        group.userData.body.rotation.z = Math.sin(group.userData.walkTime * 0.5) * 0.1;
      } else {
        group.userData.body.position.y = 18;
        group.userData.body.rotation.z = 0;
        group.userData.walkTime = 0;
      }

      // Pulse the ring
      if (group.userData.ring) {
        const scale = 1 + Math.sin(performance.now() * 0.005) * 0.1;
        group.userData.ring.scale.set(scale, scale, scale);
      }

      group.visible = p.alive;
    });

    Object.keys(this.playerMeshes).forEach(id => {
      if (!currentPlayers.has(id)) {
        this.scene.remove(this.playerMeshes[id]);
        delete this.playerMeshes[id];
      }
    });

    // Obstacles
    const currentObstacles = new Set();
    if (state.obstacles) {
      state.obstacles.forEach(o => {
        currentObstacles.add(o.id);
        if (!this.obstacleMeshes[o.id]) {
          let mesh;
          if (o.type === 'bush' || o.t === 'bush') {
            const geo = new THREE.DodecahedronGeometry(o.radius || o.r, 1);
            const mat = new THREE.MeshStandardMaterial({ color: 0x2d4c1e, roughness: 0.9 });
            mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = (o.radius || o.r) * 0.8;
          } else if (o.t === 'wood_wall') {
            const geo = new THREE.BoxGeometry((o.radius || o.r) * 2, 40, 10);
            const mat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
            mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = 20;
          } else if (o.t === 'shield_wall') {
            const geo = new THREE.SphereGeometry(o.radius || o.r, 16, 16);
            const mat = new THREE.MeshPhysicalMaterial({ color: 0x3498db, transparent: true, opacity: 0.5, transmission: 0.5, roughness: 0.1 });
            mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = o.radius || o.r;
          } else {
            const geo = new THREE.BoxGeometry(20, 20, 20);
            const mat = new THREE.MeshStandardMaterial({ color: 0x555555 });
            mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = 10;
          }
          if (mesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            this.obstacleMeshes[o.id] = mesh;
          }
        }
        const mesh = this.obstacleMeshes[o.id];
        if (mesh) {
          mesh.position.x = o.x;
          mesh.position.z = o.y;
        }
      });
    }

    Object.keys(this.obstacleMeshes).forEach(id => {
      if (!currentObstacles.has(id)) {
        this.scene.remove(this.obstacleMeshes[id]);
        delete this.obstacleMeshes[id];
      }
    });

    // Items (Glowing)
    const currentItems = new Set();
    state.items.forEach(it => {
        currentItems.add(it.id);
        if (!this.itemMeshes[it.id]) {
            const geo = new THREE.OctahedronGeometry(12, 0);
            let color = 0xffffff;
            if (it.type === 'Pistolet') color = 0xff3333;
            else if (it.type === 'Miltiq') color = 0x33ff33;
            else if (it.type === 'Sniper') color = 0x3333ff;
            else if (it.type === 'medkit') color = 0xff33ff;
            else if (it.type === 'shield') color = 0x33ffff;
            
            const mat = new THREE.MeshStandardMaterial({ 
              color: color, 
              emissive: color,
              emissiveIntensity: 0.5 
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(it.x, 15, it.y);
            
            // Add a small point light
            const light = new THREE.PointLight(color, 1, 50);
            light.position.set(0, 0, 0);
            mesh.add(light);

            this.scene.add(mesh);
            this.itemMeshes[it.id] = mesh;
        }
        const mesh = this.itemMeshes[it.id];
        mesh.rotation.y += 0.02; 
        mesh.rotation.x += 0.01;
        mesh.position.y = 15 + Math.sin(performance.now() * 0.005) * 3; // Float animation
        mesh.position.x = it.x;
        mesh.position.z = it.y;
    });

    Object.keys(this.itemMeshes).forEach(id => {
      if (!currentItems.has(id)) {
        this.scene.remove(this.itemMeshes[id]);
        delete this.itemMeshes[id];
      }
    });

    // Bullets (Neon trails)
    const currentBullets = new Set();
    if (state.bullets) {
        state.bullets.forEach(b => {
            currentBullets.add(b.id);
            if (!this.bulletMeshes[b.id]) {
                const geo = new THREE.SphereGeometry(b.radius || 4, 8, 8);
                const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
                const mesh = new THREE.Mesh(geo, mat);
                
                const light = new THREE.PointLight(0xffff00, 1, 30);
                mesh.add(light);
                
                this.scene.add(mesh);
                this.bulletMeshes[b.id] = mesh;
            }
            const mesh = this.bulletMeshes[b.id];
            mesh.position.set(b.x, 20, b.y);
            // Stretch bullet along velocity to look like a laser trail
            mesh.scale.z = 8; 
            mesh.scale.x = 0.5;
            mesh.scale.y = 0.5;
            
            // Orient bullet trail to its velocity
            if (b.dx !== undefined && b.dy !== undefined) {
               mesh.rotation.y = -Math.atan2(b.dy, b.dx);
            }
        });
    }

    Object.keys(this.bulletMeshes).forEach(id => {
      if (!currentBullets.has(id)) {
        this.scene.remove(this.bulletMeshes[id]);
        delete this.bulletMeshes[id];
      }
    });

    this.renderer.render(this.scene, this.camera);
  }
}

window.Game3D = Game3D;
