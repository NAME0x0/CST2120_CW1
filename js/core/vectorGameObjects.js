/**
 * Vector Game Objects - SVG-based game elements
 * Spaceship, asteroids, projectiles, power-ups all in SVG
 */

export class VectorGameObjects {
  // Create animated spaceship SVG
  static createSpaceship(color = '#00f0ff') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '60');
    svg.setAttribute('height', '60');
    svg.setAttribute('viewBox', '0 0 60 60');
    
    svg.innerHTML = `
      <defs>
        <linearGradient id="shipGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.5" />
        </linearGradient>
        <filter id="shipGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Main body -->
      <polygon points="30,5 45,40 30,35 15,40" fill="url(#shipGradient)" filter="url(#shipGlow)"/>
      
      <!-- Cockpit -->
      <ellipse cx="30" cy="20" rx="6" ry="10" fill="rgba(0, 240, 255, 0.6)"/>
      
      <!-- Wings -->
      <polygon points="15,25 10,35 15,30" fill="${color}" opacity="0.8"/>
      <polygon points="45,25 50,35 45,30" fill="${color}" opacity="0.8"/>
      
      <!-- Engine glow -->
      <ellipse cx="30" cy="40" rx="8" ry="4" fill="${color}" opacity="0.5">
        <animate attributeName="ry" values="4;6;4" dur="0.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0.8;0.5" dur="0.5s" repeatCount="indefinite"/>
      </ellipse>
      
      <!-- Thrust particles -->
      <circle cx="30" cy="45" r="2" fill="${color}" opacity="0.7">
        <animate attributeName="cy" values="45;55" dur="0.3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.7;0" dur="0.3s" repeatCount="indefinite"/>
      </circle>
    `;
    
    return svg;
  }

  // Create asteroid SVG
  static createAsteroid(size = 40) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    
    const points = [];
    const segments = 8;
    const center = size / 2;
    const radius = size * 0.4;
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const variation = 0.8 + Math.random() * 0.4;
      const r = radius * variation;
      const x = center + Math.cos(angle) * r;
      const y = center + Math.sin(angle) * r;
      points.push(`${x},${y}`);
    }
    
    svg.innerHTML = `
      <defs>
        <radialGradient id="asteroidGrad${size}">
          <stop offset="0%" style="stop-color:#999;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#555;stop-opacity:1" />
        </radialGradient>
      </defs>
      <polygon points="${points.join(' ')}" fill="url(#asteroidGrad${size})" stroke="#333" stroke-width="1">
        <animateTransform attributeName="transform" type="rotate" 
          from="0 ${center} ${center}" to="360 ${center} ${center}" 
          dur="${3 + Math.random() * 2}s" repeatCount="indefinite"/>
      </polygon>
      <circle cx="${center}" cy="${center * 0.6}" r="${size * 0.1}" fill="rgba(0,0,0,0.3)"/>
      <circle cx="${center * 1.2}" cy="${center * 1.3}" r="${size * 0.08}" fill="rgba(0,0,0,0.2)"/>
    `;
    
    return svg;
  }

  // Create projectile SVG
  static createProjectile(color = '#00f0ff') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '12');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 12 20');
    
    svg.innerHTML = `
      <defs>
        <linearGradient id="projectileGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.3" />
        </linearGradient>
      </defs>
      <ellipse cx="6" cy="10" rx="4" ry="8" fill="url(#projectileGrad)">
        <animate attributeName="ry" values="8;10;8" dur="0.2s" repeatCount="indefinite"/>
      </ellipse>
      <circle cx="6" cy="6" r="3" fill="${color}" opacity="0.8"/>
    `;
    
    return svg;
  }

  // Create power-up SVG
  static createPowerUp(type = 'health') {
    const colors = {
      health: '#00ff88',
      shield: '#00f0ff',
      weapon: '#ff006e',
      speed: '#8b5cf6'
    };
    
    const color = colors[type] || colors.health;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '30');
    svg.setAttribute('height', '30');
    svg.setAttribute('viewBox', '0 0 30 30');
    
    let icon = '';
    switch(type) {
      case 'health':
        icon = '<path d="M15 25 L8 18 L8 12 L12 8 L15 11 L18 8 L22 12 L22 18 Z" fill="none" stroke="currentColor" stroke-width="2"/>';
        break;
      case 'shield':
        icon = '<path d="M15 5 L22 8 L22 15 Q22 22 15 26 Q8 22 8 15 L8 8 Z" fill="none" stroke="currentColor" stroke-width="2"/>';
        break;
      case 'weapon':
        icon = '<path d="M10 20 L15 5 L20 20 M12 15 L18 15" stroke="currentColor" stroke-width="2" fill="none"/>';
        break;
      case 'speed':
        icon = '<path d="M5 15 L15 5 L15 12 L25 12 L15 25 L15 18 L5 18 Z" fill="currentColor"/>';
        break;
    }
    
    svg.innerHTML = `
      <defs>
        <filter id="powerupGlow${type}">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="15" cy="15" r="12" fill="none" stroke="${color}" stroke-width="2" 
        filter="url(#powerupGlow${type})" opacity="0.6">
        <animate attributeName="r" values="12;14;12" dur="1s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0.9;0.6" dur="1s" repeatCount="indefinite"/>
      </circle>
      <g style="color:${color}">${icon}</g>
    `;
    
    return svg;
  }

  // Create explosion particles
  static createExplosion(x, y, color = '#ff006e') {
    const container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 20 + Math.random() * 20;
      const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      
      particle.setAttribute('cx', x);
      particle.setAttribute('cy', y);
      particle.setAttribute('r', 2 + Math.random() * 3);
      particle.setAttribute('fill', color);
      particle.setAttribute('opacity', '1');
      
      const endX = x + Math.cos(angle) * distance;
      const endY = y + Math.sin(angle) * distance;
      
      const animateX = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animateX.setAttribute('attributeName', 'cx');
      animateX.setAttribute('from', x);
      animateX.setAttribute('to', endX);
      animateX.setAttribute('dur', '0.5s');
      animateX.setAttribute('fill', 'freeze');
      
      const animateY = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animateY.setAttribute('attributeName', 'cy');
      animateY.setAttribute('from', y);
      animateY.setAttribute('to', endY);
      animateY.setAttribute('dur', '0.5s');
      animateY.setAttribute('fill', 'freeze');
      
      const animateOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animateOpacity.setAttribute('attributeName', 'opacity');
      animateOpacity.setAttribute('from', '1');
      animateOpacity.setAttribute('to', '0');
      animateOpacity.setAttribute('dur', '0.5s');
      animateOpacity.setAttribute('fill', 'freeze');
      
      particle.appendChild(animateX);
      particle.appendChild(animateY);
      particle.appendChild(animateOpacity);
      container.appendChild(particle);
    }
    
    return container;
  }

  // Create loading spinner
  static createLoadingSpinner(size = 40, color = '#00f0ff') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('class', 'loading-spinner');
    
    const center = size / 2;
    const radius = size * 0.35;
    
    svg.innerHTML = `
      <circle cx="${center}" cy="${center}" r="${radius}" 
        fill="none" stroke="${color}" stroke-width="3" 
        stroke-dasharray="${Math.PI * radius}" 
        stroke-dashoffset="${Math.PI * radius * 0.75}" 
        stroke-linecap="round">
        <animateTransform attributeName="transform" type="rotate" 
          from="0 ${center} ${center}" to="360 ${center} ${center}" 
          dur="1s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${center}" cy="${center}" r="${radius * 0.6}" 
        fill="none" stroke="${color}" stroke-width="2" opacity="0.5"
        stroke-dasharray="${Math.PI * radius * 0.3}" 
        stroke-dashoffset="${Math.PI * radius * 0.5}">
        <animateTransform attributeName="transform" type="rotate" 
          from="360 ${center} ${center}" to="0 ${center} ${center}" 
          dur="1.5s" repeatCount="indefinite"/>
      </circle>
    `;
    
    return svg;
  }
}
