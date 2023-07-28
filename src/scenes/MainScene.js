import * as THREE from 'three';
import { BG_COLOR } from '../constants'

import Sun from '../lights/Sun';


class MainScene extends THREE.Scene {

  constructor() {
    super();

    this.fog = new THREE.FogExp2( BG_COLOR, 0.004);
    this.sun = new Sun();
    this.add(this.sun);

    this.ambientLight = new THREE.AmbientLight( 0xC4E9FF, 0.7 ); 
    this.add( this.ambientLight );

    // lines for each chunk boundary
    // a white line material
    const boundaryLine = new THREE.LineBasicMaterial({ color: 0xffffff });
    // TODO: refer to the world object instead
    const RENDER_DISTANCE = 2;
    for(let x=-RENDER_DISTANCE; x<RENDER_DISTANCE; x++) {
      for(let z=-RENDER_DISTANCE; z<RENDER_DISTANCE; z++) {
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x*16, 0, z*16),
          new THREE.Vector3(x*16, 64, z*16)
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