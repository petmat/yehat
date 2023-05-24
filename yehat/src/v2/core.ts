import * as A from "fp-ts/lib/Array";
import { Either } from "fp-ts/lib/Either";
import * as E from "fp-ts/lib/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import {
  attachShader,
  compileShader,
  createProgram,
  createShader,
  linkProgram,
  setShaderSource,
} from "./webGL";
import { constant, flip, flow, pipe } from "fp-ts/lib/function";
import { vec2 } from "gl-matrix";
import { tap, tapE } from "./fn";
import { TaskEither } from "fp-ts/lib/TaskEither";
import { requestAnimationFrameTask } from "./web";
import { defaultFs } from "./shaders/defaultFs";
import { defaultVs } from "./shaders/defaultVs";

export enum ShaderType {
  Vertex,
  Fragment,
}

export interface ShaderSource {
  type: ShaderType;
  source: string;
}

export interface YehatContext {
  webGLRenderingContext: WebGLRenderingContext;
  webGLProgram: WebGLProgram;
}

export type GameData = Record<string, unknown>;

export const VertexNumComponents2D = 2;

export interface GameObject2DCreated {
  vertices: Float32Array;
  translation: vec2;
  scale: vec2;
  rotation: vec2;
}

export type GameObject2DInitialized = {
  vertices: Float32Array;
  translation: vec2;
  scale: vec2;
  rotation: vec2;
  vertexBuffer: WebGLBuffer;
};

export type GameObject2D = GameObject2DCreated | GameObject2DInitialized;

export const calculateVertexCount2D = (gameObject: GameObject2D) =>
  gameObject.vertices.length / VertexNumComponents2D;

export interface YehatScene2DCreated<T extends GameData = GameData> {
  isInitialized: false;
  context: YehatContext;
  gameData: T;
  gameObjects: GameObject2DCreated[];
}

export interface YehatScene2DInitialized<T extends GameData = GameData> {
  isInitialized: true;
  context: YehatContext;
  gameData: T;
  gameObjects: GameObject2DInitialized[];
}

export type YehatScene2D<T extends GameData = GameData> =
  | YehatScene2DCreated<T>
  | YehatScene2DInitialized<T>;

export const shaderTypeToWebGLShaderType =
  (gl: WebGLRenderingContext) => (shaderType: ShaderType) =>
    shaderType === ShaderType.Vertex ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;

export const buildShader =
  (gl: WebGLRenderingContext) =>
  (shaderSource: ShaderSource): Either<string, WebGLShader> => {
    return pipe(
      shaderSource.type,
      shaderTypeToWebGLShaderType(gl),
      createShader(gl),
      E.chain(tapE(setShaderSource(gl)(shaderSource.source))),
      E.chain(tapE(compileShader(gl)))
    );
  };

export const initializeShader =
  (yehatContext: YehatContext) =>
  (shaderSource: ShaderSource): Either<string, WebGLShader> => {
    return pipe(
      shaderSource,
      buildShader(yehatContext.webGLRenderingContext),
      E.chain((shader) =>
        pipe(
          shader,
          attachShader(yehatContext.webGLRenderingContext)(
            yehatContext.webGLProgram
          ),
          E.map(constant(shader))
        )
      )
    );
  };

export const buildShaders =
  (shaderSources: ShaderSource[]) =>
  (yehatContext: YehatContext): Either<string, YehatContext> =>
    pipe(
      shaderSources,
      A.map(initializeShader(yehatContext)),
      A.reduce(E.right([]) as Either<string, WebGLShader[]>, (accE, shaderE) =>
        pipe(
          accE,
          E.chain((acc) => pipe(shaderE, E.map(flip(A.append)(acc))))
        )
      ),
      E.map(constant(yehatContext))
    );

// Should implement getting the default shaders from TS files
export const getDefaultShaderSources = (): ShaderSource[] => [
  { type: ShaderType.Vertex, source: defaultVs },
  { type: ShaderType.Fragment, source: defaultFs },
];

