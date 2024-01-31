import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import * as S from "fp-ts/lib/String";
import { pipe } from "fp-ts/lib/function";

import {
  YehatScene2D,
  addKeyListeners,
  isKeyDown,
  startGame,
} from "@yehat/yehat/src/v2/core";
import { collides } from "@yehat/yehat/src/v2/collisions";
import { rgb } from "@yehat/yehat/src/v2/colors";
import { createRectangle, createText } from "@yehat/yehat/src/v2/shapes";
import { addV2, createV2, zeroV2 } from "@yehat/yehat/src/v2/math";

import {
  GameObject2D,
  addAnimation,
  addTexture,
  clearCurrentAnimation,
  emptyTextures,
  movePosition,
  setCurrentAnimation,
  currentFrame,
  defaultFrame,
  direction,
  setGroupSize,
  lastFrameChange,
  setTag,
  setTexture,
  setTextureCoords,
  textureFrameGridWidth,
  translation,
  velocity,
  getTextureCoordsForFrame,
  bindBuffers,
} from "@yehat/yehat/src/v2/gameObject";

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
  MarioSprite,
  Mushroom,
  MarioFont,
  X,
  Coin,
}

enum Animations {
  MarioRun,
}

interface PlayableGameData {
  canJump: boolean;
}

type PlayableScene = YehatScene2D<PlayableGameData>;

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
  (position: [x: number, y: number]) =>
    pipe(createRectangle(gl)(position, [32, 32]), setTexture(texture));

const createMario =
  (gl: WebGLRenderingContext) => (position: [x: number, y: number]) =>
    pipe(
      createCharacter(gl)(Textures.MarioSprite)(position),
      textureFrameGridWidth.set(4),
      currentFrame.set(1),
      defaultFrame.set(1),
      addAnimation(Animations.MarioRun, [2, 3, 4]),
      setTag("mario")
    );

const createSymbol =
  (gl: WebGLRenderingContext) =>
  (texture: Textures) =>
  (position: [x: number, y: number]) =>
    pipe(createRectangle(gl)(position, [16, 16]), setTexture(texture));

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
  createMario: createMario(gl),
  createMarioText: createMarioText(gl),
  createSymbol: createSymbol(gl),
});

const createGameObjects = (gl: WebGLRenderingContext) => {
  const {
    createTile,
    createLargeTile,
    createLargeWideTile,
    createFloor,
    createMario,
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
    pipe(createLargeTile(Textures.Pipe)([564, 54]), setTag("pipe")),
    // mario
    createMario([120, 36]),
    // sky
    createLargeTile(Textures.CloudSmall)([94, 252]),
    createLargeWideTile(Textures.Cloud)([554, 238]),
    // game info text
    ...createMarioText(16)(100, 356)("MARIO"),
    ...createMarioText(16)(330, 356)("WORLD"),
    ...createMarioText(16)(470, 356)("TIME"),
    ...createMarioText(16)(100, 336)("000000"),
    createSymbol(Textures.Coin)([236, 336]),
    createSymbol(Textures.X)([252, 336]),
    ...createMarioText(16)(270, 336)("00"),
    ...createMarioText(16)(344, 336)("1-1"),
    ...createMarioText(16)(480, 336)("000"),
  ];
};

const createScene = (
  gl: WebGLRenderingContext
): YehatScene2D<PlayableGameData> => ({
  clearColor: rgb(127, 149, 255),
  currentTime: 0,
  previousTime: 0,
  keysHandled: {},
  animationInterval: 1000 / 12,
  gameData: { canJump: true },
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
    addTexture(Textures.MarioSprite, "assets/textures/mario_sprite.png"),
    addTexture(Textures.Mushroom, "assets/textures/mushroom.png"),
    addTexture(Textures.MarioFont, "assets/fonts/mario_font_square.png"),
    addTexture(Textures.X, "assets/textures/x.png"),
    addTexture(Textures.Coin, "assets/textures/coin.png")
  ),
  gameObjects: createGameObjects(gl),
  webGLRenderingContext: gl,
  yehatContext: O.none,
});

export const detectCollisions =
  (gameData: PlayableGameData) =>
  (character: GameObject2D) =>
  (platforms: GameObject2D[]): [PlayableGameData, GameObject2D] => {
    let newCharacter = character;
    let newGameData = gameData;

    for (const platform of platforms) {
      const collision = collides(newCharacter)(platform);
      if (collision.isCollision) {
        newCharacter = pipe(
          newCharacter,
          translation.set(collision.newTranslation),
          velocity.set(collision.newVelocity)
        );
        newGameData = { ...newGameData, canJump: true };
      }
    }

    return [newGameData, newCharacter];
  };

