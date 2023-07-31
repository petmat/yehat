import * as T from "fp-ts/lib/Task";
import { pipe } from "fp-ts/lib/function";

import {
  GameData,
  GameObject2DInitialized,
  YehatScene2DCreated,
  YehatScene2DInitialized,
  bindBuffers,
  initializeDefaultScene2D,
  loadGame,
  processGameTick,
  rgb,
} from "@yehat/yehat/src/v2/core";
import {
  addTexture,
  createSprite,
  emptyTextures,
  setPosition,
  setSize,
  setTexture,
  setTextureCoords,
} from "@yehat/yehat/src/v2/shapes";
import { assoc } from "@yehat/yehat/src/v2/utils";

enum Textures {
  Mario,
}

interface SpriteAnimationGameData extends GameData {
  previousTime: number;
  currentTime: number;
  marioFrameIndex: number;
}

type SpriteAnimationScene = YehatScene2DInitialized<SpriteAnimationGameData>;

const gridSizeToCoord = (gridSize: number) => 1 / gridSize;

const getTextureCoordsForFrame = (gridSize: number) => (frameIndex: number) => {
  const step = gridSizeToCoord(gridSize);
  const xIndex = frameIndex % gridSize;
  const yIndex = Math.floor(frameIndex / gridSize);

  return new Float32Array([
    step * xIndex,
    1 - step * yIndex,
    step * (xIndex + 1),
    1 - step * yIndex,
    step * (xIndex + 1),
    1 - step * (yIndex + 1),
    step * xIndex,
    1 - step * yIndex,
    step * (xIndex + 1),
    1 - step * (yIndex + 1),
    step * xIndex,
    1 - step * (yIndex + 1),
  ]);
};

const createCharacter =
  (gl: WebGLRenderingContext) =>
  (texture: Textures) =>
  (x: number, y: number) =>
    pipe(
      createSprite(gl)(),
      setSize(gl)(128, 128),
      setPosition(gl)(x, y),
      setTexture(texture),
      setTextureCoords(getTextureCoordsForFrame(4)(2))
    );

const createGameObjects = (gl: WebGLRenderingContext) => {
  return [createCharacter(gl)(Textures.Mario)(400, 300)];
};

const createScene = (
  gl: WebGLRenderingContext
): YehatScene2DCreated<SpriteAnimationGameData> => ({
  isInitialized: false as const,
  clearColor: rgb(127, 149, 255),
  gameData: { currentTime: 0, previousTime: 0, marioFrameIndex: 2 },
  textures: pipe(
    emptyTextures(),
    addTexture(Textures.Mario, "assets/textures/mario_sprite.png")
  ),
  gameObjects: createGameObjects(gl),
});

const updateScene = (scene: SpriteAnimationScene): SpriteAnimationScene => {
  const { gameData, gameObjects } = scene;

  const { previousTime, currentTime, marioFrameIndex } = gameData;

  const [mario] = gameObjects;

  const shouldAnimate = currentTime - previousTime > 500;

  const newMarioFrameIndex = shouldAnimate
    ? marioFrameIndex < 4
      ? marioFrameIndex + 1
      : 2
    : marioFrameIndex;

  const newMario = pipe(
    mario,
    setTextureCoords(getTextureCoordsForFrame(4)(newMarioFrameIndex))
  ) as GameObject2DInitialized;

  bindBuffers(scene.context.webGLRenderingContext)(newMario);

  return {
    ...scene,
    gameData: pipe(
      gameData,
      assoc<SpriteAnimationGameData, "marioFrameIndex">("marioFrameIndex")(
        newMarioFrameIndex
      ),
      assoc<SpriteAnimationGameData, "previousTime">("previousTime")(
        shouldAnimate ? currentTime : previousTime
      )
    ),
    gameObjects: [newMario],
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
