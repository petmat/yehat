import { identity, pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/lib/Array";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";

import {
  YehatScene2DCreated,
  initializeDefaultScene2D,
  loadGame,
  printScene,
  processGameTick,
  rgb,
} from "@yehat/yehat/src/v2/core";
import {
  addTexture,
  createText,
  emptyTextures,
  setGroupScaleLockAspectRatio,
  translate,
} from "@yehat/yehat/src/v2/shapes";

enum Textures {
  MarioFont,
}

const createScene = (gl: WebGLRenderingContext): YehatScene2DCreated => ({
  isInitialized: false as const,
  clearColor: rgb(127, 149, 255),
  gameData: {},
  textures: pipe(
    emptyTextures(),
    addTexture(Textures.MarioFont, "assets/textures/mario_font_square.png")
  ),
  gameObjects: [
    ...pipe(
      createText(gl)(Textures.MarioFont)("MARIO"),
      setGroupScaleLockAspectRatio(1 / 8)(gl),
      A.map(translate([-0.25, 0]))
    ),
    ...pipe(
      createText(gl)(Textures.MarioFont)("00000"),
      setGroupScaleLockAspectRatio(1 / 8)(gl),
      A.map(translate([-0.25, -0.4]))
    ),
  ],
});

const startup = (gl: WebGLRenderingContext) =>
  pipe(
    gl,
    createScene,
    initializeDefaultScene2D(gl),
    TE.map(printScene),
    T.chain(processGameTick(identity))
  );

pipe(startup, loadGame(window)("#glcanvas"));
