import { identity, pipe } from "fp-ts/lib/function";

import {
  createYehat2DScene,
  startGame,
  YehatScene2D,
} from "@yehat/yehat/src/v2/core";
import {
  addTexture,
  emptyTextures,
  setTexture,
} from "@yehat/yehat/src/v2/gameObject";
import { createRectangle } from "@yehat/yehat/src/v2/shapes";

enum Textures {
  Wood,
  Square,
  Joy,
}

const createSize100Rectangle =
  (gl: WebGLRenderingContext) =>
  (position: [x: number, y: number]) =>
  (texture: Textures) =>
    pipe(createRectangle(gl)(position, [100, 100]), setTexture(texture));

const createScene = (gl: WebGLRenderingContext): YehatScene2D<{}> =>
  createYehat2DScene(gl)({
    gameData: {},
    textures: pipe(
      emptyTextures(),
      addTexture(Textures.Wood, "assets/textures/wood_0.png"),
      addTexture(Textures.Square, "assets/textures/brick_2.png"),
      addTexture(Textures.Joy, "assets/textures/joy.png")
    ),
    gameObjects: [
      createSize100Rectangle(gl)([160, 240])(Textures.Wood),
      createSize100Rectangle(gl)([320, 240])(Textures.Square),
      createSize100Rectangle(gl)([480, 240])(Textures.Joy),
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
