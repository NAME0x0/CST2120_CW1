import { StorageManager } from './core/storage.js';
import { GameEngine } from './engine/GameEngine.js';

// Debug logging flag - set to false for production
const DEBUG = false;

if (DEBUG) console.log('[game.js] Module loaded');

class SpaceLanesGame {
  constructor() {
    if (DEBUG) console.log('[SpaceLanesGame] Constructor called');
    this.canvas = document.getElementById('gameCanvas');
    this.overlay = document.getElementById('gameOverlay');
    this.overlayTitle = document.getElementById('overlayTitle');
    this.overlayMessage = document.getElementById('overlayMessage');
    this.scoreValue = document.getElementById('scoreValue');
    this.timeValue = document.getElementById('timeValue');
    this.killsValue = document.getElementById('killsValue');
    this.levelValue = document.getElementById('levelValue');
    this.xpBar = document.getElementById('xpBar');
    this.comboValue = document.getElementById('comboValue');
    this.comboMultiplierValue = document.getElementById('comboMultiplierValue');
    this.multiplierValue = document.getElementById('multiplierValue');
    this.integrityValue = document.getElementById('integrityValue');
    this.weaponValue = document.getElementById('weaponValue');
    this.pilotName = document.getElementById('pilotName');
    this.personalBest = document.getElementById('personalBest');
    this.startButton = document.getElementById('startGameButton');
    this.resumeButton = document.getElementById('resumeGameButton');
    this.pauseButton = document.getElementById('pauseGameButton');
    this.returnHomeButton = document.getElementById('returnHomeButton');

    if (!this.canvas) {
      if (DEBUG) console.warn('[SpaceLanesGame] Game canvas not found - aborting initialization');
      return;
    }

    if (DEBUG) console.log('[SpaceLanesGame] Canvas found:', this.canvas.width, 'x', this.canvas.height);
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.storage = window.app?.storage ?? new StorageManager();
    this.user = window.app?.user ?? this.storage.getCurrentUser();
    if (DEBUG) console.log('[SpaceLanesGame] User:', this.user ? this.user.username : 'None');

    // Initialize game engine
    if (DEBUG) console.log('[SpaceLanesGame] Creating GameEngine instance...');
    this.engine = new GameEngine(this.canvas, {
      showFPS: true,
      asteroidSpawnRate: 2.0,
      powerUpChance: 0.15
    });
    if (DEBUG) console.log('[SpaceLanesGame] GameEngine created');

    this.settings = {
      laneCount: 3,
      lanePadding: 120,
      laneSpawnMultipliers: [0.8, 1.0, 1.3], // Lane 1: safer, Lane 2: neutral, Lane 3: risky
      laneScoreMultipliers: [0.8, 1.0, 1.5]  // Lane 3 gives bonus score
    };

    // Remove local state - use engine state instead
    this.lastFrame = 0;

    // Calculate lane positions for visual guides
    const laneSpacing = (this.width - this.settings.lanePadding * 2) / (this.settings.laneCount - 1);
    this.lanes = Array.from({ length: this.settings.laneCount }, (_, i) => this.settings.lanePadding + laneSpacing * i);

    if (DEBUG) console.log('[SpaceLanesGame] Initializing UI, profile, and events');
    this.initUI();
    this.updateProfile();
    this.bindEvents();
    this.renderFrame(0);
    if (DEBUG) console.log('[SpaceLanesGame] Game ready in idle state');
  }

  initUI() {
    if (DEBUG) console.log('[SpaceLanesGame] initUI called');
    if (this.overlay) {
      this.overlay.hidden = false;
      this.overlayTitle.textContent = 'Standby';
      this.overlayMessage.textContent = 'Press "Start New Run" to enter the lanes.';
      this.overlay.classList.add('ready');
      if (DEBUG) console.log('[SpaceLanesGame] Overlay set to standby mode');
    } else {
      if (DEBUG) console.warn('[SpaceLanesGame] Overlay element not found');
    }
  }

