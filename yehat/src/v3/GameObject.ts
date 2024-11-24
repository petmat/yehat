import * as Vector2 from "./Vector2";
import * as Vector4 from "./Vector4";
import * as UtilityTypes from "./UtilityTypes";

export type GameObjectVector2Keys = UtilityTypes.TypedKeys<
  GameObject,
  Vector2.Vector2
>;
export type GameObjectVector4Keys = UtilityTypes.TypedKeys<
  GameObject,
  Vector4.Vector4
>;
export type GameObjectBooleanKeys = UtilityTypes.TypedKeys<GameObject, boolean>;

export type GameObjectNumberKeys = UtilityTypes.TypedKeys<GameObject, number>;

export interface GameObject {
  color: Vector4.Vector4;
  translation: Vector2.Vector2;
  rotation: Vector2.Vector2;
  scale: Vector2.Vector2;
  vertexCoordinates: number[];
  hasTexture: boolean;
  texture: number;
}
