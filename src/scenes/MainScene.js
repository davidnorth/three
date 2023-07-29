import * as THREE from 'three';
import { BG_COLOR } from '../constants'
import { skyShader } from '../render/shaders';

import Sun from '../lights/Sun';


class MainScene extends THREE.Scene {

  constructor() {
    super();

    this.fog = new THREE.FogExp2( BG_COLOR, 0.008);
    this.sunLight = new Sun();
    this.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight( 0xC4E9FF, 0.7 ); 
    this.add( this.ambientLight );



    // The sun
    const sunLightSphere = new THREE.Mesh(
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
    sunLightSphere.position.copy(sunPosition);
    this.add(sunLightSphere);


    // The sky
    const skySphere = new THREE.Mesh(
      new THREE.SphereGeometry(1000, 16, 16),
      new THREE.ShaderMaterial(skyShader)
    );
    // turn sphere geometry inside out so we can shade the inside of the sphere
    this.add(skySphere);





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