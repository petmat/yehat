import { pipe } from "fp-ts/lib/function";
import { vec2 } from "gl-matrix";
import { Lens } from "monocle-ts";
import { indexArray } from "monocle-ts/lib/Index/Array";

import {
  YehatScene2D,
  createYehat2DScene,
  currentTime,
  gameObjects,
  previousTime,
  startGame,
} from "@yehat/yehat/src/v2/core";
import { createRectangle } from "@yehat/yehat/src/v2/shapes";

import { GameObject2D, color, rotation } from "@yehat/yehat/src/v2/gameObject";
import { green } from "@yehat/yehat/src/v2/colors";

interface HelloWorldGameData {
  currentAngle: number;
  degreesPerSecond: number;
}

type HelloWorldScene = YehatScene2D<HelloWorldGameData>;

const createScene = (gl: WebGLRenderingContext): HelloWorldScene =>
  createYehat2DScene(gl)({
    gameData: {
      currentAngle: 0.0,
      degreesPerSecond: 90,
    },
    gameObjects: [
      pipe(createRectangle(gl)([320, 240], [200, 200]), color.set(green)),
    ],
  });

const angleToRadians = (angle: number): number => (angle * Math.PI) / 180.0;

const radiansToRotation = (radians: number): vec2 =>
  vec2.fromValues(Math.sin(radians), Math.cos(radians));

const calculateDeltaAngle =
  (previousTime: number, currentTime: number) =>
  (degreesPerSecond: number): number =>
    ((currentTime - previousTime) / 1000.0) * degreesPerSecond;

const incrementAngle =
  (angle: number) =>
  (deltaAngle: number): number =>
    (angle + deltaAngle) % 360;

const calculateNewAngle = (scene: HelloWorldScene) =>
  pipe(
    gameData.compose(degreesPerSecond).get(scene),
    calculateDeltaAngle(previousTime.get(scene), currentTime.get(scene)),
    incrementAngle(gameDataCurrentAngle.get(scene))
  );

const gameData = Lens.fromProp<HelloWorldScene>()("gameData");

const currentAngle = Lens.fromProp<HelloWorldGameData>()("currentAngle");

const gameDataCurrentAngle = gameData.compose(currentAngle);

const degreesPerSecond =
  Lens.fromProp<HelloWorldGameData>()("degreesPerSecond");

const firstGameObject = indexArray<GameObject2D>().index(0);
const rectangle =
  gameObjects<HelloWorldScene>().composeOptional(firstGameObject);

const updateScene =
  (_gl: WebGLRenderingContext) =>
  (scene: HelloWorldScene): HelloWorldScene =>
    pipe(
      scene,
      gameDataCurrentAngle.set(pipe(scene, calculateNewAngle)),
      rectangle
        .composeLens(rotation)
        .set(
          pipe(
            gameDataCurrentAngle.get(scene),
            angleToRadians,
            radiansToRotation
          )
        )
    );

const initOptions = {
  window,
  canvasId: "#glcanvas",
  createScene,
  updateScene,
};

pipe(initOptions, startGame);
