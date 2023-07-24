import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Define the six possible normal vectors
const faceNormals = {
  up: new THREE.Vector3(0, 1, 0),
  down: new THREE.Vector3(0, -1, 0),
  right: new THREE.Vector3(1, 0, 0),
  left: new THREE.Vector3(-1, 0, 0),
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1)
};

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

function isSolid(blockId){
  return blockId === 1;
}

// x represents left to right, z forwards and backwards and y up and down
// chunk is flat array of block ids that represents a 3 dimensional grid of blocks
// this function takes x, y, z coordinates and returns the index of the block in the chunk array
function getBlockIndex(x, y, z) {
  return x + CHUNK_WIDTH * (y + CHUNK_HEIGHT * z);
}

// for now let's just fill the first layer of the chunk with blocks
for (let x = 0; x < CHUNK_WIDTH; x++) {
  for (let z = 0; z < CHUNK_WIDTH; z++) {
    chunk[getBlockIndex(x, 0, z)] = 1;
  }
}


function setBlockAt(chunk, x, y, z, blockId) {
  chunk[getBlockIndex(x, y, z)] = blockId;
}

setBlockAt(chunk, 0, 1, 7, 1);
setBlockAt(chunk, 1, 1, 7, 1);
setBlockAt(chunk, 4, 1, 5, 1);


// // now fill just a few random blocks on the next layer
// chunk[getBlockIndex(1, 1, 1)] = 1;
// chunk[getBlockIndex(2, 1, 1)] = 1;
// chunk[getBlockIndex(3, 1, 1)] = 1;
// chunk[getBlockIndex(4, 1, 1)] = 1;
// chunk[getBlockIndex(5, 1, 1)] = 1;
// chunk[getBlockIndex(6, 1, 1)] = 1;

// Load a texture
// const textureLoader = new THREE.TextureLoader();
// const texture = textureLoader.load('path_to_your_texture.png');


// geometry holds all faces for a chunk
const geometry = new THREE.BufferGeometry();


const vertsTmp = [];
const indicesTmp = [];
const normalsTmp = [];

let vertIndex = 0;
// iterate through each block in the chunk
for (let x = 0; x < CHUNK_WIDTH; x++) {
  for (let y = 0; y < CHUNK_HEIGHT; y++) {
    for (let z = 0; z < CHUNK_WIDTH; z++) {
      // get the block id of the current block
      const blockId = chunk[getBlockIndex(x, y, z)];
      // if the block is solid, add verticies and indices to the geometry for its top face only



      if (isSolid(blockId)) {

        // ensure that the top face is adjacent to a non-solid block
        if (!isSolid(chunk[getBlockIndex(x, y + 1, z)])) {
          // Add verts
          vertsTmp.push(x, y+1, z); // front left
          vertsTmp.push(x, y+1, z+1); // back left
          vertsTmp.push(x+1, y+1, z+1); // back right
          vertsTmp.push(x+1, y+1, z); // front right
          // Set face normal up
          for (let i = 0; i < 4; i++) {
            normalsTmp.push(faceNormals.up.x, faceNormals.up.y, faceNormals.up.z);
          }
          // Add tri faces
          indicesTmp.push(vertIndex, vertIndex + 1, vertIndex + 2);
          indicesTmp.push(vertIndex, vertIndex + 2, vertIndex + 3);
          vertIndex += 4;
        }

      }
    }
  }
}


// // Create a Float32Array to hold the UV data
// const uvs = new Float32Array([
//   0.0, 0.0,
//   1.0, 0.0,
//   1.0, 1.0,
//   0.0, 1.0
// ]);


// Assign the vertex, index, and UV data to the geometry
geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertsTmp), 3));
geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indicesTmp), 1));
geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normalsTmp, 3));
// geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));


const blockMaterial = new THREE.MeshPhongMaterial( {
  color: 0x33ff33,
  specular: 0x101010,
  flatShading: true,
  wireframe: true,
  shininess: 0,
} )

// Create a mesh with the geometry and material
const mesh = new THREE.Mesh(geometry, blockMaterial);

mesh.castShadow = true;
mesh.receiveShadow = true;
mesh.position.set(0, 0, -8);

scene.add(mesh);




const pointLight = new THREE.PointLight( 0xffffff, 1 );
pointLight.position.set( 10, 10, 10 );
scene.add(pointLight);
pointLight.castShadow = true;

const light = new THREE.AmbientLight( 0x6666ff ); // soft white light
scene.add( light );





// Create a material for the lines
const redLine = new THREE.LineBasicMaterial({ color: 0xff0000 });
const greenLine = new THREE.LineBasicMaterial({ color: 0x00ff00 });
const blueLine = new THREE.LineBasicMaterial({ color: 0x0000ff });
// Create a geometry for the x-axis
const geometryX = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1, 0, 0)
]);
const lineX = new THREE.Line(geometryX, redLine);
scene.add(lineX);
// Create a geometry for the y-axis
const geometryY = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 1, 0)
]);
const lineY = new THREE.Line(geometryY, greenLine);
scene.add(lineY);
// Create a geometry for the z-axis
const geometryZ = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 1)
]);
const lineZ = new THREE.Line(geometryZ, blueLine);
scene.add(lineZ);



const renderer = new THREE.WebGLRenderer({ antialias: true});
renderer.shadowMap.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor(0xeeeeee); // white color
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );


function animate() {

	requestAnimationFrame( animate );
	renderer.render( scene, camera );

}
animate();

