import { identity, pipe } from "fp-ts/lib/function";

import {
  YehatScene2D,
  createYehat2DScene,
  startGame,
} from "@yehat/yehat/src/v2/core";
import { createRectangle } from "@yehat/yehat/src/v2/shapes";
import { green } from "@yehat/yehat/src/v2/colors";
import { color } from "@yehat/yehat/src/v2/gameObject";

const createScene = (gl: WebGLRenderingContext): YehatScene2D<{}> =>
  createYehat2DScene(gl)({
    gameData: {},
    gameObjects: [
      pipe(createRectangle(gl)([320, 240], [200, 200]), color.set(green)),
    ],
  });

const updateScene = (_gl: WebGLRenderingContext) => identity<YehatScene2D<{}>>;

const initOptions = {
  window,
  canvasId: "#glcanvas",
  createScene,
  updateScene,
};

pipe(initOptions, startGame);
