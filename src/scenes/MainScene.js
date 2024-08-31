import * as THREE from 'three';
import { BG_COLOR } from '../constants'
import { skyShader } from '../render/shaders';

import Sun from '../lights/Sun';


class MainScene extends THREE.Scene {

  constructor() {
    super();

    this.fog = new THREE.FogExp2( BG_COLOR, 0.006);
    this.sunLight = new Sun();
    this.add(this.sunLight);
    this.add( this.sunLight.target );

    this.ambientLight = new THREE.AmbientLight( 0xC4E9FF, 0.7 ); 
    this.add( this.ambientLight );


    // A flat plain representing water
    this.water = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000),
      new THREE.MeshPhongMaterial({
        color: 0x3333ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        fog: false,
      })
    );
    this.water.castShadow = false;
    this.water.receiveShadow = true;
    this.water.rotation.x = Math.PI / 2;
    this.water.position.y = 30.1;
    //this.add(this.water);


    // The sun
    this.sunLightSphere = new THREE.Mesh(
      new THREE.SphereGeometry(10.2, 16, 16),
      new THREE.MeshPhongMaterial({ 
        color: 0x000000,
        emissive: 0xF8EC8D,
        fog: false,
        emissiveIntensity: 5,
      })
    );
    // calculate a position for the sun that's based on the sunLight position
    // but further away along the sunLight vector
    const sunPosition = this.sunLight.position.clone();
    sunPosition.multiplyScalar(8);
    this.sunLightSphere.position.copy(sunPosition);
    this.add(this.sunLightSphere);


    // The sky
    this.skySphere = new THREE.Mesh(
      new THREE.SphereGeometry(1000, 16, 16),
      new THREE.ShaderMaterial(skyShader)
    );
    // turn sphere geometry inside out so we can shade the inside of the sphere
    this.add(this.skySphere);

  }

  update(delta, world, player) {
    this.skySphere.position.x = player.position.x;
    this.skySphere.position.z = player.position.z;

    this.sunLight.position.set(player.position.x + 80, 50, player.position.z + 50);
    this.sunLight.target.position.set(player.position.x, 0, player.position.z);

    const lightDirection = new THREE.Vector3();
    lightDirection.subVectors(this.sunLight.target.position, this.sunLight.position);
    lightDirection.normalize();

    const sunPosition = this.sunLight.position.clone();
    sunPosition.add(lightDirection.multiplyScalar(-500));
    this.sunLightSphere.position.copy(sunPosition);
  }

  chunkBoundaries() {
    // lines for each chunk boundary
    // a white line material
    const boundaryLine = new THREE.LineBasicMaterial({ color: 0xffffff });
    // TODO: refer to the world object instead
    const RENDER_DISTANCE = 2;
    for (let x = -RENDER_DISTANCE; x < RENDER_DISTANCE; x++) {
      for (let z = -RENDER_DISTANCE; z < RENDER_DISTANCE; z++) {
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x * 16, 0, z * 16),
          new THREE.Vector3(x * 16, 64, z * 16)
        ]);
        const line = new THREE.Line(lineGeometry, boundaryLine));
        this.add(line);
      }
    }
  }

  getRaycastMeshes() {
    const raycastList = [];
    this.traverse(c => {
      if (c.isMesh && c.enableRaycast) {
        raycastList.push(c);
      }
    });
    return raycastList;
  }


} 

export default MainScene;