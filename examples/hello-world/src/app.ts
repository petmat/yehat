import { flow, pipe } from "fp-ts/lib/function";
import * as T from "fp-ts/lib/Task";

import { vec2, vec4 } from "gl-matrix";

import {
  GameData,
  GameObject2DInitialized,
  YehatScene2DCreated,
  YehatScene2DInitialized,
  initializeDefaultScene2D,
  loadGame,
  processGameTick,
} from "@yehat/yehat/src/v2/core";
import { createV4 } from "@yehat/yehat/src/v2/math";
import {
  createRectangle,
  setCircleShape,
  setColor,
  setPosition,
  setRotation,
  setSize,
  setTriangleShape,
} from "@yehat/yehat/src/v2/shapes";
import { assoc } from "@yehat/yehat/src/v2/utils";

interface HelloWorldGameData extends GameData {
  currentAngle: number;
  previousTime: number;
  currentTime: number;
  degreesPerSecond: number;
}

type HelloWorldScene = YehatScene2DInitialized<HelloWorldGameData>;

const setSize100 = (gl: WebGLRenderingContext) => setSize(gl)(100, 100);

const red = createV4(0.7, 0.1, 0.2, 1.0);
const blue = createV4(0.2, 0.1, 0.7, 1.0);
const green = createV4(0.1, 0.7, 0.2, 1.0);

const createSize100GameObject = (gl: WebGLRenderingContext) =>
  flow(createRectangle(gl), setSize100(gl));

const createSize100Circle =
  (gl: WebGLRenderingContext) => (x: number, y: number) => (color: vec4) =>
    pipe(
      createSize100GameObject(gl)(),
      setCircleShape,
      setPosition(gl)(x, y),
      setColor(color)
    );

const createSize100Triangle =
  (gl: WebGLRenderingContext) => (x: number, y: number) => (color: vec4) =>
    pipe(
      createSize100GameObject(gl)(),
      setTriangleShape,
      setPosition(gl)(x, y),
      setColor(color)
    );

const createSize100Rectangle =
  (gl: WebGLRenderingContext) => (x: number, y: number) => (color: vec4) =>
    pipe(createSize100GameObject(gl)(), setPosition(gl)(x, y), setColor(color));

const createScene = (
  gl: WebGLRenderingContext
): YehatScene2DCreated<HelloWorldGameData> => ({
  isInitialized: false,
  gameData: {
    previousTime: 0,
    currentTime: 0,
    currentAngle: 0.0,
    degreesPerSecond: 90,
  },
  textures: new Map(),
  gameObjects: [
    createSize100Circle(gl)(160, 240)(red),
    createSize100Triangle(gl)(320, 240)(blue),
    createSize100Rectangle(gl)(480, 240)(green),
  ],
});

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
  const { gameData, gameObjects } = scene;

  const { currentAngle, previousTime, currentTime, degreesPerSecond } =
    gameData;

  const [circle, triangle, rectangle] = gameObjects;

  return {
    ...scene,
    gameData: pipe(
      gameData,
      assoc<HelloWorldGameData, "currentAngle">("currentAngle")(
        pipe(
          degreesPerSecond,
          calculateDeltaAngle(previousTime, currentTime),
          incrementCurrentAngle(currentAngle)
        )
      ),
      assoc<HelloWorldGameData, "previousTime">("previousTime")(currentTime)
    ),
    gameObjects: [
      circle,
      triangle,
      pipe(
        rectangle,
        setRotation(calculateRotation(currentAngle))
      ) as GameObject2DInitialized,
    ],
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
