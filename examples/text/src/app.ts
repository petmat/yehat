import { identity, pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/lib/Array";
import * as T from "fp-ts/lib/Task";

import {
  YehatScene2DCreated,
  hex,
  initializeDefaultScene2D,
  loadGame,
  processGameTick,
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
  clearColor: hex("#63AE00"),
  gameData: {},
  textures: pipe(
    emptyTextures(),
    addTexture(Textures.MarioFont, "assets/textures/mario_font_square.png")
  ),
  gameObjects: [
    ...pipe(
      createText(gl)(Textures.MarioFont)("Guns n Roses"),
      setGroupScaleLockAspectRatio(32 / gl.canvas.width, 32)(gl),
      A.map(translate([-0.6, 0.2]))
    ),
    ...pipe(
      createText(gl)(Textures.MarioFont)("Welcome to the Jungle"),
      setGroupScaleLockAspectRatio(16 / gl.canvas.width, 16)(gl),
      A.map(translate([-0.55, -0.1]))
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
