import * as A from "fp-ts/lib/Array";
import * as T from "fp-ts/lib/Task";
import { identity, pipe } from "fp-ts/lib/function";

import {
  YehatScene2DCreated,
  initializeDefaultScene2D,
  loadGame,
  processGameTick,
  rgb,
} from "@yehat/yehat/src/v2/core";
import {
  addTexture,
  createRectangle,
  createSprite,
  createText,
  emptyTextures,
  pxToWebGLCoords,
  setGroupScaleLockAspectRatio,
  setScale,
  setTexture,
  setTextureCoords,
  setTranslation,
  translate,
} from "@yehat/yehat/src/v2/shapes";
import { addV2, createV2 } from "@yehat/yehat/src/v2/math";

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
  RedRectangle,
}

const createTile =
  (width: number, height: number) =>
  (gl: WebGLRenderingContext) =>
  (texture: Textures) =>
  (x: number, y: number) =>
    pipe(
      createRectangle(gl)(),
      setScale(createV2(width / gl.canvas.width, height / gl.canvas.height)),
      setTranslation(
        pipe(
          createV2(x, y),
          addV2(createV2(width / 2, height / 2)),
          pxToWebGLCoords(gl)
        )
      ),
      setTexture(texture)
    );

const createLargeWideTile = createTile(128, 64);

const createLargeTile = createTile(64, 64);

const createSmallTile = createTile(32, 32);

const createFloor = (gl: WebGLRenderingContext) => () =>
  pipe(
    createTile(640, 32)(gl)(Textures.FloorTile)(0, -10),
    setTextureCoords(new Float32Array([0, 1, 16, 1, 16, 0, 0, 1, 16, 0, 0, 0]))
  );

const createCharacter =
  (gl: WebGLRenderingContext) =>
  (texture: Textures) =>
  (x: number, y: number) =>
    pipe(
      createSprite(gl)(),
      setScale(createV2(32 / gl.canvas.width, 32 / gl.canvas.height)),
      setTranslation(
        pipe(createV2(x, y), addV2(createV2(16, 16)), pxToWebGLCoords(gl))
      ),
      setTexture(texture)
    );

const createSymbol =
  (gl: WebGLRenderingContext) =>
  (texture: Textures) =>
  (x: number, y: number) =>
    pipe(
      createSprite(gl)(),
      setScale(createV2(16 / gl.canvas.width, 16 / gl.canvas.height)),
      setTranslation(
        pipe(createV2(x, y), addV2(createV2(8, 8)), pxToWebGLCoords(gl))
      ),
      setTexture(texture)
    );

const createMarioText =
  (gl: WebGLRenderingContext) =>
  (texture: Textures) =>
  (text: string) =>
  (x: number, y: number) =>
    pipe(
      createText(gl)(texture)(text),
      setGroupScaleLockAspectRatio(16 / gl.canvas.width, 16)(gl),
      A.map(
        translate(
          pipe(createV2(x, y), addV2(createV2(8, 8)), pxToWebGLCoords(gl))
        )
      )
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
    createLargeWideTile(Textures.Bush)(-12, 20),
    createLargeWideTile(Textures.Hill)(100, 20),
    createLargeTile(Textures.BushSmall)(365, 20),
    // floor
    createFloor(),
    // platform tiles
    createTile(Textures.Tile25)(112, 100),
    createTile(Textures.Bricks)(230, 100),
    createTile(Textures.Iron)(262, 100),
    createTile(Textures.Bricks)(294, 100),
    createTile(Textures.Tile25)(326, 100),
    createTile(Textures.Bricks)(358, 100),
    createTile(Textures.Tile25)(294, 184),
    createLargeTile(Textures.Pipe)(514, 22),
    // monsters
    createCharacter(Textures.DickHead)(82, 20),
    // mario
    createCharacter(Textures.Mario)(286, 54),
    // power-ups
    createCharacter(Textures.Mushroom)(314, 132),
    // sky
    createLargeTile(Textures.CloudSmall)(78, 216),
    createLargeWideTile(Textures.Cloud)(476, 208),
    // game info text
    ...createMarioText(Textures.MarioFont)("MARIO")(110, 305),
    ...createMarioText(Textures.MarioFont)("WORLD")(330, 305),
    ...createMarioText(Textures.MarioFont)("TIME")(460, 305),
    ...createMarioText(Textures.MarioFont)("000000")(110, 285),
    createSymbol(Textures.Coin)(234, 285),
    createSymbol(Textures.X)(252, 285),
    ...createMarioText(Textures.MarioFont)("00")(270, 285),
    ...createMarioText(Textures.MarioFont)("1-1")(345, 285),
    ...createMarioText(Textures.MarioFont)("913")(470, 285),
  ];
};

const createScene = (gl: WebGLRenderingContext): YehatScene2DCreated => ({
  isInitialized: false as const,
  clearColor: rgb(127, 149, 255),
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
    addTexture(Textures.Coin, "assets/textures/coin.png"),
    addTexture(Textures.RedRectangle, "assets/textures/red_rectangle.png")
  ),
  gameObjects: createGameObjects(gl),
});

const startup = (gl: WebGLRenderingContext) =>
  pipe(
    gl,
    createScene,
    initializeDefaultScene2D(gl),
    T.chain(processGameTick(identity))
  );

pipe(startup, loadGame(window)("#glcanvas"));
