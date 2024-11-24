import { Effect } from "effect";
import { NoSuchElementException } from "effect/Cause";

export const createTexture = (
  gl: WebGLRenderingContext
): Effect.Effect<WebGLTexture, Error, never> => {
  return Effect.sync(() => gl.createTexture()).pipe(
    Effect.flatMap(Effect.fromNullable),
    Effect.mapError(
      () => new NoSuchElementException("Failed to create WebGL texture")
    )
  );
};

export const activateTexture =
  (gl: WebGLRenderingContext) =>
  (key: number) =>
  (texture: WebGLTexture): Effect.Effect<WebGLTexture, Error, never> =>
    key < 0 || key >= 32
      ? Effect.fail(new Error(`Texture number ${key} is not supported.`))
      : Effect.try(() =>
          gl.activeTexture(
            (gl as unknown as Record<string, number>)[`TEXTURE${key}`]
          )
        ).pipe(Effect.map(() => texture));

export const bindTexture =
  (gl: WebGLRenderingContext) =>
  (texture: WebGLTexture): Effect.Effect<WebGLTexture, Error, never> =>
    Effect.try(() => gl.bindTexture(gl.TEXTURE_2D, texture)).pipe(
      Effect.mapBoth({
        onFailure: (error) =>
          new Error(`Failed to bind texture: ${error.error}`),
        onSuccess: () => texture,
      })
    );

export const texImage2D =
  (gl: WebGLRenderingContext) =>
  (image: HTMLImageElement) =>
  (texture: WebGLTexture): Effect.Effect<WebGLTexture, Error, never> =>
    Effect.try(() =>
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    ).pipe(
      Effect.mapBoth({
        onFailure: (error) =>
          new Error(`Failed to set texture image: ${error.error}`),
        onSuccess: () => texture,
      })
    );

export const texParameteri =
  (gl: WebGLRenderingContext) =>
  (pname: GLenum) =>
  (param: GLint) =>
  (texture: WebGLTexture): Effect.Effect<WebGLTexture, Error, never> =>
    Effect.try(() => gl.texParameteri(gl.TEXTURE_2D, pname, param)).pipe(
      Effect.mapBoth({
        onFailure: (error) =>
          new Error(`Failed to set texture parameter: ${error.error}`),
        onSuccess: () => texture,
      })
    );
