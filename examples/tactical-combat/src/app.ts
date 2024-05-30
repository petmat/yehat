import { identity, pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/lib/Array";
import * as NEA from "fp-ts/lib/NonEmptyArray";

import { rgb } from "@yehat/yehat/src/v2/colors";
import { createYehat2DScene, startGame } from "@yehat/yehat/src/v2/core";
import {
  GameObject2D,
  Texture,
  addTexture,
  currentFrame,
  emptyTextures,
  movePosition,
  setGroupSize,
  setTexture,
  textureFrameGridWidth,
  updateCharacterTextureCoords,
} from "@yehat/yehat/src/v2/gameObject";
import { createRectangle, createText } from "@yehat/yehat/src/v2/shapes";
import { addTuple } from "@yehat/yehat/src/v2/math";

enum Textures {
  GrassTile,
  Floor,
  Grid,
  Character,
  Box,
  Tree1,
  Tree2,
  Bush1,
  Bush2,
  BuildingWallW,
  BuildingWallN,
  BuildingWallE,
  BuildingDoorE,
  BuildingCornerNW,
  BuildingCornerSW,
  BuildingCornerSE,
  BuildingCornerNE,
  BuildingWallS,
  HudTopLeft,
  HudTop,
  HudTopRight,
  HudTopButton,
  HudBottomLeft,
  HudBottomRight,
  HudBottomTile,
  CharacterScreen,
  Font,
  BigFont,
}

const textureFileMappings: [index: number, url: string][] = [
  [Textures.GrassTile, "assets/textures/grass_tile.png"],
  [Textures.Floor, "assets/textures/floor.png"],
  [Textures.Grid, "assets/textures/grid.png"],
  [Textures.Character, "assets/textures/character.png"],
  [Textures.Box, "assets/textures/box.png"],
  [Textures.Tree1, "assets/textures/tree_01.png"],
  [Textures.Tree2, "assets/textures/tree_02.png"],
  [Textures.Bush1, "assets/textures/bush_01.png"],
  [Textures.Bush2, "assets/textures/bush_02.png"],
  [Textures.BuildingWallW, "assets/textures/building_wall_w.png"],
  [Textures.BuildingWallN, "assets/textures/building_wall_n.png"],
  [Textures.BuildingWallE, "assets/textures/building_wall_e.png"],
  [Textures.BuildingDoorE, "assets/textures/building_door_e.png"],
  [Textures.BuildingCornerSW, "assets/textures/building_corner_sw.png"],
  [Textures.BuildingCornerNW, "assets/textures/building_corner_nw.png"],
  [Textures.BuildingCornerSE, "assets/textures/building_corner_se.png"],
  [Textures.BuildingCornerNE, "assets/textures/building_corner_ne.png"],
  [Textures.BuildingWallS, "assets/textures/building_wall_s.png"],
  [Textures.HudTopLeft, "assets/textures/hud_topleft.png"],
  [Textures.HudTop, "assets/textures/hud_top.png"],
  [Textures.HudTopRight, "assets/textures/hud_topright.png"],
  [Textures.HudTopButton, "assets/textures/hud_top_button.png"],
  [Textures.HudBottomLeft, "assets/textures/hud_bottomleft.png"],
  [Textures.HudBottomRight, "assets/textures/hud_bottomright.png"],
  [Textures.HudBottomTile, "assets/textures/hud_bottom_tile.png"],
  [Textures.CharacterScreen, "assets/textures/character_screen.png"],
  [Textures.Font, "assets/textures/font.png"],
  [Textures.BigFont, "assets/textures/big_font.png"],
];

const createTerrainTile =
  (gl: WebGLRenderingContext) =>
  (texture: Textures) =>
  (position: [x: number, y: number]) =>
    pipe(createRectangle(gl)(position, [32, 32]), setTexture(texture));

const createGrassTile = (gl: WebGLRenderingContext) =>
  createTerrainTile(gl)(Textures.GrassTile);

const createFloorTile = (gl: WebGLRenderingContext) =>
  createTerrainTile(gl)(Textures.Floor);

const addTextureFromArgs = (
  textures: Map<number, Texture>,
  [index, url]: [index: number, url: string]
) => pipe(textures, addTexture(index, url));

const createTextures = () => {
  return pipe(
    textureFileMappings,
    A.reduce(emptyTextures(), addTextureFromArgs)
  );
};

const createTerrain = (gl: WebGLRenderingContext): GameObject2D[] => {
  return pipe(
    NEA.range(0, 20),
    A.flatMap((i) =>
      pipe(
        NEA.range(0, 15),
        A.map((j) => createGrassTile(gl)([i * 32 + 16, j * 28 - 6]))
      )
    ),
    pipe(
      pipe(
        NEA.range(5, 7),
        A.flatMap((i) =>
          pipe(
            NEA.range(6, 10),
            A.map((j) => createFloorTile(gl)([i * 32 + 16, j * 28 - 6]))
          )
        )
      ),
      A.concat
    )
  );
};

const createGridTile = (gl: WebGLRenderingContext) =>
  createTerrainTile(gl)(Textures.Grid);

const createGrid = (gl: WebGLRenderingContext) =>
  pipe(
    NEA.range(0, 20),
    A.flatMap((i) =>
      pipe(
        NEA.range(0, 15),
        A.map((j) => createGridTile(gl)([i * 32 + 16, j * 28 - 4]))
      )
    )
  );

const createCharacter =
  (gl: WebGLRenderingContext) =>
  (position: [x: number, y: number]) =>
  (frame: number) =>
    pipe(
      createRectangle(gl)(position, [64, 64]),
      setTexture(Textures.Character),
      currentFrame.set(frame),
      textureFrameGridWidth.set(4),
      updateCharacterTextureCoords
    );

const createSizedRectangle =
  (gl: WebGLRenderingContext) =>
  (
    size: [width: number, height: number]
  ): ((position: [x: number, y: number]) => GameObject2D) =>
  (position) =>
    pipe(createRectangle(gl)(position, size));

const createGridObj =
  ([gw, gh]: [gw: number, gh: number]) =>
  (gl: WebGLRenderingContext) =>
  (texture: number) =>
  (position: [x: number, y: number]) =>
    pipe(
      createSizedRectangle(gl)([gw * 32, gh * 32])(position),
      setTexture(texture)
    );

const createObj1x1 = createGridObj([1, 1]);

const createObj1x2 = createGridObj([1, 2]);

const createObj2x2 = createGridObj([2, 2]);

const createObj2x1 = createGridObj([2, 1]);

const createObj4x1 = createGridObj([4, 1]);

const createObj4x2 = createGridObj([4, 2]);

const createObj4x4 = createGridObj([4, 4]);

const createObj16x1 = createGridObj([16, 1]);

const getGridPos =
  ([gw, gh]: [gw: number, gh: number]) =>
  ([gx, gy]: [gx: number, gy: number]): [x: number, y: number] =>
    [32 * gx + (gw * 32) / 2, 28 * gy + (gh * 32) / 2 + 8];

const get1x1GridPos = getGridPos([1, 1]);

const get1x2GridPos = getGridPos([1, 2]);

const get2x1GridPos = getGridPos([2, 1]);

const get2x2GridPos = getGridPos([2, 2]);

const get4x1GridPos = getGridPos([4, 1]);

const get4x4GridPos = getGridPos([4, 4]);

const get16x1GridPos = getGridPos([16, 1]);

const createCharacters = (gl: WebGLRenderingContext) => [
  createCharacter(gl)(get2x2GridPos([10, 11]))(1),
  createCharacter(gl)(get2x2GridPos([9, 10]))(1),
  createCharacter(gl)(get2x2GridPos([10, 9]))(0),
  createCharacter(gl)(get2x2GridPos([8, 8]))(5),
  createCharacter(gl)(get2x2GridPos([9, 8]))(5),
  createCharacter(gl)(get2x2GridPos([5, 7]))(2),
  createCharacter(gl)(get2x2GridPos([9, 7]))(5),
  createCharacter(gl)(get2x2GridPos([10, 7]))(2),
];

const createItems = (gl: WebGLRenderingContext) => [
  createObj2x1(gl)(Textures.Box)(get2x1GridPos([4, 9])),
  createObj2x1(gl)(Textures.Box)(get2x1GridPos([4, 8])),
  createObj2x1(gl)(Textures.Box)(get2x1GridPos([4, 7])),
  createObj2x1(gl)(Textures.Box)(get2x1GridPos([4, 6])),
  createObj2x1(gl)(Textures.Box)(get2x1GridPos([4, 5])),
  createObj2x1(gl)(Textures.Box)(get2x1GridPos([12, 10])),
  createObj2x1(gl)(Textures.Box)(get2x1GridPos([11, 10])),
  createObj2x1(gl)(Textures.Box)(get2x1GridPos([11, 9])),
  createObj2x1(gl)(Textures.Box)(get2x1GridPos([11, 8])),
  createObj2x1(gl)(Textures.Box)(get2x1GridPos([11, 7])),
];

const createBgFoliage = (gl: WebGLRenderingContext) => [
  createObj2x2(gl)(Textures.Tree1)(get2x2GridPos([4, 11])),
  createObj2x2(gl)(Textures.Bush1)(addTuple(get2x2GridPos([5, 11]))([4, 0])),
];

const createBuilding = (gl: WebGLRenderingContext) => [
  createObj1x1(gl)(Textures.BuildingWallW)(get1x1GridPos([4, 9])),
  createObj1x1(gl)(Textures.BuildingWallW)(get1x1GridPos([4, 8])),
  createObj1x1(gl)(Textures.BuildingWallW)(get1x1GridPos([4, 7])),
  createObj1x1(gl)(Textures.BuildingWallW)(get1x1GridPos([4, 6])),
  createObj1x2(gl)(Textures.BuildingCornerSW)(get1x2GridPos([4, 4])),
  createObj1x2(gl)(Textures.BuildingCornerNW)(get1x2GridPos([4, 10])),
  createObj1x2(gl)(Textures.BuildingWallN)(get1x2GridPos([6, 10])),
  createObj1x2(gl)(Textures.BuildingWallN)(get1x2GridPos([5, 10])),
  createObj1x2(gl)(Textures.BuildingCornerNE)(get1x2GridPos([7, 10])),
  createObj1x2(gl)(Textures.BuildingDoorE)(get1x2GridPos([7, 7])),
  createObj1x1(gl)(Textures.BuildingWallE)(get1x1GridPos([7, 6])),
  createObj1x1(gl)(Textures.BuildingWallE)(get1x1GridPos([7, 9])),
  createObj1x2(gl)(Textures.BuildingWallS)(get1x2GridPos([5, 4])),
  createObj1x2(gl)(Textures.BuildingWallS)(get1x2GridPos([6, 4])),
  createObj1x2(gl)(Textures.BuildingCornerSE)(get1x2GridPos([7, 4])),
];

const createFoliage = (gl: WebGLRenderingContext) => [
  createObj2x2(gl)(Textures.Bush1)(addTuple(get2x2GridPos([15, 10]))([4, 0])),
  createObj2x2(gl)(Textures.Bush1)(addTuple(get2x2GridPos([2, 7]))([4, 0])),
  createObj2x2(gl)(Textures.Tree1)(get2x2GridPos([12, 7])),
  createObj2x2(gl)(Textures.Bush1)(addTuple(get2x2GridPos([14, 6]))([4, 0])),
  createObj2x2(gl)(Textures.Bush2)(addTuple(get2x2GridPos([13, 5]))([4, 0])),
  createObj2x2(gl)(Textures.Tree1)(get2x2GridPos([10, 4])),
  createObj2x2(gl)(Textures.Tree1)(get2x2GridPos([12, 4])),
  createObj2x2(gl)(Textures.Bush1)(addTuple(get2x2GridPos([5, 3]))([4, 0])),
  createObj2x2(gl)(Textures.Bush1)(addTuple(get2x2GridPos([11, 3]))([4, 0])),
  createObj2x2(gl)(Textures.Tree2)(get2x2GridPos([13, 3])),
  createObj2x2(gl)(Textures.Bush1)(addTuple(get2x2GridPos([3, 2]))([4, 0])),
  createObj2x2(gl)(Textures.Bush2)(addTuple(get2x2GridPos([10, 2]))([4, 0])),
  createObj2x2(gl)(Textures.Tree2)(get2x2GridPos([4, 1])),
  createObj2x2(gl)(Textures.Tree1)(get2x2GridPos([7, 0])),
  createObj2x2(gl)(Textures.Bush2)(addTuple(get2x2GridPos([8, 0]))([4, 0])),
  createObj2x2(gl)(Textures.Tree2)(get2x2GridPos([11, 0])),
];

const createGameText =
  (gl: WebGLRenderingContext) =>
  (fontSize: number) =>
  (deltaX: number, deltaY: number) =>
  (text: string) =>
    pipe(
      createText(gl)(Textures.Font)("0123456789/")(8, 128)(text),
      setGroupSize(gl)(fontSize, fontSize),
      A.map(movePosition(gl)(deltaX, deltaY))
    );

const createHud = (gl: WebGLRenderingContext) => [
  createObj4x1(gl)(Textures.HudTopLeft)(get4x1GridPos([0, 13])),
  createObj16x1(gl)(Textures.HudTop)(get16x1GridPos([3, 13])),
  createObj4x1(gl)(Textures.HudTopButton)([162, 388]),
  createObj4x1(gl)(Textures.HudTopButton)([236, 388]),
  createObj4x1(gl)(Textures.HudTopButton)([310, 388]),
  createObj4x1(gl)(Textures.HudTopButton)([384, 388]),
  createObj4x1(gl)(Textures.HudTopButton)([458, 388]),
  createObj4x1(gl)(Textures.HudTopButton)([532, 388]),
  createObj4x1(gl)(Textures.HudTopRight)(get4x1GridPos([17, 13])),
  createObj4x2(gl)(Textures.HudBottomLeft)([64, 32]),
  createObj4x2(gl)(Textures.HudBottomRight)([608, 32]),
  createObj4x4(gl)(Textures.CharacterScreen)(get4x4GridPos([0, 10])),
  createObj4x4(gl)(Textures.CharacterScreen)(get4x4GridPos([0, 7])),
  createObj4x4(gl)(Textures.CharacterScreen)(get4x4GridPos([0, 4])),
  createObj4x4(gl)(Textures.CharacterScreen)(get4x4GridPos([0, 1])),
  createObj4x4(gl)(Textures.CharacterScreen)(get4x4GridPos([17, 10])),
  createObj4x4(gl)(Textures.CharacterScreen)(get4x4GridPos([17, 7])),
  createObj4x4(gl)(Textures.CharacterScreen)(get4x4GridPos([17, 4])),
  createObj4x4(gl)(Textures.CharacterScreen)(get4x4GridPos([17, 1])),
  createObj4x2(gl)(Textures.HudBottomTile)([160, 32]),
  createObj4x2(gl)(Textures.HudBottomTile)([250, 32]),
  createObj4x2(gl)(Textures.HudBottomTile)([340, 32]),
  createObj4x2(gl)(Textures.HudBottomTile)([430, 32]),
  createObj4x2(gl)(Textures.HudBottomTile)([520, 32]),
  ...createGameText(gl)(64)(200, 200)("0000"),
];

const createScene = (gl: WebGLRenderingContext) =>
  createYehat2DScene(gl)({
    clearColor: rgb(127, 149, 255),
    animationInterval: 1000 / 12,
    gameData: {},
    textures: createTextures(),
    gameObjects: pipe(
      createTerrain(gl),
      A.concat(createCharacters(gl)),
      A.concat(createItems(gl)),
      A.concat(createBgFoliage(gl)),
      A.concat(createBuilding(gl)),
      A.concat(createFoliage(gl)),
      A.concat(createHud(gl)),
      A.concat(createGrid(gl))
    ),
  });

const updateScene = () => identity;

const initOptions = {
  window,
  canvasId: "#glcanvas",
  createScene,
  updateScene,
};

pipe(initOptions, startGame);
