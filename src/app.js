import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {axisLines} from './render/debug';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import Chunk from './world/Chunk';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { contrastShader } from './render/shaders';

THREE.ColorManagement.enabled = true;


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.x = 35;
camera.position.y = 50;
camera.position.z = 60;
camera.lookAt(new THREE.Vector3(8, 16, 8));


const textureLoader = new THREE.TextureLoader();
textureLoader.load('/blocks/blocks.png', function(texture){
  console.log('Texture loaded')
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  // texture.colorSpace = THREE.LinearSRGBColorSpace;
  // THREE.NoColorSpace is the default. Textures containing color data should be annotated with 
  // THREE.SRGBColorSpace or THREE.LinearSRGBColorSpace.0


  const blockMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    shininess: 0,
    wireframe: false,
  });
  const chunk = new Chunk(0,0,0)
  chunk.generateBlocks();
  chunk.generateMesh();
  chunk.mesh.material = blockMaterial;
  scene.add(chunk.mesh);
});




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
const light = new THREE.AmbientLight( 0xD6F0FF, 0.5 ); 
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


const controls = new OrbitControls( camera, renderer.domElement );

function animate(delta) {
	requestAnimationFrame( animate );
  composer.render();
}

animate()
