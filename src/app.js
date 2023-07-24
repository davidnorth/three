import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { meshChunk } from './render/mesher';
import {axisLines} from './render/debug';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.x =0 ;
camera.position.y = 5;
camera.position.z = 20;
camera.lookAt(new THREE.Vector3(0, 0, 0));

CHUNK_WIDTH = 8;
CHUNK_HEIGHT = 8;
BLOCKS_PER_CHUNK = CHUNK_WIDTH * CHUNK_WIDTH * CHUNK_HEIGHT;

const chunk = new Uint8Array(BLOCKS_PER_CHUNK);

// x represents left to right, z forwards and backwards and y up and down
// chunk is flat array of block ids that represents a 3 dimensional grid of blocks
// this function takes x, y, z coordinates and returns the index of the block in the chunk array
function getBlockIndex(x, y, z) {
  return x + CHUNK_WIDTH * (y + CHUNK_HEIGHT * z);
}

function setBlockAt(chunk, x, y, z, blockId) {
  chunk[getBlockIndex(x, y, z)] = blockId;
}

// for now let's just fill the first layer of the chunk with blocks
for (let x = 0; x < CHUNK_WIDTH; x++) {
  for (let z = 0; z < CHUNK_WIDTH; z++) {
    chunk[getBlockIndex(x, 0, z)] = 1;
  }
}
setBlockAt(chunk, 0, 1, 7, 2);
setBlockAt(chunk, 1, 1, 7, 3);
setBlockAt(chunk, 4, 1, 5, 1);
setBlockAt(chunk, 4, 6, 4, 1);


const mesh = meshChunk(chunk);
mesh.position.set(0, 0, -8);
scene.add(mesh);




const sun = new THREE.DirectionalLight( 0xFFD457, 1.3);
sun.position.set( 50, 50, 50);
sun.shadow.bias = 0.0001;
sun.castShadow = true;

// Define the resolution of the shadow map
sun.shadow.mapSize.width = 1024 * 2;
sun.shadow.mapSize.height = 1024 * 2;

// Define the visible area of the projected shadow
sun.shadow.camera.left = -20;
sun.shadow.camera.right = 20;
sun.shadow.camera.top = 20;
sun.shadow.camera.bottom = -20;

// Set the near and far plane of the shadow camera
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 500;

scene.add(sun);


const light = new THREE.AmbientLight( 0x9999ff, 0.5 ); 
scene.add( light );






const renderer = new THREE.WebGLRenderer({ antialias: true});
renderer.shadowMap.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor(0x9999ff); // white color
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );


axisLines(scene);

function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
}

animate()


const textureLoader = new THREE.TextureLoader();
textureLoader.load('/blocks/blocks.png', function(texture){
  console.log('texture loaded', texture)
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  const blockMaterial = new THREE.MeshPhongMaterial({
    map: texture,
    wireframe: false,
  });
  mesh.material = blockMaterial;
});
