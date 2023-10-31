import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import * as S from "fp-ts/lib/String";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { vec2 } from "gl-matrix";

import {
  GameData,
  KeyboardStateMap,
  YehatScene2D,
  bindBuffers,
  initializeDefaultScene2D,
  loadGame,
  processGameTick,
  rgb,
} from "@yehat/yehat/src/v2/core";
import {
  createRectangle,
  createSprite,
  createText,
} from "@yehat/yehat/src/v2/shapes";
import { addV2, createV2, zeroV2 } from "@yehat/yehat/src/v2/math";

import {
  GameObject2D,
  addAnimation,
  addTexture,
  clearCurrentAnimation,
  emptyTextures,
  movePosition,
  setCurrentAnimation,
  setCurrentFrame,
  setDefaultFrame,
  setDirection,
  setGroupSize,
  setLastFrameChange,
  setPosition,
  setSize,
  setTag,
  setTexture,
  setTextureCoords,
  setTextureFrameGridWidth,
  setTranslation,
  setVelocity,
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

let keysDown: KeyboardStateMap = {};

const isKeyDown = (key: string): boolean => !!keysDown[key];

const setIsKeyDown = (key: string, isDown: boolean): void => {
  keysDown = { ...keysDown, [key]: isDown };
};

interface PlayableGameData extends GameData {
  canJump: boolean;
}

type PlayableScene = YehatScene2D<PlayableGameData>;

const gridSizeToCoord = (gridSize: number) => 1 / gridSize;

const getTextureCoordsForFrame =
  (gridSize: number) => (direction: vec2) => (frameIndex: number) => {
    const step = gridSizeToCoord(gridSize);
    const xIndex = frameIndex % gridSize;
    const yIndex = Math.floor(frameIndex / gridSize);

    if (direction[0] === 1 && direction[1] === 0) {
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
    }

    return new Float32Array([
      step * (xIndex + 1),
      1 - step * yIndex,
      step * xIndex,
      1 - step * yIndex,
      step * xIndex,
      1 - step * (yIndex + 1),
      step * (xIndex + 1),
      1 - step * yIndex,
      step * xIndex,
      1 - step * (yIndex + 1),
      step * (xIndex + 1),
      1 - step * (yIndex + 1),
    ]);
  };

const createTile =
  (width: number, height: number) =>
  (gl: WebGLRenderingContext) =>
  (texture: Textures) =>
  (x: number, y: number) =>
    pipe(
      createRectangle(gl)(),
      setSize(gl)(width, height),
      setPosition(gl)(x, y),
      setTexture(texture)
    );

const createLargeWideTile = createTile(128, 64);

const createLargeTile = createTile(64, 64);

const createSmallTile = createTile(32, 32);

const createFloorTile = createTile(640, 32);

const createFloor = (gl: WebGLRenderingContext) => () =>
  pipe(
    createFloorTile(gl)(Textures.FloorTile)(320, 6),
    setTextureCoords(new Float32Array([0, 1, 16, 1, 16, 0, 0, 1, 16, 0, 0, 0]))
  );

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

const createMario = (gl: WebGLRenderingContext) => (x: number, y: number) =>
  pipe(
    createSprite(gl)(),
    setSize(gl)(32, 32),
    setPosition(gl)(x, y),
    setTexture(Textures.MarioSprite),
    setTextureFrameGridWidth(4),
    setDefaultFrame(1),
    addAnimation(Animations.MarioRun, [2, 3, 4]),
    setTag("mario")
  );

const createSymbol =
  (gl: WebGLRenderingContext) =>
  (texture: Textures) =>
  (x: number, y: number) =>
    pipe(
      createSprite(gl)(),
      setSize(gl)(16, 16),
      setPosition(gl)(x, y),
      setTexture(texture)
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
    createLargeWideTile(Textures.Bush)(54, 54),
    createLargeWideTile(Textures.Hill)(166, 54),
    createLargeTile(Textures.BushSmall)(420, 54),
    // floor
    createFloor(),
    // platform tiles
    createTile(Textures.Tile25)(112, 118),
    createTile(Textures.Bricks)(230, 118),
    createTile(Textures.Iron)(262, 118),
    createTile(Textures.Bricks)(294, 118),
    createTile(Textures.Tile25)(326, 118),
    createTile(Textures.Bricks)(358, 118),
    createTile(Textures.Tile25)(294, 202),
    pipe(createLargeTile(Textures.Pipe)(564, 54), setTag("pipe")),
    // mario
    createMario(120, 36),
    // sky
    createLargeTile(Textures.CloudSmall)(94, 252),
    createLargeWideTile(Textures.Cloud)(554, 238),
    // game info text
    ...createMarioText(16)(100, 356)("MARIO"),
    ...createMarioText(16)(330, 356)("WORLD"),
    ...createMarioText(16)(470, 356)("TIME"),
    ...createMarioText(16)(100, 336)("000000"),
    createSymbol(Textures.Coin)(236, 336),
    createSymbol(Textures.X)(252, 336),
    ...createMarioText(16)(270, 336)("00"),
    ...createMarioText(16)(344, 336)("1-1"),
    ...createMarioText(16)(480, 336)("000"),
  ];
};

const createScene = (
  gl: WebGLRenderingContext
): YehatScene2D<PlayableGameData> => ({
  isInitialized: false as const,
  clearColor: rgb(127, 149, 255),
  currentTime: 0,
  previousTime: 0,
  keysHandled: {},
  animationInterval: 1000 / 12,
  gameData: {
    marioFrameIndex: 1,
    marioDirection: "right",
    canJump: true,
  },
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
  context: O.none,
});

