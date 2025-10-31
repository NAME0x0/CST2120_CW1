/**
 * 3D Wireframe Asteroid Generator
 * Generates random 3D asteroids using only lines and points
 * No SVG - pure canvas rendering with 3D projection
 */

console.log('[wireframeAsteroid.js] Module loaded');

export class WireframeAsteroid {
  constructor(containerId, options = {}) {
    console.log('[WireframeAsteroid] Constructor called with containerId:', containerId, 'options:', options);
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn('[WireframeAsteroid] Container not found:', containerId);
      return;
    }
    console.log('[WireframeAsteroid] Container found');

    this.options = {
      size: options.size || 200,
      segments: options.segments || 24, // Increased for smoother appearance
      irregularity: options.irregularity || 0.5, // More variation
      rotationSpeed: options.rotationSpeed || 0.3,
      edgeColor: options.edgeColor || '#6b6b6b', // Gray stone edges
      pointColor: options.pointColor || '#8b7d6b', // Brown rock points
      glowColor: options.glowColor || 'rgba(255, 230, 200, 0.3)', // Warm spotlight
      // Rock color palette for filled faces
      rockColors: [
        '#4a4a4a', // Dark gray
        '#5a5a5a', // Medium gray
        '#6b6b6b', // Light gray
        '#7a6f5d', // Brown-gray
        '#8b7d6b', // Light brown
        '#5c5447', // Dark brown
      ],
      ...options
    };
    
    // Random seed for this instance to ensure unique asteroids each time
    this.seed = Math.random() * 10000;

    // Generate random 3D vertices, edges, and faces
    this.vertices = this.generateVertices();
    this.edges = this.generateEdges();
    this.faces = this.generateFaces();
    
    // Rotation angles (randomized for unique starting position)
    this.rotX = Math.random() * Math.PI * 2;
    this.rotY = Math.random() * Math.PI * 2;
    this.rotZ = Math.random() * Math.PI * 2;
    
    this.rotSpeedX = (Math.random() - 0.5) * this.options.rotationSpeed;
    this.rotSpeedY = (Math.random() - 0.5) * this.options.rotationSpeed;
    this.rotSpeedZ = (Math.random() - 0.5) * this.options.rotationSpeed;
    
    // Interactive state
    this.mouseX = 0;
    this.mouseY = 0;
    this.isHovered = false;
    this.scrollInfluence = 0;

