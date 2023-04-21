export const texturePolygonVsSource = `
  attribute vec4 aPosition;
  attribute vec2 aTextureCoord;

  uniform vec2 screenSize;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying highp vec2 vTextureCoord;

  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
    vTextureCoord = aTextureCoord;
  }
`;
