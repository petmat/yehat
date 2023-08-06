import * as A from "fp-ts/lib/Array";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import {
  GameData,
  GameObject2D,
  GameObject2DInitialized,
  YehatScene2DCreated,
  YehatScene2DInitialized,
  initializeDefaultScene2D,
  loadGame,
  processGameTick,
  rgb,
} from "@yehat/yehat/src/v2/core";
import {
  addTexture,
  createSprite,
  createText,
  emptyTextures,
  movePosition,
  pxToWebGLCoords,
  setGroupSize,
  setScale,
  setTexture,
  setTranslation,
} from "@yehat/yehat/src/v2/shapes";
import { addV2, createV2 } from "@yehat/yehat/src/v2/math";

enum Textures {
  Mario,
  MarioFont,
}

interface KeyboardInputGameData extends GameData {
  moved: boolean;
}

type KeyboardInputScene = YehatScene2DInitialized<KeyboardInputGameData>;

let keyboardState: { [key: string]: boolean } = {};

const isKeyDown = (key: string): boolean => !!keyboardState[key];

const setIsKeyDown = (key: string, isDown: boolean): void => {
  keyboardState = { ...keyboardState, [key]: isDown };
};

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

const getGameObjectCreators = (gl: WebGLRenderingContext) => ({
  createCharacter: createCharacter(gl),
});

const createGameObjects = (gl: WebGLRenderingContext) => {
  const { createCharacter } = getGameObjectCreators(gl);

  const createMarioText = createText(gl)(Textures.MarioFont);

  return [
    createCharacter(Textures.Mario)(270, 54),
    ...pipe(
      createMarioText("ARROW LEFT"),
      setGroupSize(gl)(32, 32),
      A.map(movePosition(gl)(-320, 240))
    ),
    ...pipe(
      createMarioText("ARROW RIGHT"),
      setGroupSize(gl)(32, 32),
      A.map(movePosition(gl)(-346, 100))
    ),
  ];
};

const createScene = (
  gl: WebGLRenderingContext
): YehatScene2DCreated<KeyboardInputGameData> => ({
  isInitialized: false as const,
  clearColor: rgb(127, 149, 255),
  gameData: {
    moved: false,
  },
  textures: pipe(
    emptyTextures(),
    addTexture(Textures.Mario, "assets/textures/mario.png"),
    addTexture(Textures.MarioFont, "assets/fonts/mario_font_square.png")
  ),
  gameObjects: createGameObjects(gl),
});

const updateScene = (scene: KeyboardInputScene): KeyboardInputScene => {
  const gl = scene.context.webGLRenderingContext;

  const { gameData, gameObjects } = scene;

  const [mario, ...restGameObjects] = gameObjects;

  let newMario = mario;
  let newGameData = gameData;

  if (isKeyDown("ArrowLeft")) {
    newMario = movePosition(gl)(-6, 0)(mario) as GameObject2DInitialized;
    newGameData = { ...gameData, moved: true };
  }

  if (isKeyDown("ArrowRight")) {
    newMario = movePosition(gl)(6, 0)(mario) as GameObject2DInitialized;
    newGameData = { ...gameData, moved: true };
  }

  return {
    ...scene,
    gameData: newGameData,
    gameObjects: [newMario, ...restGameObjects],
  };
};

const startup = (gl: WebGLRenderingContext) =>
  pipe(
    gl,
    createScene,
    initializeDefaultScene2D(gl),
    T.chain(processGameTick(updateScene))
  );

pipe(startup, loadGame(window)("#glcanvas"));

document.addEventListener("keydown", (event) => {
  setIsKeyDown(event.key, true);
  if (event.key === "ArrowUp") {
    console.log("Jump!!!");
  }
  if (event.key === "ArrowDown") {
    console.log("Crouch?");
  }
  if (event.key === "ArrowLeft") {
    console.log("Move left!");
  }
  if (event.key === "ArrowRight") {
    console.log("Move right!");
  }
});

document.addEventListener("keyup", (event) => {
  setIsKeyDown(event.key, false);
});