    this.init();
  }

  init() {
    // Create container box
    const box = document.createElement('div');
    box.className = 'asteroid-box';
    box.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, rgba(255, 240, 220, 0.15) 0%, rgba(20, 24, 41, 0.9) 70%);
      border: 2px solid rgba(100, 100, 100, 0.3);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 0 30px rgba(255, 230, 200, 0.15), inset 0 0 40px rgba(255, 240, 220, 0.1);
      overflow: hidden;
      cursor: grab;
    `;
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.options.size;
    this.canvas.height = this.options.size;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.ctx = this.canvas.getContext('2d');
    
    box.appendChild(this.canvas);
    this.container.appendChild(box);
    
    // Add interactivity
    this.setupInteractivity(box);
    
    // Start animation
    this.animate();
  }
  
  setupInteractivity(box) {
    // Mouse move
    box.addEventListener('mousemove', (e) => {
      const rect = box.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left - rect.width / 2) / rect.width;
      this.mouseY = (e.clientY - rect.top - rect.height / 2) / rect.height;
      this.isHovered = true;
      box.style.cursor = 'grabbing';
    });
    
    box.addEventListener('mouseleave', () => {
      this.isHovered = false;
      box.style.cursor = 'grab';
    });
    
    // Touch support
    box.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = box.getBoundingClientRect();
      const touch = e.touches[0];
      this.mouseX = (touch.clientX - rect.left - rect.width / 2) / rect.width;
      this.mouseY = (touch.clientY - rect.top - rect.height / 2) / rect.height;
      this.isHovered = true;
    });
    
    box.addEventListener('touchend', () => {
      this.isHovered = false;
    });
    
    // Scroll influence
    window.addEventListener('scroll', () => {
      this.scrollInfluence = (window.scrollY / 1000) % 1;
    });
  }

  generateVertices() {
    const vertices = [];
    const segments = this.options.segments;
    const baseRadius = this.options.size * 0.25;
    
    // Generate vertices in spherical coordinates with noise
    for (let lat = 0; lat <= segments; lat++) {
      const theta = (lat / segments) * Math.PI;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      
      for (let lon = 0; lon < segments; lon++) {
        const phi = (lon / segments) * 2 * Math.PI;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        
        // Multi-layered noise for realistic rocky surface
        const noise1 = Math.sin(lat * 2.3 + this.seed) * Math.cos(lon * 1.7 + this.seed);
        const noise2 = Math.sin(lat * 4.1 + this.seed * 2) * Math.cos(lon * 3.3 + this.seed * 2);
        const noise3 = (Math.random() - 0.5) * 0.3; // Small random bumps
        
        // Combine noise layers for natural variation
        const noiseValue = (noise1 * 0.4 + noise2 * 0.3 + noise3 * 0.3);
        const variation = 1 + noiseValue * this.options.irregularity;
        
        // Add some crater-like depressions
        const craterNoise = Math.max(0, Math.sin(lat * 5.7 + lon * 4.3 + this.seed * 3) - 0.7);
        const craterDepth = craterNoise * 0.15;
        
        const radius = baseRadius * variation * (1 - craterDepth);
        
        const x = radius * sinTheta * cosPhi;
        const y = radius * sinTheta * sinPhi;
        const z = radius * cosTheta;
        
        vertices.push({ x, y, z, brightness: variation }); // Store brightness for shading
      }
    }
    
    return vertices;
  }

  generateEdges() {
    const edges = [];
    const segments = this.options.segments;
    
    // Connect vertices to form edges (for wireframe outline)
    for (let lat = 0; lat < segments; lat++) {
      for (let lon = 0; lon < segments; lon++) {
        const current = lat * segments + lon;
        const next = lat * segments + ((lon + 1) % segments);
        const below = (lat + 1) * segments + lon;
        
        // Horizontal edge
        edges.push([current, next]);
        
        // Vertical edge
        if (lat < segments) {
          edges.push([current, below]);
        }
      }
    }
    
    return edges;
  }

  generateFaces() {
    const faces = [];
    const segments = this.options.segments;
    
    // Generate triangular faces for each quad in the mesh
    for (let lat = 0; lat < segments; lat++) {
      for (let lon = 0; lon < segments; lon++) {
        const current = lat * segments + lon;
        const next = lat * segments + ((lon + 1) % segments);
        const below = (lat + 1) * segments + lon;
        const belowNext = (lat + 1) * segments + ((lon + 1) % segments);
        
        // Create two triangles per quad
        if (lat < segments) {
          // Triangle 1: current, next, belowNext
          faces.push({
            vertices: [current, next, belowNext],
            color: this.options.rockColors[Math.floor(Math.random() * this.options.rockColors.length)]
          });
          
          // Triangle 2: current, belowNext, below
          faces.push({
            vertices: [current, belowNext, below],
            color: this.options.rockColors[Math.floor(Math.random() * this.options.rockColors.length)]
          });
        }
      }
    }
    
    return faces;
  }

  project3DTo2D(vertex) {
    // Apply rotation matrices
    let { x, y, z } = vertex;
    
    // Rotate around X axis
    let tempY = y * Math.cos(this.rotX) - z * Math.sin(this.rotX);
    let tempZ = y * Math.sin(this.rotX) + z * Math.cos(this.rotX);
    y = tempY;
    z = tempZ;
    
    // Rotate around Y axis
    let tempX = x * Math.cos(this.rotY) + z * Math.sin(this.rotY);
    tempZ = -x * Math.sin(this.rotY) + z * Math.cos(this.rotY);
    x = tempX;
    z = tempZ;
    
    // Rotate around Z axis
    tempX = x * Math.cos(this.rotZ) - y * Math.sin(this.rotZ);
    tempY = x * Math.sin(this.rotZ) + y * Math.cos(this.rotZ);
    x = tempX;
    y = tempY;
    
    // Perspective projection
    const distance = 400;
    const scale = distance / (distance + z);
    
    return {
      x: this.canvas.width / 2 + x * scale,
      y: this.canvas.height / 2 + y * scale,
      scale: scale,
      z: z
    };
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Project all vertices
    const projected = this.vertices.map(v => this.project3DTo2D(v));
    
    // Sort faces by average Z depth (back to front for proper rendering)
    const sortedFaces = this.faces.map(face => {
      const avgZ = face.vertices.reduce((sum, idx) => sum + projected[idx].z, 0) / face.vertices.length;
      return { face, avgZ };
    }).sort((a, b) => a.avgZ - b.avgZ);
    
    // Draw filled faces with depth-based shading
    sortedFaces.forEach(({ face, avgZ }) => {
      const points = face.vertices.map(idx => projected[idx]);
      
      // Calculate lighting based on depth (closer = brighter)
      const depthFactor = Math.max(0.3, Math.min(1, 0.5 + avgZ / 250));
      
      // Calculate surface normal for proper lighting
      const v1 = this.vertices[face.vertices[0]];
      const v2 = this.vertices[face.vertices[1]];
      const v3 = this.vertices[face.vertices[2]];
      
      // Vectors for cross product
      const dx1 = v2.x - v1.x, dy1 = v2.y - v1.y, dz1 = v2.z - v1.z;
      const dx2 = v3.x - v1.x, dy2 = v3.y - v1.y, dz2 = v3.z - v1.z;
      
      // Cross product for normal
      const nx = dy1 * dz2 - dz1 * dy2;
      const ny = dz1 * dx2 - dx1 * dz2;
      const nz = dx1 * dy2 - dy1 * dx2;
      
      // Light direction (from front-top-right)
      const lightX = 0.5, lightY = -0.3, lightZ = 0.8;
      
      // Normalize and calculate dot product for lighting
      const normalMag = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const dotProduct = (nx * lightX + ny * lightY + nz * lightZ) / (normalMag || 1);
      
      // Backface culling has been removed to ensure all triangles are rendered.
      // Instead, we apply different shading to front-facing and back-facing triangles
      // to maintain depth cues while creating a solid, filled appearance.
      
      // Calculate lighting intensity (ambient + diffuse)
      const ambient = 0.4;
      const diffuse = Math.max(0, dotProduct) * 0.6;
      let brightness = (ambient + diffuse) * depthFactor;

      // Apply backface shading for depth
      if (nz < 0) {
        brightness *= 0.5; // Make back faces 50% darker
      }
      
      // Apply brightness to face color
      const rgb = this.hexToRgb(face.color);
      const shadedColor = `rgba(${
        Math.floor(rgb.r * brightness)
      }, ${
        Math.floor(rgb.g * brightness)
      }, ${
        Math.floor(rgb.b * brightness)
      }, 0.95)`;
      
      // Draw filled triangle
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.lineTo(points[2].x, points[2].y);
      ctx.closePath();
      ctx.fillStyle = shadedColor;
      ctx.fill();
      
      // Draw subtle edge lines for definition
      ctx.strokeStyle = `rgba(0, 0, 0, ${brightness * 0.15})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });
    
    // Optional: Draw subtle highlights on prominent vertices
    projected.forEach((p, i) => {
      if (p.z > 20) { // Only highlight vertices close to viewer
        const vertex = this.vertices[i];
        const highlightStrength = Math.max(0, vertex.brightness || 1) * (p.z / 100);
        
        if (highlightStrength > 0.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 240, 220, ${highlightStrength * 0.3})`;
          ctx.fill();
        }
      }
    });
  }
  
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 240, b: 255 };
  }

  animate() {
    // Update rotation with interactive influences
    let speedMultiplier = 1;
    
    if (this.isHovered) {
      // Mouse influence on rotation
      this.rotY += this.mouseX * 0.05;
      this.rotX += this.mouseY * 0.05;
      speedMultiplier = 0.5; // Slow down auto-rotation when hovering
    }
    
    // Scroll influence
    this.rotZ += this.scrollInfluence * 0.002;
    
    // Auto rotation
    this.rotX += this.rotSpeedX * 0.01 * speedMultiplier;
    this.rotY += this.rotSpeedY * 0.01 * speedMultiplier;
    this.rotZ += this.rotSpeedZ * 0.01 * speedMultiplier;
    
    this.draw();
    
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.container && this.canvas) {
      this.container.removeChild(this.canvas);
    }
  }
}
