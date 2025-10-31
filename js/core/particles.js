/**
 * Space Lanes - Particle System
 * Creates an animated starfield background
 */

console.log('[particles.js] Module loaded');

export class ParticleSystem {
  constructor(canvasId) {
    console.log('[ParticleSystem] Constructor called with canvasId:', canvasId);
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.warn('[ParticleSystem] Canvas not found:', canvasId);
      return;
    }
    console.log('[ParticleSystem] Canvas found');
    
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.particleCount = 200;
    this.mouse = { x: 0, y: 0 };
    
    this.init();
    this.bindEvents();
    this.animate();
    console.log('[ParticleSystem] Initialized with', this.particleCount, 'particles');
  }
  
  init() {
    console.log('[ParticleSystem] Resizing and creating particles');
    this.resize();
    this.createParticles();
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }
  
  createParticles() {
    this.particles = [];
    
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }
  
  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.createParticles();
    });
    
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
  }
  
  updateParticles() {
    for (let particle of this.particles) {
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      // Wrap around edges
      if (particle.x < 0) particle.x = this.width;
      if (particle.x > this.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.height;
      if (particle.y > this.height) particle.y = 0;
      
      // Twinkle effect
      particle.twinklePhase += particle.twinkleSpeed;
      particle.opacity = 0.3 + Math.abs(Math.sin(particle.twinklePhase)) * 0.5;
      
      // Mouse interaction
      const dx = this.mouse.x - particle.x;
      const dy = this.mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100) {
        const force = (100 - distance) / 100;
        particle.x -= (dx / distance) * force * 2;
        particle.y -= (dy / distance) * force * 2;
      }
    }
  }
  
  drawParticles() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw particles
    for (let particle of this.particles) {
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(0, 240, 255, ${particle.opacity})`;
      this.ctx.fill();
      
      // Add glow effect for larger particles
      if (particle.size > 1.5) {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
    }
    
    // Draw connections between nearby particles
    this.drawConnections();
  }
  
  drawConnections() {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 120) {
          const opacity = (1 - distance / 120) * 0.15;
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }
  }
  
  animate() {
    this.updateParticles();
    this.drawParticles();
    requestAnimationFrame(() => this.animate());
  }
}
