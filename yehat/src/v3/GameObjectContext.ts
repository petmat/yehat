import { Effect } from "effect";

import * as WglAttribLocation from "./WglAttribLocation";
import * as WglGameObject from "./WglGameObject";
import * as WglProgram from "./WglProgram";
import * as WglRenderingContext from "./WglRenderingContext";
import * as YehatWglBuffer from "./YehatWglBuffer";
import * as YehatWglContext from "./YehatWglContext";

import * as YehatWglUniformLocation from "./YehatWglUniformLocation";

export interface GameObjectContext {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  gameObject: WglGameObject.WglGameObject;
}

type GameObjectContextValueGetter<T> = (context: GameObjectContext) => T;

export const createGameObjectContext =
  (context: YehatWglContext.YehatWebGLContext) =>
  (gameObject: WglGameObject.WglGameObject) => ({
    gl: context.gl,
    program: context.program,
    gameObject,
  });

export const useProgram = (context: GameObjectContext) =>
  WglProgram.useProgram(context.gl)(context.program).pipe(
    Effect.map(() => context)
  );

export const setUniform =
  <T>(uniformSetter: YehatWglUniformLocation.UniformSetter<T>) =>
  (uniformName: string) =>
  (getter: GameObjectContextValueGetter<T>) =>
  (context: GameObjectContext) =>
    YehatWglUniformLocation.getUniformLocation(context.gl)(uniformName)(
      context.program
    ).pipe(
      Effect.flatMap(uniformSetter(context.gl)(getter(context))),
      Effect.map(() => context)
    );

export const setUniform2fv = setUniform(YehatWglUniformLocation.uniform2fv);

export const setUniform4fv = setUniform(YehatWglUniformLocation.uniform4fv);

export const setUniform1i = setUniform(YehatWglUniformLocation.uniform1i);

export const enableVertexArray = (context: GameObjectContext) =>
  YehatWglBuffer.bindBuffer(context.gl)(WebGLRenderingContext.ARRAY_BUFFER)(
    context.gameObject.vertexCoordinatesBuffer
  ).pipe(
    Effect.map(() => "aVertexPosition"),
    Effect.flatMap(
      WglAttribLocation.getAttribLocation(context.gl)(context.program)
    ),
    Effect.flatMap(
      WglAttribLocation.vertexAttribPointer(context.gl)({
        size: 2,
        type: WebGLRenderingContext.FLOAT,
        normalized: false,
        stride: 0,
        offset: 0,
      })
    ),
    Effect.flatMap(WglAttribLocation.enableVertexAttribArray(context.gl)),
    Effect.map(() => context)
  );

export const enableTextureCoordinateArray = (context: GameObjectContext) =>
  YehatWglBuffer.bindBuffer(context.gl)(WebGLRenderingContext.ARRAY_BUFFER)(
    context.gameObject.textureCoordinatesBuffer
  ).pipe(
    Effect.map(() => "aTextureCoord"),
    Effect.flatMap(
      WglAttribLocation.getAttribLocation(context.gl)(context.program)
    ),
    Effect.flatMap(
      WglAttribLocation.vertexAttribPointer(context.gl)({
        size: 2,
        type: WebGLRenderingContext.FLOAT,
        normalized: false,
        stride: 0,
        offset: 0,
      })
    ),
    Effect.flatMap(WglAttribLocation.enableVertexAttribArray(context.gl)),
    Effect.map(() => context)
  );

export const drawArrays = (context: GameObjectContext) =>
  WglRenderingContext.drawArrays({
    mode: context.gameObject.drawMode,
    first: 0,
    count: context.gameObject.vertexCoordinates.length / 2,
  })(context.gl).pipe(Effect.map(() => context));
