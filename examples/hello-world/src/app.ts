import { pipe } from "fp-ts/lib/function";
import * as T from "fp-ts/lib/Task";

import { vec2 } from "gl-matrix";

import {
  GameData,
  GameObject2DInitialized,
  YehatScene2DCreated,
  YehatScene2DInitialized,
  initializeDefaultScene2D,
  loadGame,
  processGameTick,
} from "yehat/src/v2/core";
import { vector2, vector4 } from "yehat/src/v2/math";
import {
  createCircle,
  createRectangle,
  createTriangle,
  setColor,
  setRotation,
  setScale,
  setTranslation,
} from "yehat/src/v2/shapes";
import { assoc } from "yehat/src/v2/utils";

interface HelloWorldGameData extends GameData {
  currentAngle: number;
  previousTime: number;
  currentTime: number;
  degreesPerSecond: number;
}

type HelloWorldScene = YehatScene2DInitialized<HelloWorldGameData>;

const createScene = (
  gl: WebGLRenderingContext
): YehatScene2DCreated<HelloWorldGameData> => {
  const aspectRatio = gl.canvas.width / gl.canvas.height;

  const setOneThirdScale = setScale(vector2.create(0.3, aspectRatio * 0.3));

  const circle = pipe(
    createCircle(gl)(),
    setOneThirdScale,
    setTranslation(vector2.create(-0.5, 0.0)),
    setColor(vector4.create(0.7, 0.1, 0.2, 1.0))
  );

  const triangle = pipe(
    createTriangle(gl)(),
    setOneThirdScale,
    setColor(vector4.create(0.2, 0.1, 0.7, 1.0))
  );

  const rectangle = pipe(
    createRectangle(gl)(),
    setOneThirdScale,
    setTranslation(vector2.create(0.5, 0.0)),
    setColor(vector4.create(0.1, 0.7, 0.2, 1.0))
  );

  return {
    isInitialized: false,
    gameData: {
      previousTime: 0,
      currentTime: 0,
      currentAngle: 0.0,
      degreesPerSecond: 90,
    },
    textures: new Map(),
    //gameObjects: [circle, triangle, rectangle],
    gameObjects: [rectangle],
  };
};

const calculateRotation = (currentAngle: number): vec2 => {
  const radians = (currentAngle * Math.PI) / 180.0;
  return vec2.fromValues(Math.sin(radians), Math.cos(radians));
};

const calculateDeltaAngle =
  (previousTime: number, currentTime: number) =>
  (degreesPerSecond: number): number =>
    ((currentTime - previousTime) / 1000.0) * degreesPerSecond;

const incrementCurrentAngle =
  (currentAngle: number) =>
  (deltaAngle: number): number =>
    (currentAngle + deltaAngle) % 360;

const updateScene = (scene: HelloWorldScene): HelloWorldScene => {
  // const { gameData, gameObjects } = scene;

  // const { currentAngle, previousTime, currentTime, degreesPerSecond } =
  //   gameData;

  // const [circle, triangle, rectangle] = gameObjects;

  // return {
  //   ...scene,
  //   gameData: pipe(
  //     gameData,
  //     assoc<HelloWorldGameData>("currentAngle")(
  //       pipe(
  //         degreesPerSecond,
  //         calculateDeltaAngle(previousTime, currentTime),
  //         incrementCurrentAngle(currentAngle)
  //       )
  //     ),
  //     assoc<HelloWorldGameData>("previousTime")(currentTime)
  //   ),
  //   gameObjects: [
  //     circle,
  //     triangle,
  //     pipe(
  //       rectangle,
  //       setRotation(calculateRotation(currentAngle))
  //     ) as GameObject2DInitialized,
  //   ],
  // };
  return scene;
};

const startup = (gl: WebGLRenderingContext) =>
  pipe(
    gl,
    createScene,
    initializeDefaultScene2D(gl),
    T.chain(processGameTick(updateScene))
  );

pipe(startup, loadGame(window)("#glcanvas"));
