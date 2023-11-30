import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import {
  GameData,
  YehatScene2D,
  initializeDefaultScene2D,
  loadGame,
  processGameTick,
} from "@yehat/yehat/src/v2/core";
import {
  GameObject2D,
  addTexture,
  emptyTextures,
  movePosition,
  setGroupSize,
  setPosition,
  setSize,
  setTexture,
} from "@yehat/yehat/src/v2/gameObject";
import { createSprite, createText } from "@yehat/yehat/src/v2/shapes";
import { rgb } from "@yehat/yehat/src/v2/colors";

enum Textures {
  Mario,
  MarioFont,
}

interface KeyboardInputGameData extends GameData {
  moved: boolean;
}

type KeyboardInputScene = YehatScene2D<KeyboardInputGameData>;

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
      setSize(gl)(32, 32),
      setPosition(gl)(x, y),
      setTexture(texture)
    );

const getGameObjectCreators = (gl: WebGLRenderingContext) => ({
  createCharacter: createCharacter(gl),
});

const createGameObjects = (gl: WebGLRenderingContext) => {
  const { createCharacter } = getGameObjectCreators(gl);

  const createMarioText = createText(gl)(Textures.MarioFont);

  return [
    createCharacter(Textures.Mario)(286, 70),
    ...pipe(
      createMarioText("ARROW LEFT"),
      setGroupSize(gl)(32, 32),
      A.map(movePosition(gl)(180, 340))
    ),
    ...pipe(
      createMarioText("ARROW RIGHT"),
      setGroupSize(gl)(32, 32),
      A.map(movePosition(gl)(168, 260))
    ),
  ];
};

const createScene = (
  gl: WebGLRenderingContext
): YehatScene2D<KeyboardInputGameData> => ({
  isInitialized: false as const,
  clearColor: rgb(127, 149, 255),
  currentTime: 0,
  previousTime: 0,
  keysHandled: {},
  animationInterval: 1000 / 12,
  gameData: {
    moved: false,
  },
  textures: pipe(
    emptyTextures(),
    addTexture(Textures.Mario, "assets/textures/mario.png"),
    addTexture(Textures.MarioFont, "assets/fonts/mario_font_square.png")
  ),
  gameObjects: createGameObjects(gl),
  context: O.none,
});

const handleInput =
  (gl: WebGLRenderingContext) =>
  (gameData: KeyboardInputGameData) =>
  (mario: GameObject2D) => {
    if (isKeyDown("ArrowLeft")) {
      const newM = movePosition(gl)(-6, 0)(mario);
      const newGD = { ...gameData, moved: true };
      return [newGD, newM] as const;
    }

    if (isKeyDown("ArrowRight")) {
      const newM = movePosition(gl)(6, 0)(mario);
      const newGD = { ...gameData, moved: true };
      return [newGD, newM] as const;
    }

    return [gameData, mario] as const;
  };

const updateScene =
  (gl: WebGLRenderingContext) =>
  (scene: KeyboardInputScene): KeyboardInputScene => {
    const { gameData, gameObjects } = scene;

    const [mario, ...restGameObjects] = gameObjects;

    const [newGameData, newMario] = handleInput(gl)(gameData)(mario);

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
    TE.chain(pipe(updateScene, processGameTick(gl)))
  );

pipe(startup, loadGame(window)("#glcanvas"));

document.addEventListener("keydown", (event) => {
  setIsKeyDown(event.key, true);
});

document.addEventListener("keyup", (event) => {
  setIsKeyDown(event.key, false);
});
