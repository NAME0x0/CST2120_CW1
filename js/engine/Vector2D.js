console.log('[Vector2D.js] Module loaded');

/**
 * 2D Vector class for physics calculations
 * Handles position, velocity, acceleration in space
 */
export class Vector2D {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  // Create new vector from this one
  clone() {
    return new Vector2D(this.x, this.y);
  }

  // Add another vector to this one
  add(vector) {
    this.x += vector.x;
    this.y += vector.y;
    return this;
  }

  // Subtract another vector from this one
  subtract(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    return this;
  }

  // Multiply by scalar
  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  // Divide by scalar
  divide(scalar) {
    if (scalar !== 0) {
      this.x /= scalar;
      this.y /= scalar;
    }
    return this;
  }

  // Get magnitude (length) of vector
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  // Get squared magnitude (faster, no sqrt)
  magnitudeSquared() {
    return this.x * this.x + this.y * this.y;
  }

  // Normalize to unit vector
  normalize() {
    const mag = this.magnitude();
    if (mag > 0) {
      this.divide(mag);
    }
    return this;
  }

  // Limit magnitude to max value
  limit(max) {
    const magSq = this.magnitudeSquared();
    if (magSq > max * max) {
      this.normalize().multiply(max);
    }
    return this;
  }

  // Set magnitude
  setMagnitude(mag) {
    return this.normalize().multiply(mag);
  }

  // Get angle in radians
  angle() {
    return Math.atan2(this.y, this.x);
  }

  // Rotate by angle (radians)
  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = this.x * cos - this.y * sin;
    const y = this.x * sin + this.y * cos;
    this.x = x;
    this.y = y;
    return this;
  }

  // Dot product
  dot(vector) {
    return this.x * vector.x + this.y * vector.y;
  }

  // Distance to another vector
  distanceTo(vector) {
    const dx = this.x - vector.x;
    const dy = this.y - vector.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Distance squared (faster)
  distanceSquaredTo(vector) {
    const dx = this.x - vector.x;
    const dy = this.y - vector.y;
    return dx * dx + dy * dy;
  }

  // Linear interpolation
  lerp(vector, t) {
    this.x += (vector.x - this.x) * t;
    this.y += (vector.y - this.y) * t;
    return this;
  }

  // Set values
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  // Static methods
  static add(v1, v2) {
    return new Vector2D(v1.x + v2.x, v1.y + v2.y);
  }

  static subtract(v1, v2) {
    return new Vector2D(v1.x - v2.x, v1.y - v2.y);
  }

  static multiply(v, scalar) {
    return new Vector2D(v.x * scalar, v.y * scalar);
  }

  static dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
  }

  static distance(v1, v2) {
    return v1.distanceTo(v2);
  }

  static fromAngle(angle, magnitude = 1) {
    return new Vector2D(
      Math.cos(angle) * magnitude,
      Math.sin(angle) * magnitude
    );
  }

  static random() {
    return Vector2D.fromAngle(Math.random() * Math.PI * 2);
  }

  static zero() {
    return new Vector2D(0, 0);
  }
}