  bindEvents() {
    if (DEBUG) console.log('[SpaceLanesGame] Binding button and keyboard events');
    this.startButton?.addEventListener('click', () => this.startRun());
    this.resumeButton?.addEventListener('click', () => this.resume());
    this.pauseButton?.addEventListener('click', () => this.pause());
    this.returnHomeButton?.addEventListener('click', () => window.location.href = 'index.html');

    // Pause with spacebar (engine handles other controls)
    window.addEventListener('keydown', (event) => {
      if (this.state !== 'running') return;
      if (event.key === ' ') {
        event.preventDefault();
        this.pause();
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }
  
  handleResize() {
    // Update canvas dimensions
    const container = this.canvas.parentElement;
    if (container) {
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      
      // Update engine dimensions
      this.engine.width = this.width;
      this.engine.height = this.height;
      
      // Recalculate fixedPlayerY for lane-shooter mode
      if (this.engine.config.mode === 'lane-shooter') {
        this.engine.config.fixedPlayerY = this.height - 100;
        if (this.engine.player) {
          this.engine.player.position.y = this.engine.config.fixedPlayerY;
          // Clamp player X to new bounds
          const margin = 50;
          this.engine.player.position.x = Math.max(margin, Math.min(this.width - margin, this.engine.player.position.x));
        }
      }
      
      // Recalculate lane positions
      const laneSpacing = (this.width - this.settings.lanePadding * 2) / (this.settings.laneCount - 1);
      this.lanes = Array.from({ length: this.settings.laneCount }, (_, i) => this.settings.lanePadding + laneSpacing * i);
      
      // Update starfield
      if (this.engine.starField) {
        this.engine.starField.width = this.width;
        this.engine.starField.height = this.height;
      }
      
      if (DEBUG) console.log('[Game] Resized to', this.width, 'x', this.height);
    }
  }

  updateProfile() {
    if (!this.user) {
      this.pilotName.textContent = 'Guest Pilot';
      this.pilotName.style.color = 'var(--color-text-secondary)';
      this.personalBest.textContent = '—';
      
      // Add login prompt below profile if not already present
      const profileSection = document.querySelector('.game-profile');
      if (profileSection && !document.getElementById('guestLoginPrompt')) {
        const prompt = document.createElement('p');
        prompt.id = 'guestLoginPrompt';
        prompt.style.cssText = `
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        `;
        prompt.innerHTML = `
          <a href="login.html" style="color: var(--color-cyan-bright);">Login</a> or 
          <a href="register.html" style="color: var(--color-cyan-bright);">Register</a> 
          to save your scores
        `;
        profileSection.appendChild(prompt);
      }
      return;
    }

    this.pilotName.textContent = this.user.username;
    this.pilotName.style.color = 'var(--color-cyan-bright)';
    const userScores = this.storage.getUserScores(this.user.username);
    const best = userScores.length ? Math.max(...userScores.map(s => s.score)) : 0;
    this.personalBest.textContent = best.toLocaleString();
    
    // Remove guest prompt if user logs in
    const prompt = document.getElementById('guestLoginPrompt');
    if (prompt) prompt.remove();
  }

  startRun() {
    if (DEBUG) console.log('[Game] Starting new run...');
    
    // Reset and start engine
    this.engine.start();
    const engineState = this.engine.getState();
    if (DEBUG) console.log('[Game] Engine started:', engineState);
    
    this.lastFrame = performance.now();
    
    // Hide overlay and reset button visibility
    if (this.overlay) {
      this.overlay.hidden = true;
      if (this.resumeButton) this.resumeButton.style.display = 'none';
      if (this.startButton) this.startButton.style.display = 'inline-block';
    }
    
    if (DEBUG) console.log('[Game] Game started, engine state:', engineState.state);
  }



  pause() {
    const engineState = this.engine.getState();
    if (engineState.state !== 'playing') return;
    
    this.engine.pause();
    if (this.overlay) {
      this.overlay.hidden = false;
      this.overlayTitle.textContent = 'Run Paused';
      this.overlayMessage.textContent = 'Resume when your trajectory is locked.';
      // Show resume button, hide start button
      if (this.resumeButton) this.resumeButton.style.display = 'inline-block';
      if (this.startButton) this.startButton.style.display = 'none';
    }
  }

  resume() {
    const engineState = this.engine.getState();
    if (engineState.state !== 'paused') return;
    
    this.engine.resume();
    this.lastFrame = performance.now();
    if (this.overlay) {
      this.overlay.hidden = true;
      // Reset button visibility for next time
      if (this.resumeButton) this.resumeButton.style.display = 'none';
      if (this.startButton) this.startButton.style.display = 'inline-block';
    }
  }

  renderFrame(timestamp) {
    requestAnimationFrame((t) => this.renderFrame(t));
    
    const engineState = this.engine.getState();
    
    // Always render the engine visuals
    if (engineState.state !== 'playing') {
      this.engine.render();
      this.drawLanes(); // Draw lanes even when not playing
      return;
    }

    const delta = (timestamp - this.lastFrame) / 1000;
    this.lastFrame = timestamp;
    this.update(delta);
    this.drawScene(delta);
  }

  update(delta) {
    // Update game engine
    this.engine.update(delta);
    
    // Get engine state and update HUD
    const engineState = this.engine.getState();
    if (DEBUG) console.log('[Game] Update - Health:', engineState.health, 'State:', engineState.state, 'Time:', engineState.time.toFixed(2));
    
    // Apply lane-based score multiplier
    const currentLane = this.getCurrentLane();
    const laneMultiplier = this.settings.laneScoreMultipliers[currentLane];
    
    this.updateHud(engineState, laneMultiplier);
    
    // Check for game over
    if (engineState.state === 'gameover') {
      if (DEBUG) console.log('[Game] Game over detected! Final health:', engineState.health);
      this.handleGameOver('Ship destroyed. Mission failed.', engineState);
    }
  }



  updateHud(engineState, laneMultiplier = 1.0) {
    // Format score with thousands separators
    const displayScore = Math.max(0, Math.floor(engineState.score * laneMultiplier));
    this.scoreValue.textContent = displayScore.toLocaleString();
    
    // Format time as MM:SS or SS.s
    const totalSeconds = Math.max(0, engineState.time);
    if (totalSeconds >= 60) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = Math.floor(totalSeconds % 60);
      this.timeValue.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      this.timeValue.textContent = `${totalSeconds.toFixed(1)}s`;
    }

    // Update kills, level, and XP bar
    this.killsValue.textContent = engineState.kills;
    this.levelValue.textContent = engineState.level;
    this.xpBar.value = engineState.experience;
    this.xpBar.max = engineState.experienceToNext;
    
    // Display wave number as integer
    this.comboValue.textContent = `${engineState.combo}x (${engineState.comboMultiplier.toFixed(1)}x)`;

    if (this.comboMultiplierValue) {
        this.comboMultiplierValue.textContent = `x${engineState.comboMultiplier.toFixed(1)}`;
    }

    if (this.multiplierValue) {
        this.multiplierValue.textContent = `x${laneMultiplier.toFixed(1)}`;
    }
    
    // Display integrity percentage (health)
    const integrityDisplay = Math.max(0, Math.min(100, Math.floor((engineState.health / engineState.maxHealth) * 100)));
    this.integrityValue.textContent = `${integrityDisplay}%`;
    
    // Update weapon HUD
    if (this.weaponValue) {
        const weaponName = engineState.weapon.charAt(0).toUpperCase() + engineState.weapon.slice(1);
        const weaponTime = engineState.weaponTimer > 0 ? ` (${engineState.weaponTimer.toFixed(1)}s)` : '';
        this.weaponValue.textContent = `${weaponName}${weaponTime}`;
    }

    // Add color coding for low health
    if (integrityDisplay <= 25) {
      this.integrityValue.style.color = '#ff0055';
    } else if (integrityDisplay <= 50) {
      this.integrityValue.style.color = '#ffaa00';
    } else {
      this.integrityValue.style.color = '#00ff88';
    }
  }

  // Helper to determine which lane the player is in
  getCurrentLane() {
    if (!this.engine.player) return 1; // Default to middle lane
    
    const playerX = this.engine.player.position.x;
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

  // Removed dead functions: shiftLane, createTeleportEffect, pulse, moveBackward
  // Movement is now handled entirely by the engine

  drawScene() {
    // Render game engine (handles all visuals)
    this.engine.render();
    
    // Draw lane markers on top for visibility
    this.drawLanes();
  }

  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, 'rgba(10, 14, 26, 0.95)');
    gradient.addColorStop(1, 'rgba(10, 14, 26, 0.8)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawLanes() {
    this.ctx.save();
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 16]);
    
    // Draw three lane dividers
    this.lanes.forEach((x, index) => {
      const gradient = this.ctx.createLinearGradient(x, 0, x, this.height);
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.2)');
      gradient.addColorStop(0.5, 'rgba(255, 0, 110, 0.3)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0.2)');
      this.ctx.strokeStyle = gradient;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();

      // Lane label at top
      this.ctx.setLineDash([]);
      this.ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      this.ctx.font = 'bold 14px "Segoe UI"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`LANE ${index + 1}`, x, 30);
      this.ctx.setLineDash([10, 16]);
    });
    
