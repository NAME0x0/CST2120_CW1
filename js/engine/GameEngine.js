import { Spaceship } from './Spaceship.js';
import { Asteroid, Projectile, PowerUp } from './GameObjects.js';
import { CollisionSystem } from './Collision.js';
import { ParticleSystem, StarField } from './Effects.js';
import { Vector2D } from './Vector2D.js';

console.log('[GameEngine.js] Module loaded');

/**
 * Main Game Engine
 * Handles physics, rendering, game logic
 */
export class GameEngine {
  constructor(canvas, config = {}) {
    console.log('[GameEngine] Constructor called with config:', config);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    console.log('[GameEngine] Canvas dimensions:', this.width, 'x', this.height);

    // Game state
    this.state = 'menu'; // menu, playing, paused, gameover
    this.score = 0;
    this.wave = 1;
    this.kills = 0;
    this.time = 0;

    // Entities
    this.player = null;
    this.asteroids = [];
    this.projectiles = [];
    this.powerUps = [];

    // Systems
    this.particles = new ParticleSystem();
    this.starField = new StarField(this.width, this.height, 150);
    this.collision = new CollisionSystem();

    // Input handling
    this.keys = {};
    this.mouse = { x: 0, y: 0, down: false };

    // Game settings
    this.config = {
      mode: 'lane-shooter', // 'lane-shooter' or 'space-sim'
      asteroidSpawnRate: 2.0, // seconds
      asteroidSpawnIncrease: 0.85, // multiply each wave
      powerUpChance: 0.15,
      maxAsteroids: 20,
      scrollSpeed: 50,
      difficultyMultiplier: 1.0,
      bossWaveInterval: 5, // Boss every N waves
      fixedPlayerY: null, // Will be set on start for lane-shooter mode
      // Lane-shooter movement tuning
      maxSpeedX: 450, // Max horizontal velocity (pixels/sec)
      accelX: 2800, // Acceleration when input pressed
      decelX: 2000, // Deceleration when input released
      frictionX: 0.92, // Velocity damping per frame (when no input)
      laneCount: 3,
      lanePadding: 120,
      ...config
    };

    // Calculate lane positions
    const laneSpacing = (this.width - this.config.lanePadding * 2) / (this.config.laneCount - 1);
    this.lanes = Array.from({ length: this.config.laneCount }, (_, i) => this.config.lanePadding + laneSpacing * i);
    
    // Lane-shooter movement state
    this.laneMovement = {
      targetVelocityX: 0,
      inputX: 0,
      lastInputTime: 0
    };
    
    // Enhanced UI system for lane-shooter mode
    this.uiSystem = {
      floatingTexts: [], // For score popups, notifications
      damageFlash: { active: false, alpha: 0, timer: 0 },
      shieldPulse: { active: false, alpha: 0, timer: 0 },
      powerUpTimers: {}, // Track active power-up durations
      debugMode: false, // Toggle with F12
      fps: 0,
      frameCount: 0,
      fpsTimer: 0
    };

    // Timers
    this.asteroidSpawnTimer = 0;
    this.waveTimer = 0;
    this.waveInterval = 30; // seconds per wave

    // Advanced game systems
    this.comboSystem = {
      count: 0,
      timer: 0,
      maxTime: 3.0, // seconds to maintain combo
      multiplier: 1.0,
      maxMultiplier: 8.0
    };

    this.bossSystem = {
      active: false,
      boss: null,
      phase: 1,
      maxPhases: 3
    };

    this.weaponSystem = {
      currentWeapon: 'default',
      weapons: {
        default: { damage: 10, fireRate: 0.2, projectileSpeed: 800, color: '#00f0ff' },
        laser: { damage: 5, fireRate: 0.05, projectileSpeed: 1000, color: '#ff00ff', duration: 15 },
        missile: { damage: 30, fireRate: 0.5, projectileSpeed: 600, color: '#ff6600', homing: true, duration: 20 },
        shotgun: { damage: 8, fireRate: 0.4, projectileSpeed: 700, color: '#ffff00', spread: 3, duration: 18 }
      },
      activeWeaponTimer: 0
    };

    this.upgradeSystem = {
      level: 1,
      experience: 0,
      experienceToNext: 100,
      skillPoints: 0,
      upgrades: {
        damage: 0,
        fireRate: 0,
        health: 0,
        speed: 0,
        shield: 0
      }
    };

    // Environmental hazards
    this.hazards = [];
    this.hazardSpawnTimer = 0;
    this.hazardSpawnInterval = 15; // seconds

    // Chain reaction system
    this.chainReactions = [];

    // Performance monitoring
    this.fps = 60;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;

    // Camera shake
    this.shake = { x: 0, y: 0, intensity: 0, duration: 0 };

    // Setup
    this.setupPlayer();
    this.bindInput();
  }

  /**
   * Initialize player spaceship
   */
  setupPlayer() {
    this.player = new Spaceship(this.width / 2, this.height - 100, {
      width: 40,
      height: 50,
      mass: 1.5,
      thrustPower: 800,
      lateralThrustPower: 600,
      maxSpeed: 500,
      health: 100,
      color: '#00f0ff'
    });
  }

  /**
   * Bind keyboard and mouse input
   */
  bindInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      
      // Toggle debug mode with F12
      if (e.key === 'F12') {
        e.preventDefault();
        this.uiSystem.debugMode = !this.uiSystem.debugMode;
        console.log('[Engine] Debug mode:', this.uiSystem.debugMode);
      }
      
