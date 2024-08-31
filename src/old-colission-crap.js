    overlaps = this.calculateOverlap();
    if(overlaps.x !== 0) {
      this.velocity.x = 0;
    }
    this.x += overlaps.x;

    this.proposedPosition = new THREE.Vector3(
      this.x + this.velocity.x,
      this.y + this.velocity.y,
      this.z + this.velocity.z
    );
    overlaps = this.calculateOverlap();
    if(overlaps.z !== 0) {
      this.velocity.z = 0;
    }
    this.x += overlaps.z;

    this.x += overlaps.y;
    this.z += overlaps.z;

Box2D
  calculateOverlapX() {
    const AABB = this.getProposedAABB(this.proposedPosition);
    const cellMin = {
      x: Math.floor(AABB.min.x),
      y: Math.floor(AABB.min.y),
      z: Math.floor(AABB.min.z)
    };
    const cellMax = {
      x: Math.floor(AABB.max.x),
      y: Math.floor(AABB.max.y),
      z: Math.floor(AABB.max.z)
    };
    let overlap = new THREE.Vector3(0, 0, 0);

    // check overlap for x-axis
    for (let y = cellMin.y; y <= cellMax.y; y++) {
      for (let z = cellMin.z; z <= cellMax.z; z++) {
        if (this.velocity.x > 0) {
          if (this.world.solidAt(cellMax.x, y, z)) {
            overlap.x = Math.min(overlap.x, cellMax.x - AABB.max.x);
          }
        } else if (this.velocity.x < 0) {
          if (this.world.solidAt(cellMin.x, y, z)) {
            overlap.x = Math.max(overlap.x, cellMin.x + 1 - AABB.min.x);
          }
        }
      }
    }

    // check overlap for z-axis
    for (let y = cellMin.y; y <= cellMax.y; y++) {
      for (let x = cellMin.x; x <= cellMax.x; x++) {
        if (this.velocity.z > 0) {
          if (this.world.solidAt(x, y, cellMax.z)) {
            overlap.z = Math.min(overlap.z, cellMax.z - AABB.max.z);
          }
        } else if(this.velocity.z < 0) {
          if (this.world.solidAt(x, y, cellMin.z)) {
            overlap.z = Math.max(overlap.z, cellMin.z + 1 - AABB.min.z);
          }
        }
      }
    }

    // // check overlap for y-axis
    // for (let x = cellMin.x; x <= cellMax.x; x++) {
    //   for (let z = cellMin.z; z <= cellMax.z; z++) {
    //     if (this.velocity.y > 0) {
    //       if (this.world.solidAt(x, cellMax.y, z)) {
    //         overlap.y = Math.min(overlap.y, cellMax.y - AABB.max.y);
    //       }
    //     } else {
    //       if (this.world.solidAt(x, cellMin.y, z)) {
    //         overlap.y = Math.max(overlap.y, cellMin.y + 1 - AABB.min.y);
    //       }
    //     }
    //   }
    // }



    // // check overlap for z-axis
    // for (let x = cellMin.x; x <= cellMax.x; x++) {
    //     for (let y = cellMin.y; y <= cellMax.y; y++) {
    //         if (this.world.solidAt(x, y, cellMin.z)) {
    //             overlap.z = Math.max(overlap.z, AABB.min.z - cellMin.z);
    //         }
    //         if (this.world.solidAt(x, y, cellMax.z)) {
    //             overlap.z = Math.max(overlap.z, cellMax.z - AABB.max.z);
    //         }
    //     }
    // }

    return overlap;
}