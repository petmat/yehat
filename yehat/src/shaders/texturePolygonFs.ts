export const texturePolygonFsSource = `
  varying highp vec2 vTextureCoord;

  uniform sampler2D texture;

  void main(void) {
    gl_FragColor = texture2D(texture, vTextureCoord);
  }
`;