const createYehatContext = (
  gl: WebGLRenderingContext
): Either<string, YehatContext> =>
  pipe(
    gl,
    createProgram,
    E.map((program) => {
      return {
        webGLRenderingContext: gl,
        webGLProgram: program,
      };
    })
  );

export const initializeYehatContext =
  (gl: WebGLRenderingContext) =>
  (shaderSources: ShaderSource[]): Either<string, YehatContext> =>
    pipe(
      gl,
      createYehatContext,
      E.chain(buildShaders(shaderSources)),
      E.map(
        tap((context) => {
          linkProgram(context.webGLRenderingContext)(context.webGLProgram);
        })
      )
    );

export const initializeDefaultYehatContext = (gl: WebGLRenderingContext) =>
  pipe(getDefaultShaderSources(), initializeYehatContext(gl));

const createVertexBuffer2D =
  (gl: WebGLRenderingContext) =>
  (gameObject: GameObject2DCreated): Either<string, GameObject2DInitialized> =>
    pipe(
      gl.createBuffer(),
      E.fromNullable("Cannot create buffer"),
      E.map((buffer) => ({ ...gameObject, vertexBuffer: buffer }))
    );

const bindVertexBuffer =
  (gl: WebGLRenderingContext) => (gameObject: GameObject2DInitialized) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gameObject.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, gameObject.vertices, gl.STATIC_DRAW);
    return gameObject;
  };

export const initializeScene2D = <T extends GameData>(
  scene: YehatScene2DCreated<T>
): Either<string, YehatScene2DInitialized<T>> =>
  pipe(
    scene.gameObjects,
    A.map(
      flow(
        createVertexBuffer2D(scene.context.webGLRenderingContext),
        E.map(bindVertexBuffer(scene.context.webGLRenderingContext))
      )
    ),
    A.sequence(E.Monad),
    E.map((gameObjects) => ({ ...scene, isInitialized: true, gameObjects }))
  );

export const drawScene = <T extends GameData>(
  scene: YehatScene2DInitialized<T>
) => {
  const {
    context: { webGLRenderingContext: gl, webGLProgram: program },
    gameObjects,
  } = scene;

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0.8, 0.9, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  for (const gameObject of gameObjects) {
    gl.useProgram(program);

    const uScalingFactor = gl.getUniformLocation(program, "uScalingFactor");
    const uGlobalColor = gl.getUniformLocation(program, "uGlobalColor");
    const uRotationVector = gl.getUniformLocation(program, "uRotationVector");
    const uTranslationVector = gl.getUniformLocation(
      program,
      "uTranslationVector"
    );

    gl.uniform2fv(uScalingFactor, gameObject.scale);
    gl.uniform2fv(uRotationVector, gameObject.rotation);
    gl.uniform2fv(uTranslationVector, gameObject.translation);
    gl.uniform4fv(uGlobalColor, [0.1, 0.7, 0.2, 1.0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, gameObject.vertexBuffer);

    const aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");

    gl.enableVertexAttribArray(aVertexPosition);
    gl.vertexAttribPointer(
      aVertexPosition,
      VertexNumComponents2D,
      gl.FLOAT,
      false,
      0,
      0
    );

    gl.drawArrays(gl.TRIANGLES, 0, calculateVertexCount2D(gameObject));
  }

  return scene;
};

export const processGameTick =
  <T extends GameData>(
    updateScene: (s: YehatScene2DInitialized<T>) => YehatScene2DInitialized<T>
  ) =>
  (
    sceneE: Either<string, YehatScene2DInitialized<T>>
  ): TaskEither<string, YehatScene2DInitialized<T>> =>
    pipe(
      sceneE,
      E.map(updateScene),
      E.map(drawScene),
      TE.fromEither,
      T.chain((e) =>
        pipe(
          requestAnimationFrameTask,
          T.map((currentTime) =>
            pipe(
              e,
              E.map(
                (scene): YehatScene2DInitialized<T> => ({
                  ...scene,
                  gameData: { ...scene.gameData, currentTime },
                })
              )
            )
          )
        )
      ),
      T.chain(processGameTick(updateScene))
    );
