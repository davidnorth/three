import * as THREE from 'three';
import { createDebugScene } from './scenes/debug';
import { createHudScene } from './scenes/hud';
import MainScene from './scenes/MainScene';
import GameRenderer from './render/GameRenderer';
import { customizeMeshLambertShader } from './render/shaders';
import World from './world/World';
import Player from './entities/Player';
import GUI from 'lil-gui'; 
import Stats from 'stats.js';

import { RENDER_DISTANCE } from './constants';


const gui = new GUI();
const scene = new MainScene();
const debugScene = createDebugScene();
const hudScene = createHudScene();
const world = new World(scene);
const player = new Player(world, scene);
const guiCamera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 1, 1000 );
guiCamera.position.z = 10;
const gameRenderer = new GameRenderer({ scene, camera: player.camera, debugScene, hudScene, guiCamera});

gui.add(scene.sunLight.position, 'x', -100, 100).name('sun x');
gui.add(scene.sunLight.position, 'y', -100, 100).name('sun y');

let pointerLock = false;

const textureLoader = new THREE.TextureLoader();
textureLoader.load('/blocks/blocks.png', function(texture){
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  const blockMaterial = new THREE.MeshLambertMaterial({
    map: texture,
    wireframe: false,
  });
  blockMaterial.onBeforeCompile = customizeMeshLambertShader;
  gui.add(blockMaterial, 'wireframe')
  world.blockMaterial = blockMaterial;

  for(let x=-RENDER_DISTANCE; x<RENDER_DISTANCE; x++) {
    for(let z=-RENDER_DISTANCE; z<RENDER_DISTANCE; z++) {
      world.addNewChunk(x, z);
    }
  }
  //world.addNewChunk(0, 0);

  // request pointer lock

  gameRenderer.renderer.domElement.addEventListener('click', function(e) {
    e.target.requestPointerLock();
    pointerLock = true;
  });

  animate()
});


document.addEventListener('mousemove', function (event) {
  if (pointerLock) {
    const dx = event.movementX || event.mozMovementX || 0;
    const dy = event.movementY || event.mozMovementY || 0;
    player.lookAround(dx, dy);
  }
});



window.debugVisible = true;
gui.add(self, 'debugVisible');


var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );


const clock = new THREE.Clock();

function animate() {
  stats.begin();
  const delta = clock.getDelta(); 
  // TODO: Instead update all entities
  player.update(delta);
  scene.update(delta, world, player);
  gameRenderer.bokehPass.uniforms.focus.value = player.eyeRayIntersectDistance;
  gameRenderer.render();
  stats.end();
  requestAnimationFrame(animate);

}


