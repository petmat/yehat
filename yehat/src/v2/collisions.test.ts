import { expect, test } from "vitest";
import { collides, getBoundingBox } from "./collisions";
import {
  createV2,
  downLeftV2,
  downRightV2,
  downV2,
  leftV2,
  rightV2,
  upLeftV2,
  upRightV2,
  upV2,
  zeroV2,
} from "./math";

test("gets bounding box", () => {
  const box = getBoundingBox({
    translation: createV2(3, 3),
    scale: createV2(2, 2),
    velocity: zeroV2(),
    isColliding: false,
  });

  expect(box).toEqual({ width: 2, height: 2, x: 3, y: 3 });
});

test("does not collide if source object is on the left", () => {
  const source = {
    translation: createV2(3, 6),
    scale: createV2(1, 1),
    velocity: rightV2(),
    isColliding: false,
  };
  const target = {
    translation: createV2(6, 6),
    scale: createV2(1, 1),
    velocity: zeroV2(),
    isColliding: false,
  };

  expect(collides(source)(target)).toBeFalsy();
});

test("does not collide if source object is on the top-left", () => {
  const source = {
    translation: createV2(3, 9),
    scale: createV2(1, 1),
    velocity: downRightV2(),
    isColliding: false,
  };
  const target = {
    translation: createV2(6, 6),
    scale: createV2(1, 1),
    velocity: zeroV2(),
    isColliding: false,
  };

  expect(collides(source)(target)).toBeFalsy();
});

test("does not collide if source object is on the top", () => {
  const source = {
    translation: createV2(6, 9),
    scale: createV2(1, 1),
    velocity: downV2(),
    isColliding: false,
  };
  const target = {
    translation: createV2(6, 6),
    scale: createV2(1, 1),
    velocity: zeroV2(),
    isColliding: false,
  };

  expect(collides(source)(target)).toBeFalsy();
});

test("does not collide if source object is on the top-right", () => {
  const source = {
    translation: createV2(9, 9),
    scale: createV2(1, 1),
    velocity: downLeftV2(),
    isColliding: false,
  };
  const target = {
    translation: createV2(6, 6),
    scale: createV2(1, 1),
    velocity: zeroV2(),
    isColliding: false,
  };

  expect(collides(source)(target)).toBeFalsy();
});

test("does not collide if source object is on the right", () => {
  const source = {
    translation: createV2(9, 6),
    scale: createV2(1, 1),
    velocity: leftV2(),
    isColliding: false,
  };
  const target = {
    translation: createV2(6, 6),
    scale: createV2(1, 1),
    velocity: zeroV2(),
    isColliding: false,
  };

  expect(collides(source)(target)).toBeFalsy();
});

test("does not collide if source object is on the bottom-right", () => {
  const source = {
    translation: createV2(9, 3),
    scale: createV2(1, 1),
    velocity: upLeftV2(),
    isColliding: false,
  };
  const target = {
    translation: createV2(6, 6),
    scale: createV2(1, 1),
    velocity: zeroV2(),
    isColliding: false,
  };

  expect(collides(source)(target)).toBeFalsy();
});

test("does not collide if source object is on the bottom", () => {
  const source = {
    translation: createV2(6, 3),
    scale: createV2(1, 1),
    velocity: rightV2(),
    isColliding: false,
  };
  const target = {
    translation: createV2(6, 6),
    scale: createV2(1, 1),
    velocity: zeroV2(),
    isColliding: false,
  };

  expect(collides(source)(target)).toBeFalsy();
});

test("does not collide if source object is on the bottom-left", () => {
  const source = {
    translation: createV2(3, 3),
    scale: createV2(1, 1),
    velocity: upRightV2(),
    isColliding: false,
  };
  const target = {
    translation: createV2(6, 6),
    scale: createV2(1, 1),
    velocity: zeroV2(),
    isColliding: false,
  };

  expect(collides(source)(target)).toBeFalsy();
});

test("collides from the left", () => {
  const source = {
    translation: createV2(5.5, 6),
    scale: createV2(1, 1),
    velocity: rightV2(),
    isColliding: false,
  };
  const target = {
    translation: createV2(6, 6),
    scale: createV2(1, 1),
    velocity: zeroV2(),
    isColliding: false,
  };

  expect(collides(source)(target)).toBeTruthy();
});

test("collides from the top", () => {
  const source = {
    translation: createV2(6, 6.5),
    scale: createV2(1, 1),
    velocity: downV2(),
    isColliding: false,
  };
  const target = {
    translation: createV2(6, 6),
    scale: createV2(1, 1),
    velocity: zeroV2(),
    isColliding: false,
  };

  expect(collides(source)(target)).toBeTruthy();
});

test("collides from the top on a wider object", () => {
  const source = {
    translation: createV2(2, 6.5),
    scale: createV2(1, 1),
    velocity: downV2(),
    isColliding: false,
  };
  const target = {
    translation: createV2(6, 6),
    scale: createV2(20, 1),
    velocity: zeroV2(),
    isColliding: false,
  };

  expect(collides(source)(target)).toBeTruthy();
});

test("collides from the right", () => {
  const source = {
    translation: createV2(6.5, 6),
    scale: createV2(1, 1),
    velocity: leftV2(),
    isColliding: false,
  };
  const target = {
    translation: createV2(6, 6),
    scale: createV2(1, 1),
    velocity: zeroV2(),
    isColliding: false,
  };

  expect(collides(source)(target)).toBeTruthy();
});

test("collides from the bottom", () => {
  const source = {
    translation: createV2(6, 5.5),
    scale: createV2(1, 1),
    velocity: upV2(),
    isColliding: false,
  };
  const target = {
    translation: createV2(6, 6),
    scale: createV2(1, 1),
    velocity: zeroV2(),
    isColliding: false,
  };

  expect(collides(source)(target)).toBeTruthy();
});

test("collides from the top left", () => {
  const source = {
    translation: createV2(5.5, 6.5),
    scale: createV2(1, 1),
    velocity: downRightV2(),
    isColliding: false,
  };
  const target = {
    translation: createV2(6, 6),
    scale: createV2(1, 1),
    velocity: zeroV2(),
    isColliding: false,
  };

  expect(collides(source)(target)).toBeTruthy();
});

test("collides from the top right", () => {
  const source = {
    translation: createV2(6.5, 6.5),
    scale: createV2(1, 1),
    velocity: downLeftV2(),
    isColliding: false,
  };
  const target = {
    translation: createV2(6, 6),
    scale: createV2(1, 1),
    velocity: zeroV2(),
    isColliding: false,
  };

  expect(collides(source)(target)).toBeTruthy();
});

test("collides from the bottom right", () => {
  const source = {
    translation: createV2(6.5, 5.5),
    scale: createV2(1, 1),
    velocity: downLeftV2(),
    isColliding: false,
  };
  const target = {
    translation: createV2(6, 6),
    scale: createV2(1, 1),
    velocity: zeroV2(),
    isColliding: false,
  };

  expect(collides(source)(target)).toBeTruthy();
});

test("collides from the bottom left", () => {
  const source = {
    translation: createV2(5.5, 5.5),
    scale: createV2(1, 1),
    velocity: downLeftV2(),
    isColliding: false,
  };
  const target = {
    translation: createV2(6, 6),
    scale: createV2(1, 1),
    velocity: zeroV2(),
    isColliding: false,
  };

  expect(collides(source)(target)).toBeTruthy();
});
