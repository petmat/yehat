import { identity, pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/lib/Array";
import * as NEA from "fp-ts/lib/NonEmptyArray";

import { rgb } from "@yehat/yehat/src/v2/colors";
import { createYehat2DScene, startGame } from "@yehat/yehat/src/v2/core";
import {
  addTexture,
  currentFrame,
  emptyTextures,
  setTexture,
  textureFrameGridWidth,
  updateCharacterTextureCoords,
} from "@yehat/yehat/src/v2/gameObject";
import { createRectangle } from "@yehat/yehat/src/v2/shapes";

enum Textures {
  GrassTile,
  Character,
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
    addTexture(Textures.GrassTile, "assets/textures/grass_tile.png"),
    addTexture(Textures.Character, "assets/textures/character.png")
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

const createCharacter =
  (gl: WebGLRenderingContext) =>
  (position: [x: number, y: number]) =>
  (frame: number) =>
    pipe(
      createRectangle(gl)(position, [32, 32]),
      setTexture(Textures.Character),
      currentFrame.set(frame),
      textureFrameGridWidth.set(4),
      updateCharacterTextureCoords
    );

const createCharacters = (gl: WebGLRenderingContext) => [
  createCharacter(gl)([352, 368])(1),
  createCharacter(gl)([320, 336])(1),
  createCharacter(gl)([352, 304])(0),
  createCharacter(gl)([288, 272])(5),
  createCharacter(gl)([320, 272])(5),
  createCharacter(gl)([320, 240])(5),
  createCharacter(gl)([352, 240])(2),
];

const createScene = (gl: WebGLRenderingContext) =>
  createYehat2DScene(gl)({
    clearColor: rgb(127, 149, 255),
    animationInterval: 1000 / 12,
    gameData: {},
    textures: createTextures(),
    gameObjects: pipe(createTerrain(gl), A.concat(createCharacters(gl))),
  });

const updateScene = () => identity;

const initOptions = {
  window,
  canvasId: "#glcanvas",
  createScene,
  updateScene,
};

pipe(initOptions, startGame);
