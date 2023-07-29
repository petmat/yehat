import { identity, pipe } from "fp-ts/lib/function";
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
  setPosition,
  setSize,
  setTexture,
} from "@yehat/yehat/src/v2/shapes";

enum Textures {
  Wood,
  Square,
  Joy,
}

const setSize100 = (gl: WebGLRenderingContext) => setSize(gl)(100, 100);

const createSize100Rectangle =
  (gl: WebGLRenderingContext) =>
  (x: number, y: number) =>
  (texture: Textures) =>
    pipe(
      createRectangle(gl)(),
      setSize100(gl),
      setPosition(gl)(x, y),
      setTexture(texture)
    );

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
    createSize100Rectangle(gl)(160, 240)(Textures.Wood),
    createSize100Rectangle(gl)(320, 240)(Textures.Square),
    createSize100Rectangle(gl)(480, 240)(Textures.Joy),
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
