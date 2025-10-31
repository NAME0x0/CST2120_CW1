import { Vector2D } from './Vector2D.js';

console.log('[Collision.js] Module loaded');

/**
 * Collision detection and resolution system
 */
export class CollisionSystem {
  constructor() {
    console.log('[CollisionSystem] Constructor called');
    this.collisions = [];
  }

  /**
   * Check circle-circle collision
   */
  static checkCircleCollision(obj1, obj2, radius1, radius2) {
    const distSquared = obj1.position.distanceSquaredTo(obj2.position);
    const radiusSum = radius1 + radius2;
    return distSquared < radiusSum * radiusSum;
  }

  /**
   * Check AABB (Axis-Aligned Bounding Box) collision
   */
  static checkAABBCollision(obj1, obj2, width1, height1, width2, height2) {
    return (
      Math.abs(obj1.position.x - obj2.position.x) < (width1 + width2) / 2 &&
      Math.abs(obj1.position.y - obj2.position.y) < (height1 + height2) / 2
    );
  }

  /**
   * Check if point is inside circle
   */
  static pointInCircle(point, circle, radius) {
    return point.distanceSquaredTo(circle) < radius * radius;
  }

  /**
   * Check if point is inside rectangle
   */
  static pointInRect(point, rect, width, height) {
    return (
      point.x >= rect.x - width / 2 &&
      point.x <= rect.x + width / 2 &&
      point.y >= rect.y - height / 2 &&
      point.y <= rect.y + height / 2
    );
  }

  /**
   * Resolve collision between two physics bodies (elastic collision)
   */
  static resolveCollision(obj1, obj2, restitution = 0.8) {
    // Calculate collision normal
    const normal = Vector2D.subtract(obj2.position, obj1.position).normalize();
    
    // Calculate relative velocity
    const relativeVelocity = Vector2D.subtract(obj2.velocity, obj1.velocity);
    
    // Calculate relative velocity in terms of the normal direction
    const velocityAlongNormal = Vector2D.dot(relativeVelocity, normal);
    
    // Do not resolve if velocities are separating
    if (velocityAlongNormal > 0) return;
    
    // Calculate impulse scalar
    const e = Math.min(obj1.restitution, obj2.restitution) * restitution;
    let j = -(1 + e) * velocityAlongNormal;
    j /= obj1.inverseMass + obj2.inverseMass;
    
    // Apply impulse
    const impulse = Vector2D.multiply(normal, j);
    
    if (!obj1.isStatic) {
      const impulse1 = Vector2D.multiply(impulse, -obj1.inverseMass);
      obj1.velocity.add(impulse1);
    }
    
    if (!obj2.isStatic) {
      const impulse2 = Vector2D.multiply(impulse, obj2.inverseMass);
      obj2.velocity.add(impulse2);
    }
  }

  /**
   * Separate overlapping objects
   */
  static separateObjects(obj1, obj2, radius1, radius2) {
    const normal = Vector2D.subtract(obj2.position, obj1.position);
    const distance = normal.magnitude();
    const overlap = radius1 + radius2 - distance;
    
    if (overlap > 0 && distance > 0) {
      normal.normalize();
      const separation = Vector2D.multiply(normal, overlap / 2);
      
      if (!obj1.isStatic) {
        obj1.position.subtract(separation);
      }
      if (!obj2.isStatic) {
        obj2.position.add(separation);
      }
    }
  }

  /**
   * Check line-circle intersection (for laser/projectile hits)
   */
  static lineCircleIntersection(lineStart, lineEnd, circlePos, radius) {
    const line = Vector2D.subtract(lineEnd, lineStart);
    const circleToStart = Vector2D.subtract(lineStart, circlePos);
    
    const a = line.dot(line);
    const b = 2 * circleToStart.dot(line);
    const c = circleToStart.dot(circleToStart) - radius * radius;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) return null; // No intersection
    
    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
    
    // Check if intersection is within line segment
    if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) {
      const t = t1 >= 0 && t1 <= 1 ? t1 : t2;
      const intersection = Vector2D.add(
        lineStart,
        Vector2D.multiply(line, t)
      );
      return {
        point: intersection,
        t: t
      };
    }
    
    return null;
  }

  /**
   * Broad phase collision detection using spatial hashing
   */
  static createSpatialHash(objects, cellSize = 100) {
    const hash = new Map();
    
    objects.forEach(obj => {
      const cellX = Math.floor(obj.position.x / cellSize);
      const cellY = Math.floor(obj.position.y / cellSize);
      const key = `${cellX},${cellY}`;
      
      if (!hash.has(key)) {
        hash.set(key, []);
      }
      hash.get(key).push(obj);
    });
    
    return hash;
  }

  /**
   * Get potential collision pairs using spatial hash
   */
  static getPotentialCollisions(spatialHash) {
    const pairs = [];
    const checked = new Set();
    
    spatialHash.forEach(cell => {
      for (let i = 0; i < cell.length; i++) {
        for (let j = i + 1; j < cell.length; j++) {
          const pairKey = `${cell[i].id}-${cell[j].id}`;
          if (!checked.has(pairKey)) {
            pairs.push([cell[i], cell[j]]);
            checked.add(pairKey);
          }
        }
      }
    });
    
    return pairs;
  }

  /**
   * Raycast from point in direction
   */
  static raycast(origin, direction, maxDistance, objects) {
    const rayEnd = Vector2D.add(
      origin,
      Vector2D.multiply(direction.clone().normalize(), maxDistance)
    );
    
    let closestHit = null;
    let closestDistance = maxDistance;
    
    objects.forEach(obj => {
      const hit = this.lineCircleIntersection(
        origin,
        rayEnd,
        obj.position,
        obj.radius || 20
      );
      
      if (hit && hit.t * maxDistance < closestDistance) {
        closestDistance = hit.t * maxDistance;
        closestHit = {
          object: obj,
          point: hit.point,
          distance: closestDistance
        };
      }
    });
    
    return closestHit;
  }

  /**
   * Check if object is within bounds
   */
  static isInBounds(position, width, height, boundsWidth, boundsHeight) {
    return (
      position.x >= width / 2 &&
      position.x <= boundsWidth - width / 2 &&
      position.y >= height / 2 &&
      position.y <= boundsHeight - height / 2
    );
  }

  /**
   * Wrap object around screen edges (for asteroids game style)
   */
  static wrapAround(position, width, height, boundsWidth, boundsHeight) {
    if (position.x < -width / 2) position.x = boundsWidth + width / 2;
    if (position.x > boundsWidth + width / 2) position.x = -width / 2;
    if (position.y < -height / 2) position.y = boundsHeight + height / 2;
    if (position.y > boundsHeight + height / 2) position.y = -height / 2;
  }

  /**
   * Bounce object off bounds
   */
  static bounceOffBounds(body, width, height, boundsWidth, boundsHeight, restitution = 0.8) {
    const halfW = width / 2;
    const halfH = height / 2;
    
    if (body.position.x - halfW < 0) {
      body.position.x = halfW;
      body.velocity.x = Math.abs(body.velocity.x) * restitution;
    } else if (body.position.x + halfW > boundsWidth) {
      body.position.x = boundsWidth - halfW;
      body.velocity.x = -Math.abs(body.velocity.x) * restitution;
    }
    
    if (body.position.y - halfH < 0) {
      body.position.y = halfH;
      body.velocity.y = Math.abs(body.velocity.y) * restitution;
    } else if (body.position.y + halfH > boundsHeight) {
      body.position.y = boundsHeight - halfH;
      body.velocity.y = -Math.abs(body.velocity.y) * restitution;
    }
  }
}
