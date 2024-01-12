import { pipe } from "fp-ts/lib/function";
import { Lens } from "monocle-ts";

import {
  YehatScene2D,
  createYehat2DScene,
  startGame,
} from "@yehat/yehat/src/v2/core";
import { createSprite } from "@yehat/yehat/src/v2/shapes";
import {
  addAnimation,
  addTexture,
  currentFrame,
  defaultFrame,
  emptyTextures,
  getTextureCoordsForFrame,
  setCurrentAnimation,
  setPosition,
  setSize,
  setTexture,
  setTextureCoords,
  textureFrameGridWidth,
  updateAnimations,
} from "@yehat/yehat/src/v2/gameObject";
import { rgb } from "@yehat/yehat/src/v2/colors";
import { rightV2 } from "@yehat/yehat/src/v2/math";

enum Textures {
  Mario,
}

enum Animations {
  MarioRun,
}

type SpriteAnimationScene = YehatScene2D<{}>;

const marioSpriteFrameGridWidth = 4;
const marioDefaultFrame = 2;

const getMarioTextureCoordsForFrame = pipe(
  rightV2(),
  getTextureCoordsForFrame(marioSpriteFrameGridWidth)
);

const createMario = (gl: WebGLRenderingContext) => (x: number, y: number) =>
  pipe(
    createSprite(gl)(),
    setSize(gl)(128, 128),
    setPosition(gl)(x, y),
    setTexture(Textures.Mario),
    textureFrameGridWidth.set(marioSpriteFrameGridWidth),
    currentFrame.set(marioDefaultFrame),
    defaultFrame.set(marioDefaultFrame),
    setTextureCoords(getMarioTextureCoordsForFrame(marioDefaultFrame)),
    addAnimation(Animations.MarioRun, [2, 3, 4]),
    setCurrentAnimation(Animations.MarioRun)
  );

const createScene = (gl: WebGLRenderingContext): SpriteAnimationScene =>
  createYehat2DScene(gl)({
    clearColor: rgb(127, 149, 255),
    gameData: {},
    textures: pipe(
      emptyTextures(),
      addTexture(Textures.Mario, "assets/textures/mario_sprite.png")
    ),
    gameObjects: [createMario(gl)(400, 300)],
  });

const gameObjectsLens = Lens.fromProp<SpriteAnimationScene>()("gameObjects");

const updateScene =
  (gl: WebGLRenderingContext) =>
  (scene: SpriteAnimationScene): SpriteAnimationScene =>
    pipe(
      scene,
      gameObjectsLens.modify(
        updateAnimations(gl)(scene.currentTime, scene.animationInterval)
      )
    );

const initOptions = {
  window,
  canvasId: "#glcanvas",
  createScene,
  updateScene,
};

pipe(initOptions, startGame);
