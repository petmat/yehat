import { Option } from "effect";

import * as Vector2 from "./Vector2";
import * as Vector4 from "./Vector4";
import * as UtilityTypes from "./UtilityTypes";

export type GameObjectKeysByValue<T extends GameObject[keyof GameObject]> =
  UtilityTypes.TypedKeys<GameObject, T>;

export type GameObjectValues = GameObject[keyof GameObject];

export interface GameObject {
  color: Vector4.Vector4;
  position: Vector2.Vector2;
  rotation: Vector2.Vector2;
  size: Vector2.Vector2;
  vertexCoordinates: number[];
  textureCoordinates: number[];
  texture: Option.Option<number>;
}

export const setSize = (size: Vector2.Vector2) => (gameObject: GameObject) => ({
  ...gameObject,
  size,
});

export const setPosition =
  (position: Vector2.Vector2) =>
  (gameObject: GameObject): GameObject => ({
    ...gameObject,
    position,
  });

export const setColor =
  (color: Vector4.Vector4) =>
  (gameObject: GameObject): GameObject => ({
    ...gameObject,
    color,
  });

export const setHasTexture =
  (hasTexture: boolean) => (gameObject: GameObject) => ({
    ...gameObject,
    hasTexture,
  });

export const setTexture =
  (texture: Option.Option<number>) => (gameObject: GameObject) => ({
    ...gameObject,
    texture,
  });
