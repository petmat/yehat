import * as A from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";

import {
  YehatScene2D,
  addKeyListeners,
  createYehat2DScene,
  isKeyDown,
  startGame,
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

type KeyboardInputScene = YehatScene2D<{}>;

const createMario = (gl: WebGLRenderingContext) => (x: number, y: number) =>
  pipe(
    createSprite(gl)(),
    setSize(gl)(32, 32),
    setPosition(gl)(x, y),
    setTexture(Textures.Mario)
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

const createScene = (gl: WebGLRenderingContext): KeyboardInputScene =>
  createYehat2DScene(gl)({
    clearColor: rgb(127, 149, 255),
    gameData: {},
    textures: pipe(
      emptyTextures(),
      addTexture(Textures.Mario, "assets/textures/mario.png"),
      addTexture(Textures.MarioFont, "assets/fonts/mario_font_square.png")
    ),
    gameObjects: [
      createMario(gl)(286, 70),
      ...createMarioText(gl)(32)(180, 340)("ARROW LEFT"),
      ...createMarioText(gl)(32)(168, 260)("ARROW RIGHT"),
    ],
  });

const handleInput =
  (gl: WebGLRenderingContext) =>
  (mario: GameObject2D): GameObject2D => {
    if (isKeyDown("ArrowLeft")) {
      const newM = movePosition(gl)(-6, 0)(mario);
      return newM;
    }

    if (isKeyDown("ArrowRight")) {
      const newM = movePosition(gl)(6, 0)(mario);
      return newM;
    }

    return mario;
  };

const updateScene =
  (gl: WebGLRenderingContext) =>
  (scene: KeyboardInputScene): KeyboardInputScene => {
    const { gameObjects } = scene;

    const [mario, ...restGameObjects] = gameObjects;

    const newMario = handleInput(gl)(mario);

    return {
      ...scene,
      gameObjects: [newMario, ...restGameObjects],
    };
  };

const initOptions = {
  window,
  canvasId: "#glcanvas",
  createScene,
  updateScene,
};

pipe(initOptions, startGame);

addKeyListeners(window);
