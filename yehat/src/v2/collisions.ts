import { pipe } from "fp-ts/lib/function";
import { vec2 } from "gl-matrix";
import { Lens } from "monocle-ts";
import { add } from "./math";

export interface Collidable {
  translation: vec2;
  scale: vec2;
  velocity: vec2;
  isColliding: boolean;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Collision {
  isCollision: boolean;
  newTranslation: vec2;
  newVelocity: vec2;
}

export const getBoundingBox = ({
  translation,
  scale,
}: Collidable): Rectangle => ({
  x: translation[0],
  y: translation[1],
  width: scale[0],
  height: scale[1],
});

export const intersects =
  (a: Rectangle) =>
  (b: Rectangle): boolean => {
    return (
      a.x + a.width >= b.x - b.width &&
      a.x - a.width <= b.x + b.width &&
      a.y + a.height >= b.y - b.height &&
      a.y - a.height <= b.y + b.height
    );
  };

export const collides =
  (gameObjA: Collidable) =>
  (gameObjB: Collidable): boolean => {
    return intersects(getBoundingBox(gameObjA))(getBoundingBox(gameObjB));
  };

export const rectX = Lens.fromProp<Rectangle>()("x");
export const rectWidth = Lens.fromProp<Rectangle>()("x");

export const getRectangleRight = (rect: Rectangle) =>
  pipe(rect, rectX.get, add(rectWidth.get(rect)));
