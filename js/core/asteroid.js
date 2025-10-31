/**
 * Space Lanes - 3D Asteroid Renderer
 * Creates a rotating 3D asteroid using custom rendering
 * No external libraries - pure canvas 2D with 3D projection
 */

export class Asteroid3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'asteroidCanvas';
    this.container.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d');
    this.width = 500;
    this.height = 500;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    this.rotation = { x: 0, y: 0, z: 0 };
    this.rotationSpeed = { x: 0.003, y: 0.005, z: 0.002 };
    this.scrollInfluence = 0;
    
    this.vertices = [];
    this.faces = [];
    
    this.createAsteroidGeometry();
    this.bindEvents();
    this.animate();
  }
  
  createAsteroidGeometry() {
    // Create icosahedron-based asteroid
    const t = (1 + Math.sqrt(5)) / 2;
    const scale = 80;
    
    // Base icosahedron vertices
    const baseVertices = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
    ];
    
    // Add randomness to create asteroid shape
    this.vertices = baseVertices.map(v => {
      const randomFactor = 0.3 + Math.random() * 0.4;
      return [
        v[0] * scale * randomFactor,
        v[1] * scale * randomFactor,
        v[2] * scale * randomFactor
      ];
    });
    
    // Define faces (triangles)
    this.faces = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];
  }
  
  project3D(x, y, z) {
    // Simple 3D to 2D projection
    const distance = 300;
    const scale = distance / (distance + z);
    
    return {
      x: x * scale + this.width / 2,
      y: y * scale + this.height / 2,
      scale: scale
    };
  }
  
  rotate3D(x, y, z, rotation) {
    // Rotate around X axis
    let cosX = Math.cos(rotation.x);
    let sinX = Math.sin(rotation.x);
    let y1 = y * cosX - z * sinX;
    let z1 = y * sinX + z * cosX;
    
    // Rotate around Y axis
    let cosY = Math.cos(rotation.y);
    let sinY = Math.sin(rotation.y);
    let x2 = x * cosY + z1 * sinY;
    let z2 = -x * sinY + z1 * cosY;
    
    // Rotate around Z axis
    let cosZ = Math.cos(rotation.z);
    let sinZ = Math.sin(rotation.z);
    let x3 = x2 * cosZ - y1 * sinZ;
    let y3 = x2 * sinZ + y1 * cosZ;
    
    return [x3, y3, z2];
  }
  
  bindEvents() {
    let ticking = false;
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.pageYOffset || document.documentElement.scrollTop;
          this.scrollInfluence = scrollY * 0.001;
          ticking = false;
        });
        ticking = true;
      }
    });
    
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const mouseY = (e.clientY - rect.top - rect.height / 2) / rect.height;
      
      this.rotationSpeed.y = 0.005 + mouseX * 0.01;
      this.rotationSpeed.x = 0.003 + mouseY * 0.01;
    });
  }
  
  drawFace(vertices, color, brightness) {
    this.ctx.beginPath();
    this.ctx.moveTo(vertices[0].x, vertices[0].y);
    
    for (let i = 1; i < vertices.length; i++) {
      this.ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    
    this.ctx.closePath();
    
    // Fill
    this.ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${brightness})`;
    this.ctx.fill();
    
    // Stroke
    this.ctx.strokeStyle = `rgba(0, 240, 255, ${brightness * 0.3})`;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }
  
  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Update rotation
    this.rotation.x += this.rotationSpeed.x + this.scrollInfluence * 0.1;
    this.rotation.y += this.rotationSpeed.y + this.scrollInfluence * 0.2;
    this.rotation.z += this.rotationSpeed.z;
    
    // Transform and project vertices
    const projectedVertices = this.vertices.map(v => {
      const rotated = this.rotate3D(v[0], v[1], v[2], this.rotation);
      return this.project3D(rotated[0], rotated[1], rotated[2]);
    });
    
    // Calculate face depths and sort for painter's algorithm
    const facesWithDepth = this.faces.map(face => {
      const v1 = this.vertices[face[0]];
      const v2 = this.vertices[face[1]];
      const v3 = this.vertices[face[2]];
      
      const rotated1 = this.rotate3D(v1[0], v1[1], v1[2], this.rotation);
      const rotated2 = this.rotate3D(v2[0], v2[1], v2[2], this.rotation);
      const rotated3 = this.rotate3D(v3[0], v3[1], v3[2], this.rotation);
      
      const avgZ = (rotated1[2] + rotated2[2] + rotated3[2]) / 3;
      
      // Calculate normal for lighting
      const ux = rotated2[0] - rotated1[0];
      const uy = rotated2[1] - rotated1[1];
      const uz = rotated2[2] - rotated1[2];
      const vx = rotated3[0] - rotated1[0];
      const vy = rotated3[1] - rotated1[1];
      const vz = rotated3[2] - rotated1[2];
      
      const normalX = uy * vz - uz * vy;
      const normalY = uz * vx - ux * vz;
      const normalZ = ux * vy - uy * vx;
      
      // Simple lighting calculation
      const lightZ = 1;
      const brightness = Math.max(0.2, (normalZ * lightZ) / Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ));
      
      return {
        face,
        depth: avgZ,
        brightness
      };
    });
    
    // Sort faces by depth (back to front)
    facesWithDepth.sort((a, b) => a.depth - b.depth);
    
    // Draw faces
    facesWithDepth.forEach(({ face, brightness }) => {
      const faceVertices = face.map(i => projectedVertices[i]);
      
      // Asteroid color (gray/brown tones with cyan tint)
      const baseColor = [80, 90, 100];
      const color = baseColor.map(c => Math.floor(c * brightness));
      
      this.drawFace(faceVertices, color, brightness);
    });
    
    // Add cyan glow effect
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = 'rgba(0, 240, 255, 0.3)';
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, 0, this.width, this.height);
    this.ctx.shadowBlur = 0;
  }
  
  animate() {
    this.render();
    requestAnimationFrame(() => this.animate());
  }
}
