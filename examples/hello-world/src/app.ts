import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";

import { vec2, vec4 } from "gl-matrix";

import {
  GameData,
  YehatScene2D,
  createYehat2DScene,
  initializeDefaultScene2D,
  loadGame,
  processGameTick,
} from "@yehat/yehat/src/v2/core";
import {
  createCircleShape,
  createTriangleShape,
  getCircleDrawMode,
  createCircleTextureCoords,
  getTriangleDrawMode,
  createTriangleTextureCoords,
  createRectangleShape,
  getRectangleDrawMode,
  createRectangleTextureCoords,
} from "@yehat/yehat/src/v2/shapes";
import { assoc } from "@yehat/yehat/src/v2/utils";
import {
  getAspectRatioCoreFns,
  setColor,
  setDrawMode,
  setRotation,
  setTextureCoords,
  setVertices,
} from "@yehat/yehat/src/v2/gameObject";
import { blue, green, red } from "@yehat/yehat/src/v2/colors";

interface HelloWorldGameData extends GameData {
  currentAngle: number;
  degreesPerSecond: number;
}

type HelloWorldScene = YehatScene2D<HelloWorldGameData>;

const createScene = (gl: WebGLRenderingContext): HelloWorldScene => {
  const { createDefaultGameObject, setPosition, setSize } =
    getAspectRatioCoreFns(gl);

  const setSize100 = setSize(100, 100);

  const createSize100DefaultGameObject =
    (x: number, y: number) => (color: vec4) =>
      pipe(
        createDefaultGameObject(),
        setSize100,
        setPosition(x, y),
        setColor(color)
      );

  const createSize100Rectangle = (x: number, y: number) => (color: vec4) =>
    pipe(
      createSize100DefaultGameObject(x, y)(color),
      pipe(createRectangleShape(), setVertices),
      pipe(getRectangleDrawMode(), setDrawMode),
      pipe(createRectangleTextureCoords(), setTextureCoords)
    );

  const createSize100Circle = (x: number, y: number) => (color: vec4) =>
    pipe(
      createSize100DefaultGameObject(x, y)(color),
      pipe(createCircleShape(), setVertices),
      pipe(getCircleDrawMode(), setDrawMode),
      pipe(createCircleTextureCoords(), setTextureCoords)
    );

  const createSize100Triangle = (x: number, y: number) => (color: vec4) =>
    pipe(
      createSize100DefaultGameObject(x, y)(color),
      pipe(createTriangleShape(), setVertices),
      pipe(getTriangleDrawMode(), setDrawMode),
      pipe(createTriangleTextureCoords(), setTextureCoords)
    );

  return createYehat2DScene(gl)({
    gameData: {
      previousTime: 0,
      currentTime: 0,
      currentAngle: 0.0,
      degreesPerSecond: 90,
    },
    gameObjects: [
      createSize100Circle(160, 240)(red),
      createSize100Triangle(320, 240)(blue),
      createSize100Rectangle(480, 240)(green),
    ],
  });
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

const updateScene =
  (_gl: WebGLRenderingContext) =>
  (scene: HelloWorldScene): HelloWorldScene => {
    const { gameData, gameObjects, previousTime, currentTime } = scene;

    const { currentAngle, degreesPerSecond } = gameData;

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
        )
      ),
      gameObjects: [
        circle,
        triangle,
        pipe(rectangle, setRotation(calculateRotation(currentAngle))),
      ],
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
