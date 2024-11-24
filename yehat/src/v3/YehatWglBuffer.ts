import { Effect } from "effect";
import { NoSuchElementException } from "effect/Cause";

import * as WebGLBuffer from "./WglBuffer";

// This buffer type is used instead of the WebGLBuffer to provide more type safety.
export type YehatWglBuffer = WebGLBuffer & {
  readonly _brand: "YehatWglBuffer";
};

export const createBuffer =
  (gl: WebGLRenderingContext) =>
  (): Effect.Effect<YehatWglBuffer, NoSuchElementException, never> =>
    WebGLBuffer.createBuffer(gl).pipe(
      Effect.map((webGLBuffer) => webGLBuffer as YehatWglBuffer)
    );

export const bindBuffer =
  (gl: WebGLRenderingContext) =>
  (target: GLenum) =>
  (buffer: YehatWglBuffer): Effect.Effect<YehatWglBuffer, Error, never> =>
    WebGLBuffer.bindBuffer(gl)(target)(buffer).pipe(Effect.map(() => buffer));

export const bufferData =
  (gl: WebGLRenderingContext) =>
  (target: GLenum) =>
  (usage: GLenum) =>
  (data: ArrayBuffer | null) =>
  (buffer: YehatWglBuffer): Effect.Effect<YehatWglBuffer, Error, never> =>
    WebGLBuffer.bufferData(gl)(target)(usage)(data)(buffer).pipe(
      Effect.map(() => buffer)
    );
