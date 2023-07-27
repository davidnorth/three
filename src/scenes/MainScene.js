import * as THREE from 'three';
import { BG_COLOR } from '../constants'

import Sun from '../lights/Sun';


class MainScene extends THREE.Scene {

  constructor() {
    super();

    this.fog = new THREE.FogExp2( BG_COLOR, 0.010);
    this.sun = new Sun();
    this.add(this.sun);

    this.ambientLight = new THREE.AmbientLight( 0xC4E9FF, 0.7 ); 
    this.add( this.ambientLight );

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