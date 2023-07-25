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