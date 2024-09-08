import * as THREE from 'three';

export const contrastShader = {
  uniforms: {
    "tDiffuse": { type: "t", value: null },
    "contrast": { type: "f", value: 1.0 }
  },

  vertexShader: [
    "varying vec2 vUv;",

    "void main() {",

    "vUv = uv;",
    "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

    "}"
  ].join("\n"),

  fragmentShader: [
    "uniform sampler2D tDiffuse;",
    "uniform float contrast;",

    "varying vec2 vUv;",

    "void main() {",
    "vec4 color = texture2D(tDiffuse, vUv);",
    "gl_FragColor = vec4(((color.rgb - 0.5) * max(contrast, 0.0)) + 0.5, color.a);",
    "}"
  ].join("\n")
};


    




export function customizeMeshLambertShader(shader) {

  shader.vertexShader = `
       attribute float lightValue;
       attribute uint packed;
       varying float vLightValue;

       // Unpacking masks
       #define SIX_BITS 63u
       #define FIVE_BITS 31u
       #define THREE_BITS 7u
     ` + shader.vertexShader;

  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `
      // Unpack position
      float x = float(packed >> 11 & FIVE_BITS);
      float y = float(packed >> 5 & SIX_BITS);
      float z = float(packed & FIVE_BITS);
      vec3 transformed = vec3( x, y, z );
      // Unpack AO light value
      vLightValue = float(packed >> 16 & 3u);
      `
  );

  shader.vertexShader = shader.vertexShader.replace(
    '#include <beginnormal_vertex>',
    `
      // positive X is left, positive Z is back. positive Y is up
      vec3 faceNormals[6];
      faceNormals[0] = vec3( -1.0, 0.0, 0.0 ); // Left
      faceNormals[1] = vec3( 1.0, 0.0, 0.0 ); // Right
      faceNormals[2] = vec3( 0.0, 0.0, 1.0 ); // Back
      faceNormals[3] = vec3( 0.0, 0.0, -1.0 ); // Front
      faceNormals[4] = vec3( 0.0, 1.0, 0.0 ); // Top
      faceNormals[5] = vec3( 0.0, -1.0, 0.0 ); // Bottom

      uint n = packed >> 18 & THREE_BITS;
      vec3 objectNormal = faceNormals[n];

      //vec3 objectNormal = normal ;

      `
  );



  shader.fragmentShader = `
    varying float vLightValue;
  ` + shader.fragmentShader;


  shader.fragmentShader = shader.fragmentShader.replace(
    'vec4 diffuseColor = vec4( diffuse, opacity );',
    `
    vec4 diffuseColor = vec4( diffuse, opacity );


    vec3 shadowColor = vec3(0.4490, 0.6392, 1.0000); // Define your shadow color here

    // vec3 shadowColor = vec3(0, 0, 1.0000); // Define your shadow color here

    float shadowStrength = vLightValue / 2.0;

    vec3 shadowMix = mix(shadowColor, vec3(1.0), shadowStrength);

    // diffuseColor.rgb *= shadowMix;
    diffuseColor.rgb = shadowMix;

    `
  );

}


export const skyShader = {
  side: THREE.BackSide,
  uniforms: {

  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    void main() {
      // 2457A2
      // D6E4F0
      vec3 topColor = vec3(0.012, 0.208, 0.549);
      vec3 bottomColor = vec3(1.0, 1.0, 1.0); 
      vec3 color = mix(bottomColor, topColor, vUv.y-0.2);
      gl_FragColor = vec4(color, 1.0);
    }
  `,


}