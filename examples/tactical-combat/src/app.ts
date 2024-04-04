import { identity, pipe } from "fp-ts/lib/function";
import * as NEA from "fp-ts/lib/NonEmptyArray";

import { rgb } from "@yehat/yehat/src/v2/colors";
import { createYehat2DScene, startGame } from "@yehat/yehat/src/v2/core";
import {
  addTexture,
  emptyTextures,
  setTexture,
} from "@yehat/yehat/src/v2/gameObject";
import { createRectangle } from "@yehat/yehat/src/v2/shapes";

enum Textures {
  GrassTile,
}

const createTile =
  (gl: WebGLRenderingContext) =>
  (texture: Textures) =>
  (position: [x: number, y: number]) =>
    pipe(createRectangle(gl)(position, [32, 32]), setTexture(texture));

const createGrassTile = (gl: WebGLRenderingContext) =>
  createTile(gl)(Textures.GrassTile);

const createTextures = () =>
  pipe(
    emptyTextures(),
    addTexture(Textures.GrassTile, "assets/textures/grass_tile.png")
  );

const createTerrain = (gl: WebGLRenderingContext) =>
  pipe(
    NEA.range(0, 20),
    NEA.flatMap((i) =>
      pipe(
        NEA.range(0, 15),
        NEA.map((j) => createGrassTile(gl)([i * 32, j * 32]))
      )
    )
  );

const createScene = (gl: WebGLRenderingContext) =>
  createYehat2DScene(gl)({
    clearColor: rgb(127, 149, 255),
    animationInterval: 1000 / 12,
    gameData: {},
    textures: createTextures(),
    gameObjects: createTerrain(gl),
  });

const updateScene = () => identity;

const initOptions = {
  window,
  canvasId: "#glcanvas",
  createScene,
  updateScene,
};

pipe(initOptions, startGame);
