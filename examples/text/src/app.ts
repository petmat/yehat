import { identity, pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/lib/Array";

import {
  YehatScene2D,
  createYehat2DScene,
  startGame,
} from "@yehat/yehat/src/v2/core";
import { createText } from "@yehat/yehat/src/v2/shapes";
import {
  addTexture,
  emptyTextures,
  movePosition,
  setGroupSize,
} from "@yehat/yehat/src/v2/gameObject";

enum Textures {
  MarioFont,
}

const chars =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ- ";

const createMarioFontText =
  (gl: WebGLRenderingContext) =>
  (fontSize: number) =>
  (deltaX: number, deltaY: number) =>
  (text: string) =>
    pipe(
      createText(gl)(Textures.MarioFont)(chars)(16, 128)(text),
      setGroupSize(gl)(fontSize, fontSize),
      A.map(movePosition(gl)(deltaX, deltaY))
    );

const createScene = (gl: WebGLRenderingContext): YehatScene2D<{}> =>
  createYehat2DScene(gl)({
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

const updateScene = (_gl: WebGLRenderingContext) => identity<YehatScene2D<{}>>;

const initOptions = {
  window,
  canvasId: "#glcanvas",
  createScene,
  updateScene,
};

pipe(initOptions, startGame);
