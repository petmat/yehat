import { Array, Option } from "effect";

import { GameObject, Vector2, Vector4 } from ".";

const createCircleVertexCoordinates = (segments: number): number[] =>
  [
    0.0,
    0.0,
    ...Array.range(0, segments).map((i) => [
      Math.cos((i * 2 * Math.PI) / segments),
      Math.sin((i * 2 * Math.PI) / segments),
    ]),
  ].flat();

const createCircleTextureCoordinates = (segments: number) =>
  [
    0.0,
    0.0,
    ...Array.range(0, segments).map((i) => [
      Math.cos((i * 2 * Math.PI) / segments) * 0.5,
      Math.sin((i * 2 * Math.PI) / segments) * 0.5,
    ]),
  ].flat();

export const create = (size: Vector2.Vector2): GameObject.GameObject => ({
  drawMode: WebGLRenderingContext.TRIANGLE_FAN,
  color: Vector4.make(1, 1, 1, 1),
  position: Vector2.make(0, 0),
  rotation: Vector2.make(0, 1),
  size,
  vertexCoordinates: createCircleVertexCoordinates(30),
  textureCoordinates: createCircleTextureCoordinates(30),
  texture: Option.none(),
});
