import { identity, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import * as T from "fp-ts/lib/Task";

import {
  Texture,
  YehatScene2DCreated,
  initializeDefaultScene2D,
  loadGame,
  processGameTick,
} from "@yehat/yehat/src/v2/core";
import { createRectangle, setTexture } from "@yehat/yehat/src/v2/shapes";

enum Textures {
  Square,
}

const addTexture =
  (index: number, url: string) =>
  (textures: Map<number, Texture>): Map<number, Texture> => {
    const newTextures = new Map<number, Texture>(textures);
    newTextures.set(index, { url });
    return newTextures;
  };

const createScene = (gl: WebGLRenderingContext): YehatScene2DCreated => ({
  isInitialized: false as const,
  gameData: {},
  textures: pipe(
    new Map<number, Texture>(),
    addTexture(Textures.Square, "assets/textures/square_texture.png")
  ),
  gameObjects: [
    pipe(createRectangle(gl)(), setTexture(O.some(Textures.Square))),
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