      // Prevent default for game keys
      if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.mouse.down = true;
      if (this.state === 'playing') {
        this.playerFire();
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.mouse.down = false;
    });

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.mouse.x = touch.clientX - rect.left;
      this.mouse.y = touch.clientY - rect.top;
      this.mouse.down = true;
      if (this.state === 'playing') {
        this.playerFire();
      }
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.mouse.down = false;
    });
  }

  /**
   * UI Helper: Create floating text notification
   */
  createFloatingText(x, y, text, color = '#ffaa00', size = 20) {
    this.uiSystem.floatingTexts.push({
      x, y,
      text,
      color,
      size,
      alpha: 1.0,
      velocityY: -40, // Float upward slower
      lifetime: 2.0, // Stay longer
      age: 0
    });
  }

  /**
   * UI Helper: Trigger damage flash
   */
  triggerDamageFlash() {
    this.uiSystem.damageFlash.active = true;
    this.uiSystem.damageFlash.alpha = 0.4;
    this.uiSystem.damageFlash.timer = 0.2;
  }

  /**
   * UI Helper: Trigger shield pulse
   */
  triggerShieldPulse() {
    this.uiSystem.shieldPulse.active = true;
    this.uiSystem.shieldPulse.alpha = 0.3;
    this.uiSystem.shieldPulse.timer = 0.3;
  }

  /**
   * Handle player input
   */
  handleInput(deltaTime) {
    if (!this.player || this.state !== 'playing') return;

    if (this.config.mode === 'lane-shooter') {
      // Lane shooter mode: responsive velocity-based horizontal movement
      
      // Determine input direction
      let inputX = 0;
      if (this.keys['a'] || this.keys['arrowleft']) {
        inputX = -1;
      }
      if (this.keys['d'] || this.keys['arrowright']) {
        inputX += 1;
      }
      
      this.laneMovement.inputX = inputX;
      
      // Calculate target velocity based on input
      this.laneMovement.targetVelocityX = inputX * this.config.maxSpeedX;
      
      // Apply acceleration or deceleration to approach target velocity
      const currentVx = this.player.velocity.x;
      const targetVx = this.laneMovement.targetVelocityX;
      const velocityDiff = targetVx - currentVx;
      
      if (Math.abs(velocityDiff) > 0.1) {
        // Choose acceleration or deceleration rate
        const rate = (Math.abs(targetVx) > Math.abs(currentVx)) 
          ? this.config.accelX 
          : this.config.decelX;
        
        // Apply dt-correct acceleration
        const deltaV = Math.sign(velocityDiff) * rate * deltaTime;
        
        // Don't overshoot target
        if (Math.abs(deltaV) < Math.abs(velocityDiff)) {
          this.player.velocity.x += deltaV;
        } else {
          this.player.velocity.x = targetVx;
        }
      } else {
        this.player.velocity.x = targetVx;
      }
      
      // Apply friction when no input (helps with stopping feel)
      if (inputX === 0 && Math.abs(currentVx) > 1) {
        this.player.velocity.x *= this.config.frictionX;
      }
      
      // Clamp to max speed
      const maxSpeed = this.config.maxSpeedX;
      this.player.velocity.x = Math.max(-maxSpeed, Math.min(maxSpeed, this.player.velocity.x));

      // Fire weapon (spacebar or mouse)
      if (this.keys[' '] || this.mouse.down) {
        this.playerFire();
      }

      // Shield toggle
      if (this.keys['shift'] || this.keys['e']) {
        this.player.activateShield();
      } else {
        this.player.deactivateShield();
      }

      // Lock Y position - ship cannot move up/down
      if (this.config.fixedPlayerY !== null) {
        this.player.position.y = this.config.fixedPlayerY;
        this.player.velocity.y = 0;
      }
      
      // Lock angle to prevent rotation drift
      this.player.angle = 0;
      this.player.angularVelocity = 0;
      
      // Keep ship within horizontal bounds (clamp position and velocity)
      const margin = 50;
      if (this.player.position.x < margin) {
        this.player.position.x = margin;
        this.player.velocity.x = Math.max(0, this.player.velocity.x);
      }
      if (this.player.position.x > this.width - margin) {
        this.player.position.x = this.width - margin;
        this.player.velocity.x = Math.min(0, this.player.velocity.x);
      }
      
    } else {
      // Space sim mode: full 360° controls (original behavior)
      
      // Thrust forward
      if (this.keys['w'] || this.keys['arrowup']) {
        this.player.thrust(deltaTime);
        
        // Create thrust particles
        const thrustPos = Vector2D.subtract(
          this.player.position,
          Vector2D.multiply(this.player.getForwardVector(), this.player.height / 3)
        );
        this.particles.createThrust(thrustPos.x, thrustPos.y, this.player.angle, '#ff9933');
      }

      // Brake
      if (this.keys['s'] || this.keys['arrowdown']) {
        this.player.brake(deltaTime);
      }

      // Strafe left
      if (this.keys['a'] || this.keys['arrowleft']) {
        this.player.strafe(-1, deltaTime);
      }

      // Strafe right
      if (this.keys['d'] || this.keys['arrowright']) {
        this.player.strafe(1, deltaTime);
      }

      // Rotate towards mouse
      if (this.keys['r']) {
        const target = new Vector2D(this.mouse.x, this.mouse.y);
        this.player.lookAt(target);
      }

      // Fire weapon
      if (this.keys[' '] || this.mouse.down) {
        this.playerFire();
      }

      // Shield toggle
      if (this.keys['shift'] || this.keys['e']) {
        this.player.activateShield();
      } else {
        this.player.deactivateShield();
      }
    }
  }

  getCurrentLane() {
    if (!this.player) return 1; // Default to middle lane
    
    const playerX = this.player.position.x;
    let closestLane = 0;
    let minDist = Infinity;
    
    this.lanes.forEach((laneX, index) => {
      const dist = Math.abs(playerX - laneX);
      if (dist < minDist) {
        minDist = dist;
        closestLane = index;
      }
    });
    
    return closestLane;
  }

  /**
   * Player fires weapon (simplified for lane-shooter)
   */
  playerFire() {
    const weaponType = this.weaponSystem.currentWeapon;
    const weapon = this.weaponSystem.weapons[weaponType];

    // Use player's fireRate for the current weapon
    this.player.weapons.fireRate = weapon.fireRate;

    const projectileData = this.player.fire();
    if (!projectileData) return;

    const baseDamage = weapon.damage * (1 + this.upgradeSystem.upgrades.damage * 0.1);

    switch (weaponType) {
      case 'default': {
        const proj = new Projectile(
          projectileData.position,
          projectileData.velocity,
          projectileData.angle,
          baseDamage
        );
        proj.color = weapon.color;
        this.projectiles.push(proj);
        break;
      }
      case 'laser': {
        const proj = new Projectile(
          projectileData.position,
          projectileData.velocity,
          projectileData.angle,
          baseDamage
        );
        proj.color = weapon.color;
        proj.width = 3;
        proj.height = 40;
        this.projectiles.push(proj);
        break;
      }
      case 'missile': {
        const proj = new Projectile(
          projectileData.position,
          projectileData.velocity,
          projectileData.angle,
          baseDamage
        );
        proj.color = weapon.color;
        proj.homing = true;
        proj.homingStrength = 2.5;
        proj.width = 8;
        proj.height = 16;
        this.projectiles.push(proj);
        break;
      }
      case 'shotgun': {
        const spreadCount = weapon.spread;
        for (let i = 0; i < spreadCount; i++) {
          const angleOffset = (i - Math.floor(spreadCount / 2)) * 0.15;
          const velocity = Vector2D.fromAngle(projectileData.angle + angleOffset, weapon.projectileSpeed);
          const proj = new Projectile(
            projectileData.position,
            velocity,
            projectileData.angle + angleOffset,
            baseDamage
          );
          proj.color = weapon.color;
          this.projectiles.push(proj);
        }
        break;
      }
    }
  }

  /**
   * Spawn asteroid with difficulty scaling
   */
  spawnAsteroid() {
    if (this.asteroids.length >= this.config.maxAsteroids) return;
    if (this.bossSystem.active) return; // Don't spawn during boss fight

    // Spawn position with lane-based bias (lane-shooter mode)
    const margin = 100;
    let x = margin + Math.random() * (this.width - margin * 2);
    
    if (this.config.mode === 'lane-shooter' && this.player) {
      // Bias spawn toward active lanes based on multipliers
      // Lane 1 (left): 0.8x spawn rate (safer)
      // Lane 2 (center): 1.0x spawn rate
      // Lane 3 (right): 1.3x spawn rate (more dangerous)
      
      const laneWidth = (this.width - margin * 2) / 3;
      const lane1Center = margin + laneWidth * 0.5;
      const lane2Center = margin + laneWidth * 1.5;
      const lane3Center = margin + laneWidth * 2.5;
      
      // Weighted random lane selection
      const rand = Math.random();
      const totalWeight = 0.8 + 1.0 + 1.3; // Sum of lane spawn multipliers
      
      if (rand < 0.8 / totalWeight) {
        // Lane 1 (left) - fewer spawns
        x = lane1Center + (Math.random() - 0.5) * laneWidth * 0.8;
      } else if (rand < (0.8 + 1.0) / totalWeight) {
        // Lane 2 (center) - normal spawns
        x = lane2Center + (Math.random() - 0.5) * laneWidth * 0.8;
      } else {
        // Lane 3 (right) - more spawns
        x = lane3Center + (Math.random() - 0.5) * laneWidth * 0.8;
      }
      
      // Ensure within bounds
      x = Math.max(margin, Math.min(this.width - margin, x));
    }
    
    const y = -50;

    // Random size with difficulty-based weights
    const sizes = ['small', 'medium', 'large', 'huge'];
    const baseWeights = [0.4, 0.35, 0.2, 0.05];
    
    // Adjust weights based on wave (harder = more large asteroids)
    const difficultyFactor = Math.min(this.wave / 10, 1.5);
    const weights = baseWeights.map((w, i) => 
      i >= 2 ? w * (1 + difficultyFactor * 0.5) : w * (1 - difficultyFactor * 0.2)
    );
    
    const rand = Math.random();
    let size = 'small';
    let cumulative = 0;
    
    for (let i = 0; i < sizes.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        size = sizes[i];
        break;
      }
    }

    // Random velocity with difficulty scaling
    const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    const baseSpeed = 80 + Math.random() * 120;
    const speed = baseSpeed * (1 + this.config.difficultyMultiplier * 0.3);
    const velocity = Vector2D.fromAngle(angle, speed);

    const asteroid = new Asteroid(x, y, size, velocity);

    // Scale stats based on wave
    const waveFactor = 1 + (this.wave - 1) * 0.1;
    asteroid.health *= waveFactor;
    asteroid.maxHealth *= waveFactor;
    asteroid.damage = (asteroid.sizeMap[size] / 2) * waveFactor; // Collision damage scales with size and wave
    
    // Add rotation for more dynamic visuals
    asteroid.angularVelocity = (Math.random() - 0.5) * 3;
    
    // Safety check: Don't spawn too close to player (lane-shooter mode)
    if (this.config.mode === 'lane-shooter' && this.player) {
      const safeDistance = 200;
      const dx = asteroid.position.x - this.player.position.x;
      const dy = asteroid.position.y - this.player.position.y;
      const distSq = dx * dx + dy * dy;
      
      // If too close horizontally (Y distance is already safe due to spawn at top), shift horizontally
      if (Math.abs(dx) < safeDistance && dy < safeDistance) {
        // Move asteroid away horizontally
        asteroid.position.x += (dx > 0 ? 1 : -1) * (safeDistance - Math.abs(dx));
        // Clamp to bounds
        const margin = 100;
        asteroid.position.x = Math.max(margin, Math.min(this.width - margin, asteroid.position.x));
      }
    }
    
    this.asteroids.push(asteroid);
  }

  /**
   * Spawn boss asteroid
   */
  spawnBoss() {
    console.log('[Engine] Spawning Boss!');
    
    const x = this.width / 2;
    const y = -100;
    
    const boss = new Asteroid(x, y, 'huge', new Vector2D(0, 50));
    boss.isBoss = true;
    boss.health = 200 + (this.wave * 50); // Scale with wave
    boss.maxHealth = boss.health;
    boss.color = '#ff0055';
    boss.damage = 40;
    boss.scoreValue = 1000;
    boss.radius *= 1.5; // Make it bigger
    
    this.bossSystem.boss = boss;
    this.bossSystem.active = true;
    this.bossSystem.phase = 1;
    this.asteroids.push(boss);
    
    this.screenShake(15, 0.5);
  }

  /**
   * Spawn environmental hazard
   */
  spawnHazard() {
    if (this.config.mode === 'lane-shooter') {
      const activeLane = this.getCurrentLane();
      const laneX = this.lanes[activeLane];

      const hazard = {
        type: 'blackhole',
        position: new Vector2D(
          this.player.position.x + 200, // Spawn to the right of the player
          this.player.position.y + 100 // Spawn below the player
        ),
        velocity: new Vector2D(0, 0), // No movement
        radius: 80, // Slightly larger
        strength: 250, // Amplified gravity
        duration: 15,
        timer: 0,
        active: true,
        telegraph: true,
        telegraphTimer: 2.0 // Amplified telegraph time
      };
      
      this.hazards.push(hazard);
      console.log('[Engine] Blackhole spawning in lane:', activeLane);
    } else {
      // Space-sim mode: Random hazard types and positions
      const types = ['blackhole', 'nebula', 'meteor_shower'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const hazard = {
        type,
        position: new Vector2D(
          Math.random() * this.width,
          Math.random() * this.height
        ),
        radius: type === 'blackhole' ? 80 : 150,
        strength: type === 'blackhole' ? 200 : 0.5,
        duration: 10 + Math.random() * 10,
        timer: 0,
        active: true
      };
      
      if (type === 'meteor_shower') {
        hazard.spawnTimer = 0;
        hazard.spawnRate = 0.1;
      }
      
      this.hazards.push(hazard);
    }
  }

  /**
   * Spawn power-up
   */
  spawnPowerUp(x, y) {
    const types = ['health', 'shield', 'weapon', 'speed'];
    const type = types[Math.floor(Math.random() * types.length)];
    const powerUp = new PowerUp(x, y, type);
    
    if (this.config.mode === 'lane-shooter') {
      // In lane-shooter mode, power-ups fall downward like asteroids
      // Spawn above screen if not already positioned
      if (y > 0 && y < this.height) {
        powerUp.position.y = -30; // Spawn above view
        powerUp.position.x = x; // Keep X position
      }
      
      // Downward velocity (match scroll speed for natural feel)
      const fallSpeed = this.config.scrollSpeed * 1.8; // Slightly faster than background
      powerUp.velocity.set(0, fallSpeed);
      
      // Small horizontal drift for variety
      const drift = (Math.random() - 0.5) * 30;
      powerUp.velocity.x = drift;
    } else {
      // Space-sim mode: random velocity in all directions
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      powerUp.velocity.set(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
    }
    
    this.powerUps.push(powerUp);
  }

  /**
   * Update game logic
   */
  update(deltaTime) {
    if (this.state !== 'playing') return;

    // Clamp deltaTime to prevent huge frame spikes causing physics issues
    deltaTime = Math.min(deltaTime, 0.1); // Cap at 100ms (10 FPS minimum)
    
    this.time += deltaTime;

    // Handle input
    this.handleInput(deltaTime);

    // Update player
    if (this.player) {
      this.player.update(deltaTime);
      
      // Keep player in bounds (horizontal only for lane-shooter)
      if (this.config.mode === 'lane-shooter') {
        // Horizontal clamping only - no vertical bounce
        const margin = 50;
        if (this.player.position.x < margin) {
          this.player.position.x = margin;
          this.player.velocity.x = 0;
        }
        if (this.player.position.x > this.width - margin) {
          this.player.position.x = this.width - margin;
          this.player.velocity.x = 0;
        }
      } else {
        // Space sim mode: bounce off all edges
        CollisionSystem.bounceOffBounds(
          this.player,
          this.player.width,
          this.player.height,
          this.width,
          this.height,
          0.5
        );
      }

      // Check if player is destroyed
      if (this.player.isDestroyed()) {
        console.log('[Engine] Player destroyed! Health:', this.player.health);
        this.gameOver();
        return;
      }
    }

    // Update asteroids
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const asteroid = this.asteroids[i];
      asteroid.update(deltaTime);

      // Remove if off screen
      if (asteroid.position.y > this.height + 100) {
        if (asteroid.isBoss) {
          this.bossSystem.active = false;
          this.bossSystem.boss = null;
          console.log('[Engine] Boss asteroid went off screen. Boss fight ended.');
        }
        this.asteroids.splice(i, 1);
        continue;
      }

      // Check collision with player
      if (CollisionSystem.checkCircleCollision(
        this.player,
        asteroid,
        Math.max(this.player.width, this.player.height) / 2,
        asteroid.radius
      )) {
        // Player takes damage
        const destroyed = this.player.takeDamage(asteroid.damage || 20);
        
        // UI feedback
        if (this.player.shield.active) {
          this.triggerShieldPulse();
        } else {
          this.triggerDamageFlash();
          this.createFloatingText(this.player.position.x, this.player.position.y - 40, '-20 HP', '#ff0055', 18);
        }
        
        // Create effects
        this.particles.createExplosion(
          asteroid.position.x,
          asteroid.position.y,
          20,
          '#ff0055',
          150
        );
        
        if (this.player.shield.active) {
          this.particles.createShieldHit(asteroid.position.x, asteroid.position.y);
        }
        
        this.screenShake(10, 0.3);
        
        // Destroy asteroid
        const fragments = asteroid.split();
        this.asteroids.splice(i, 1);
        this.asteroids.push(...fragments);
        
        if (destroyed) {
          this.gameOver();
          return;
        }
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(deltaTime);

      // Homing missile behavior
      if (proj.homing && this.asteroids.length > 0) {
        const target = this.findNearestAsteroid(proj.position);
        if (target) {
          const toTarget = Vector2D.subtract(target.position, proj.position);
          const desiredVelocity = toTarget.normalize().multiply(proj.velocity.magnitude());
          const steering = Vector2D.subtract(desiredVelocity, proj.velocity);
          steering.multiply(proj.homingStrength * deltaTime);
          proj.velocity.add(steering);
          proj.angle = Math.atan2(proj.velocity.y, proj.velocity.x);
        }
      }

      // Create trail
      this.particles.createTrail(
        proj.position.x,
        proj.position.y,
        proj.velocity.x,
        proj.velocity.y,
        proj.color || '#00f0ff'
      );

      // Remove if expired or off screen
      if (proj.isExpired() || !this.isOnScreen(proj.position, 50)) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with asteroids
      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const asteroid = this.asteroids[j];
        
        if (CollisionSystem.checkCircleCollision(
          proj,
          asteroid,
          proj.width / 2,
          asteroid.radius
        )) {
          // Damage asteroid
          const destroyed = asteroid.takeDamage(proj.damage);
          
          // Create impact effect
          this.particles.createDamageSparks(
            proj.position.x,
            proj.position.y,
            proj.velocity,
            '#ffaa00'
          );
          
          // Remove projectile
          this.projectiles.splice(i, 1);
          
          if (destroyed) {
            // Increase combo
            this.increaseCombo();
            
            // Score points with combo multiplier
            const scoreMap = { small: 100, medium: 50, large: 25, huge: 10 };
            const baseScore = asteroid.isBoss ? asteroid.scoreValue : (scoreMap[asteroid.size] || 10);
            const finalScore = Math.floor(baseScore * this.comboSystem.multiplier);
            this.score += finalScore;
            this.kills++;
            
            // Create floating score text
            const scoreColor = this.comboSystem.count > 5 ? '#ffff00' : '#ffaa00';
            this.createFloatingText(
              asteroid.position.x,
              asteroid.position.y,
              `+${finalScore}`,
              scoreColor,
              20 + Math.min(this.comboSystem.count, 10)
            );
            
            // Add experience
            this.addExperience(baseScore / 10);
            
            // Boss handling
            if (asteroid.isBoss) {
              this.bossSystem.active = false;
              this.bossSystem.boss = null;
              this.screenShake(30, 1.0);
              
              // Spawn multiple power-ups
              for (let k = 0; k < 3; k++) {
                this.spawnPowerUp(
                  asteroid.position.x + (Math.random() - 0.5) * 100,
                  asteroid.position.y + (Math.random() - 0.5) * 100
                );
              }
            }
            
            // Create explosion
            const explosionSize = asteroid.isBoss ? 80 : 30;
            this.particles.createExplosion(
              asteroid.position.x,
              asteroid.position.y,
              explosionSize,
              asteroid.isBoss ? '#ff0055' : '#ff6600',
              asteroid.isBoss ? 400 : 200
            );
            this.particles.createDebris(
              asteroid.position.x,
              asteroid.position.y,
              asteroid.isBoss ? 40 : 15,
              asteroid.color
            );
            
            // Split asteroid (not for boss)
            if (!asteroid.isBoss) {
              const fragments = asteroid.split();
              this.asteroids.splice(j, 1);
              this.asteroids.push(...fragments);
              
              // Chance to spawn power-up
              if (Math.random() < this.config.powerUpChance * this.comboSystem.multiplier) {
                this.spawnPowerUp(asteroid.position.x, asteroid.position.y);
              }
            } else {
              this.asteroids.splice(j, 1);
            }
            
            // Chain reaction check
            this.checkChainReaction(asteroid.position, asteroid.radius * 2);
            
            this.screenShake(asteroid.isBoss ? 15 : 5, asteroid.isBoss ? 0.3 : 0.15);
          }
          
          break;
        }
      }
    }

    // Update power-ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.update(deltaTime);

      // Remove if expired
      if (powerUp.isExpired()) {
        this.powerUps.splice(i, 1);
        continue;
      }
      
      // Remove if off-screen (lane-shooter mode)
      if (this.config.mode === 'lane-shooter') {
        if (powerUp.position.y > this.height + 50 || 
            powerUp.position.x < -50 || 
            powerUp.position.x > this.width + 50) {
          this.powerUps.splice(i, 1);
          continue;
        }
      }

      // Magnet effect: pull power-ups toward player when close
      const dx = this.player.position.x - powerUp.position.x;
      const dy = this.player.position.y - powerUp.position.y;
      const distSq = dx * dx + dy * dy;
      const magnetRange = 120;
      const magnetRangeSq = magnetRange * magnetRange;
      
      if (distSq < magnetRangeSq && distSq > 1) {
        const dist = Math.sqrt(distSq);
        const magnetStrength = 200 * (1 - dist / magnetRange); // Stronger when closer
        const pullX = (dx / dist) * magnetStrength * deltaTime;
        const pullY = (dy / dist) * magnetStrength * deltaTime;
        powerUp.velocity.x += pullX;
        powerUp.velocity.y += pullY;
      }

      // Check collision with player
      const playerRadius = Math.max(this.player.width, this.player.height) / 2;
      if (CollisionSystem.checkCircleCollision(
        this.player,
        powerUp,
        playerRadius,
        powerUp.radius
      )) {
        if (!powerUp.collected) {
          this.collectPowerUp(powerUp);
          powerUp.collect(); // Mark as collected to prevent double-pickup
        }
        this.powerUps.splice(i, 1);
      }
    }

    // Update combo timer
    if (this.comboSystem.count > 0) {
      this.comboSystem.timer += deltaTime;
      if (this.comboSystem.timer >= this.comboSystem.maxTime) {
        this.resetCombo();
      }
    }

    // Update weapon timer
    if (this.weaponSystem.currentWeapon !== 'default' && this.weaponSystem.activeWeaponTimer > 0) {
      this.weaponSystem.activeWeaponTimer -= deltaTime;
      if (this.weaponSystem.activeWeaponTimer <= 0) {
        this.weaponSystem.currentWeapon = 'default';
      }
    }

    // Update hazards
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const hazard = this.hazards[i];
      hazard.timer += deltaTime;
      
      // Remove if expired or off-screen (lane-shooter mode)
      if (hazard.timer >= hazard.duration) {
        this.hazards.splice(i, 1);
        continue;
      }
      
      if (this.config.mode === 'lane-shooter' && hazard.position.y > this.height + 150) {
        this.hazards.splice(i, 1);
        continue;
      }
      
      this.updateHazard(hazard, deltaTime);
    }

    // Spawn asteroids
    this.asteroidSpawnTimer += deltaTime;
    if (this.asteroidSpawnTimer >= this.config.asteroidSpawnRate) {
      this.asteroidSpawnTimer = 0;
      this.spawnAsteroid();
    }

    // Spawn hazards
    this.hazardSpawnTimer += deltaTime;
    if (this.hazardSpawnTimer >= this.hazardSpawnInterval && this.wave > 2) {
      this.hazardSpawnTimer = 0;
      this.spawnHazard();
    }

    // Wave progression
    this.waveTimer += deltaTime;
    if (this.waveTimer >= this.waveInterval) {
      this.waveTimer = 0;
      this.wave++;
      this.config.asteroidSpawnRate *= this.config.asteroidSpawnIncrease;
      this.config.maxAsteroids += 2;
      this.config.difficultyMultiplier += 0.1;
      
      // Boss wave check
      if (this.wave % this.config.bossWaveInterval === 0) {
        this.spawnBoss();
      }
    }

    // Update effects
    this.particles.update(deltaTime);
    this.starField.update(deltaTime, this.config.scrollSpeed);

    // Update camera shake
    if (this.shake.duration > 0) {
      this.shake.duration -= deltaTime;
      this.shake.x = (Math.random() - 0.5) * this.shake.intensity;
      this.shake.y = (Math.random() - 0.5) * this.shake.intensity;
    } else {
      this.shake.x = 0;
      this.shake.y = 0;
    }
    
    // Update enhanced UI elements
    this.updateEnhancedUI(deltaTime);
  }

  /**
   * Update enhanced UI elements
   */
  updateEnhancedUI(deltaTime) {
    // Update floating texts
    for (let i = this.uiSystem.floatingTexts.length - 1; i >= 0; i--) {
      const text = this.uiSystem.floatingTexts[i];
      text.age += deltaTime;
      text.y += text.velocityY * deltaTime;
      text.alpha = 1.0 - (text.age / text.lifetime);
      
      if (text.age >= text.lifetime) {
        this.uiSystem.floatingTexts.splice(i, 1);
      }
    }
    
    // Update damage flash
    if (this.uiSystem.damageFlash.active) {
      this.uiSystem.damageFlash.timer -= deltaTime;
      this.uiSystem.damageFlash.alpha = Math.max(0, this.uiSystem.damageFlash.alpha - deltaTime * 2);
      
      if (this.uiSystem.damageFlash.timer <= 0) {
        this.uiSystem.damageFlash.active = false;
      }
    }
    
    // Update shield pulse
    if (this.uiSystem.shieldPulse.active) {
      this.uiSystem.shieldPulse.timer -= deltaTime;
      this.uiSystem.shieldPulse.alpha = Math.max(0, this.uiSystem.shieldPulse.alpha - deltaTime * 1.5);
      
      if (this.uiSystem.shieldPulse.timer <= 0) {
        this.uiSystem.shieldPulse.active = false;
      }
    }
    
    // Update FPS counter
    this.uiSystem.frameCount++;
    this.uiSystem.fpsTimer += deltaTime;
    if (this.uiSystem.fpsTimer >= 1.0) {
      this.uiSystem.fps = this.uiSystem.frameCount;
      this.uiSystem.frameCount = 0;
      this.uiSystem.fpsTimer = 0;
    }
  }

  /**
   * Collect power-up
   */
  collectPowerUp(powerUp) {
    powerUp.collect();
    
    // Create collect effect
    this.particles.createCollectEffect(
      powerUp.position.x,
      powerUp.position.y,
      powerUp.types[powerUp.type].color
    );
    
    // Create floating text notification
    const typeData = powerUp.types[powerUp.type];
    this.createFloatingText(
      powerUp.position.x,
      powerUp.position.y,
      `+${typeData.description}`,
      typeData.color,
      18
    );

    // Apply effect
    switch (powerUp.type) {
      case 'health':
        this.player.heal(30);
        this.createFloatingText(powerUp.position.x, powerUp.position.y - 20, '+30 HP', '#00ff88', 16);
        break;
        
      case 'shield':
        this.player.shield.powerUpActive = true;
        this.player.shield.powerUpTimer = 10; // 10 seconds
        this.player.activateShield();
        this.player.shield.strength = this.player.shield.maxStrength; // Fully charge the shield
        this.triggerShieldPulse();
        break;
        
      case 'weapon':
        // Cycle through special weapons
        const weapons = ['laser', 'missile', 'shotgun'];
        const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)];
        this.weaponSystem.currentWeapon = randomWeapon;
        this.weaponSystem.activeWeaponTimer = this.weaponSystem.weapons[randomWeapon].duration;
        break;
        
      case 'speed':
        this.config.maxSpeedX *= 1.2; // Increase max horizontal speed by 20%
        this.createFloatingText(powerUp.position.x, powerUp.position.y - 20, 'Max Speed++', '#ffaa00', 16);
        break;
    }

    this.score += Math.floor(50 * this.comboSystem.multiplier);
    this.addExperience(5);
  }

  /**
   * Screen shake effect
   */
  screenShake(intensity, duration) {
    this.shake.intensity = intensity;
    this.shake.duration = duration;
  }

  /**
   * Render game
   */
  render() {
    // Clear screen
    this.ctx.fillStyle = '#0a0e1a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Apply camera shake
    this.ctx.save();
    this.ctx.translate(this.shake.x, this.shake.y);

    // Render star field
    this.starField.render(this.ctx);

    // Render hazards (background)
    this.renderHazards();

    // Render particles (background layer)
    this.particles.render(this.ctx);

    // Render power-ups
    this.powerUps.forEach(powerUp => powerUp.render(this.ctx));

    // Render asteroids
    this.asteroids.forEach(asteroid => asteroid.render(this.ctx));

    // Render projectiles
    this.projectiles.forEach(proj => proj.render(this.ctx));

    // Render player
    if (this.player) {
      this.player.render(this.ctx);
    }

    this.ctx.restore();


  }

  /**
   * Render environmental hazards
   */
  renderHazards() {
    this.hazards.forEach(hazard => {
      this.ctx.save();
      
      if (hazard.type === 'blackhole') {
        // Render black hole with gradient
        const gradient = this.ctx.createRadialGradient(
          hazard.position.x, hazard.position.y, 0,
          hazard.position.x, hazard.position.y, hazard.radius
        );
        gradient.addColorStop(0, 'rgba(153, 51, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(102, 0, 204, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(hazard.position.x, hazard.position.y, hazard.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner core
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(hazard.position.x, hazard.position.y, hazard.radius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
      } else if (hazard.type === 'nebula') {
        // Render nebula cloud
        const gradient = this.ctx.createRadialGradient(
          hazard.position.x, hazard.position.y, 0,
          hazard.position.x, hazard.position.y, hazard.radius
        );
        gradient.addColorStop(0, 'rgba(100, 150, 255, 0.3)');
        gradient.addColorStop(0.7, 'rgba(50, 100, 200, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(hazard.position.x, hazard.position.y, hazard.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    });
  }



  /**
   * Render enhanced UI elements (lane-shooter mode)
   */
  renderEnhancedUI() {
    this.ctx.save();
    
    // Render floating texts
    for (let i = this.uiSystem.floatingTexts.length - 1; i >= 0; i--) {
      const text = this.uiSystem.floatingTexts[i];
      
      this.ctx.fillStyle = text.color;
      this.ctx.globalAlpha = text.alpha;
      this.ctx.font = `bold ${text.size}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = text.color;
      this.ctx.fillText(text.text, text.x, text.y);
    }
    
    // Damage flash (red tint on damage)
    if (this.uiSystem.damageFlash.active && this.uiSystem.damageFlash.alpha > 0) {
      this.ctx.fillStyle = `rgba(255, 0, 0, ${this.uiSystem.damageFlash.alpha})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    // Shield pulse (blue tint on shield activation)
    if (this.uiSystem.shieldPulse.active && this.uiSystem.shieldPulse.alpha > 0) {
      this.ctx.strokeStyle = `rgba(0, 240, 255, ${this.uiSystem.shieldPulse.alpha})`;
      this.ctx.lineWidth = 6;
      this.ctx.strokeRect(10, 10, this.width - 20, this.height - 20);
    }
    
    // Blackhole telegraph warnings
    this.hazards.forEach(hazard => {
      if (hazard.type === 'blackhole' && hazard.telegraph && hazard.telegraphTimer > 0) {
        const alpha = Math.min(1.0, hazard.telegraphTimer / 0.6);
        const pulseSize = 1 + Math.sin(Date.now() * 0.01) * 0.1;
        
        this.ctx.globalAlpha = alpha * 0.7;
        this.ctx.strokeStyle = '#ff0055';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.arc(hazard.position.x, hazard.position.y, hazard.radius * pulseSize, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Warning text
        this.ctx.fillStyle = '#ff0055';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('⚠ BLACKHOLE', hazard.position.x, hazard.position.y - hazard.radius - 20);
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(`${hazard.telegraphTimer.toFixed(1)}s`, hazard.position.x, hazard.position.y);
      }
    });
    
    // Debug panel (F12 to toggle)
    if (this.uiSystem.debugMode) {
      const debugX = this.width - 200;
      const debugY = 80;
      const lineHeight = 20;
      
      this.ctx.globalAlpha = 0.8;
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(debugX - 10, debugY - 10, 190, 200);
      
      this.ctx.globalAlpha = 1.0;
      this.ctx.fillStyle = '#00ff00';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'left';
      
      let lineY = debugY + 10;
      this.ctx.fillText('=== DEBUG ===', debugX, lineY);
      lineY += lineHeight;
      this.ctx.fillText(`FPS: ${this.uiSystem.fps}`, debugX, lineY);
      lineY += lineHeight;
      this.ctx.fillText(`Entities: ${this.asteroids.length + this.projectiles.length + this.powerUps.length}`, debugX, lineY);
      lineY += lineHeight;
      this.ctx.fillText(`Asteroids: ${this.asteroids.length}`, debugX, lineY);
      lineY += lineHeight;
      this.ctx.fillText(`Projectiles: ${this.projectiles.length}`, debugX, lineY);
      lineY += lineHeight;
      this.ctx.fillText(`Power-ups: ${this.powerUps.length}`, debugX, lineY);
      lineY += lineHeight;
      this.ctx.fillText(`Hazards: ${this.hazards.length}`, debugX, lineY);
      
      if (this.player) {
        lineY += lineHeight;
        this.ctx.fillText(`Player vX: ${this.player.velocity.x.toFixed(1)}`, debugX, lineY);
        lineY += lineHeight;
        this.ctx.fillText(`Target vX: ${this.laneMovement.targetVelocityX.toFixed(1)}`, debugX, lineY);
        lineY += lineHeight;
        this.ctx.fillText(`Input: ${this.laneMovement.inputX}`, debugX, lineY);
      }
    }
    
    this.ctx.restore();
  }

  /**
   * Check if position is on screen
   */
  isOnScreen(position, margin = 0) {
    return (
      position.x >= -margin &&
      position.x <= this.width + margin &&
      position.y >= -margin &&
      position.y <= this.height + margin
    );
  }

  /**
   * Increase combo counter
   */
  increaseCombo() {
    this.comboSystem.count++;
    this.comboSystem.timer = 0;
    
    // Increase multiplier (caps at maxMultiplier)
    this.comboSystem.multiplier = Math.min(
      1.0 + (this.comboSystem.count * 0.1),
      this.comboSystem.maxMultiplier
    );
  }

  /**
   * Reset combo
   */
  resetCombo() {
    if (this.comboSystem.count >= 10) {
      // Bonus for high combo
      this.score += Math.floor(this.comboSystem.count * 50);
    }
    this.comboSystem.count = 0;
    this.comboSystem.timer = 0;
    this.comboSystem.multiplier = 1.0;
  }

  /**
   * Add experience and handle level ups
   */
  addExperience(amount) {
    this.upgradeSystem.experience += amount;
    
    while (this.upgradeSystem.experience >= this.upgradeSystem.experienceToNext) {
      this.upgradeSystem.experience -= this.upgradeSystem.experienceToNext;
      this.upgradeSystem.level++;
      this.upgradeSystem.skillPoints++;
      this.upgradeSystem.experienceToNext = Math.floor(this.upgradeSystem.experienceToNext * 1.5);
      
      // Auto-upgrade for arcade gameplay
      this.autoUpgrade();
    }
  }

  /**
   * Auto-upgrade system for seamless arcade experience
   */
  autoUpgrade() {
    // Rotate through upgrades
    const upgrades = ['damage', 'fireRate', 'health', 'speed', 'shield'];
    const randomUpgrade = upgrades[Math.floor(Math.random() * upgrades.length)];
    this.upgradeSystem.upgrades[randomUpgrade]++;
    
    // Apply upgrade immediately
    if (randomUpgrade === 'health' && this.player) {
      this.player.maxHealth += 10;
      this.player.heal(10);
    } else if (randomUpgrade === 'speed' && this.player) {
      this.player.maxSpeed += 20;
    } else if (randomUpgrade === 'shield' && this.player) {
      this.player.shield.maxStrength += 20;
    } else if (randomUpgrade === 'fireRate' && this.player) {
      this.player.weapons.fireRate = Math.max(0.05, this.player.weapons.fireRate * 0.95);
    }
  }

  /**
   * Find nearest asteroid to position
   */
  findNearestAsteroid(position) {
    let nearest = null;
    let minDist = Infinity;
    
    for (const asteroid of this.asteroids) {
      const dist = Vector2D.distance(position, asteroid.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = asteroid;
      }
    }
    
    return nearest;
  }

  /**
   * Check for chain reaction explosions
   */
  checkChainReaction(position, radius) {
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const asteroid = this.asteroids[i];
      const dist = Vector2D.distance(position, asteroid.position);
      
      if (dist < radius) {
        const damaged = asteroid.takeDamage(20);
        
        if (damaged) {
          // Recursive chain reaction
          this.particles.createExplosion(
            asteroid.position.x,
            asteroid.position.y,
            20,
            '#ff9900',
            150
          );
          this.createFloatingText(asteroid.position.x, asteroid.position.y - 30, 'CHAIN!', '#ff9900', 24);
          
          const scoreMap = { small: 50, medium: 25, large: 15, huge: 5 };
          this.score += Math.floor(scoreMap[asteroid.size] * this.comboSystem.multiplier);
          this.kills++;
          
          const fragments = asteroid.split();
          this.asteroids.splice(i, 1);
          this.asteroids.push(...fragments);
          
          // Continue chain
          setTimeout(() => {
            this.checkChainReaction(asteroid.position, radius * 0.7);
          }, 100);
        }
      }
    }
  }

  /**
   * Update environmental hazard
   */
  updateHazard(hazard, deltaTime) {
    if (hazard.type === 'blackhole') {
      // Move blackhole position if it has velocity (lane-shooter mode)
      if (hazard.velocity) {
        hazard.position.x += hazard.velocity.x * deltaTime;
        hazard.position.y += hazard.velocity.y * deltaTime;
      }
      
      // Telegraph warning countdown
      if (hazard.telegraph && hazard.telegraphTimer > 0) {
        hazard.telegraphTimer -= deltaTime;
        if (hazard.telegraphTimer <= 0) {
          hazard.telegraph = false; // Now fully active
        }
      }
      
      // Only apply forces if telegraph phase is over
      const isActive = !hazard.telegraph || hazard.telegraphTimer <= 0;
      
      if (isActive) {
        // Apply gravitational pull to asteroids
        this.asteroids.forEach(asteroid => {
          const toHazard = Vector2D.subtract(hazard.position, asteroid.position);
          const dist = toHazard.magnitude();
          
          if (dist < hazard.radius * 3) {
            const force = toHazard.normalize().multiply(hazard.strength * 0.005); // Constant pull, adjusted multiplier
            asteroid.velocity.add(force.multiply(deltaTime));
          }
        });
        
        // Pull projectiles (makes gameplay interesting)
        this.projectiles.forEach(proj => {
          const toHazard = Vector2D.subtract(hazard.position, proj.position);
          const dist = toHazard.magnitude();
          
          if (dist < hazard.radius * 2) {
            const force = toHazard.normalize().multiply(hazard.strength * 0.5 / (dist + 1));
            proj.velocity.add(force.multiply(deltaTime));
          }
        });
        
        // Apply to player (horizontal-only in lane-shooter mode)
        // Removed player pull as per user request

      }
      
      // Render effect
      this.particles.createBlackHoleEffect(hazard.position.x, hazard.position.y, hazard.radius);
      
    } else if (hazard.type === 'nebula') {
      // Slow down entities in nebula
      if (this.player) {
        const dist = Vector2D.distance(hazard.position, this.player.position);
        if (dist < hazard.radius) {
          this.player.velocity.multiply(0.98);
        }
      }
      
    } else if (hazard.type === 'meteor_shower') {
      // Spawn rapid asteroids
      hazard.spawnTimer += deltaTime;
      if (hazard.spawnTimer >= hazard.spawnRate) {
        hazard.spawnTimer = 0;
        
        const x = hazard.position.x + (Math.random() - 0.5) * hazard.radius;
        const y = -50;
        const velocity = new Vector2D(
          (Math.random() - 0.5) * 100,
          200 + Math.random() * 200
        );
        
        const asteroid = new Asteroid(x, y, 'small', velocity);
        this.asteroids.push(asteroid);
      }
    }
  }

  /**
   * Start new game
   */
  start() {
    console.log('[Engine] Starting game engine...');
    this.state = 'playing';
    this.score = 0;
    this.wave = 1;
    this.kills = 0;
    this.time = 0;
    this.asteroids = [];
    this.projectiles = [];
    this.powerUps = [];
    this.hazards = [];
    this.particles.clear();
    this.config.asteroidSpawnRate = 2.0;
    this.config.maxAsteroids = 20;
    this.config.difficultyMultiplier = 1.0;
    
    // Set fixed Y position for lane-shooter mode
    if (this.config.mode === 'lane-shooter') {
      this.config.fixedPlayerY = this.height - 100;
    }
    
    // Reset combo system
    this.comboSystem = {
      count: 0,
      timer: 0,
      maxTime: 3.0,
      multiplier: 1.0,
      maxMultiplier: 8.0
    };
    
    // Reset boss system
    this.bossSystem = {
      active: false,
      boss: null,
      phase: 1,
      maxPhases: 3
    };
    
    // Reset weapon system
    this.weaponSystem.currentWeapon = 'default';
    this.weaponSystem.activeWeaponTimer = 0;
    
    // Reset upgrade system (keep between games for progression)
    this.upgradeSystem.level = 1;
    this.upgradeSystem.experience = 0;
    this.upgradeSystem.experienceToNext = 100;
    
    this.setupPlayer();
    
    // Lock player position for lane-shooter mode
    if (this.config.mode === 'lane-shooter' && this.player) {
      this.player.position.y = this.config.fixedPlayerY;
      this.player.angle = 0;
      this.player.angularVelocity = 0;
    }
    
    console.log('[Engine] Game engine started. Mode:', this.config.mode, 'Player health:', this.player?.health, 'Level:', this.upgradeSystem.level);
  }

  /**
   * Pause game
   */
  pause() {
    if (this.state === 'playing') {
      this.state = 'paused';
    }
  }

  /**
   * Resume game
   */
  resume() {
    if (this.state === 'paused') {
      this.state = 'playing';
    }
  }

  /**
   * Game over
   */
  gameOver() {
    console.log('[Engine] gameOver() called. Current state:', this.state, 'Player health:', this.player?.health);
    this.state = 'gameover';
    
    // Final explosion
    if (this.player) {
      this.particles.createExplosion(
        this.player.position.x,
        this.player.position.y,
        50,
        '#ff0055',
        300
      );
      this.particles.createDebris(
        this.player.position.x,
        this.player.position.y,
        30,
        this.player.color
      );
    }
    
    this.screenShake(20, 0.5);
  }

  /**
   * Resize canvas
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.starField.resize(width, height);
  }

  /**
   * Get game state
   */
  getState() {
    return {
      state: this.state,
      score: this.score,
      wave: this.wave,
      kills: this.kills,
      time: this.time,
      health: this.player ? this.player.health : 0,
      maxHealth: this.player ? this.player.maxHealth : 100,
      weapon: this.weaponSystem.currentWeapon,
      weaponTimer: this.weaponSystem.activeWeaponTimer,
      level: this.upgradeSystem.level,
      experience: this.upgradeSystem.experience,
      experienceToNext: this.upgradeSystem.experienceToNext,
      combo: this.comboSystem.count,
      comboMultiplier: this.comboSystem.multiplier
    };
  }
}
