import { PhysicsBody } from './PhysicsBody.js';
import { Vector2D } from './Vector2D.js';

console.log('[GameObjects.js] Module loaded');

/**
 * Asteroid obstacle with realistic physics
 */
export class Asteroid extends PhysicsBody {
  constructor(x, y, size = 'medium', velocity = null) {
    const massMap = { small: 0.5, medium: 1.0, large: 2.0, huge: 4.0 };
    super(x, y, massMap[size] || 1.0);

    this.size = size;
    this.sizeMap = {
      small: 20,
      medium: 35,
      large: 50,
      huge: 70
    };
    
    this.radius = this.sizeMap[size] || 35;
    this.health = this.radius;
    this.maxHealth = this.health;

    // Set initial velocity if provided
    if (velocity) {
      this.velocity = velocity.clone();
    }

    // Random rotation
    this.angularVelocity = (Math.random() - 0.5) * 2;

    // Visual properties
    this.color = this.getRandomColor();
    this.vertices = this.generateShape();
    this.crackPattern = [];
    
    // Damage state
    this.damage = 0;
    this.maxDamage = 100;
    
    // ID for tracking
    this.id = Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate random asteroid color
   */
  getRandomColor() {
    const colors = [
      'rgba(180, 150, 140, 0.9)',
      'rgba(160, 130, 120, 0.9)',
      'rgba(200, 170, 160, 0.9)',
      'rgba(140, 110, 100, 0.9)',
      'rgba(220, 190, 180, 0.9)'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Generate irregular asteroid shape
   */
  generateShape() {
    const vertices = [];
    const segments = 8 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < segments; i++) {
      const angle = (Math.PI * 2 * i) / segments;
      const variance = 0.7 + Math.random() * 0.3;
      const distance = this.radius * variance;
      
      vertices.push({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance
      });
    }
    
    return vertices;
  }

  /**
   * Take damage and create cracks
   */
  takeDamage(amount) {
    this.health -= amount;
    this.damage = Math.min(this.maxDamage, this.damage + amount);
    
    // Add crack pattern
    if (Math.random() < 0.5) {
      const angle = Math.random() * Math.PI * 2;
      const length = this.radius * (0.3 + Math.random() * 0.4);
      this.crackPattern.push({
        angle: angle,
        length: length,
        offset: (Math.random() - 0.5) * this.radius * 0.5
      });
    }
    
    return this.health <= 0;
  }

  /**
   * Split into smaller asteroids
   */
  split() {
    const fragments = [];
    const sizeHierarchy = ['huge', 'large', 'medium', 'small'];
    const currentIndex = sizeHierarchy.indexOf(this.size);
    
    if (currentIndex < sizeHierarchy.length - 1) {
      const newSize = sizeHierarchy[currentIndex + 1];
      const count = 2 + Math.floor(Math.random() * 2); // 2-3 fragments
      
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
        const speed = 50 + Math.random() * 100;
        const velocity = Vector2D.fromAngle(angle, speed);
        velocity.add(this.velocity); // Inherit parent velocity
        
        const offset = Vector2D.fromAngle(angle, this.radius * 0.5);
        const position = Vector2D.add(this.position, offset);
        
        const fragment = new Asteroid(position.x, position.y, newSize, velocity);
        fragments.push(fragment);
      }
    }
    
    return fragments;
  }

  /**
   * Update asteroid
   */
  update(deltaTime) {
    super.update(deltaTime);
  }

  /**
   * Render asteroid
   */
  render(ctx) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle);

    // Shadow for depth
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';

    // Draw asteroid shape
    ctx.fillStyle = this.color;
    ctx.strokeStyle = 'rgba(100, 80, 70, 0.8)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw cracks
    if (this.crackPattern.length > 0) {
      ctx.strokeStyle = 'rgba(50, 30, 20, 0.8)';
      ctx.lineWidth = 1.5;
      
      this.crackPattern.forEach(crack => {
        const startAngle = crack.angle;
        const startX = Math.cos(startAngle) * crack.offset;
        const startY = Math.sin(startAngle) * crack.offset;
        const endX = startX + Math.cos(startAngle) * crack.length;
        const endY = startY + Math.sin(startAngle) * crack.length;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      });
    }

    // Surface details
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * this.radius * 0.6;
      const size = 2 + Math.random() * 4;
      
      ctx.beginPath();
      ctx.arc(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        size,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Health indicator (when damaged)
    if (this.damage > 20) {
      const healthPercent = this.health / this.maxHealth;
      ctx.strokeStyle = healthPercent > 0.5 ? 'rgba(0, 255, 100, 0.6)' : 'rgba(255, 50, 50, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2 * healthPercent);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Get collision radius
   */
  getRadius() {
    return this.radius;
  }

  /**
   * Check if destroyed
   */
  isDestroyed() {
    return this.health <= 0;
  }
}

/**
 * Projectile (laser/bullet)
 */
export class Projectile extends PhysicsBody {
  constructor(position, velocity, angle, damage = 25, color = '#00f0ff') {
    super(position.x, position.y, 0.1);
    this.velocity = velocity.clone();
    this.angle = angle;
    this.damage = damage;
    this.color = color;
    this.lifetime = 3.0; // seconds
    this.age = 0;
    this.length = 20;
    this.width = 3;
    this.isStatic = false;
    this.id = Math.random().toString(36).substr(2, 9);
  }

  update(deltaTime) {
    super.update(deltaTime);
    this.age += deltaTime;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle);

    // Glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;

    // Projectile trail
    const gradient = ctx.createLinearGradient(-this.length / 2, 0, this.length / 2, 0);
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0)');
    gradient.addColorStop(0.5, this.color);
    gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(-this.length / 2, -this.width / 2, this.length, this.width);

    // Core
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(-this.length / 4, -this.width / 4, this.length / 2, this.width / 2);

    ctx.restore();
  }

  isExpired() {
    return this.age >= this.lifetime;
  }

  getRadius() {
    return this.width;
  }
}

/**
 * Power-up pickup
 */
export class PowerUp extends PhysicsBody {
  constructor(x, y, type = 'health') {
    super(x, y, 0.5);
    this.type = type;
    this.radius = 15;
    this.age = 0;
    this.lifetime = 10.0;
    this.collected = false;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.id = Math.random().toString(36).substr(2, 9);

    this.types = {
      health: { color: '#00ff88', icon: '+', description: 'Health Boost' },
      shield: { color: '#00f0ff', icon: '◆', description: 'Shield Charge' },
      weapon: { color: '#ff0055', icon: '⚡', description: 'Weapon Upgrade' },
      speed: { color: '#ffaa00', icon: '»', description: 'Speed Boost' }
    };
  }

  update(deltaTime) {
    super.update(deltaTime);
    this.age += deltaTime;
    this.pulsePhase += deltaTime * 3;
  }

  render(ctx) {
    if (this.collected) return;

    const typeData = this.types[this.type];
    const pulse = Math.sin(this.pulsePhase) * 0.2 + 1;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    // Outer glow
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * pulse * 1.5);
    gradient.addColorStop(0, typeData.color + 'aa');
    gradient.addColorStop(0.5, typeData.color + '44');
    gradient.addColorStop(1, typeData.color + '00');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * pulse * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Main circle
    ctx.fillStyle = typeData.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = typeData.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Icon
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${this.radius * 1.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typeData.icon, 0, 0);

    ctx.restore();
  }

  isExpired() {
    return this.age >= this.lifetime || this.collected;
  }

  collect() {
    this.collected = true;
  }

  getRadius() {
    return this.radius;
  }
}
