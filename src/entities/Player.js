import * as THREE from 'three';

const epsilon = 0.001;

const EYE_HEIGHT = 1.6;
const BB_HEIGHT = 1.8;
// const BB_WIDTH = 0.5;
const BB_WIDTH = 1.0;
// const BB_WIDTH = 1.0;

const MOUSE_SENSITIVITY = 0.003; 

// const WALK_SPEED = 4.3; // m/s
const WALK_SPEED = 1.0;


const GRAVITY = 0.002;

const MAX_COLLISION_CHECKS = 2;

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

    this.x = -1;
    this.y = 9;
    this.z = 2;

    this.bbWidth = BB_WIDTH;
    this.bbDepth = BB_WIDTH;
    this.bbHeight = BB_HEIGHT;


    // define a vector representing the direction the player is looking in
    this.direction = new THREE.Vector3(1, 0, 0);
    // direction and magnitude of current movement
    this.velocity = new THREE.Vector3(0, 0, 0);

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
    const bbGeometry = new THREE.BoxGeometry(this.bbWidth, this.bbHeight, this.bbDepth);
    bbGeometry.translate(0, this.bbHeight * 0.5, 0);
    this.bbMesh = new THREE.Mesh(
      bbGeometry,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
      })
    );
    this.scene.add(this.bbMesh);




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

  update(delta) {
    this.castEyeRay();
    // this.yv -= GRAVITY;
    
    const speed = WALK_SPEED * delta;

    const forward = new THREE.Vector3(this.direction.x, 0, this.direction.z).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, forward).normalize();

    if(this.keyInput.keys.w) {
      this.velocity.x = forward.x * speed;
      this.velocity.z = forward.z * speed;
    } else if(this.keyInput.keys.s) {
      this.velocity.x = forward.x * speed * -1;
      this.velocity.z = forward.z * speed * -1;
    } else if(this.keyInput.keys.a) {
      // this.xv = right.x * speed;
      this.velocity.z = -speed;
    } else  if(this.keyInput.keys.d) {
      this.velocity.x = right.x * speed;
      this.velocity.z = -right.z * speed;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    if(this.keyInput.keys.space) {
      this.yv = 0.04;
    }


    this.doWorldCollisions();

    // TODO: switch to this.position and update directly with velocity
    this.y += this.velocity.y;
    this.x += this.velocity.x;
    this.z += this.velocity.z;

    this.updateCamera();

    // TODO: Set with position.copy
    this.bbMesh.position.set(this.x, this.y, this.z);
  }




  updateCamera() {
    this.camera.position.x = this.x;
    this.camera.position.y = this.y + EYE_HEIGHT;
    this.camera.position.z = this.z;
    this.camera.lookAt(new THREE.Vector3(this.x, this.y + EYE_HEIGHT, this.z).add(this.direction));

    // to view BB mesh from behind in x
    this.camera.position.x = this.x;
    this.camera.position.y = this.y + 6;
    this.camera.position.z = this.z;
    this.camera.lookAt(new THREE.Vector3(this.x, this.y, this.z));

  }

  getBox(proposedPos) {
    const pos = proposedPos || new THREE.Vector3(this.x, this.y, this.z);
    return new THREE.Box3(
      new THREE.Vector3(
        pos.x - this.bbWidth * 0.5,
        pos.y,
        pos.z - this.bbDepth * 0.5
      ),
      new THREE.Vector3(
        pos.x + this.bbWidth * 0.5,
        pos.y + this.bbHeight,
        pos.z + this.bbDepth * 0.5
      )
    )
  }

  // player position and block position are both in world space
  // so we can compare them without conversion
  // Use world.solidAt(x,y,z) together with the player AABB
  // to determine if the player is colliding with a block
  doWorldCollisions() {
    this.proposedPosition = new THREE.Vector3(
      this.x + this.velocity.x,
      this.y + this.velocity.y,
      this.z + this.velocity.z
    );

    let overlapX = this.calculateOverlapX();
    if(overlapX !== 0) {
      console.log(overlapX);
      this.proposedPosition.x -= overlapX;
      this.velocity.x = 0;
    }
  }

  // Calculates the penetration of the player's AABB into any blocks
  // in the X axis only
  calculateOverlapX() {
    const box = this.getBox(this.proposedPosition);
    // Accumulate the total overlap
    let overlapX = 0;
    // Only check leading face
    const cellX = this.velocity.x > 0 ?  Math.floor(box.max.x) : Math.floor(box.min.x);
    const startY = Math.floor(box.min.y);
    const endY = Math.floor(box.max.y);
    const startZ = Math.floor(box.min.z);
    const endZ = Math.floor(box.max.z);
    for(let y = startY; y <= endY; y++) {
      for(let z = startZ; z <= endZ; z++) {
        if(this.world.solidAt(cellX, y, z)) {
          box.intersect(this.world.getBlockBox(cellX, y, z));
          overlapX += box.max.x - box.min.x;
        }
      }
    }
    return overlapX;
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
