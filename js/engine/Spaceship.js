import { PhysicsBody } from './PhysicsBody.js';
import { Vector2D } from './Vector2D.js';

console.log('[Spaceship.js] Module loaded');

/**
 * Spaceship entity with advanced controls and physics
 */
export class Spaceship extends PhysicsBody {
  constructor(x, y, config = {}) {
    console.log('[Spaceship] Constructor called at position:', x, y, 'config:', config);
    super(x, y, config.mass || 1.5);

    // Ship properties
    this.width = config.width || 40;
    this.height = config.height || 50;
    this.color = config.color || '#00f0ff';

    // Engine properties
    this.thrustPower = config.thrustPower || 800;
    this.lateralThrustPower = config.lateralThrustPower || 600;
    this.rotationSpeed = config.rotationSpeed || 5;
    this.maxSpeed = config.maxSpeed || 600;
    this.brakePower = config.brakePower || 0.95;

    // Ship state
    this.isThrusting = false;
    this.isBraking = false;
    this.strafingDirection = 0; // -1 left, 0 none, 1 right
    this.rotationDirection = 0; // -1 left, 0 none, 1 right

    // Visual effects
    this.thrustParticles = [];
    this.shield = {
      active: false,
      strength: 100,
      maxStrength: 100,
      regenRate: 10,
      depletionRate: 30,
      powerUpActive: false,
      powerUpTimer: 0
    };

    // Weapon system
    this.weapons = {
      cooldown: 0,
      fireRate: 0.2, // seconds between shots
      projectileSpeed: 800
    };

    // Damage system
    this.health = config.health || 100;
    this.maxHealth = config.health || 100;
    this.invulnerable = false;
    this.invulnerabilityTimer = 0;

    // Animation state
    this.sprite = null;
    this.animationFrame = 0;
    this.animationTimer = 0;

    this.sprite = new Image();
    this.sprite.src = 'assets/images/spaceship-default.svg';

    // Trail effect
    this.trail = [];
    this.maxTrailLength = 20;
    this.trailTimer = 0;
  }

  /**
   * Apply thrust forward
   */
  thrust(deltaTime) {
    this.isThrusting = true;
    const forward = this.getForwardVector();
    const thrust = Vector2D.multiply(forward, this.thrustPower * deltaTime);
    this.applyForce(thrust);
  }

  /**
   * Apply brake (reverse thrust)
   */
  brake(deltaTime) {
    this.isBraking = true;
    if (this.velocity.magnitude() > 0.1) {
      const brakeForce = this.velocity.clone()
        .normalize()
        .multiply(-this.thrustPower * this.brakePower * deltaTime);
      this.applyForce(brakeForce);
    }
  }

  /**
   * Strafe left/right (lateral movement)
   */
  strafe(direction, deltaTime) {
    this.strafingDirection = direction;
    const right = this.getRightVector();
    const thrust = Vector2D.multiply(right, direction * this.lateralThrustPower * deltaTime);
    this.applyForce(thrust);
  }

  /**
   * Rotate ship
   */
  rotate(direction, deltaTime) {
    this.rotationDirection = direction;
    this.angularVelocity += direction * this.rotationSpeed * deltaTime;
  }

  /**
   * Activate shield
   */
  activateShield() {
    if (this.shield.strength > 0) {
      this.shield.active = true;
    }
  }

  /**
   * Deactivate shield
   */
  deactivateShield() {
    this.shield.active = false;
  }

  /**
   * Toggle shield
   */
  toggleShield() {
    if (this.shield.active) {
      this.deactivateShield();
    } else {
      this.activateShield();
    }
  }

  /**
   * Fire weapon
   */
  fire() {
    if (this.weapons.cooldown > 0) return null;

    this.weapons.cooldown = this.weapons.fireRate;

    // Always shoot upward
    const upwardDirection = new Vector2D(0, -1);
    const spawnOffset = Vector2D.multiply(upwardDirection, this.height / 2);
    const spawnPos = Vector2D.add(this.position, spawnOffset);

    const projectileVelocity = Vector2D.multiply(upwardDirection, this.weapons.projectileSpeed);

    return {
      position: spawnPos,
      velocity: projectileVelocity,
      angle: -Math.PI / 2, // Point upward
      damage: 25
    };
  }

