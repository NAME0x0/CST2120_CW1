/**
 * Vector Asteroid - 3D-looking asteroid using pure SVG
 * No external images, all procedurally generated
 */

export class VectorAsteroid {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn(`Container ${containerId} not found`);
      return;
    }

    this.options = {
      size: options.size || 400,
      rotationSpeed: options.rotationSpeed || 0.2,
      segments: options.segments || 8,
      irregularity: options.irregularity || 0.3,
      color: options.color || '#8b8b8b',
      ...options
    };

    this.rotation = 0;
    this.init();
  }

  init() {
    // Create SVG element
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', this.options.size);
    this.svg.setAttribute('height', this.options.size);
    this.svg.setAttribute('viewBox', `0 0 ${this.options.size} ${this.options.size}`);
    this.svg.style.filter = 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.5))';

    // Create defs for gradients and filters
    this.createDefs();

    // Create asteroid layers
    this.createAsteroidLayers();

    // Add to container
    this.container.appendChild(this.svg);

    // Start animation
    this.animate();
  }

  createDefs() {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    // Radial gradient for 3D effect
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    gradient.setAttribute('id', 'asteroidGradient');
    gradient.innerHTML = `
      <stop offset="0%" style="stop-color:#b8b8b8;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#8b8b8b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4a4a4a;stop-opacity:1" />
    `;

    // Glow filter
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'asteroidGlow');
    filter.innerHTML = `
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    `;

    defs.appendChild(gradient);
    defs.appendChild(filter);
    this.svg.appendChild(defs);
  }

  createAsteroidLayers() {
    const center = this.options.size / 2;
    const baseRadius = this.options.size * 0.35;

    // Create main asteroid body
    this.mainBody = this.createIrregularShape(center, center, baseRadius, this.options.segments);
    this.mainBody.setAttribute('fill', 'url(#asteroidGradient)');
    this.mainBody.setAttribute('filter', 'url(#asteroidGlow)');
    this.svg.appendChild(this.mainBody);

    // Create craters
    this.craters = [];
    for (let i = 0; i < 5; i++) {
      const crater = this.createCrater(center, baseRadius);
      this.craters.push(crater);
      this.svg.appendChild(crater);
    }

    // Create detail rocks
    this.rocks = [];
    for (let i = 0; i < 8; i++) {
      const rock = this.createDetailRock(center, baseRadius);
      this.rocks.push(rock);
      this.svg.appendChild(rock);
    }

    // Group all elements
    this.asteroidGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.asteroidGroup.setAttribute('transform', `rotate(0 ${center} ${center})`);
    
    // Move all elements to group
    this.asteroidGroup.appendChild(this.mainBody);
    this.craters.forEach(c => this.asteroidGroup.appendChild(c));
    this.rocks.forEach(r => this.asteroidGroup.appendChild(r));
    
    this.svg.appendChild(this.asteroidGroup);
  }

  createIrregularShape(cx, cy, radius, segments) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let d = 'M ';

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const variation = 1 + (Math.random() - 0.5) * this.options.irregularity;
      const r = radius * variation;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      if (i === 0) {
        d += `${x},${y} `;
      } else {
        d += `L ${x},${y} `;
      }
    }

    d += 'Z';
    path.setAttribute('d', d);
    return path;
  }

  createCrater(center, baseRadius) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * baseRadius * 0.6;
    const cx = center + Math.cos(angle) * distance;
    const cy = center + Math.sin(angle) * distance;
    const r = 10 + Math.random() * 15;

    const crater = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    crater.setAttribute('cx', cx);
    crater.setAttribute('cy', cy);
    crater.setAttribute('rx', r);
    crater.setAttribute('ry', r * 0.8);
    crater.setAttribute('fill', 'rgba(0, 0, 0, 0.3)');
    crater.setAttribute('transform', `rotate(${Math.random() * 360} ${cx} ${cy})`);

    return crater;
  }

  createDetailRock(center, baseRadius) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * baseRadius * 0.7;
    const x = center + Math.cos(angle) * distance;
    const y = center + Math.sin(angle) * distance;
    const size = 5 + Math.random() * 10;

    const rock = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const points = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const r = size * (0.8 + Math.random() * 0.4);
      points.push(`${x + Math.cos(a) * r},${y + Math.sin(a) * r}`);
    }
    rock.setAttribute('points', points.join(' '));
    rock.setAttribute('fill', 'rgba(100, 100, 100, 0.5)');

    return rock;
  }

  animate() {
    const center = this.options.size / 2;
    this.rotation += this.options.rotationSpeed;

    if (this.asteroidGroup) {
      this.asteroidGroup.setAttribute(
        'transform',
        `rotate(${this.rotation} ${center} ${center})`
      );
    }

    requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.container && this.svg) {
      this.container.removeChild(this.svg);
    }
  }
}
