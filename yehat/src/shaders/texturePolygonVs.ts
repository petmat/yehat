export const texturePolygonVsSource = `
  attribute vec2 position;
  attribute vec2 aTextureCoord;

  uniform vec2 screenSize;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying highp vec2 vTextureCoord;

  void main(void) {
    vec4 screenTransform =
      vec4(2.0 / screenSize.x, -2.0 / screenSize.y, -1.0, 1.0);
    vec4 calculatedPosition = vec4(position * screenTransform.xy + screenTransform.zw, 0.0, 1.0);
    gl_Position = uProjectionMatrix * uModelViewMatrix * calculatedPosition;
    vTextureCoord = aTextureCoord;
  }
`;
