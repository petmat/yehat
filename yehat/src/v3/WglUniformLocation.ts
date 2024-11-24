import { Effect } from "effect";

export const getUniformLocation =
  (gl: WebGLRenderingContext) =>
  (uniformName: string) =>
  (program: WebGLProgram) =>
    Effect.try(() => gl.getUniformLocation(program, uniformName)).pipe(
      Effect.flatMap(Effect.fromNullable),
      Effect.mapError(
        () => new Error(`Failed to get uniform location: ${uniformName}`)
      )
    );

export const uniform2fv =
  (gl: WebGLRenderingContext) =>
  (value: [number, number]) =>
  (uniform: WebGLUniformLocation) =>
    Effect.try(() => gl.uniform2fv(uniform, value)).pipe(
      Effect.mapBoth({
        onFailure: (error) =>
          new Error(`Failed to set uniform2fv: ${error.error}`),
        onSuccess: () => uniform,
      })
    );

export const uniform4fv =
  (gl: WebGLRenderingContext) =>
  (value: [number, number, number, number]) =>
  (uniform: WebGLUniformLocation) =>
    Effect.try(() => gl.uniform4fv(uniform, value)).pipe(
      Effect.mapBoth({
        onFailure: (error) =>
          new Error(`Failed to set uniform4fv: ${error.error}`),
        onSuccess: () => uniform,
      })
    );

export const uniform1i =
  (gl: WebGLRenderingContext) =>
  (value: number) =>
  (uniform: WebGLUniformLocation) =>
    Effect.try(() => gl.uniform1i(uniform, value)).pipe(
      Effect.mapBoth({
        onFailure: (error) =>
          new Error(`Failed to set uniform1i: ${error.error}`),
        onSuccess: () => uniform,
      })
    );