    this.ctx.restore();
  }

  // Removed dead draw functions: drawPlayer, drawObstacles, drawPulse
  // Engine now handles all entity rendering

  flashScreen() {
    this.canvas.classList.add('flash-damage');
    setTimeout(() => this.canvas.classList.remove('flash-damage'), 150);
  }

  handleGameOver(reason, engineState) {
    const duration = Math.max(1, Math.round(engineState.time));
    const finalScore = Math.max(0, Math.floor(engineState.score));

    if (this.overlay) {
      this.overlay.hidden = false;
      this.overlayTitle.textContent = 'Run Complete';
      
      if (this.user) {
        this.overlayMessage.textContent = reason ?? 'Trajectory logged. Review your stats before re-entry.';
        this.storage.saveScore(this.user.username, { score: finalScore, duration });
        this.updateProfile();
      } else {
        this.overlayMessage.innerHTML = `
          <p style="margin-bottom: 1rem;">${reason ?? 'Run complete!'}</p>
          <p style="color: var(--color-cyan-bright); font-size: 0.95rem;">
            <strong>Score: ${finalScore.toLocaleString()}</strong> • Time: ${duration}s
          </p>
          <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--color-text-secondary);">
            <a href="login.html" style="color: var(--color-cyan-bright); text-decoration: underline;">Login</a> or 
            <a href="register.html" style="color: var(--color-cyan-bright); text-decoration: underline;">Register</a> 
            to save your scores to the leaderboard!
          </p>
        `;
      }
    }

    this.updateHud();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new SpaceLanesGame();
});
