import * as THREE from 'three';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { contrastShader, customizeMeshLambertShader } from './shaders';
import { BG_COLOR } from '../constants';

class GameRenderer {

  constructor({ scene, camera, debugScene, hudScene, guiCamera}) {

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(BG_COLOR);
    document.body.appendChild(this.renderer.domElement);

    // Create composers for both scenes
    this.mainComposer = new EffectComposer(this.renderer);
    this.overlayComposer = new EffectComposer(this.renderer);

    // Add render pass for the main scene
    this.mainComposer.addPass(new RenderPass(scene, camera));

    this.bokehPass = new BokehPass(scene, camera, {
      focus: 50,
      aperture: 0.0003,
      maxblur: 0.01,
      width: window.innerWidth,
      height: window.innerHeight
    });
    this.mainComposer.addPass(this.bokehPass);

    // Add contrast shader
    const contrastPass = new ShaderPass(contrastShader);
    contrastPass.uniforms.contrast.value = 1.0;
    this.mainComposer.addPass(contrastPass);

    // Add render pass for the overlay scene
    var overlayRenderPass = new RenderPass(debugScene, camera);
    overlayRenderPass.clear = false;
    this.overlayComposer.addPass(overlayRenderPass);

    this.guiComposer = new EffectComposer(this.renderer);
    // Add render pass for the GUI scene
    var guiRenderPass = new RenderPass(hudScene, guiCamera);
    guiRenderPass.clear = false;
    this.guiComposer.addPass(guiRenderPass);

  }



  render() {
    this.renderer.clear();
    this.mainComposer.render();
    this.renderer.clearDepth();
    if (window.debugVisible) {
      // Render the overlay scene
      this.overlayComposer.render();
      this.renderer.clearDepth();
    }
    this.guiComposer.render();
  }

}

export default GameRenderer;