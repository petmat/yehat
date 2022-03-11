export const spriteFsSource = `
  uniform sampler2D spriteTexture;

  void main() {
    gl_FragColor = texture2D(spriteTexture, gl_PointCoord);
  }
`;
