import { Effect } from "effect";

export const getAttribLocation =
  (gl: WebGLRenderingContext) => (program: WebGLProgram) => (name: string) =>
    Effect.sync(() => gl.getAttribLocation(program, name));

export const vertexAttribPointer =
  (gl: WebGLRenderingContext) =>
  ({
    size,
    type,
    normalized,
    stride,
    offset,
  }: {
    size: number;
    type: number;
    normalized: boolean;
    stride: number;
    offset: number;
  }) =>
  (index: number) =>
    Effect.try(() =>
      gl.vertexAttribPointer(index, size, type, normalized, stride, offset)
    ).pipe(
      Effect.mapBoth({
        onFailure: (error) =>
          new Error(
            `Failed to bind the array buffer to vertex attribute: ${error.error}`
          ),
        onSuccess: () => index,
      })
    );

export const enableVertexAttribArray =
  (gl: WebGLRenderingContext) => (index: number) =>
    Effect.try(() => gl.enableVertexAttribArray(index)).pipe(
      Effect.mapError(
        (error) =>
          new Error(`Failed to enable vertex attribute array: ${error.error}`)
      )
    );
