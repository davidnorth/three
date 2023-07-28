
import * as THREE from 'three';



export function createHudScene() {

  const scene = new THREE.Scene();

  // Crosshairs
  const crosshairMaterial = new THREE.LineBasicMaterial({ color: 0x000000, depthTest: false });
  function addLine(point1, point2) {
    const crosshairGeometry = new THREE.BufferGeometry().setFromPoints([point1, point2])
    const line = new THREE.Line(crosshairGeometry, crosshairMaterial);
    scene.add(line);
  }
  addLine(new THREE.Vector2(2, 0), new THREE.Vector2(10, 0))
  addLine(new THREE.Vector2(-2, 0), new THREE.Vector2(-10, 0))
  addLine(new THREE.Vector2(0, 2), new THREE.Vector2(0, 10))
  addLine(new THREE.Vector2(0, -2), new THREE.Vector2(0, -10))





  return scene;
}