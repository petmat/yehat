import { Effect, pipe } from "effect";
import { NoSuchElementException } from "effect/Cause";

import * as WglProgram from "./WglProgram";
import * as WglRenderingContext from "./WglRenderingContext";
import * as WglShader from "./WglShader";
import * as Vector4 from "./Vector4";

export interface YehatWebGLContext {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
}

export const createYehatWebGLContext = (
  gl: WebGLRenderingContext
): Effect.Effect<YehatWebGLContext, NoSuchElementException, never> =>
  WglProgram.createProgram(gl).pipe(
    Effect.map((program) => ({
      gl,
      program,
    }))
  );

export const addShader =
  (shaderType: GLenum) =>
  (shaderSrc: string) =>
  (
    context: YehatWebGLContext
  ): Effect.Effect<YehatWebGLContext, Error, never> =>
    pipe(
      context.gl,
      WglShader.createShader(shaderType),
      Effect.flatMap(WglShader.shaderSource(shaderSrc)(context.gl)),
      Effect.flatMap(WglShader.compileShader(context.gl)),
      Effect.flatMap(WglShader.attachShader(context.program)(context.gl)),
      Effect.map(() => context)
    );

export const addVertexShader = addShader(WebGLRenderingContext.VERTEX_SHADER);

export const addFragmentShader = addShader(
  WebGLRenderingContext.FRAGMENT_SHADER
);

export const linkProgram = (
  context: YehatWebGLContext
): Effect.Effect<YehatWebGLContext, Error, never> =>
  WglProgram.linkProgram(context.gl)(context.program).pipe(
    Effect.map(() => context)
  );

export const viewport =
  (options: { x: number; y: number; width: number; height: number }) =>
  (
    context: YehatWebGLContext
  ): Effect.Effect<YehatWebGLContext, Error, never> =>
    WglRenderingContext.viewport(options)(context.gl).pipe(
      Effect.map(() => context)
    );

export const clearColor =
  (color: Vector4.Vector4) =>
  (
    context: YehatWebGLContext
  ): Effect.Effect<YehatWebGLContext, Error, never> =>
    WglRenderingContext.clearColor(color)(context.gl).pipe(
      Effect.map(() => context)
    );

export const clear = (mask: number) => (context: YehatWebGLContext) =>
  WglRenderingContext.clear(mask)(context.gl).pipe(Effect.map(() => context));

export const enable = (capability: number) => (context: YehatWebGLContext) =>
  WglRenderingContext.enable(capability)(context.gl).pipe(
    Effect.map(() => context)
  );

export const blendFunc =
  (sfactor: number, dfactor: number) => (context: YehatWebGLContext) =>
    WglRenderingContext.blendFunc(
      sfactor,
      dfactor
    )(context.gl).pipe(Effect.map(() => context));
