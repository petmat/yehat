export const defaultVs = `
  attribute vec2 aVertexPosition;

  uniform vec2 uScalingFactor;
  uniform vec2 uRotationVector;
  uniform vec2 uTranslationVector;

  void main() {
    vec2 rotatedPosition = vec2(
      aVertexPosition.x * uRotationVector.y +
      aVertexPosition.y * uRotationVector.x,
      aVertexPosition.y * uRotationVector.y -
      aVertexPosition.x * uRotationVector.x
    );

    gl_Position = vec4(rotatedPosition * uScalingFactor + uTranslationVector, 0.0, 1.0);
  }
`;
