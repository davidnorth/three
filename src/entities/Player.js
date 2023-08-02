import * as THREE from 'three';
import KeyInput from '../utility/KeyInput';

const RENDER_BOX_SIZE = 16;

function round(number, precision) {
  return +number.toFixed(precision)
}

const epsilon = 0.001;

const EYE_HEIGHT = 1.6;
const BB_HEIGHT = 1.8;
// const BB_WIDTH = 0.5;
const BB_WIDTH = 1.0;
// const BB_WIDTH = 1.0;

const MOUSE_SENSITIVITY = 0.003;

const WALK_SPEED = 4.3; // m/s
// const WALK_SPEED = 1.0;


const GRAVITY = 0.003;

const MAX_COLLISION_CHECKS = 2;



class Player {

  constructor(world, scene) {
    this.world = world;
    this.scene = scene;

    this.position = new THREE.Vector3(0, 20, 0);

    this.bbWidth = BB_WIDTH;
    this.bbDepth = BB_WIDTH;
    this.bbHeight = BB_HEIGHT;

    // define a vector representing the direction the player is looking in
    this.direction = new THREE.Vector3(0, -1, 0);
    // direction and magnitude of current movement
    this.velocity = new THREE.Vector3(0, 0, 0);

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1200);
    this.updateCamera();

    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));


    // Raycaster to find which block face we are looking at
    this.eyeRaycaster = new THREE.Raycaster();
    this.eyeRaycaster.far = 50;
    this.eyeRaycaster.near = 0.1;

    this.keyInput = new KeyInput();

    window.player = this;


    const bbGeometry = new THREE.BoxGeometry(RENDER_BOX_SIZE*2, 4, RENDER_BOX_SIZE*2);
    this.bbMesh = new THREE.Mesh(
      bbGeometry,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
      })
    );
    this.bbMesh.position.y = 10;
    // this.scene.add(this.bbMesh);


    // Set initial render box
    this.updateRenderBox();
  }

  // Recenter a box on the player's position
  updateRenderBox() {
    this.renderBox = new THREE.Box2(
      new THREE.Vector2(this.position.x - RENDER_BOX_SIZE, this.position.z - RENDER_BOX_SIZE),
      new THREE.Vector2(this.position.x + RENDER_BOX_SIZE, this.position.z + RENDER_BOX_SIZE)
    )
    this.bbMesh.position.x = this.position.x;
    this.bbMesh.position.z = this.position.z;

  }

  // If player has moved outside of the box, update the box
  // and tell the world to load/unload chunks
  checkRenderBox() {
    if(!this.renderBox.containsPoint(new THREE.Vector2(this.position.x, this.position.z))) {
      this.updateRenderBox();
      this.world.updateLoadedChunks(this.position);
    }
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
    this.velocity.y -= GRAVITY;
    this.doInputs();
    this.doWorldCollisions();
    this.position.add(this.velocity);
    this.updateCamera();
    this.checkRenderBox();
  }

  doInputs() {
    const speed = 0.1;
    const forward = new THREE.Vector3(this.direction.x, 0, this.direction.z).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, forward).normalize();
    if (this.keyInput.keys.w) {
      this.velocity.x = forward.x * speed;
      this.velocity.z = forward.z * speed;
    } else if (this.keyInput.keys.s) {
      this.velocity.x = forward.x * speed * -1;
      this.velocity.z = forward.z * speed * -1;
    } else if (this.keyInput.keys.a) {
      this.velocity.z = -speed;
    } else if (this.keyInput.keys.d) {
      this.velocity.x = right.x * speed;
      this.velocity.z = -right.z * speed;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }
    if (this.keyInput.keys.space) {
      this.velocity.y = 0.06;
    }


  }

  handleMouseDown(event) {
    if (event.button === 2) {
      this.world.setBlock(this.deleteBlockPos.x, this.deleteBlockPos.y, this.deleteBlockPos.z, 0);
    }
    if (event.button === 0) {
      this.world.setBlock(this.newBlockPos.x, this.newBlockPos.y, this.newBlockPos.z, 3);
    }
  }

  handleMouseUp(event) {

  }



  updateCamera() {
    this.camera.position.x = this.position.x;
    this.camera.position.y = this.position.y + EYE_HEIGHT;
    this.camera.position.z = this.position.z;
    this.camera.lookAt(new THREE.Vector3(this.position.x, this.position.y + EYE_HEIGHT, this.position.z).add(this.direction));

    // // to view BB mesh from behind in x
    // this.camera.position.x = this.x;
    // this.camera.position.y = this.y + 6;
    // this.camera.position.z = this.z;
    // this.camera.lookAt(new THREE.Vector3(this.x, this.y, this.z));

  }

  getBox(proposedPos) {
    const pos = proposedPos || this.position;
    return new THREE.Box3(
      new THREE.Vector3(
        round(pos.x - this.bbWidth * 0.5, 2),
        round(pos.y, 2),
        round(pos.z - this.bbDepth * 0.5, 2)
      ),
      new THREE.Vector3(
        round(pos.x + this.bbWidth * 0.5, 2),
        round(pos.y + this.bbHeight, 2),
        round(pos.z + this.bbDepth * 0.5, 2)
      )
    )
  }

  // player position and block position are both in world space
  // so we can compare them without conversion
  // Use world.solidAt(x,y,z) together with the player AABB
  // to determine if the player is colliding with a block
  doWorldCollisions() {
    this.proposedPosition = new THREE.Vector3(
      round(this.position.x + this.velocity.x, 2),
      round(this.position.y + this.velocity.y, 2),
      round(this.position.z + this.velocity.z, 2)
    );

    let overlaps = this.calculateOverlaps();
    if (overlaps.x.total <= 0 && overlaps.y.total <= 0 && overlaps.z.total <= 0) {
      return;
    }


    for (let i = 0; i < 3; i++) {
      overlaps = this.calculateOverlaps();

      if (overlaps.x.total <= 0 && overlaps.y.total <= 0 && overlaps.z.total <= 0) {
        continue;
      }

      overlaps.x.total += epsilon;
      overlaps.y.total += epsilon;
      overlaps.z.total += epsilon;



      let sortedOverlaps = Object.keys(overlaps)
        .map((k) => ({ axis: k, min: overlaps[k].min, total: overlaps[k].total }))
        .sort((a, b) => Math.abs(a.total) - Math.abs(b.total))
        .filter((overlap) => Math.abs(overlap.total) > 0);
      if (sortedOverlaps.length) {
        const axis = sortedOverlaps[0].axis;
        if (this.velocity[sortedOverlaps[0].axis] > 0) {
          this.proposedPosition[sortedOverlaps[0].axis] = Math.floor(this.proposedPosition[axis]) + this.bbWidth * 0.5;
        } else if (this.velocity[sortedOverlaps[0].axis] < 0) {
          if (axis === 'y') {
            this.proposedPosition[sortedOverlaps[0].axis] = Math.ceil(this.proposedPosition.y);
          } else {
            this.proposedPosition[sortedOverlaps[0].axis] = Math.floor(this.proposedPosition[axis]) + this.bbWidth * 0.5;
          }
          this.velocity[axis] = 0;
        }
      }
    }

    this.position.copy(this.proposedPosition);
  }

  calculateOverlaps() {
    let box = this.getBox(this.proposedPosition);

    const overlaps = {
      x: { total: 0, min: 9 },
      y: { total: 0, min: 9 },
      z: { total: 0, min: 9 }
    }

    const startX = Math.floor(box.min.x + epsilon);
    const endX = Math.floor(box.max.x - epsilon);
    const startY = Math.floor(box.min.y + epsilon);
    const endY = Math.floor(box.max.y - epsilon);
    const startZ = Math.floor(box.min.z + epsilon);
    const endZ = Math.floor(box.max.z - epsilon);
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        for (let z = startZ; z <= endZ; z++) {
          if (this.world.solidAt(x, y, z)) {
            // box is mutated by intersect so we need to get a fresh one for each world block we check
            box = this.getBox();
            box.intersect(this.world.getBlockBox(x, y, z));

            overlaps.x.total += box.max.x - box.min.x;
            overlaps.x.min = Math.min(overlaps.x.min, Math.abs(box.max.x - box.min.x));

            overlaps.y.total += box.max.y - box.min.y;
            overlaps.y.min = Math.min(overlaps.y.min, Math.abs(box.max.y - box.min.y));

            overlaps.z.total += box.max.z - box.min.z;
            overlaps.z.min = Math.min(overlaps.z.min, Math.abs(box.max.z - box.min.z));

          }
        }
      };
    }
    return overlaps;
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
