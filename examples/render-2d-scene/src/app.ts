import * as A from "fp-ts/lib/Array";
import { identity, pipe } from "fp-ts/lib/function";

import {
  YehatScene2D,
  createYehat2DScene,
  startGame,
} from "@yehat/yehat/src/v2/core";
import {
  addTexture,
  emptyTextures,
  movePosition,
  setGroupSize,
  setPosition,
  setSize,
  setTexture,
  setTextureCoords,
} from "@yehat/yehat/src/v2/gameObject";
import {
  createRectangle,
  createSprite,
  createText,
} from "@yehat/yehat/src/v2/shapes";
import { rgb } from "@yehat/yehat/src/v2/colors";

enum Textures {
  Bush,
  BushSmall,
  Hill,
  FloorTile,
  Bricks,
  Iron,
  Tile25,
  Pipe,
  Cloud,
  CloudSmall,
  DickHead,
  Mario,
  Mushroom,
  MarioFont,
  X,
  Coin,
}

const createTile =
  (size: [width: number, height: number]) =>
  (gl: WebGLRenderingContext) =>
  (texture: Textures) =>
  (position: [x: number, y: number]) =>
    pipe(createRectangle(gl)(position, size), setTexture(texture));

const createLargeWideTile = createTile([128, 64]);
const createLargeTile = createTile([64, 64]);
const createSmallTile = createTile([32, 32]);
const createFloorTile = createTile([640, 32]);

const createFloor = (gl: WebGLRenderingContext) => () =>
  pipe(
    createFloorTile(gl)(Textures.FloorTile)([320, 6]),
    setTextureCoords(new Float32Array([0, 1, 16, 1, 16, 0, 0, 1, 16, 0, 0, 0]))
  );

const createCharacter =
  (gl: WebGLRenderingContext) =>
  (texture: Textures) =>
  (x: number, y: number) =>
    pipe(
      createSprite(gl)(),
      setSize(gl)(32, 32),
      setPosition(gl)(x, y),
      setTexture(texture)
    );

const createSymbol =
  (gl: WebGLRenderingContext) =>
  (texture: Textures) =>
  (x: number, y: number) =>
    pipe(
      createSprite(gl)(),
      setSize(gl)(16, 16),
      setPosition(gl)(x, y),
      setTexture(texture)
    );

const createMarioText =
  (gl: WebGLRenderingContext) =>
  (fontSize: number) =>
  (deltaX: number, deltaY: number) =>
  (text: string) =>
    pipe(
      createText(gl)(Textures.MarioFont)(text),
      setGroupSize(gl)(fontSize, fontSize),
      A.map(movePosition(gl)(deltaX, deltaY))
    );

const getGameObjectCreators = (gl: WebGLRenderingContext) => ({
  createTile: createSmallTile(gl),
  createLargeTile: createLargeTile(gl),
  createLargeWideTile: createLargeWideTile(gl),
  createFloor: createFloor(gl),
  createCharacter: createCharacter(gl),
  createMarioText: createMarioText(gl),
  createSymbol: createSymbol(gl),
});

const createGameObjects = (gl: WebGLRenderingContext) => {
  const {
    createTile,
    createLargeTile,
    createLargeWideTile,
    createFloor,
    createCharacter,
    createMarioText,
    createSymbol,
  } = getGameObjectCreators(gl);

  return [
    // background
    createLargeWideTile(Textures.Bush)([54, 54]),
    createLargeWideTile(Textures.Hill)([166, 54]),
    createLargeTile(Textures.BushSmall)([420, 54]),
    // floor
    createFloor(),
    // platform tiles
    createTile(Textures.Tile25)([112, 118]),
    createTile(Textures.Bricks)([230, 118]),
    createTile(Textures.Iron)([262, 118]),
    createTile(Textures.Bricks)([294, 118]),
    createTile(Textures.Tile25)([326, 118]),
    createTile(Textures.Bricks)([358, 118]),
    createTile(Textures.Tile25)([294, 202]),
    createLargeTile(Textures.Pipe)([564, 54]),
    // monsters
    createCharacter(Textures.DickHead)(98, 36),
    // mario
    createCharacter(Textures.Mario)(286, 70),
    // power-ups
    createCharacter(Textures.Mushroom)(314, 148),
    // sky
    createLargeTile(Textures.CloudSmall)([94, 252]),
    createLargeWideTile(Textures.Cloud)([554, 238]),
    // game info text
    ...createMarioText(16)(100, 356)("MARIO"),
    ...createMarioText(16)(330, 356)("WORLD"),
    ...createMarioText(16)(470, 356)("TIME"),
    ...createMarioText(16)(100, 336)("000000"),
    createSymbol(Textures.Coin)(236, 336),
    createSymbol(Textures.X)(252, 336),
    ...createMarioText(16)(270, 336)("00"),
    ...createMarioText(16)(344, 336)("1-1"),
    ...createMarioText(16)(480, 336)("913"),
  ];
};

const createScene = (gl: WebGLRenderingContext): YehatScene2D<{}> =>
  createYehat2DScene(gl)({
    clearColor: rgb(127, 149, 255),
    animationInterval: 1000 / 12,
    gameData: {},
    textures: pipe(
      emptyTextures(),
      addTexture(Textures.Bush, "assets/textures/bush.png"),
      addTexture(Textures.BushSmall, "assets/textures/bush_small.png"),
      addTexture(Textures.Hill, "assets/textures/hill.png"),
      addTexture(Textures.FloorTile, "assets/textures/floor_tile.png"),
      addTexture(Textures.Bricks, "assets/textures/bricks_tile.png"),
      addTexture(Textures.Iron, "assets/textures/iron_tile.png"),
      addTexture(Textures.Tile25, "assets/textures/25_tile.png"),
      addTexture(Textures.Pipe, "assets/textures/pipe.png"),
      addTexture(Textures.Cloud, "assets/textures/cloud.png"),
      addTexture(Textures.CloudSmall, "assets/textures/cloud_small.png"),
      addTexture(Textures.DickHead, "assets/textures/dick_head.png"),
      addTexture(Textures.Mario, "assets/textures/mario.png"),
      addTexture(Textures.Mushroom, "assets/textures/mushroom.png"),
      addTexture(Textures.MarioFont, "assets/fonts/mario_font_square.png"),
      addTexture(Textures.X, "assets/textures/x.png"),
      addTexture(Textures.Coin, "assets/textures/coin.png")
    ),
    gameObjects: createGameObjects(gl),
  });

const updateScene = (_gl: WebGLRenderingContext) => identity<YehatScene2D<{}>>;

const initOptions = {
  window,
  canvasId: "#glcanvas",
  createScene,
  updateScene,
};

pipe(initOptions, startGame);
