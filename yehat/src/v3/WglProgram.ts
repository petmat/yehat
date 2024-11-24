import { Effect } from "effect";
import { NoSuchElementException } from "effect/Cause";

export const createProgram = (gl: WebGLRenderingContext) =>
  Effect.sync(() => gl.createProgram()).pipe(
    Effect.flatMap(Effect.fromNullable),
    Effect.mapError(
      () => new NoSuchElementException("Failed to create WebGL program")
    )
  );

export const linkProgram =
  (gl: WebGLRenderingContext) => (program: WebGLProgram) =>
    Effect.try(() => gl.linkProgram(program)).pipe(
      Effect.mapBoth({
        onFailure: (error) =>
          new Error(`Failed to link program: ${error.error}`),
        onSuccess: () => program,
      })
    );

export const useProgram =
  (gl: WebGLRenderingContext) => (program: WebGLProgram) =>
    Effect.try(() => gl.useProgram(program)).pipe(
      Effect.mapBoth({
        onFailure: (error) =>
          new Error(`Failed to use program: ${error.error}`),
        onSuccess: () => program,
      })
    );
