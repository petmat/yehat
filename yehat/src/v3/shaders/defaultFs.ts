export const defaultFs = `
  #ifdef GL_ES
    precision highp float;
  #endif

  varying highp vec2 vTextureCoord;

  uniform vec4 uGlobalColor;
  uniform sampler2D uTexture;
  uniform bool uHasTexture;
  uniform vec4 uColor;

  void main() {
    if (uHasTexture) {
      gl_FragColor = texture2D(uTexture, vTextureCoord) * uColor;
    } else {
      gl_FragColor = uGlobalColor;
    }
  }
`;
