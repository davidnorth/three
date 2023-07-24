import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { meshChunk } from './render/mesher';
import {axisLines} from './render/debug';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

import { generate } from './world/generator';



const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.x = 70;
camera.position.y = 115;
camera.position.z = 122;
camera.lookAt(new THREE.Vector3(8, 16, 8));

window.cam = camera;

CHUNK_WIDTH = 16;
CHUNK_HEIGHT = 64;
BLOCKS_PER_CHUNK = CHUNK_WIDTH * CHUNK_WIDTH * CHUNK_HEIGHT;



// generate 5 x 5 grid of chunks centered on 0,0
for(let x = -4; x <= 4; x++) {
  for(let z = -4; z <= 4; z++) {

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

    // iterate through each block in the chunk and call the generator function
    // to determine its block id
    for (let bx = 0; bx < CHUNK_WIDTH; bx++) {
      for (let by = 0; by < CHUNK_HEIGHT; by++) {
        for (let bz = 0; bz < CHUNK_WIDTH; bz++) {
          const blockId = generate(bx + x*CHUNK_WIDTH, by, bz + z*CHUNK_WIDTH);
          setBlockAt(chunk, bx, by, bz, blockId);
        }
      }
    }

    const mesh = meshChunk(chunk);
    mesh.position.set(x * CHUNK_WIDTH, 0, z * CHUNK_WIDTH);
    scene.add(mesh);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/blocks/blocks.png', function(texture){
      console.log('texture loaded', texture)
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      const blockMaterial = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 0,
        wireframe: false,
      });
      mesh.material = blockMaterial;
    });

  }
}



const sun = new THREE.DirectionalLight( 0xFFE5AD, 1.6);
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


const light = new THREE.AmbientLight( 0x9999ff, 0.8 ); 
scene.add( light );



const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor(0x9999ff); 
document.body.appendChild( renderer.domElement );





const contrastShader = {
  uniforms: {
    "tDiffuse": { type: "t", value: null },
    "contrast": { type: "f", value: 1.0 }
  },

  vertexShader: [
    "varying vec2 vUv;",

    "void main() {",

    "vUv = uv;",
    "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

    "}"
  ].join("\n"),

  fragmentShader: [
    "uniform sampler2D tDiffuse;",
    "uniform float contrast;",

    "varying vec2 vUv;",

    "void main() {",
    "vec4 color = texture2D(tDiffuse, vUv);",
    "gl_FragColor = vec4(((color.rgb - 0.5) * max(contrast, 0.0)) + 0.5, color.a);",
    "}"
  ].join("\n")
};

// Usage
var composer = new EffectComposer( renderer );
composer.addPass( new RenderPass( scene, camera ) );

var contrastPass = new ShaderPass( contrastShader );
contrastPass.uniforms.contrast.value = 0.9;  // Change contrast here
composer.addPass( contrastPass );



const controls = new OrbitControls( camera, renderer.domElement );


axisLines(scene);

function animate(delta) {
	requestAnimationFrame( animate );
  composer.render();
}

animate()

