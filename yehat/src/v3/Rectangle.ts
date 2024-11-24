import { Option } from "effect";

import { GameObject, Vector2, Vector4 } from ".";

export const create = (size: Vector2.Vector2): GameObject.GameObject => ({
  color: Vector4.make(1, 1, 1, 1),
  position: Vector2.make(0, 0),
  rotation: Vector2.make(0, 1),
  size,
  vertexCoordinates: [-1, 1, 1, 1, 1, -1, -1, 1, 1, -1, -1, -1],
  textureCoordinates: [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1],
  texture: Option.none(),
});
