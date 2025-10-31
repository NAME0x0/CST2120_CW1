import { Vector2D } from './Vector2D.js';

console.log('[PhysicsBody.js] Module loaded');

/**
 * Physics body with realistic space dynamics
 * No friction, Newton's laws of motion
 */
export class PhysicsBody {
  constructor(x, y, mass = 1) {
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D(0, 0);
    this.acceleration = new Vector2D(0, 0);
    this.force = new Vector2D(0, 0);
    
    this.mass = mass;
    this.inverseMass = mass > 0 ? 1 / mass : 0;
    
    // Rotation physics
    this.angle = 0;
    this.angularVelocity = 0;
    this.angularAcceleration = 0;
    this.torque = 0;
    
    // Damping (minimal in space, but useful for gameplay)
    this.linearDamping = 0.999;
    this.angularDamping = 0.995;
    
    // Collision properties
    this.restitution = 0.8; // Bounciness
    this.friction = 0.3;
    
    // State flags
    this.isStatic = false;
    this.affectedByGravity = true;
  }

  /**
   * Apply force to body (F = ma)
   */
  applyForce(force) {
    if (this.isStatic) return;
    this.force.add(force);
  }

  /**
   * Apply impulse (immediate velocity change)
   */
  applyImpulse(impulse) {
    if (this.isStatic) return;
    const deltaV = Vector2D.multiply(impulse, this.inverseMass);
    this.velocity.add(deltaV);
  }

  /**
   * Apply force at a point (creates torque)
   */
  applyForceAtPoint(force, point) {
    if (this.isStatic) return;
    this.applyForce(force);
    
    // Calculate torque from point
    const r = Vector2D.subtract(point, this.position);
    const crossProduct = r.x * force.y - r.y * force.x;
    this.torque += crossProduct;
  }

  /**
   * Apply thrust in a direction
   */
  applyThrust(direction, magnitude) {
    const thrust = direction.clone().setMagnitude(magnitude);
    this.applyForce(thrust);
  }

  /**
   * Update physics (semi-implicit Euler integration)
   */
  update(deltaTime) {
    if (this.isStatic) return;

    // Linear motion
    // a = F / m
    this.acceleration = Vector2D.multiply(this.force, this.inverseMass);
    
    // v = v + a * dt
    const deltaV = Vector2D.multiply(this.acceleration, deltaTime);
    this.velocity.add(deltaV);
    
    // Apply damping (space drag from solar wind, debris field)
    this.velocity.multiply(Math.pow(this.linearDamping, deltaTime * 60));
    
    // p = p + v * dt
    const deltaP = Vector2D.multiply(this.velocity, deltaTime);
    this.position.add(deltaP);
    
    // Angular motion
    this.angularAcceleration = this.torque * this.inverseMass;
    this.angularVelocity += this.angularAcceleration * deltaTime;
    this.angularVelocity *= Math.pow(this.angularDamping, deltaTime * 60);
    this.angle += this.angularVelocity * deltaTime;
    
    // Reset forces for next frame
    this.force.set(0, 0);
    this.torque = 0;
  }

  /**
   * Get kinetic energy (1/2 * m * v²)
   */
  getKineticEnergy() {
    const speedSquared = this.velocity.magnitudeSquared();
    return 0.5 * this.mass * speedSquared;
  }

  /**
   * Get momentum (m * v)
   */
  getMomentum() {
    return Vector2D.multiply(this.velocity, this.mass);
  }

  /**
   * Stop all motion
   */
  stop() {
    this.velocity.set(0, 0);
    this.acceleration.set(0, 0);
    this.force.set(0, 0);
    this.angularVelocity = 0;
    this.angularAcceleration = 0;
    this.torque = 0;
  }

  /**
   * Set velocity directly
   */
  setVelocity(x, y) {
    this.velocity.set(x, y);
  }

  /**
   * Limit velocity to max speed
   */
  limitVelocity(maxSpeed) {
    this.velocity.limit(maxSpeed);
  }

  /**
   * Get forward vector based on angle
   */
  getForwardVector() {
    return new Vector2D(
      Math.cos(this.angle),
      Math.sin(this.angle)
    );
  }

  /**
   * Get right vector (perpendicular to forward)
   */
  getRightVector() {
    return new Vector2D(
      Math.cos(this.angle + Math.PI / 2),
      Math.sin(this.angle + Math.PI / 2)
    );
  }

  /**
   * Point towards a target position
   */
  lookAt(target) {
    const direction = Vector2D.subtract(target, this.position);
    this.angle = direction.angle();
  }

  /**
   * Rotate towards angle smoothly
   */
  rotateTowards(targetAngle, rotationSpeed, deltaTime) {
    let angleDiff = targetAngle - this.angle;
    
    // Normalize angle difference to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    const maxRotation = rotationSpeed * deltaTime;
    
    if (Math.abs(angleDiff) < maxRotation) {
      this.angle = targetAngle;
    } else {
      this.angle += Math.sign(angleDiff) * maxRotation;
    }
    
    // Normalize angle
    this.angle = this.angle % (Math.PI * 2);
  }

  /**
   * Check if moving
   */
  isMoving() {
    return this.velocity.magnitude() > 0.01;
  }

  /**
   * Get speed
   */
  getSpeed() {
    return this.velocity.magnitude();
  }

  /**
   * Get direction of movement
   */
  getDirection() {
    return this.velocity.clone().normalize();
  }
}
