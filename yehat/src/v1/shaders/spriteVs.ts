export const spriteVsSource = `
  attribute vec2 spritePosition;
  attribute float spriteSize;
  uniform vec2 screenSize;

  void main() {
    vec4 screenTransform =
      vec4(2.0 / screenSize.x, -2.0 / screenSize.y, -1.0, 1.0);
    gl_Position =
      vec4(spritePosition * screenTransform.xy + screenTransform.zw, 0.0, 1.0);
    gl_PointSize = spriteSize;
  }
`;
