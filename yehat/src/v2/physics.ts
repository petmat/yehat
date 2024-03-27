import { pipe } from "fp-ts/lib/function";
import { YehatScene2D, gameObjects, getElapsedTime } from "./core";
import { movePosition } from "./gameObject";

export const updatePhysics =
  <T extends YehatScene2D>(gl: WebGLRenderingContext) =>
  (scene: T) =>
    gameObjects().modify((gameObjs) =>
      gameObjs.map((gameObj) =>
        pipe(
          gameObj,
          movePosition(gl)(
            (gameObj.velocity[0] * getElapsedTime(scene)) / 1000,
            (gameObj.velocity[1] * getElapsedTime(scene)) / 1000
          )
        )
      )
    )(scene);
