import * as THREE from 'three';

class Sun extends THREE.DirectionalLight {

  // call parent in constructor
  constructor() {
    super(0xF8EC8D, 1);
    this.position.set(80, 50, 50);
    this.shadow.bias = 0.0001;
    this.castShadow = true;
    // Define the resolution of the shadow map
    this.shadow.mapSize.width = 1024 * 2;
    this.shadow.mapSize.height = 1024 * 2;
    // Define the visible area of the projected shadow
    this.shadow.camera.left = -20;
    this.shadow.camera.right = 20;
    this.shadow.camera.top = 20;
    this.shadow.camera.bottom = -20;
    // Set the near and far plane of the shadow camera
    this.shadow.camera.near = 0.5;
    this.shadow.camera.far = 500;
  }
}

export default Sun;