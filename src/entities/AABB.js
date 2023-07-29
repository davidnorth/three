import * as THREE from 'three';

// Create an AABB for an entitiy with x,y and z coordinates
// It is defined by a min and max vector representing 
// opposite corners of a bounding box centered on the entities position 
// in the x/z plane and with its bottom at the entities y position.
// Optionally suppy a proposedPosition as a Vector3 
// to calculate the AABB for a position that the entity wants to move to.
class AABB {
  constructor(entity, proposedPosition = null) {
    let pos = proposedPosition || entity;
    this.min = new THREE.Vector3(
      pos.x - entity.bbWidth*0.5, 
      pos.y, 
      pos.z - entity.bbDepth*0.5
    ),
    this.max = new THREE.Vector3(
      pos.x + entity.bbWidth*0.5, 
      pos.y + entity.bbHeight, 
      pos.z + entity.bbDepth*0.5
    )
  }
}

export default AABB;