  /**
   * Take damage
   */
  takeDamage(amount) {
    if (this.invulnerable) return false;

    if (this.shield.active && this.shield.strength > 0) {
      this.shield.strength = Math.max(0, this.shield.strength - amount);
      if (this.shield.strength === 0) {
        this.shield.active = false;
      }
      return false; // Shield absorbed damage
    }

    this.health = Math.max(0, this.health - amount);
    
    // Grant brief invulnerability
    this.invulnerable = true;
    this.invulnerabilityTimer = 1.0; // 1 second

    return this.health <= 0;
  }

  /**
   * Heal ship
   */
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  /**
   * Update spaceship
   */
  update(deltaTime) {
    // Update physics
    super.update(deltaTime);

    // Limit velocity
    this.limitVelocity(this.maxSpeed);

    // Update shield
    if (this.shield.powerUpActive) {
        this.shield.powerUpTimer -= deltaTime;
        if (this.shield.powerUpTimer <= 0) {
            this.shield.powerUpActive = false;
            this.deactivateShield();
        }
    }

    if (this.shield.active) {
      this.shield.strength = Math.max(0, this.shield.strength - this.shield.depletionRate * deltaTime);
      if (this.shield.strength === 0) {
        this.shield.active = false;
      }
    } else if (this.shield.strength < this.shield.maxStrength) {
      this.shield.strength = Math.min(
        this.shield.maxStrength,
        this.shield.strength + this.shield.regenRate * deltaTime
      );
    }

    // Update weapon cooldown
    if (this.weapons.cooldown > 0) {
      this.weapons.cooldown = Math.max(0, this.weapons.cooldown - deltaTime);
    }

    // Update invulnerability
    if (this.invulnerable) {
      this.invulnerabilityTimer = Math.max(0, this.invulnerabilityTimer - deltaTime);
      if (this.invulnerabilityTimer === 0) {
        this.invulnerable = false;
      }
    }

    // Update trail
    this.trailTimer += deltaTime;
    if (this.trailTimer > 0.02 && this.velocity.magnitude() > 10) {
      this.trail.push({
        position: this.position.clone(),
        alpha: 1.0,
        size: this.width * 0.5
      });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }
      this.trailTimer = 0;
    }

