import { vec2 } from "gl-matrix";
import { addV2, createV2, subtractV2 } from "./math";
import { ap } from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";

export interface Collidable {
  translation: vec2;
  scale: vec2;
  velocity: vec2;
}

export interface Rectangle {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Collision {
  isCollision: boolean;
  newTranslation: vec2;
  newVelocity: vec2;
}

export const getBoundingBox = ({ translation, scale }: Collidable): Rectangle =>
  pipe(
    [subtractV2(scale), addV2(scale)],
    ap([translation]),
    ([bottomLeft, topRight]) => ({
      left: bottomLeft[0],
      top: topRight[1],
      right: topRight[0],
      bottom: bottomLeft[1],
    })
  );

const isMovingDown = ({ velocity }: Collidable) => velocity[1] < 0;

const isMovingUp = ({ velocity }: Collidable) => velocity[1] > 0;

const isMovingRight = ({ velocity }: Collidable) => velocity[0] > 0;

const isMovingLeft = ({ velocity }: Collidable) => velocity[0] < 0;

// enum CornerType {
//   TopLeft,
//   TopRight,
//   BottomRight,
//   BottomLeft,
// }

interface NoIntersection {
  isIntersection: false;
}

// interface CornerIntersection {
//   isIntersection: true;
//   cornerType: CornerType;
//   corner: vec2;
// }

interface SideIntersection {
  isIntersection: true;
  side: "left" | "top" | "right" | "bottom";
}

type Intersection = SideIntersection | NoIntersection;

// const intersects =
//   (a: Rectangle) =>
//   (b: Rectangle): Intersection => {
//     const corners = [
//       createV2(a.left, a.top),
//       createV2(a.right, a.top),
//       createV2(a.right, a.bottom),
//       createV2(a.left, a.bottom),
//     ];

//     const cornerIndex = corners.findIndex((corner) => {
//       const [x, y] = corner;
//       return x > b.left && x < b.right && y > b.bottom && y < b.top;
//     });

//     if (cornerIndex !== -1) {
//       if (cornerIndex === 0) {
//         if (corners[0][0] - )
//       }
//       return {
//         isIntersection: true,
//         cornerType: Object.values(CornerType).findIndex(
//           (v) => v === cornerIndex
//         ),
//         corner: corners[cornerIndex],
//       };
//     }

//     if (a.top >= b.top && a.bottom <= b.bottom) {
//       if (a.right > b.left && a.right < b.right) {
//         return {
//           isIntersection: true,
//           side: "right",
//         };
//       } else if (a.left > b.left && a.left < b.right) {
//         return {
//           isIntersection: true,
//           side: "left",
//         };
//       }
//     }

//     if (a.right >= b.right && a.left <= b.left) {
//       if (a.top > b.bottom && a.top < b.top) {
//         return {
//           isIntersection: true,
//           side: "top",
//         };
//       } else if (a.bottom > b.bottom && a.bottom < b.top) {
//         return {
//           isIntersection: true,
//           side: "bottom",
//         };
//       }
//     }

//     return {
//       isIntersection: false,
//     };
//   };

export const collides =
  (gameObjA: Collidable) =>
  (gameObjB: Collidable): Collision => {
    const boxA = getBoundingBox(gameObjA);
    const boxB = getBoundingBox(gameObjB);

    if (
      isMovingDown(gameObjA) &&
      boxA.bottom < boxB.top &&
      boxA.top > boxB.top &&
      ((boxA.left < boxB.right && boxA.left >= boxB.left) ||
        (boxA.right > boxB.left && boxA.right <= boxB.right))
    ) {
      return {
        isCollision: true,
        newTranslation: createV2(
          gameObjA.translation[0],
          gameObjA.translation[1] - (boxA.bottom - boxB.top)
        ),
        newVelocity: createV2(gameObjA.velocity[0], 0),
      };
    }

    if (
      isMovingUp(gameObjA) &&
      boxA.top > boxB.bottom &&
      boxA.bottom < boxB.bottom &&
      ((boxA.left < boxB.right && boxA.left >= boxB.left) ||
        (boxA.right > boxB.left && boxA.right <= boxB.right))
    ) {
      return {
        isCollision: true,
        newTranslation: createV2(
          gameObjA.translation[0],
          gameObjA.translation[1] - (boxA.top - boxB.bottom)
        ),
        newVelocity: createV2(gameObjA.velocity[0], 0),
      };
    }

    if (
      isMovingRight(gameObjA) &&
      boxA.right > boxB.left &&
      boxA.left < boxB.left &&
      ((boxA.bottom < boxB.top && boxA.bottom >= boxB.bottom) ||
        (boxA.top > boxB.bottom && boxA.top <= boxB.top))
    ) {
      return {
        isCollision: true,
        newTranslation: createV2(
          gameObjA.translation[0] - (boxA.right - boxB.left),
          gameObjA.translation[1]
        ),
        newVelocity: createV2(0, gameObjA.velocity[1]),
      };
    }

    if (
      isMovingLeft(gameObjA) &&
      boxA.left < boxB.right &&
      boxA.right > boxB.right &&
      ((boxA.bottom < boxB.top && boxA.bottom >= boxB.bottom) ||
        (boxA.top > boxB.bottom && boxA.top <= boxB.top))
    ) {
      return {
        isCollision: true,
        newTranslation: createV2(
          gameObjA.translation[0] - (boxA.left - boxB.right),
          gameObjA.translation[1]
        ),
        newVelocity: createV2(0, gameObjA.velocity[1]),
      };
    }

    return {
      isCollision: false,
      newTranslation: gameObjA.translation,
      newVelocity: gameObjA.velocity,
    };
  };
