import { identity, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as T from "fp-ts/lib/Task";

import {
  YehatScene2DCreated,
  initializeDefaultScene2D,
  loadGame,
  processGameTick,
} from "@yehat/yehat/src/v2/core";
import {
  addTexture,
  createRectangle,
  emptyTextures,
  setScaleLockAspectRatio,
  setTexture,
  setTranslation,
} from "@yehat/yehat/src/v2/shapes";

enum Textures {
  Wood,
  Square,
  Joy,
}

const setOneThirdScale = setScaleLockAspectRatio(1 / 3);

const createScene = (gl: WebGLRenderingContext): YehatScene2DCreated => ({
  isInitialized: false as const,
  gameData: {},
  textures: pipe(
    emptyTextures(),
    addTexture(Textures.Wood, "assets/textures/wood_0.png"),
    addTexture(Textures.Square, "assets/textures/brick_2.png"),
    addTexture(Textures.Joy, "assets/textures/joy.png")
  ),
  gameObjects: [
    pipe(
      createRectangle(gl)(),
      setOneThirdScale(gl),
      setTranslation([-(1 / 2), 0]),
      setTexture(Textures.Wood)
    ),
    pipe(
      createRectangle(gl)(),
      setOneThirdScale(gl),
      setTexture(Textures.Square)
    ),
    pipe(
      createRectangle(gl)(),
      setOneThirdScale(gl),
      setTranslation([1 / 2, 0]),
      setTexture(Textures.Joy)
    ),
  ],
});

const startup = (gl: WebGLRenderingContext) =>
  pipe(
    gl,
    createScene,
    initializeDefaultScene2D(gl),
    T.chain(processGameTick(identity))
  );

pipe(startup, loadGame(window)("#glcanvas"));
