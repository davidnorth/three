import * as THREE from 'three';

const EYE_HEIGHT = 1.6;
const BB_HEIGHT = 1.8;
const BB_WIDTH = 0.6;
const BB_HALF_WIDTH = BB_WIDTH / 2;

const MOUSE_SENSITIVITY = 0.003; 

const WALK_SPEED = 4.3; // m/s

const GRAVITY = 0.01;

class AABB {
  constructor(min, max) {
    this.min = min; // a 3D vector
    this.max = max; // a 3D vector
  }
}


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

    this.x = 8.5;
    this.y = 20;
    this.z = 8.5;
    this.xv = 0;
    this.yv = 0;
    this.zv = 0;


    // define a vector representing the direction the player is looking in
    this.direction = new THREE.Vector3(1, 0, 0);

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.updateCamera();

    // Raycaster to find which block face we are looking at
    this.eyeRaycaster = new THREE.Raycaster();
    this.eyeRaycaster.far = 50;
    this.eyeRaycaster.near = 0.1;

    this.keyInput = new KeyInput();

    window.player = this;
  }

  update(delta) {
    this.castEyeRay();
    this.yv -= GRAVITY;

    const speed = WALK_SPEED * delta;


    let flatDirection = new THREE.Vector3(this.direction.x, 0, this.direction.z).normalize();
 

    if(this.keyInput.keys.w) {
      this.x += flatDirection.x * speed;
      this.z += flatDirection.z * speed;
    }
    if(this.keyInput.keys.s) {
      this.x -= this.direction.x * speed;
      this.z -= this.direction.z * speed;
    }
    if(this.keyInput.keys.a) {
      this.x += this.direction.z * speed;
      this.z -= this.direction.x * speed;
    }
    if(this.keyInput.keys.d) {
      this.x -= this.direction.z * speed;
      this.z += this.direction.x * speed;
    }
    if(this.keyInput.keys.space) {
      this.yv = 0.1;
    }


    this.y += this.yv;

    this.doWorldCollisions();
    this.updateCamera();
  }




  lookAround(dx, dy) {
    let theta = Math.atan2(this.direction.x, this.direction.z); // Notice the switch of x and z
    let phi = Math.acos(this.direction.y);

    theta += dx * MOUSE_SENSITIVITY * -1;
    phi -= dy * MOUSE_SENSITIVITY * -1;
    this.direction.set(
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.cos(theta)
    );
  }




  // player position and block position are both in world space
  // so we can compare them without conversion
  // Use world.solidAt(x,y,z) together with the player AABB
  // to determine if the player is colliding with a block
  doWorldCollisions() {
    // is player intersecting a solid block below? If so, adjust y to place them on top of that block in air
    if (this.isCollidingWithWorld()) {
      this.y = Math.floor(this.y + 1);
      this.yv = 0;
      while (this.isCollidingWithWorld()) {
        console.log('push up')
        this.y += 1;
      }
    }

  }

  updateCamera() {
    this.camera.position.x = this.x;
    this.camera.position.y = this.y + EYE_HEIGHT;
    this.camera.position.z = this.z;
    this.camera.lookAt(new THREE.Vector3(this.x, this.y + EYE_HEIGHT, this.z).add(this.direction));
  }

  // Calculate the AABB in world space, just 2 opposite corners
  // Bottom of the AABB is at the player's feet
  // AABB is centered on the player's x and z position
  getAABB() {
    return new AABB(
      new THREE.Vector3(this.x - BB_HALF_WIDTH, this.y, this.z - BB_HALF_WIDTH),
      new THREE.Vector3(this.x + BB_HALF_WIDTH, this.y + BB_HEIGHT, this.z + BB_HALF_WIDTH)
    );
  }

  isCollidingWithWorld() {
    const AABB = this.getAABB();
    let minCellX = Math.floor(AABB.min.x);
    let maxCellX = Math.ceil(AABB.max.x);
    let minCellY = Math.floor(AABB.min.y);
    let maxCellY = Math.ceil(AABB.max.y);
    let minCellZ = Math.floor(AABB.min.z);
    let maxCellZ = Math.ceil(AABB.max.z);

    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        for (let z = minCellZ; z <= maxCellZ; z++) {
          if (this.world.solidAt(x, y, z)) {
            return true;
          }
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
