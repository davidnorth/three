import * as THREE from 'three';


export function createDebugScene() {
  const scene = new THREE.Scene();

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







  return scene;
}