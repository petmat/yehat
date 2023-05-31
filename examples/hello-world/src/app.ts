import { pipe } from "fp-ts/lib/function";

import {
  GameData,
  YehatScene2DCreated,
  YehatScene2DInitialized,
  createCircleShape,
  createSquareShape,
  createTriangleShape,
  getCircleDrawMode,
  getSquareDrawMode,
  getTriangleDrawMode,
  initializeDefaultScene2D,
  loadGame,
  processGameTick,
} from "yehat/src/v2/core";
import { vec2, vec4 } from "gl-matrix";

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

  const scaleFactor = 0.3;

  const circle = {
    vertices: createCircleShape(),
    translation: vec2.fromValues(-0.5, 0.0),
    scale: vec2.fromValues(1.0 * scaleFactor, aspectRatio * scaleFactor),
    rotation: vec2.fromValues(0, 1),
    color: vec4.fromValues(0.7, 0.1, 0.2, 1.0),
    drawMode: getCircleDrawMode(),
  };

  const triangle = {
    vertices: createTriangleShape(),
    translation: vec2.fromValues(0.0, 0.0),
    scale: vec2.fromValues(1.0 * scaleFactor, aspectRatio * scaleFactor),
    rotation: vec2.fromValues(0, 1),
    color: vec4.fromValues(0.2, 0.1, 0.7, 1.0),
    drawMode: getTriangleDrawMode(),
  };

  const rectangle = {
    vertices: createSquareShape(),
    translation: vec2.fromValues(0.5, 0.0),
    scale: vec2.fromValues(1.0 * scaleFactor, aspectRatio * scaleFactor),
    rotation: vec2.fromValues(0, 1),
    color: vec4.fromValues(0.1, 0.7, 0.2, 1.0),
    drawMode: getSquareDrawMode(),
  };

  return {
    isInitialized: false,
    gameData: {
      previousTime: 0,
      currentTime: 0,
      currentAngle: 0.0,
      degreesPerSecond: 90,
    },
    gameObjects: [circle, triangle, rectangle],
  };
};

const calculateRotation = (currentAngle: number): vec2 => {
  const radians = (currentAngle * Math.PI) / 180.0;
  return vec2.fromValues(Math.sin(radians), Math.cos(radians));
};

const calculateDeltaAngle =
  (degreesPerSecond: number) => (previousTime: number, currentTime: number) =>
    ((currentTime - previousTime) / 1000.0) * degreesPerSecond;

const updateScene = (scene: HelloWorldScene): HelloWorldScene => {
  const {
    gameData: {
      currentAngle,
      previousTime,
      currentTime,
      degreesPerSecond,
      ...gameDataRest
    },
    gameObjects: [circle, triangle, rectangle],
  } = scene;

  const gameObjects = [
    circle,
    triangle,
    { ...rectangle, rotation: calculateRotation(currentAngle) },
  ];

  const gameData = {
    ...gameDataRest,
    currentAngle:
      (currentAngle +
        calculateDeltaAngle(degreesPerSecond)(previousTime, currentTime)) %
      360,
    currentTime,
    previousTime: currentTime,
    degreesPerSecond,
  };

  return {
    ...scene,
    gameObjects,
    gameData,
  };
};

const startup = (gl: WebGLRenderingContext) =>
  pipe(
    gl,
    createScene,
    initializeDefaultScene2D(gl),
    processGameTick(updateScene)
  );

loadGame(window)("#glcanvas")(startup);
