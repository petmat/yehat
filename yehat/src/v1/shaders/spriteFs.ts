export const spriteFsSource = `
  uniform sampler2D texture;

  void main() {
    gl_FragColor = texture2D(texture, gl_PointCoord);
  }
`;
