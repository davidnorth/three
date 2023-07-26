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



export const basicShader = { 
  uniforms: {
    u_texture: { type: "t", value: null },
  },

  vertexShader: `
    attribute float lightValue;
    varying float vLightValue;
    varying vec2 vUv;

    void main() {
        vUv = uv;
        vLightValue = lightValue;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    varying float vLightValue;
    varying vec2 vUv;
    uniform sampler2D u_texture;
    void main() {
        vec4 texColor = texture2D(u_texture, vUv);
        texColor.rgb *= (0.1 + (vLightValue * 0.3)); // Modulate the color by the light value
        gl_FragColor = texColor;
    }
  `


        // #vec4 texColor = vec4(1.0,1.0,1.0,1.0);
        // vec4 texColor = texture2D(u_texture, vUv);
};