import { identity, pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/lib/Array";
import * as TE from "fp-ts/lib/TaskEither";

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
  movePosition,
  setGroupSize,
} from "@yehat/yehat/src/v2/shapes";

enum Textures {
  MarioFont,
}

const createMarioFontText =
  (gl: WebGLRenderingContext) =>
  (fontSize: number) =>
  (deltaX: number, deltaY: number) =>
  (text: string) =>
    pipe(
      createText(gl)(Textures.MarioFont)(text),
      setGroupSize(gl)(fontSize, fontSize),
      A.map(movePosition(gl)(deltaX, deltaY))
    );

const createScene = (gl: WebGLRenderingContext): YehatScene2DCreated => ({
  isInitialized: false as const,
  clearColor: hex("#63AE00"),
  gameData: {},
  textures: pipe(
    emptyTextures(),
    addTexture(Textures.MarioFont, "assets/textures/mario_font_square.png")
  ),
  gameObjects: [
    ...createMarioFontText(gl)(32)(148, 288)("Guns n Roses"),
    ...createMarioFontText(gl)(16)(160, 212)("Welcome to the Jungle"),
  ],
});

const startup = (gl: WebGLRenderingContext) =>
  pipe(
    gl,
    createScene,
    initializeDefaultScene2D(gl),
    TE.chain(processGameTick(identity))
  );

pipe(startup, loadGame(window)("#glcanvas"));
