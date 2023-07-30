import * as THREE from 'three';
import AABB from './AABB.js';

// import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';0

const EYE_HEIGHT = 1.6;
const BB_HEIGHT = 1.8;
const BB_WIDTH = 0.5;
// const BB_WIDTH = 1.0;

const MOUSE_SENSITIVITY = 0.003; 

// const WALK_SPEED = 4.3; // m/s
const WALK_SPEED = 1.0;


const GRAVITY = 0.002;

const MAX_COLLISION_CHECKS = 10;

class KeyInput {
  constructor() {
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      space: false,
    };
    window.addEventListener('keydown', (event) => {
      if (event.code === "KeyW") this.keys.w = true;
      if (event.code === "KeyA") this.keys.a = true;
      if (event.code === "KeyS") this.keys.s = true;
      if (event.code === "KeyD") this.keys.d = true;
      if (event.code === "Space") this.keys.space = true;
    });
    window.addEventListener('keyup', (event) => {
      if (event.code === "KeyW") this.keys.w = false;
      if (event.code === "KeyA") this.keys.a = false;
      if (event.code === "KeyS") this.keys.s = false;
      if (event.code === "KeyD") this.keys.d = false;
      if (event.code === "Space") this.keys.space = false;
    });
  }
}



class Player {

  constructor(world, scene) {
    this.world = world;
    this.scene = scene;

    this.x = 5.5;
    this.y = 9;
    this.z = 0;
    this.xv = 0;
    this.yv = 0;
    this.zv = 0;

    this.bbWidth = BB_WIDTH;
    this.bbDepth = BB_WIDTH;
    this.bbHeight = BB_HEIGHT;


    // define a vector representing the direction the player is looking in
    this.direction = new THREE.Vector3(1, 0, 0);

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1200);
    this.updateCamera();

    // this.controls = new OrbitControls(this.camera, document.body);

    // Raycaster to find which block face we are looking at
    this.eyeRaycaster = new THREE.Raycaster();
    this.eyeRaycaster.far = 50;
    this.eyeRaycaster.near = 0.1;

    this.keyInput = new KeyInput();

    window.player = this;


