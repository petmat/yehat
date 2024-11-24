import { Effect } from "effect";
import { NoSuchElementException } from "effect/Cause";

export const createShader = (type: GLenum) => (gl: WebGLRenderingContext) =>
  Effect.sync(() => gl.createShader(type)).pipe(
    Effect.flatMap(Effect.fromNullable),
    Effect.mapError(
      () => new NoSuchElementException("Failed to create WebGL shader")
    )
  );

export const shaderSource =
  (shaderSrc: string) => (gl: WebGLRenderingContext) => (shader: WebGLShader) =>
    Effect.try(() => gl.shaderSource(shader, shaderSrc)).pipe(
      Effect.mapBoth({
        onFailure: (error) =>
          new Error(`Failed to set shader source: ${error.error}`),
        onSuccess: () => shader,
      })
    );

export const compileShader =
  (gl: WebGLRenderingContext) => (shader: WebGLShader) =>
    Effect.try(() => gl.compileShader(shader)).pipe(
      Effect.mapBoth({
        onFailure: (error) =>
          new Error(`Failed to compile shader: ${error.error}`),
        onSuccess: () => shader,
      })
    );

export const attachShader =
  (program: WebGLProgram) =>
  (gl: WebGLRenderingContext) =>
  (shader: WebGLShader) =>
    Effect.try(() => gl.attachShader(program, shader)).pipe(
      Effect.mapBoth({
        onFailure: (error) =>
          new Error(`Failed to attach shader to program: ${error.error}`),
        onSuccess: () => program,
      })
    );
