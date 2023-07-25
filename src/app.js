import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

import {axisLines} from './render/debug';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import Chunk from './world/Chunk';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { contrastShader } from './render/shaders';
import GUI from 'lil-gui'; 

const gui = new GUI();

THREE.ColorManagement.enabled = true;

let blockMaterial;

let defaultChunk;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.x = 8;
camera.position.y = 40;
camera.position.z = 30;
camera.lookAt(new THREE.Vector3(8, 16, 8));

// Raycaster to find which block face we are looking at
const raycaster = new THREE.Raycaster();
raycaster.far = 15;
raycaster.near = 0.1;

let newBlockPos;
let deleteBlockPos;

// This function will create a raycast from the camera's position along its viewing vector
function castRayFromCamera() {
  // The camera's viewing vector is along the negative z-axis in its local space.
  // So, we create a vector for that direction and transform it to world space.
  let direction = new THREE.Vector3(0, 0, -1);
  direction.transformDirection(camera.matrixWorld);
  
  // Now set the raycaster to the camera's position and the calculated direction
  raycaster.set(camera.position, direction);

  // Gather up which objects to try to raycast against based on
  // a set of conditions
  const raycastList = [];
  scene.traverse(c => {
    if (c.isMesh && c.enableRaycast) {
      raycastList.push(c);
    }
  });

  // Calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(raycastList);

  // distance: The distance from the origin of the ray to the intersection.
  // point: The point of intersection, represented as a THREE.Vector3.
  // face: The intersected face of the geometry, represented as a THREE.Face3.
  // faceIndex: The index of the intersected face of the geometry.
  // object: The intersected object (THREE.Mesh).
  // uv: The UV coordinates at the intersection point. This is useful for applying texture maps.

  if(intersects.length){
    intersects[0].point

    // create a copy of the intserect point moved forward along the face normal by 0.5
    newBlockPos = intersects[0].point
      .clone()
      .add(
        intersects[0].face.normal.clone().multiplyScalar(0.5)
      );  
    // snap blockPos position to the nearest whole numbers
    newBlockPos.x = Math.floor(newBlockPos.x);
    newBlockPos.y = Math.floor(newBlockPos.y);
    newBlockPos.z = Math.floor(newBlockPos.z);

    deleteBlockPos = intersects[0].point
      .clone()
      .add(
        intersects[0].face.normal.clone().multiplyScalar(-0.5)
      );  
    // snap blockPos position to the nearest whole numbers
    deleteBlockPos.x = Math.floor(deleteBlockPos.x);
    deleteBlockPos.y = Math.floor(deleteBlockPos.y);
    deleteBlockPos.z = Math.floor(deleteBlockPos.z);




    newBlockPositionCube.position.copy(newBlockPos);

    // get the corners of the intersect face
    const normal = intersects[0].face.normal;


  }  else {
    hitPoint.position.set(1000, 1000, 1000);
  }

}


// handle mouse left click
document.addEventListener('contextmenu', function (event) {

//    if (newBlockPos && defaultChunk) {
//     defaultChunk.setBlock(newBlockPos.x, newBlockPos.y, newBlockPos.z, 2)
//     defaultChunk.generateMesh()
//  }

  if (deleteBlockPos && defaultChunk) {
    defaultChunk.setBlock(deleteBlockPos.x, deleteBlockPos.y, deleteBlockPos.z, 0)
    defaultChunk.generateMesh()
  }

  

  
}
)





const textureLoader = new THREE.TextureLoader();
textureLoader.load('/blocks/blocks.png', function(texture){
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  blockMaterial = new THREE.MeshLambertMaterial({
    map: texture,
    wireframe: false,
  });
  gui.add(blockMaterial, 'wireframe')
  const chunk = new Chunk(0,0,0)
  chunk.generateBlocks();
  chunk.generateMesh();
  chunk.mesh.material = blockMaterial;
  scene.add(chunk.mesh);
  defaultChunk = chunk;
});


// add a small red sphere
const geometry = new THREE.SphereGeometry( 0.1, 32, 32 );
const material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
const hitPoint = new THREE.Mesh( geometry, material );
hitPoint.position.x = 8;
hitPoint.position.y = 16;
hitPoint.position.z = 8;
scene.add( hitPoint );

// a cube 1x1x1 with a semi transparent green material
const cubeGeometry = new THREE.BoxGeometry( 1, 1, 1 );
cubeGeometry.translate(+0.5, +0.5, +0.5);
const cubeMaterial = new THREE.MeshLambertMaterial( {color: 0x00ff00, transparent: true, opacity: 0.5} );
const newBlockPositionCube = new THREE.Mesh( cubeGeometry, cubeMaterial );
scene.add( newBlockPositionCube );




const sun = new THREE.DirectionalLight( 0xFFF2D6, 1);
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
const light = new THREE.AmbientLight( 0xC4E9FF, 0.7 ); 
scene.add( light );



const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor(0x9999ff); 
// renderer.gammaOutput = true;
// renderer.gammaFactor = 5.2; // Use 2.2 for sRGB textures
document.body.appendChild( renderer.domElement );



// Debug elements
axisLines(scene);


// Usage
var composer = new EffectComposer( renderer );
composer.addPass( new RenderPass( scene, camera ) );
var contrastPass = new ShaderPass( contrastShader );
contrastPass.uniforms.contrast.value = 0.9;  // Change contrast here
composer.addPass( contrastPass );


// setup first person controls
// const controls = new FirstPersonControls(camera, renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);


function animate(delta) {
	requestAnimationFrame( animate );

  castRayFromCamera();

  composer.render();
}

animate()