    // create an outlined box representing the player's bounding box
    const bbGeometry = new THREE.BoxGeometry(this.bbWidth, 2, this.bbDepth);
    bbGeometry.translate(0, 0.2+ this.bbHeight / 2, 0);
    this.bbMesh = new THREE.Mesh(
      bbGeometry,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
      })
    );
    this.scene.add(this.bbMesh);




  }

  update(delta) {
    this.castEyeRay();
    this.yv -= GRAVITY;
    
    const speed = WALK_SPEED * delta;

    const forward = new THREE.Vector3(this.direction.x, 0, this.direction.z).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, forward).normalize();

    if(this.keyInput.keys.w) {
      this.xv = forward.x * speed;
      this.zv = forward.z * speed;
    } else if(this.keyInput.keys.s) {
      this.xv = forward.x * speed * -1;
      this.zv = forward.z * speed * -1;
    } else if(this.keyInput.keys.a) {
      this.xv = right.x * speed;
      this.zv = -right.z * speed;
    } else  if(this.keyInput.keys.d) {
      this.xv = right.x * speed;
      this.zv = -right.z * speed;
    } else {
      this.xv = 0;
      this.zv = 0;
    }

    if(this.keyInput.keys.space) {
      this.yv = 0.04;
    }


    this.doWorldCollisions();

    this.y += this.yv;
    this.x += this.xv;
    this.z += this.zv;

    this.updateCamera();

    this.bbMesh.position.set(this.x, this.y, this.z);
  }




  lookAround(dx, dy) {
    let theta = Math.atan2(this.direction.x, this.direction.z); // Notice the switch of x and z
    let phi = Math.acos(this.direction.y);
    theta += dx * MOUSE_SENSITIVITY * -1;
    phi -= dy * MOUSE_SENSITIVITY * -1;
    phi = Math.min(phi, 3.0);
    this.direction.set(
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.cos(theta)
    );
  }


  updateCamera() {
    this.camera.position.x = this.x;
    this.camera.position.y = this.y + EYE_HEIGHT;
    this.camera.position.z = this.z;
    this.camera.lookAt(new THREE.Vector3(this.x, this.y + EYE_HEIGHT, this.z).add(this.direction));

    // // to view BB mesh from behind in x
    // this.camera.position.x = this.x;
    // this.camera.position.y = this.y + 8;
    // this.camera.position.z = this.z;
    // this.camera.lookAt(new THREE.Vector3(this.x, this.y, this.z));

  }

  getAABB() {
    return new AABB(this);
  }

  getProposedAABB(proposedX, proposedY, proposedZ) {
    const proposedPosition = new THREE.Vector3(
      proposedX === null ? this.x : proposedX,
      proposedY === null ? this.y : proposedY,
      proposedZ === null ? this.z : proposedZ
    );
    return new AABB(this, proposedPosition);
  }

  // player position and block position are both in world space
  // so we can compare them without conversion
  // Use world.solidAt(x,y,z) together with the player AABB
  // to determine if the player is colliding with a block
  doWorldCollisions() {
    const velocities = [
      {value: Math.abs(this.xv), method: this.collideX.bind(this)},
      {value: Math.abs(this.yv), method: this.collideY.bind(this)},
      {value: Math.abs(this.zv), method: this.collideZ.bind(this)}
    ];
    velocities.sort((a, b) => b.value - a.value);
    for(let i = 0; i < velocities.length; i++) {
      velocities[i].method();
    }
  }

  collideX() {
    let proposedX = this.x + this.xv;
    if (this.isCollidingWithWorldX(this.getProposedAABB(proposedX, null, null), this.xv > 0)) {
      console.log('collide X', this.x, proposedX)
      proposedX = this.xv > 0 ? Math.ceil(proposedX) - this.bbWidth*0.5 : Math.floor(proposedX) + this.bbWidth*0.5;

      let count = 0;
      while (this.isCollidingWithWorldX(this.getProposedAABB(proposedX, null, null), this.xv > 0) && count < MAX_COLLISION_CHECKS) {
        console.log('push ', proposedX);
        proposedX += this.xv >= 0 ? -1 : 1;
        count ++;
      }
      this.xv = 0;

    }
    this.x = proposedX;
  }
  
  collideZ() {
    let proposedZ = this.z + this.zv;
    if (this.isCollidingWithWorldZ(this.getProposedAABB(null, null, proposedZ), this.zv > 0)) {
      console.log('collide Z')
      proposedZ = this.zv > 0 ? Math.ceil(this.z) - this.bbDepth*0.5 : Math.floor(this.z) + this.bbDepth*0.5;
      let count = 0;
      while (this.isCollidingWithWorldZ(this.getProposedAABB(null, null, proposedZ), this.zv > 0) && count < MAX_COLLISION_CHECKS) {
        proposedZ += this.zv > 0 ? -1 : 1;
        count ++;
      }
      this.zv = 0;
      console.log(' - resolve ', proposedZ);
    }
    this.z = proposedZ;
  }

  collideY() {
    let proposedY = this.y + this.yv;
    if (this.isCollidingWithWorldY(this.getProposedAABB(null, proposedY, null), this.yv > 0)) {
      proposedY = this.yv > 0 ? Math.ceil(proposedY) : Math.floor(proposedY);
      let count = 0;
      while (this.isCollidingWithWorldY(this.getProposedAABB(null, proposedY, null), this.yv > 0) && count < MAX_COLLISION_CHECKS) {
        proposedY += this.yv > 0 ? -1 : 1;
        count ++;
      }
      this.yv = 0;
    }
    this.y = proposedY;
  }

  isCollidingWithWorldX(AABB, forward = true) {
    const minCellY = Math.floor(AABB.min.y + 0.001);
    const maxCellY = Math.floor(AABB.max.y - 0.001);
    const minCellZ = Math.floor(AABB.min.z + 0.001);
    const maxCellZ = Math.floor(AABB.max.z - 0.001);
    const cellX = forward ? Math.floor(AABB.max.x - 0.001) : Math.floor(AABB.min.x);
    // Check the cells at the relevant X boundary of the AABB
    for (let y = minCellY; y <= maxCellY; y++) {
      for (let z = minCellZ; z <= maxCellZ; z++) {
        if (this.world.solidAt(cellX, y, z)) {
          return true;
        }
      }
    }
    return false;
  }

  isCollidingWithWorldY(AABB, upward = true) {
    const minCellX = Math.floor(AABB.min.x + 0.001);
    const maxCellX = Math.floor(AABB.max.x - 0.001);
    const minCellZ = Math.floor(AABB.min.z + 0.001);
    const maxCellZ = Math.floor(AABB.max.z - 0.001);
    const cellY = upward ? Math.floor(AABB.max.y - 0.001) : Math.floor(AABB.min.y);
    // Check the cells at the relevant Y boundary of the AABB
    for (let x = minCellX; x <= maxCellX; x++) {
      for (let z = minCellZ; z <= maxCellZ; z++) {
        if (this.world.solidAt(x, cellY, z)) {
          return true;
        }
      }
    }
    return false;
  }

  isCollidingWithWorldZ(AABB, forward = true) {
    const minCellX = Math.floor(AABB.min.x + 0.001);
    const maxCellX = Math.floor(AABB.max.x - 0.001);
    const minCellY = Math.floor(AABB.min.y + 0.001);
    const maxCellY = Math.floor(AABB.max.y + 0.001);
    const cellZ = forward ? Math.floor(AABB.max.z - 0.001) : Math.floor(AABB.min.z);
    // Check the cells at the relevant Z boundary of the AABB
    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        if (this.world.solidAt(x, y, cellZ)) {
          return true;
        }
      }
    }
    return false;
  }

  castEyeRay() {
    // The camera's viewing vector is along the negative z-axis in its local space.
    // So, we create a vector for that direction and transform it to world space.
    let direction = new THREE.Vector3(0, 0, -1);
    direction.transformDirection(this.camera.matrixWorld);

    // Now set the raycaster to the camera's position and the calculated direction
    this.eyeRaycaster.set(this.camera.position, direction);

    // Calculate objects intersecting the picking ray
    const intersects = this.eyeRaycaster.intersectObjects(this.scene.getRaycastMeshes());

    if (intersects.length) {
      intersects[0].point

      // // set bokePass focus to the intersect distance
      this.eyeRayIntersectDistance = intersects[0].distance;

      // create a copy of the intserect point moved forward along the face normal by 0.5
      this.newBlockPos = intersects[0].point
        .clone()
        .add(
          intersects[0].face.normal.clone().multiplyScalar(0.5)
        );
      // snap blockPos position to the nearest whole numbers
      this.newBlockPos.x = Math.floor(this.newBlockPos.x);
      this.newBlockPos.y = Math.floor(this.newBlockPos.y);
      this.newBlockPos.z = Math.floor(this.newBlockPos.z);

      this.deleteBlockPos = intersects[0].point
        .clone()
        .add(
          intersects[0].face.normal.clone().multiplyScalar(-0.5)
        );
      // snap blockPos position to the nearest whole numbers
      this.deleteBlockPos.x = Math.floor(this.deleteBlockPos.x);
      this.deleteBlockPos.y = Math.floor(this.deleteBlockPos.y);
      this.deleteBlockPos.z = Math.floor(this.deleteBlockPos.z);
    }

  }
}

export default Player;
