
EYE_HEIGHT = 1.5;
BB_HEIGHT = 1.7;
BB_WIDTH = 0.6;
BB_HALF_WIDTH = BB_WIDTH/2;

GRAVITY = 0.01;

class Player {

  constructor(world) {
    this.x = 0;
    this.y = 40;
    this.z = 0;
    this.xv = 0;
    this.yv = 0;
    this.zv = 0;


    // define a vector representing the direction the player is looking in
    this.direction = new THREE.Vector3(0, 0, -1);

    this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.camera.position.x = this.x;
    this.camera.position.y = this.y + EYE_HEIGHT;
    this.camera.position.z = this.z;
    this.updateCamera();
  }

  update() {
    yv -= GRAVITY;

    this.x += this.xv;
    this.y += this.yv;
    this.z += this.zv;
    this.updateCamera();
  }

  updateCamera() {
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

}

export default Player;
