import { Effect } from "effect";

export const viewport =
  (options: { x: number; y: number; width: number; height: number }) =>
  (
    gl: WebGLRenderingContext
  ): Effect.Effect<WebGLRenderingContext, Error, never> =>
    Effect.try(() =>
      gl.viewport(options.x, options.y, options.width, options.height)
    ).pipe(Effect.map(() => gl));

export const clearColor =
  ([r, g, b, a]: [number, number, number, number]) =>
  (gl: WebGLRenderingContext) =>
    Effect.try(() => gl.clearColor(r, g, b, a)).pipe(Effect.map(() => gl));

export const clear = (mask: number) => (gl: WebGLRenderingContext) =>
  Effect.try(() => gl.clear(mask)).pipe(Effect.map(() => gl));

export const enable = (capability: number) => (gl: WebGLRenderingContext) =>
  Effect.try(() => gl.enable(capability)).pipe(Effect.map(() => gl));

export const blendFunc =
  (sfactor: number, dfactor: number) => (gl: WebGLRenderingContext) =>
    Effect.try(() => gl.blendFunc(sfactor, dfactor)).pipe(Effect.map(() => gl));

export const drawArrays =
  ({ mode, first, count }: { mode: number; first: number; count: number }) =>
  (gl: WebGLRenderingContext) =>
    Effect.try(() => gl.drawArrays(mode, first, count)).pipe(
      Effect.map(() => gl)
    );
