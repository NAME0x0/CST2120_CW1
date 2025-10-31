console.log('[Effects.js] Module loaded');

/**
 * Particle system for visual effects
 */
export class ParticleSystem {
  constructor() {
    console.log('[ParticleSystem] Constructor called');
    this.particles = [];
    this.maxParticles = 1000;
    console.log('[ParticleSystem] Initialized with max', this.maxParticles, 'particles');
  }

  /**
   * Create explosion effect
   */
  createExplosion(x, y, count = 30, color = '#ff0055', speed = 200) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const velocity = speed * (0.5 + Math.random() * 0.5);
      
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1.0,
        maxLife: 0.5 + Math.random() * 0.5,
        size: 3 + Math.random() * 5,
        color: color,
        type: 'explosion',
        decay: 0.5 + Math.random() * 0.5
      });
    }
  }

  /**
   * Create debris field
   */
  createDebris(x, y, count = 15, color = '#888888') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 50 + Math.random() * 150;
      
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1.0,
        maxLife: 1.0 + Math.random(),
        size: 2 + Math.random() * 4,
        color: color,
        type: 'debris',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 5,
        decay: 0.3 + Math.random() * 0.3
      });
    }
  }

  /**
   * Create thrust particles
   */
  createThrust(x, y, angle, color = '#ff9933') {
    const count = 3;
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.5;
      const velocity = 100 + Math.random() * 50;
      
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle + Math.PI + spread) * velocity,
        vy: Math.sin(angle + Math.PI + spread) * velocity,
        life: 1.0,
        maxLife: 0.3,
        size: 3 + Math.random() * 3,
        color: color,
        type: 'thrust',
        decay: 2.0
      });
    }
  }

  /**
   * Create shield hit effect
   */
  createShieldHit(x, y, color = '#00f0ff') {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 100 + Math.random() * 100;
      
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1.0,
        maxLife: 0.4,
        size: 2 + Math.random() * 3,
        color: color,
        type: 'shield',
        decay: 1.5
      });
    }
  }

  /**
   * Create spark trail
   */
  createTrail(x, y, vx, vy, color = '#00f0ff') {
    if (this.particles.length > this.maxParticles * 0.9) return;
    
    this.particles.push({
      x: x + (Math.random() - 0.5) * 5,
      y: y + (Math.random() - 0.5) * 5,
      vx: vx * 0.3 + (Math.random() - 0.5) * 20,
      vy: vy * 0.3 + (Math.random() - 0.5) * 20,
      life: 1.0,
      maxLife: 0.3 + Math.random() * 0.2,
      size: 1 + Math.random() * 2,
      color: color,
      type: 'trail',
      decay: 1.5
    });
  }

  /**
   * Create collect effect (for power-ups)
   */
  createCollectEffect(x, y, color = '#00ff88') {
    const count = 25;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const velocity = 150;
      
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1.0,
        maxLife: 0.6,
        size: 2 + Math.random() * 3,
        color: color,
        type: 'collect',
        decay: 1.0
      });
    }
  }

  /**
   * Create damage sparks
   */
  createDamageSparks(x, y, direction, color = '#ffaa00') {
    const count = 10;
    const baseAngle = direction.angle ? direction.angle() : 0;
    
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * Math.PI;
      const angle = baseAngle + spread;
      const velocity = 150 + Math.random() * 100;
      
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1.0,
        maxLife: 0.3 + Math.random() * 0.3,
        size: 2 + Math.random() * 3,
        color: color,
        type: 'sparks',
        decay: 1.2
      });
    }
  }

  /**
   * Create black hole swirl effect
   */
  createBlackHoleEffect(x, y, radius) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = radius + Math.random() * 50;
      
      this.particles.push({
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        vx: 0,
        vy: 0,
        life: 1.0,
        maxLife: 1.0,
        size: 3 + Math.random() * 2,
        color: '#9933ff',
        type: 'blackhole',
        decay: 0.5,
        orbitX: x,
        orbitY: y,
        orbitRadius: distance,
        orbitAngle: angle,
        orbitSpeed: 2.0
      });
    }
  }

  /**
   * Update all particles
   */
  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Special behavior for blackhole particles
      if (p.type === 'blackhole' && p.orbitX !== undefined) {
        p.orbitAngle += p.orbitSpeed * deltaTime;
        p.orbitRadius -= 20 * deltaTime; // Spiral inward
        p.x = p.orbitX + Math.cos(p.orbitAngle) * p.orbitRadius;
        p.y = p.orbitY + Math.sin(p.orbitAngle) * p.orbitRadius;
        
        if (p.orbitRadius < 5) {
          this.particles.splice(i, 1);
          continue;
        }
      } else {
        // Update position
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
      }
      
      // Update rotation
      if (p.rotation !== undefined) {
        p.rotation += p.rotationSpeed * deltaTime;
      }
      
      // Update life
      p.life -= deltaTime * p.decay;
      
      // Apply some gravity for debris
      if (p.type === 'debris') {
        p.vy += 100 * deltaTime;
      }
      
      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Render all particles
   */
  render(ctx) {
    ctx.save();
    
    this.particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      
      ctx.globalAlpha = alpha;
      
      if (p.type === 'debris') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else {
        // Glow effect for most particles
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    ctx.restore();
  }

  /**
   * Clear all particles
   */
  clear() {
    this.particles = [];
  }

  /**
   * Get particle count
   */
  getCount() {
    return this.particles.length;
  }
}

/**
 * Star field background
 */
export class StarField {
  constructor(width, height, starCount = 200) {
    this.width = width;
    this.height = height;
    this.stars = [];
    
    // Create star layers for parallax effect
    this.layers = [
      { stars: [], speed: 0.2, size: 1, alpha: 0.4 },
      { stars: [], speed: 0.5, size: 1.5, alpha: 0.6 },
      { stars: [], speed: 1.0, size: 2, alpha: 1.0 }
    ];
    
    // Generate stars for each layer
    this.layers.forEach(layer => {
      const count = Math.floor(starCount / this.layers.length);
      for (let i = 0; i < count; i++) {
        layer.stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          brightness: 0.5 + Math.random() * 0.5,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.5 + Math.random() * 1.5
        });
      }
    });
  }

  /**
   * Update star field (parallax scrolling)
   */
  update(deltaTime, scrollSpeedY = 0) {
    this.layers.forEach(layer => {
      layer.stars.forEach(star => {
        // Scroll stars
        star.y += scrollSpeedY * layer.speed * deltaTime;
        
        // Wrap around
        if (star.y > this.height) {
          star.y = 0;
          star.x = Math.random() * this.width;
        } else if (star.y < 0) {
          star.y = this.height;
          star.x = Math.random() * this.width;
        }
        
        // Twinkle effect
        star.twinklePhase += star.twinkleSpeed * deltaTime;
      });
    });
  }

  /**
   * Render star field
   */
  render(ctx) {
    ctx.save();
    
    this.layers.forEach(layer => {
      layer.stars.forEach(star => {
        const twinkle = Math.sin(star.twinklePhase) * 0.3 + 0.7;
        const alpha = layer.alpha * star.brightness * twinkle;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowBlur = layer.size * 2;
        ctx.shadowColor = `rgba(255, 255, 255, ${alpha})`;
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, layer.size, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    
    ctx.restore();
  }

  /**
   * Resize star field
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
  }
}
