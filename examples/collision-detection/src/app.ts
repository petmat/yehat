import { pipe } from "fp-ts/lib/function";

import {
  YehatScene2D,
  createYehat2DScene,
  gameObjects,
  startGame,
} from "@yehat/yehat/src/v2/core";
import { createRectangle } from "@yehat/yehat/src/v2/shapes";
import { green, red } from "@yehat/yehat/src/v2/colors";
import { color, velocity } from "@yehat/yehat/src/v2/gameObject";
import { updatePhysics } from "@yehat/yehat/src/v2/physics";
import { detectCollisions } from "@yehat/yehat/src/v2/collisions";

const createMovingRect =
  (gl: WebGLRenderingContext) =>
  (position: [number, number]) =>
  (vel: [number, number]) =>
    pipe(
      createRectangle(gl)(position, [50, 50]),
      color.set(green),
      velocity.set(vel)
    );

const createScene = (gl: WebGLRenderingContext): YehatScene2D<{}> =>
  createYehat2DScene(gl)({
    gameData: {},
    gameObjects: [
      createMovingRect(gl)([275, 75])([0, 50]),
      createMovingRect(gl)([275, 325])([0, -50]),
      createMovingRect(gl)([175, 25])([50, 50]),
      createMovingRect(gl)([275, 175])([50, 50]),
      createMovingRect(gl)([375, 100])([-50, 50]),
      createMovingRect(gl)([325, 325])([50, -50]),
    ],
  });

const updateColor = (scene: YehatScene2D) =>
  pipe(
    scene,
    gameObjects().modify((gameObjs) =>
      gameObjs.map((gameObj) =>
        pipe(gameObj, color.set(gameObj.isColliding ? red : green))
      )
    )
  );

const updateScene =
  (gl: WebGLRenderingContext) =>
  (scene: YehatScene2D): YehatScene2D =>
    pipe(scene, updatePhysics(gl), detectCollisions, updateColor);

const initOptions = {
  window,
  canvasId: "#glcanvas",
  createScene,
  updateScene,
};

pipe(initOptions, startGame);
