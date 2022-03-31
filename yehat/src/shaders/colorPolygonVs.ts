export const colorPolygonVsSource = `
  attribute vec2 position;
  attribute vec4 aVertexColor;

  uniform vec2 screenSize;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying lowp vec4 vColor;

  void main() {
    vec4 screenTransform =
      vec4(2.0 / screenSize.x, -2.0 / screenSize.y, -1.0, 1.0);
    vec4 calculatedPosition = vec4(position * screenTransform.xy + screenTransform.zw, 0.0, 1.0);
    gl_Position = uProjectionMatrix * uModelViewMatrix * calculatedPosition;
    vColor = aVertexColor;
  }
`;