interface Rectangle {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const getBoundingBox = (gameObj: GameObject2D): Rectangle => {
  return {
    left: gameObj.translation[0] - gameObj.scale[0],
    top: gameObj.translation[1] + gameObj.scale[1],
    right: gameObj.translation[0] + gameObj.scale[0],
    bottom: gameObj.translation[1] - gameObj.scale[1],
  };
};

const isMovingDown = (gameObj: GameObject2D) => gameObj.velocity[1] < 0;

const isMovingUp = (gameObj: GameObject2D) => gameObj.velocity[1] > 0;

const isMovingRight = (gameObj: GameObject2D) => gameObj.velocity[0] > 0;

interface Collision {
  isCollision: boolean;
  newTranslation: vec2;
  newVelocity: vec2;
}

const collides =
  (gameObjA: GameObject2D) =>
  (gameObjB: GameObject2D): Collision => {
    const boxA = getBoundingBox(gameObjA);
    const boxB = getBoundingBox(gameObjB);

    if (
      isMovingDown(gameObjA) &&
      boxA.bottom < boxB.top &&
      boxA.top > boxB.top &&
      ((boxA.left < boxB.right && boxA.left > boxB.left) ||
        (boxA.right > boxB.left && boxA.right < boxB.right))
    ) {
      return {
        isCollision: true,
        newTranslation: createV2(
          gameObjA.translation[0],
          gameObjA.translation[1] - (boxA.bottom - boxB.top)
        ),
        newVelocity: createV2(gameObjA.velocity[0], 0),
      };
    }

    if (
      isMovingUp(gameObjA) &&
      boxA.top > boxB.bottom &&
      boxA.bottom < boxB.bottom &&
      ((boxA.left < boxB.right && boxA.left > boxB.left) ||
        (boxA.right > boxB.left && boxA.right < boxB.right))
    ) {
      return {
        isCollision: true,
        newTranslation: createV2(
          gameObjA.translation[0],
          gameObjA.translation[1] - (boxA.top - boxB.bottom)
        ),
        newVelocity: createV2(gameObjA.velocity[0], 0),
      };
    }

    if (
      isMovingRight(gameObjA) &&
      boxA.right > boxB.left &&
      boxA.left < boxB.left &&
      ((boxA.bottom < boxB.top && boxA.bottom > boxB.bottom) ||
        (boxA.top > boxB.bottom && boxA.top < boxB.top))
    ) {
      return {
        isCollision: true,
        newTranslation: createV2(
          gameObjA.translation[0] - (boxA.right - boxB.left),
          gameObjA.translation[1]
        ),
        newVelocity: createV2(0, gameObjA.velocity[1]),
      };
    }

    return {
      isCollision: false,
      newTranslation: gameObjA.translation,
      newVelocity: gameObjA.velocity,
    };
  };

const detectCollisions =
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
          setTranslation(collision.newTranslation),
          setVelocity(collision.newVelocity)
        ) as GameObject2D;
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
        setVelocity(createV2(-0.5, newMario.velocity[1])),
        setCurrentAnimation(Animations.MarioRun),
        setDirection(createV2(-1, 0))
      );
    } else if (isKeyDown("ArrowRight")) {
      newMario = pipe(
        newMario,
        setVelocity(createV2(0.5, newMario.velocity[1])),
        setCurrentAnimation(Animations.MarioRun),
        setDirection(createV2(1, 0))
      );
    } else {
      newMario = pipe(newMario, setVelocity(createV2(0, newMario.velocity[1])));
    }

    if (isKeyDown("ArrowUp")) {
      if (!newKeyHandled["ArrowUp"] && gameData.canJump) {
        newMario = pipe(
          newMario,
          pipe(newMario.velocity, addV2(createV2(0, 1.4)), setVelocity)
        );
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

const updateScene = (scene: PlayableScene): PlayableScene => {
  const {
    gameData,
    gameObjects,
    keysHandled: keysHandled,
    context: contextO,
  } = scene;

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
    clearCurrentAnimation,
    handleInput(gameData)(keysHandled)
  );

  // Animation !!
  if (
    newMario.currentAnimation._tag === "Some" &&
    scene.currentTime - newMario.lastFrameChange >= scene.animationInterval
  ) {
    console.log("animate!");
    newMario = pipe(
      newMario,
      pipe(
        nextFrame(
          newMario.currentFrame,
          newMario.currentAnimation.value,
          newMario.animations
        ),
        setCurrentFrame
      ),
      pipe(scene.currentTime, setLastFrameChange)
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

  pipe(
    contextO,
    O.map((context) => {
      const { webGLRenderingContext } = context;
      bindBuffers(webGLRenderingContext)(newMario);
    })
  );

  // Physics!!

  const newVelocity = pipe(
    newMario.velocity,
    addV2(jumpVelocity),
    addV2(gravityVelocity)
  );

  newMario = pipe(newMario, setVelocity(newVelocity));

  const elapsedTime = scene.currentTime - scene.previousTime;

  pipe(
    contextO,
    O.map((context) => {
      newMario = pipe(
        newMario,
        movePosition(context.webGLRenderingContext)(
          newMario.velocity[0] * elapsedTime,
          newMario.velocity[1] * elapsedTime
        )
      );
    })
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

const startup = (gl: WebGLRenderingContext) =>
  pipe(
    gl,
    createScene,
    initializeDefaultScene2D(gl),
    TE.chain(processGameTick(updateScene))
  );

pipe(startup, loadGame(window)("#glcanvas"));

document.addEventListener("keydown", (event) => {
  setIsKeyDown(event.key, true);
});

document.addEventListener("keyup", (event) => {
  setIsKeyDown(event.key, false);
});
