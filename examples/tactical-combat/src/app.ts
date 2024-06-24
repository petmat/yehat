import { identity, pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/lib/Array";
import * as NEA from "fp-ts/lib/NonEmptyArray";

import { rgb } from "@yehat/yehat/src/v2/colors";
import {
  createYehat2DScene,
  gameObjects,
  startGame,
} from "@yehat/yehat/src/v2/core";
import {
  GameObject2D,
  Texture,
  addTexture,
  color,
  currentFrame,
  emptyTextures,
  movePosition,
  setGroupSize,
  setTexture,
  textureFrameGridWidth,
  updateCharacterTextureCoords,
} from "@yehat/yehat/src/v2/gameObject";
import {
  createDropShadow,
  createRectangle,
  createText,
} from "@yehat/yehat/src/v2/shapes";
import { addTuple } from "@yehat/yehat/src/v2/math";
import { vec4 } from "gl-matrix";

enum Textures {
  GrassTile,
  Floor,
  Grid,
  Character,
  Box,
  Foliage,
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
  FontNumbers,
  FontAbc,
  Slash,
  Faces,
  Bar,
  BarTop,
}

enum Foliage {
  Bush1,
  Bush2,
  Tree1,
  Tree2,
}

enum Faces {
  Beth,
  Boss,
  Hitman,
  Kelly,
  Magic,
  Mouse,
  Snake,
  Spike,
}

const textureFileMappings: [index: number, url: string][] = [
  [Textures.GrassTile, "assets/textures/grass_tile.png"],
  [Textures.Floor, "assets/textures/floor.png"],
  [Textures.Grid, "assets/textures/grid.png"],
  [Textures.Character, "assets/textures/character.png"],
  [Textures.Box, "assets/textures/box.png"],
  [Textures.Foliage, "assets/textures/foliage.png"],
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
  [Textures.FontNumbers, "assets/textures/font_numbers.png"],
  [Textures.FontAbc, "assets/textures/font_abc.png"],
  [Textures.Slash, "assets/textures/slash.png"],
  [Textures.Faces, "assets/textures/faces.png"],
  [Textures.Bar, "assets/textures/bar.png"],
  [Textures.BarTop, "assets/textures/bar_top.png"],
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

const createPlant =
  (gl: WebGLRenderingContext) =>
  (frame: number) =>
  (position: [x: number, y: number]) =>
    pipe(
      createObj2x2(gl)(Textures.Foliage)(position),
      currentFrame.set(frame),
      textureFrameGridWidth.set(4),
      updateCharacterTextureCoords
    );

const createBgFoliage = (gl: WebGLRenderingContext) => [
  createPlant(gl)(Foliage.Tree1)(get2x2GridPos([4, 11])),
  createPlant(gl)(Foliage.Bush1)(addTuple(get2x2GridPos([5, 11]))([4, 0])),
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
  createPlant(gl)(Foliage.Bush1)(addTuple(get2x2GridPos([15, 10]))([4, 0])),
  createPlant(gl)(Foliage.Bush1)(addTuple(get2x2GridPos([2, 7]))([4, 0])),
  createPlant(gl)(Foliage.Tree1)(get2x2GridPos([12, 7])),
  createPlant(gl)(Foliage.Bush1)(addTuple(get2x2GridPos([14, 6]))([4, 0])),
  createPlant(gl)(Foliage.Bush2)(addTuple(get2x2GridPos([13, 5]))([4, 0])),
  createPlant(gl)(Foliage.Tree1)(get2x2GridPos([10, 4])),
  createPlant(gl)(Foliage.Tree1)(get2x2GridPos([12, 4])),
  createPlant(gl)(Foliage.Bush1)(addTuple(get2x2GridPos([5, 3]))([4, 0])),
  createPlant(gl)(Foliage.Bush1)(addTuple(get2x2GridPos([11, 3]))([4, 0])),
  createPlant(gl)(Foliage.Tree2)(get2x2GridPos([13, 3])),
  createPlant(gl)(Foliage.Bush1)(addTuple(get2x2GridPos([3, 2]))([4, 0])),
  createPlant(gl)(Foliage.Bush2)(addTuple(get2x2GridPos([10, 2]))([4, 0])),
  createPlant(gl)(Foliage.Tree2)(get2x2GridPos([4, 1])),
  createPlant(gl)(Foliage.Tree1)(get2x2GridPos([7, 0])),
  createPlant(gl)(Foliage.Bush2)(addTuple(get2x2GridPos([8, 0]))([4, 0])),
  createPlant(gl)(Foliage.Tree2)(get2x2GridPos([11, 0])),
];

const abcTextCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const setGroupDistance =
  (gl: WebGLRenderingContext) =>
  (dx: number, dy: number) =>
  (gameObjects: GameObject2D[]): GameObject2D[] =>
    gameObjects.map((gameObj, i) => {
      return movePosition(gl)(dx * i, dy * i)(gameObj);
    });

const createAbcText =
  (gl: WebGLRenderingContext) =>
  (text: string) =>
  (textColor: vec4) =>
  ([deltaX, deltaY]: [dx: number, dy: number]) =>
    pipe(
      createText(gl)(Textures.FontAbc)(abcTextCharacters)(8, 8, 64)(text),
      setGroupSize(gl)(16, 16),
      A.map(movePosition(gl)(deltaX, deltaY)),
      A.map(color.set(textColor)),
      setGroupDistance(gl)(-4, 0),
      A.flatMap(createDropShadow(gl)(2, 0))
    );

const calculateButtonAndTextureWidthDiff = () => 37 - 64;

const calculateHalfOfTextWidth = (text: string) => (text.length * 9) / 2;

const calculateAlignFix = (text: string) => (text.length === 3 ? 2 : 0);

const createTopBarButton =
  (gl: WebGLRenderingContext) =>
  (text: string) =>
  (position: [x: number, y: number]) =>
    [
      createObj4x1(gl)(Textures.HudTopButton)(position),
      ...createAbcText(gl)(text)(rgb(184, 156, 120))(
        addTuple([
          calculateButtonAndTextureWidthDiff() -
            calculateHalfOfTextWidth(text) +
            calculateAlignFix(text),
          0,
        ])(position)
      ),
    ];

const createTopBar = (gl: WebGLRenderingContext) => (): GameObject2D[] =>
  [
    createObj4x1(gl)(Textures.HudTopLeft)(get4x1GridPos([0, 13])),
    ...createTurnNumberText(gl)([40, 388])("1"),
    ...createSlash(gl)(Textures.Slash)([52, 386]),
    ...createTurnNumberText(gl)([62, 388])("79"),
    createObj16x1(gl)(Textures.HudTop)(get16x1GridPos([3, 13])),
    ...createTopBarButton(gl)("DONE")([162, 388]),
    ...createTopBarButton(gl)("INV")([236, 388]),
    ...createTopBarButton(gl)("MAP")([310, 388]),
    ...createTopBarButton(gl)("OPT")([384, 388]),
    ...createTopBarButton(gl)("CHAT")([458, 388]),
    ...createTopBarButton(gl)("TAUNT")([532, 388]),
    createObj4x1(gl)(Textures.HudTopRight)(get4x1GridPos([17, 13])),
  ];

const numberTextCharacters = "0123456789";

const createNumberText =
  (shadowX: number, shadowY: number) =>
  (gl: WebGLRenderingContext) =>
  ([deltaX, deltaY]: [dx: number, dy: number]) =>
  (text: string) =>
    pipe(
      createText(gl)(Textures.FontNumbers)(numberTextCharacters)(4, 8, 32)(
        text
      ),
      setGroupSize(gl)(8, 16),
      A.map(movePosition(gl)(deltaX, deltaY)),
      A.flatMap(createDropShadow(gl)(shadowX, shadowY))
    );

const createTurnNumberText = createNumberText(2, -2);

const createAPNumberText = createNumberText(2, 0);

const createSlash =
  (gl: WebGLRenderingContext) =>
  (texture: number) =>
  (position: [x: number, y: number]): GameObject2D[] =>
    pipe(
      createSizedRectangle(gl)([16, 16])(position),
      setTexture(texture),
      createDropShadow(gl)(0, -2)
    );

const createFace =
  (gl: WebGLRenderingContext) =>
  (frame: number) =>
  (position: [x: number, y: number]): GameObject2D =>
    pipe(
      createSizedRectangle(gl)([64, 64])(position),
      setTexture(Textures.Faces),
      currentFrame.set(frame),
      textureFrameGridWidth.set(4),
      updateCharacterTextureCoords
    );

const createCharacterScreen =
  (gl: WebGLRenderingContext) =>
  (frame: number) =>
  (name: string) =>
  (ap: number) =>
  (position: [x: number, y: number]): GameObject2D[] =>
    [
      createObj4x4(gl)(Textures.CharacterScreen)(position),
      createFace(gl)(frame)(addTuple([0, -8])(position)),
      ...createAPNumberText(gl)(addTuple([12, -32])(position))(ap.toString()),
      ...createAbcText(gl)(name)(rgb(184, 156, 120))(
        addTuple([-52, -50])(position)
      ),
      pipe(
        createSizedRectangle(gl)([8, 32])(addTuple([-52, -24])(position)),
        setTexture(Textures.Bar),
        color.set(rgb(255, 0, 0))
      ),
      pipe(
        createSizedRectangle(gl)([8, 8])(addTuple([-52, -4])(position)),
        setTexture(Textures.BarTop),
        color.set(rgb(255, 0, 0))
      ),
      pipe(
        createSizedRectangle(gl)([8, 32])(addTuple([-46, -24])(position)),
        setTexture(Textures.Bar),
        color.set(rgb(0, 196, 255))
      ),
      pipe(
        createSizedRectangle(gl)([8, 8])(addTuple([-46, -4])(position)),
        setTexture(Textures.BarTop),
        color.set(rgb(0, 196, 255))
      ),
      pipe(
        createSizedRectangle(gl)([8, 32])(addTuple([-40, -24])(position)),
        setTexture(Textures.Bar),
        color.set(rgb(252, 112, 0))
      ),
      pipe(
        createSizedRectangle(gl)([8, 8])(addTuple([-40, -4])(position)),
        setTexture(Textures.BarTop),
        color.set(rgb(252, 112, 0))
      ),
    ];

const createHud = (gl: WebGLRenderingContext) => [
  ...createTopBar(gl)(),
  createObj4x2(gl)(Textures.HudBottomLeft)([64, 32]),
  createObj4x2(gl)(Textures.HudBottomRight)([608, 32]),
  ...createCharacterScreen(gl)(Faces.Boss)("BOSS")(24)(get4x4GridPos([0, 10])),
  ...createCharacterScreen(gl)(Faces.Beth)("BETH")(28)(get4x4GridPos([0, 7])),
  ...createCharacterScreen(gl)(Faces.Kelly)("KELLY")(32)(get4x4GridPos([0, 4])),
  ...createCharacterScreen(gl)(Faces.Spike)("SPIKE")(30)(get4x4GridPos([0, 1])),
  ...createCharacterScreen(gl)(Faces.Snake)("SNAKE")(30)(
    get4x4GridPos([17, 10])
  ),
  ...createCharacterScreen(gl)(Faces.Hitman)("HITMAN")(28)(
    get4x4GridPos([17, 7])
  ),
  ...createCharacterScreen(gl)(Faces.Magic)("MAGIC")(33)(
    get4x4GridPos([17, 4])
  ),
  ...createCharacterScreen(gl)(Faces.Mouse)("MOUSE")(32)(
    get4x4GridPos([17, 1])
  ),
  createObj4x2(gl)(Textures.HudBottomTile)([160, 32]),
  createObj4x2(gl)(Textures.HudBottomTile)([250, 32]),
  createObj4x2(gl)(Textures.HudBottomTile)([340, 32]),
  createObj4x2(gl)(Textures.HudBottomTile)([430, 32]),
  createObj4x2(gl)(Textures.HudBottomTile)([520, 32]),
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
      A.concat(createHud(gl))
      //A.concat(createGrid(gl))
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
