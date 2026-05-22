export function initBouncingWidgets() {
  const container = document.querySelector('.hero-right-widgets');
  const smiley = document.getElementById('homeSmileyPromo');
  const arena = document.querySelector('.hero-visual');

  if (!container || !smiley || !arena) return;

  const radius = 120; // Since width/height is 240px, radius is 120px
  
  // Initial positions (x, y are the center of the elements because of translate(-50%, -50%))
  // We'll set them dynamically to override the CSS defaults
  const rect = container.getBoundingClientRect();
  let w = rect.width;
  let h = rect.height;

  // State
  let widgets = [
    { el: smiley, x: w * 0.25, y: h * 0.5, vx: 1.5, vy: 1.2 },
    { el: arena,  x: w * 0.75, y: h * 0.5, vx: -1.2, vy: -1.5 }
  ];

  let isPaused = false;
  let animationFrameId = null;

  // Pause on hover
  smiley.addEventListener('mouseenter', () => isPaused = true);
  smiley.addEventListener('mouseleave', () => isPaused = false);
  
  // Also pause if hovering over arena, for better UX
  arena.addEventListener('mouseenter', () => isPaused = true);
  arena.addEventListener('mouseleave', () => isPaused = false);

  // Handle resize
  window.addEventListener('resize', () => {
    const newRect = container.getBoundingClientRect();
    w = newRect.width;
    h = newRect.height;
    
    // Keep them inside bounds on resize
    widgets.forEach(wObj => {
      wObj.x = Math.max(radius, Math.min(wObj.x, w - radius));
      wObj.y = Math.max(radius, Math.min(wObj.y, h - radius));
    });
  });

  function update() {
    if (!isPaused) {
      // 1. Move
      widgets.forEach(wObj => {
        wObj.x += wObj.vx;
        wObj.y += wObj.vy;

        // 2. Wall collisions
        if (wObj.x <= radius) {
          wObj.x = radius;
          wObj.vx *= -1;
        } else if (wObj.x >= w - radius) {
          wObj.x = w - radius;
          wObj.vx *= -1;
        }

        if (wObj.y <= radius) {
          wObj.y = radius;
          wObj.vy *= -1;
        } else if (wObj.y >= h - radius) {
          wObj.y = h - radius;
          wObj.vy *= -1;
        }
      });

      // 3. Widget collision (Circle-Circle)
      const dx = widgets[1].x - widgets[0].x;
      const dy = widgets[1].y - widgets[0].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius * 2) {
        // They are colliding!
        // Simple elastic collision swap
        
        // Push them apart so they don't stick
        const overlap = (radius * 2) - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        
        widgets[0].x -= nx * overlap / 2;
        widgets[0].y -= ny * overlap / 2;
        widgets[1].x += nx * overlap / 2;
        widgets[1].y += ny * overlap / 2;

        // Swap velocities (since they have equal mass, this is a basic approximation)
        const tempVx = widgets[0].vx;
        const tempVy = widgets[0].vy;
        widgets[0].vx = widgets[1].vx;
        widgets[0].vy = widgets[1].vy;
        widgets[1].vx = tempVx;
        widgets[1].vy = tempVy;
      }
    }

    // Render
    widgets[0].el.style.left = `${widgets[0].x}px`;
    widgets[0].el.style.top = `${widgets[0].y}px`;
    
    widgets[1].el.style.left = `${widgets[1].x}px`;
    widgets[1].el.style.top = `${widgets[1].y}px`;

    animationFrameId = requestAnimationFrame(update);
  }

  // Start loop
  update();
}
