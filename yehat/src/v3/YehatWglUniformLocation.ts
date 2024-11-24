import { Effect } from "effect";

import * as WglUniformLocation from "./WglUniformLocation";

// This uniform location type is used instead of the WebGLUniformLocation to provide more type safety.
export type YehatWglUniformLocation = WebGLUniformLocation & {
  readonly _brand: "YehatWglUniformLocation";
};

export type UniformSetter<T> = (
  gl: WebGLRenderingContext
) => (
  value: T
) => (
  uniform: YehatWglUniformLocation
) => Effect.Effect<YehatWglUniformLocation, Error, never>;

export const getUniformLocation =
  (gl: WebGLRenderingContext) =>
  (uniformName: string) =>
  (
    program: WebGLProgram
  ): Effect.Effect<YehatWglUniformLocation, Error, never> =>
    WglUniformLocation.getUniformLocation(gl)(uniformName)(program).pipe(
      Effect.map(
        (webGLUniformLocation) =>
          webGLUniformLocation as YehatWglUniformLocation
      )
    );

export const uniform2fv =
  (gl: WebGLRenderingContext) =>
  (value: [number, number]) =>
  (uniform: YehatWglUniformLocation) =>
    WglUniformLocation.uniform2fv(gl)(value)(uniform).pipe(
      Effect.map(() => uniform)
    );

export const uniform4fv =
  (gl: WebGLRenderingContext) =>
  (value: [number, number, number, number]) =>
  (uniform: YehatWglUniformLocation) =>
    WglUniformLocation.uniform4fv(gl)(value)(uniform).pipe(
      Effect.map(() => uniform)
    );

export const uniform1i =
  (gl: WebGLRenderingContext) =>
  (value: number) =>
  (uniform: YehatWglUniformLocation) =>
    WglUniformLocation.uniform1i(gl)(value)(uniform).pipe(
      Effect.map(() => uniform)
    );
