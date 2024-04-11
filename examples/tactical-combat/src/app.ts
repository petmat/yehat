import { identity, pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/lib/Array";
import * as NEA from "fp-ts/lib/NonEmptyArray";

import { rgb } from "@yehat/yehat/src/v2/colors";
import { createYehat2DScene, startGame } from "@yehat/yehat/src/v2/core";
import {
  GameObject2D,
  addTexture,
  currentFrame,
  emptyTextures,
  setTexture,
  textureFrameGridWidth,
  updateCharacterTextureCoords,
} from "@yehat/yehat/src/v2/gameObject";
import { createRectangle } from "@yehat/yehat/src/v2/shapes";
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
}

const createTerrainTile =
  (gl: WebGLRenderingContext) =>
  (texture: Textures) =>
  (position: [x: number, y: number]) =>
    pipe(createRectangle(gl)(position, [32, 32]), setTexture(texture));

const createGrassTile = (gl: WebGLRenderingContext) =>
  createTerrainTile(gl)(Textures.GrassTile);

const createFloorTile = (gl: WebGLRenderingContext) =>
  createTerrainTile(gl)(Textures.Floor);

const createTextures = () =>
  pipe(
    emptyTextures(),
    addTexture(Textures.GrassTile, "assets/textures/grass_tile.png"),
    addTexture(Textures.Floor, "assets/textures/floor.png"),
    addTexture(Textures.Grid, "assets/textures/grid.png"),
    addTexture(Textures.Character, "assets/textures/character.png"),
    addTexture(Textures.Box, "assets/textures/box.png"),
    addTexture(Textures.Tree1, "assets/textures/tree_01.png"),
    addTexture(Textures.Tree2, "assets/textures/tree_02.png"),
    addTexture(Textures.Bush1, "assets/textures/bush_01.png"),
    addTexture(Textures.Bush2, "assets/textures/bush_02.png"),
    addTexture(Textures.BuildingWallW, "assets/textures/building_wall_w.png"),
    addTexture(Textures.BuildingWallN, "assets/textures/building_wall_n.png"),
    addTexture(Textures.BuildingWallE, "assets/textures/building_wall_e.png"),
    addTexture(Textures.BuildingDoorE, "assets/textures/building_door_e.png"),
    addTexture(
      Textures.BuildingCornerSW,
      "assets/textures/building_corner_sw.png",
    ),
    addTexture(
      Textures.BuildingCornerNW,
      "assets/textures/building_corner_nw.png",
    ),
    addTexture(
      Textures.BuildingCornerSE,
      "assets/textures/building_corner_se.png",
    ),
    addTexture(
      Textures.BuildingCornerNE,
      "assets/textures/building_corner_ne.png",
    ),
    addTexture(Textures.BuildingWallS, "assets/textures/building_wall_s.png"),
  );

const createTerrain = (gl: WebGLRenderingContext): GameObject2D[] => {
  return pipe(
    NEA.range(0, 20),
    A.flatMap((i) =>
      pipe(
        NEA.range(0, 15),
        A.map((j) => createGrassTile(gl)([i * 32 + 16, j * 28 - 6])),
      ),
    ),
    pipe(
      pipe(
        NEA.range(5, 7),
        A.flatMap((i) =>
          pipe(
            NEA.range(6, 10),
            A.map((j) => createFloorTile(gl)([i * 32 + 16, j * 28 - 6])),
          ),
        ),
      ),
      A.concat,
    ),
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
        A.map((j) => createGridTile(gl)([i * 32 + 16, j * 28 - 6])),
      ),
    ),
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
      updateCharacterTextureCoords,
    );

const createObj1x1 =
  (gl: WebGLRenderingContext) =>
  (texture: number) =>
  (position: [x: number, y: number]) =>
    pipe(createRectangle(gl)(position, [32, 32]), setTexture(texture));

const createObj1x2 =
  (gl: WebGLRenderingContext) =>
  (texture: number) =>
  (position: [x: number, y: number]) =>
    pipe(createRectangle(gl)(position, [32, 64]), setTexture(texture));

const createObj2x2 =
  (gl: WebGLRenderingContext) =>
  (texture: number) =>
  (position: [x: number, y: number]) =>
    pipe(createRectangle(gl)(position, [64, 64]), setTexture(texture));

const createObj2x1 =
  (gl: WebGLRenderingContext) =>
  (texture: number) =>
  (position: [x: number, y: number]) =>
    pipe(createRectangle(gl)(position, [64, 32]), setTexture(texture));

const getGridPos =
  ([width, height]: [width: number, height: number]) =>
  ([gx, gy]: [gx: number, gy: number]): [x: number, y: number] => [
    32 * gx + width / 2,
    28 * gy + height / 2 + 6,
  ];

const get1x1GridPos = getGridPos([32, 32]);

const get1x2GridPos = getGridPos([32, 64]);

const get2x1GridPos = getGridPos([64, 32]);

const get2x2GridPos = getGridPos([64, 64]);

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

const createScene = (gl: WebGLRenderingContext) =>
  createYehat2DScene(gl)({
    clearColor: rgb(127, 149, 255),
    animationInterval: 1000 / 12,
    gameData: {},
    textures: createTextures(),
    gameObjects: pipe(
      createTerrain(gl),
      //A.concat(createGrid(gl)),
      A.concat(createCharacters(gl)),
      A.concat(createItems(gl)),
      A.concat(createBgFoliage(gl)),
      A.concat(createBuilding(gl)),
      A.concat(createFoliage(gl)),
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
