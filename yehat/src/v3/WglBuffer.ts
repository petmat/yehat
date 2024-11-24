import { Effect } from "effect";
import { NoSuchElementException } from "effect/Cause";

export const createBuffer = (
  gl: WebGLRenderingContext
): Effect.Effect<WebGLBuffer, NoSuchElementException, never> =>
  Effect.sync(() => gl.createBuffer()).pipe(
    Effect.flatMap(Effect.fromNullable),
    Effect.mapError(
      () => new NoSuchElementException("Failed to create WebGL buffer")
    )
  );

export const bindBuffer =
  (gl: WebGLRenderingContext) =>
  (target: GLenum) =>
  (buffer: WebGLBuffer): Effect.Effect<WebGLBuffer, Error, never> =>
    Effect.try(() => gl.bindBuffer(target, buffer)).pipe(
      Effect.mapBoth({
        onFailure: (error) =>
          new Error(`Failed to bind buffer: ${error.error}`),
        onSuccess: () => buffer,
      })
    );

export const bufferData =
  (gl: WebGLRenderingContext) =>
  (target: GLenum) =>
  (usage: GLenum) =>
  (data: ArrayBuffer | null) =>
  (buffer: WebGLBuffer): Effect.Effect<WebGLBuffer, Error, never> =>
    Effect.try(() => gl.bufferData(target, data, usage)).pipe(
      Effect.mapBoth({
        onFailure: (error) =>
          new Error(`Failed to set buffer data: ${error.error}`),
        onSuccess: () => buffer,
      })
    );