const nextFrame = (
  frame: number,
  animationKey: number,
  animations: Record<number, number[] | undefined>
) => {
  const animation = animations[animationKey];

  if (!animation) {
    return frame;
  }

  const index = animation.indexOf(frame);
  const nextIndex = index < animation.length - 1 ? index + 1 : 0;
  return animation[nextIndex];
};

const handleInput =
  (gameData: PlayableGameData) =>
  (keysHandled: Record<string, boolean>) =>
  (
    mario: GameObject2D
  ): [PlayableGameData, Record<string, boolean>, GameObject2D] => {
    let newGameData = gameData;
    let newKeyHandled = keysHandled;
    let newMario = mario;
    if (isKeyDown("ArrowLeft")) {
      newMario = pipe(
        newMario,
        velocity.set(createV2(-0.5, newMario.velocity[1])),
        setCurrentAnimation(Animations.MarioRun),
        direction.set(createV2(-1, 0))
      );
    } else if (isKeyDown("ArrowRight")) {
      newMario = pipe(
        newMario,
        velocity.set(createV2(0.5, newMario.velocity[1])),
        setCurrentAnimation(Animations.MarioRun),
        direction.set(createV2(1, 0))
      );
    } else {
      newMario = pipe(
        newMario,
        velocity.set(createV2(0, newMario.velocity[1])),
        pipe(newMario.defaultFrame, currentFrame.set)
      );
    }

    if (isKeyDown("ArrowUp")) {
      if (!newKeyHandled["ArrowUp"] && gameData.canJump) {
        newMario = pipe(
          newMario,
          pipe(newMario.velocity, addV2(createV2(0, 1.4)), velocity.set),
          pipe(0, currentFrame.set)
        );
        console.log("jumpajumpa", newMario.currentFrame);
        newKeyHandled = { ...keysHandled, ArrowUp: true };
        newGameData = {
          ...newGameData,
          canJump: false,
        };
      }
    } else {
      newKeyHandled = { ...keysHandled, ArrowUp: false };
    }

    return [newGameData, newKeyHandled, newMario];
  };

const updateScene =
  (gl: WebGLRenderingContext) =>
  (scene: PlayableScene): PlayableScene => {
    const { gameData, gameObjects, keysHandled: keysHandled } = scene;

    const marioIndex = gameObjects.findIndex((obj) =>
      pipe(obj.tag, O.elem(S.Eq)("mario"))
    );

    const beforeGameObjects = gameObjects.slice(0, marioIndex);
    const mario = gameObjects[marioIndex];
    const afterGameObjects = gameObjects.slice(marioIndex + 1);

    let jumpVelocity = zeroV2();
    let gravityVelocity = createV2(0, -0.1);

    let [newGameData, newKeyHandled, newMario] = pipe(
      mario,
      clearCurrentAnimation(),
      handleInput(gameData)(keysHandled)
    );

    // Animation !!
    if (
      newMario.currentAnimation._tag === "Some" &&
      scene.currentTime - newMario.lastFrameChange >= scene.animationInterval
    ) {
      newMario = pipe(
        newMario,
        pipe(
          nextFrame(
            newMario.currentFrame,
            newMario.currentAnimation.value,
            newMario.animations
          ),
          currentFrame.set
        ),
        pipe(scene.currentTime, lastFrameChange.set)
      );
    }

    newMario = pipe(
      newMario,
      pipe(
        newMario.currentFrame,
        pipe(newMario.direction, getTextureCoordsForFrame(4)),
        setTextureCoords
      )
    );

    bindBuffers(gl)(newMario);

    // Physics!!

    const newVelocity = pipe(
      newMario.velocity,
      addV2(jumpVelocity),
      addV2(gravityVelocity)
    );

    newMario = pipe(newMario, velocity.set(newVelocity));

    const elapsedTime = scene.currentTime - scene.previousTime;

    newMario = pipe(
      newMario,
      movePosition(gl)(
        newMario.velocity[0] * elapsedTime,
        newMario.velocity[1] * elapsedTime
      )
    );

    const [collisionGameData, collisionMario] = pipe(
      gameObjects.slice(3, 12),
      detectCollisions(newGameData)(newMario)
    );

    newGameData = collisionGameData;
    newMario = collisionMario;

    return {
      ...scene,
      keysHandled: newKeyHandled,
      gameData: newGameData,
      gameObjects: [...beforeGameObjects, newMario, ...afterGameObjects],
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
