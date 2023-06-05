import { Either } from "fp-ts/lib/Either";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { logF } from "./utils";

export const createShader =
  (gl: WebGLRenderingContext) =>
  (type: number): Either<string, WebGLShader> =>
    pipe(
      E.tryCatch(
        () => gl.createShader(type),
        (e) => `Error creating shader: ${e}`
      ),
      E.chain(E.fromNullable("Cannot create shader"))
    );

export const attachShader =
  (gl: WebGLRenderingContext) =>
  (program: WebGLProgram) =>
  (shader: WebGLShader): Either<string, void> =>
    E.tryCatch(
      () => gl.attachShader(program, shader),
      (e) => `Error attaching shader: ${e}`
    );

export const setShaderSource =
  (gl: WebGLRenderingContext) =>
  (source: string) =>
  (shader: WebGLShader): Either<string, void> =>
    E.tryCatch(
      () => gl.shaderSource(shader, source),
      (e) => `Error setting shader source: ${e}`
    );

export const compileShader =
  (gl: WebGLRenderingContext) =>
  (shader: WebGLShader): Either<string, void> =>
    pipe(
      E.tryCatch(
        () => gl.compileShader(shader),
        (e) => `Error compiling shader: ${e}`
      ),
      E.chain(
        E.fromPredicate(
          () => !!gl.getShaderParameter(shader, gl.COMPILE_STATUS),
          () => {
            console.log("VITUIKS MÄN", gl.getShaderInfoLog(shader));
            return `Error compiling shader: ${gl.getShaderInfoLog(shader)}`;
          }
        )
      )
    );

export const createProgram = (
  gl: WebGLRenderingContext
): Either<string, WebGLProgram> =>
  pipe(
    E.tryCatch(
      () => gl.createProgram(),
      (e) => `Error creating program: ${e}`
    ),
    E.chain(E.fromNullable("Cannot create shader program"))
  );

export const linkProgram =
  (gl: WebGLRenderingContext) =>
  (program: WebGLProgram): void => {
    gl.linkProgram(program);
  };
