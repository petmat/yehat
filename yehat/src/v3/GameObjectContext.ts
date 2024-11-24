import { Effect } from "effect";

import {
  GameObject,
  WglAttribLocation,
  WglGameObject,
  WglProgram,
  WglRenderingContext,
  YehatWglBuffer,
  YehatWglContext,
  YehatWglUniformLocation,
} from ".";

export interface GameObjectContext {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  gameObject: WglGameObject.WglGameObject;
}

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

export const setUniform2fv =
  (uniformName: string) =>
  (propKey: GameObject.GameObjectVector2Keys) =>
  (context: GameObjectContext) =>
    YehatWglUniformLocation.getUniformLocation(context.gl)(uniformName)(
      context.program
    ).pipe(
      Effect.flatMap(
        YehatWglUniformLocation.uniform2fv(context.gl)(
          context.gameObject[propKey]
        )
      ),
      Effect.map(() => context)
    );

export const setUniform4fv =
  (uniformName: string) =>
  (propKey: GameObject.GameObjectVector4Keys) =>
  (context: GameObjectContext) =>
    YehatWglUniformLocation.getUniformLocation(context.gl)(uniformName)(
      context.program
    ).pipe(
      Effect.flatMap(
        YehatWglUniformLocation.uniform4fv(context.gl)(
          context.gameObject[propKey]
        )
      ),
      Effect.map(() => context)
    );

export const setUniformBoolean =
  (uniformName: string) =>
  (propKey: GameObject.GameObjectBooleanKeys) =>
  (context: GameObjectContext) =>
    YehatWglUniformLocation.getUniformLocation(context.gl)(uniformName)(
      context.program
    ).pipe(
      Effect.flatMap(
        YehatWglUniformLocation.uniform1i(context.gl)(
          context.gameObject[propKey] ? 1 : 0
        )
      ),
      Effect.map(() => context)
    );

export const setUniform1i =
  (uniformName: string) =>
  (propKey: GameObject.GameObjectNumberKeys) =>
  (context: GameObjectContext) =>
    YehatWglUniformLocation.getUniformLocation(context.gl)(uniformName)(
      context.program
    ).pipe(
      Effect.flatMap(
        YehatWglUniformLocation.uniform1i(context.gl)(
          context.gameObject[propKey]
        )
      ),
      Effect.map(() => context)
    );

export const drawVertexArray = (context: GameObjectContext) =>
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
    Effect.map(() => context.gl),
    Effect.flatMap(
      WglRenderingContext.drawArrays({
        mode: WebGLRenderingContext.TRIANGLES,
        first: 0,
        count: context.gameObject.vertexCoordinates.length / 2,
      })
    )
  );
