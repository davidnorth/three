import * as THREE from 'three';

import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';0

EYE_HEIGHT = 1.5;
BB_HEIGHT = 1.7;
BB_WIDTH = 0.6;
BB_HALF_WIDTH = BB_WIDTH / 2;

GRAVITY = 0.01;

class Player {

  constructor(world, scene) {
    this.world = world;
    this.scene = scene;

    this.x = 8;
    this.y = 60;
    this.z = 8;
    this.xv = 0;
    this.yv = 0;
    this.zv = 0;


    // define a vector representing the direction the player is looking in
    this.direction = new THREE.Vector3(0, -1, 0);

    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.updateCamera();

    this.controls = new OrbitControls(this.camera, document.body);

    // Raycaster to find which block face we are looking at
    this.eyeRaycaster = new THREE.Raycaster();
    this.eyeRaycaster.far = 50;
    this.eyeRaycaster.near = 0.1;
  }

  update() {
    this.castEyeRay();
    // this.yv -= GRAVITY;
    this.x += this.xv;
    this.y += this.yv;
    this.z += this.zv;
    // this.updateCamera();
  }

  updateCamera() {
    this.camera.position.x = this.x;
    this.camera.position.y = this.y + EYE_HEIGHT;
    this.camera.position.z = this.z;
    this.camera.lookAt(new THREE.Vector3(this.x, this.y + EYE_HEIGHT, this.z).add(this.direction));
  }

  // Calculate the AABB where the player's feed at at the center
  getAABB() {
    return {
      x1: this.x - BB_HALF_WIDTH,
      x2: this.x + BB_HALF_WIDTH,
      y1: this.y,
      y2: this.y + BB_HEIGHT,
      z1: this.z - BB_HALF_WIDTH,
      z2: this.z + BB_HALF_WIDTH,
    }
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