    // Fade trail
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha *= 0.95;
    }
    this.trail = this.trail.filter(t => t.alpha > 0.05);

    // Reset frame state
    this.isThrusting = false;
    this.isBraking = false;
    this.strafingDirection = 0;
    this.rotationDirection = 0;
  }

  /**
   * Render spaceship
   */
  render(ctx) {
    // Render trail
    this.renderTrail(ctx);

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    // Always face upward (-90 degrees from default right-facing orientation)
    ctx.rotate(-Math.PI / 2);

    // Render thrust particles
    if (this.isThrusting) {
      this.renderThrust(ctx);
    }

    // Render ship body
    this.renderShip(ctx);

    // Render shield
    if (this.shield.active) {
      this.renderShield(ctx);
    }

    ctx.restore();

    // Render health bar (absolute positioning)
    this.renderHealthBar(ctx);
  }

  /**
   * Render trail effect
   */
  renderTrail(ctx) {
    if (this.trail.length < 2) return;

    ctx.save();
    for (let i = 0; i < this.trail.length; i++) {
      const trail = this.trail[i];
      const alpha = trail.alpha * (i / this.trail.length);
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.color;
      
      ctx.beginPath();
      ctx.arc(trail.position.x, trail.position.y, trail.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Render ship body (spaceship shape)
   */
  renderShip(ctx) {
    // Flashing when invulnerable
    if (this.invulnerable && Math.floor(this.invulnerabilityTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    if (this.sprite.complete) {
        ctx.save();
        ctx.rotate(Math.PI / 2); // Rotate 90 degrees clockwise
        ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    } else {
        // Fallback to original triangle drawing
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // Draw spaceship (triangle/arrow shape)
        ctx.beginPath();
        ctx.moveTo(this.height / 2, 0); // Nose
        ctx.lineTo(-this.height / 3, this.width / 2); // Right wing
        ctx.lineTo(-this.height / 3, -this.width / 2); // Left wing
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
  }

  /**
   * Render thrust flames
   */
  renderThrust(ctx) {
    ctx.fillStyle = 'rgba(255, 150, 50, 0.8)';
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';

    // Main thrust flame
    const flameLength = this.height * 0.5;
    const flameWidth = this.width * 0.4;
    const flicker = Math.sin(Date.now() * 0.05) * 0.1 + 0.9;

    ctx.beginPath();
    ctx.moveTo(-this.height / 3, 0);
    ctx.lineTo(-this.height / 3 - flameLength * flicker, flameWidth / 2);
    ctx.lineTo(-this.height / 3 - flameLength * flicker * 0.7, 0);
    ctx.lineTo(-this.height / 3 - flameLength * flicker, -flameWidth / 2);
    ctx.closePath();
    ctx.fill();

    // Inner flame
    ctx.fillStyle = 'rgba(255, 255, 100, 0.6)';
    ctx.beginPath();
    ctx.moveTo(-this.height / 3, 0);
    ctx.lineTo(-this.height / 3 - flameLength * flicker * 0.6, flameWidth / 4);
    ctx.lineTo(-this.height / 3 - flameLength * flicker * 0.4, 0);
    ctx.lineTo(-this.height / 3 - flameLength * flicker * 0.6, -flameWidth / 4);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Render shield bubble
   */
  renderShield(ctx) {
    const shieldRadius = Math.max(this.width, this.height) * 0.8;
    const shieldAlpha = (this.shield.strength / this.shield.maxStrength) * 0.6;

    ctx.strokeStyle = `rgba(0, 240, 255, ${shieldAlpha + 0.3})`;
    ctx.fillStyle = `rgba(0, 240, 255, ${shieldAlpha * 0.3})`;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';

    ctx.beginPath();
    ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hexagon pattern
    ctx.strokeStyle = `rgba(0, 240, 255, ${shieldAlpha * 0.5})`;
    ctx.lineWidth = 1;
    const hexRadius = shieldRadius * 0.3;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = Math.cos(angle) * hexRadius;
      const y = Math.sin(angle) * hexRadius;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }

  /**
   * Render health bar above ship
   */
  renderHealthBar(ctx) {
    const barWidth = 60;
    const barHeight = 6;
    const barX = this.position.x - barWidth / 2;
    const barY = this.position.y - this.height - 15;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health
    const healthPercent = this.health / this.maxHealth;
    const healthColor = healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffaa00' : '#ff0055';
    ctx.fillStyle = healthColor;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Shield bar
    if (this.shield.maxStrength > 0) {
      const shieldBarY = barY - barHeight - 2;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(barX, shieldBarY, barWidth, barHeight);

      const shieldPercent = this.shield.strength / this.shield.maxStrength;
      ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
      ctx.fillRect(barX, shieldBarY, barWidth * shieldPercent, barHeight);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.strokeRect(barX, shieldBarY, barWidth, barHeight);
    }
  }

  /**
   * Check if ship is destroyed
   */
  isDestroyed() {
    return this.health <= 0;
  }

  /**
   * Reset ship to initial state
   */
  reset(x, y) {
    this.position.set(x, y);
    this.velocity.set(0, 0);
    this.acceleration.set(0, 0);
    this.angle = -Math.PI / 2; // Point up
    this.angularVelocity = 0;
    this.health = this.maxHealth;
    this.shield.strength = this.shield.maxStrength;
    this.shield.active = false;
    this.invulnerable = false;
    this.trail = [];
  }
}
