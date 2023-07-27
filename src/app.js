import * as THREE from 'three';
import { createDebugScene } from './scenes/debug';
import { createHudScene } from './scenes/hud';
import MainScene from './scenes/MainScene';
import GameRenderer from './render/GameRenderer';
import { customizeMeshLambertShader } from './render/shaders';
import World from './world/World';
import Player from './entities/Player';
import GUI from 'lil-gui'; 


const gui = new GUI();
const scene = new MainScene();
const debugScene = createDebugScene();
const hudScene = createHudScene();
const world = new World(scene);
const player = new Player(world, scene);
const guiCamera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 1, 1000 );
guiCamera.position.z = 10;
const gameRenderer = new GameRenderer({ scene, camera: player.camera, debugScene, hudScene, guiCamera});

gui.add(scene.sun.position, 'x', -100, 100).name('sun x');
gui.add(scene.sun.position, 'y', -100, 100).name('sun y');

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
  const chunk = world.addNewChunk(0, 0);
  animate()
});




window.debugVisible = false;
gui.add(self, 'debugVisible');


function animate() {
  requestAnimationFrame(animate);
  // TODO: Instead update all entities
  player.update();
  gameRenderer.bokehPass.uniforms.focus.value = player.eyeRayIntersectDistance;
  gameRenderer.render();
}
