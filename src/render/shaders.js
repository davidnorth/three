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
       varying float vLightValue;
     ` + shader.vertexShader;

  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `
        #include <begin_vertex>
        vLightValue = lightValue;
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