import * as THREE from 'three';

const scene = new THREE.Scene();
const scene2 = new THREE.Scene();


const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 30;
camera.lookAt(new THREE.Vector3(0,0,0));

const sun = new THREE.DirectionalLight( 0xFFF2D6, 1);
sun.position.set( 50, 50, 50);
scene.add(sun);

const sun2 = new THREE.DirectionalLight( 0xFFF2D6, 1);
scene2.add(sun2);


const s1 = new THREE.SphereGeometry( 5, 32, 32 );
const s1Material = new THREE.MeshPhongMaterial( {color: 0xff0000} );
const sphere = new THREE.Mesh( s1, s1Material );
sphere.position.x = - 10
scene.add(sphere)

const s2 = new THREE.SphereGeometry( 5, 32, 32 );
const s2material = new THREE.MeshPhongMaterial( {color: 0x0000ff} );
const sphere2 = new THREE.Mesh( s2, s2material );
sphere2.position.x = 10
scene2.add(sphere2);

const renderer = new THREE.WebGLRenderer()
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.autoClear = false;
document.body.appendChild( renderer.domElement );




function animate(delta) {
  requestAnimationFrame(animate);
  renderer.clear();
  renderer.render( scene, camera );
  renderer.clearDepth();
  renderer.render( scene2, camera );
}

animate()
