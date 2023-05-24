import { pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import { Either } from "fp-ts/Either";
import * as A from "fp-ts/Array";
import * as TE from "fp-ts/TaskEither";

import {
  getCanvasElement,
  getWebGLContext,
  getElementText,
  addLoadEventListenerWithDefaults,
} from "yehat/src/v2/web";
import {
  GameData,
  ShaderSource,
  ShaderType,
  YehatContext,
  YehatScene2DCreated,
  YehatScene2DInitialized,
  initializeScene2D,
  initializeYehatContext,
  processGameTick,
} from "yehat/src/v2/core";
import { vec2 } from "gl-matrix";

interface ShaderInfo {
  type: ShaderType;
  id: string;
}

interface Rotate2GameData extends GameData {
  // this feels like it should not be here, but built into Yehat
  aspectRatio: number;

  currentAngle: number;
  previousTime: number;
  currentTime: number;
  degreesPerSecond: number;
}

type Rotate2Scene = YehatScene2DInitialized<Rotate2GameData>;

const getShaderSource =
  (document: Document) =>
  ({ id, type }: ShaderInfo): Either<string, ShaderSource> =>
    pipe(
      document,
      getElementText(id),
      E.chain(E.fromOption(() => "Shader element text is empty")),
      E.map((source) => ({ type, source }))
    );

const shaderInfos: ShaderInfo[] = [
  {
    type: ShaderType.Vertex,
    id: "vertex-shader",
  },
  {
    type: ShaderType.Fragment,
    id: "fragment-shader",
  },
];

const getShaderSources = (): Either<string, ShaderSource[]> =>
  pipe(shaderInfos, A.map(getShaderSource(document)), A.sequence(E.Monad));

const createScene = (
  context: YehatContext
): YehatScene2DCreated<Rotate2GameData> => {
  const {
    webGLRenderingContext: { canvas },
  } = context;
  const aspectRatio = canvas.width / canvas.height;
  // prettier-ignore
  const vertexArray = new Float32Array([
        -0.5, 0.5, 0.5, 0.5, 0.5, -0.5,
        -0.5, 0.5, 0.5, -0.5, -0.5, -0.5,
      ]);

  return {
    isInitialized: false,
    context,
    gameData: {
      aspectRatio,
      previousTime: 0,
      currentTime: 0,
      currentAngle: 0.0,
      degreesPerSecond: 90,
    },
    gameObjects: [
      {
        vertices: vertexArray,
        translation: [0.5, 0.5],
        scale: [1.0 * 0.5, aspectRatio * 0.5],
        rotation: [0, 1],
      },
    ],
  };
};

const calculateRotation = (currentAngle: number): vec2 => {
  const radians = (currentAngle * Math.PI) / 180.0;
  return vec2.fromValues(Math.sin(radians), Math.cos(radians));
};

const calculateDeltaAngle =
  (previousTime: number) =>
  (currentTime: number) =>
  (degreesPerSecond: number) =>
    ((currentTime - previousTime) / 1000.0) * degreesPerSecond;

const updateScene = (scene: Rotate2Scene): Rotate2Scene => {
  const {
    gameData: {
      currentAngle,
      previousTime,
      currentTime,
      degreesPerSecond,
      ...gameData
    },
  } = scene;
  return {
    ...scene,
    gameObjects: [
      { ...scene.gameObjects[0], rotation: calculateRotation(currentAngle) },
    ],
    gameData: {
      ...gameData,
      currentAngle:
        (currentAngle +
          calculateDeltaAngle(previousTime)(currentTime)(degreesPerSecond)) %
        360,
      currentTime,
      previousTime: currentTime,
      degreesPerSecond,
    },
  };
};

const initializeCustomYehatContext = (gl: WebGLRenderingContext) =>
  pipe(getShaderSources(), E.chain(initializeYehatContext(gl)));

const startup = (document: Document) =>
  pipe(
    document,
    getCanvasElement("glcanvas"),
    E.chain(getWebGLContext),
    E.chain(initializeCustomYehatContext),
    E.map(createScene),
    E.chain(initializeScene2D),
    processGameTick(updateScene)
  );

const onLoad = (document: Document) => () =>
  pipe(
    document,
    startup,
    TE.mapLeft((error) => {
      throw new Error(error);
    })
  )();

addLoadEventListenerWithDefaults(onLoad(document))(window);
