import * as A from "fp-ts/lib/Array";
import { Either } from "fp-ts/lib/Either";
import * as E from "fp-ts/lib/Either";
import {
  attachShader,
  compileShader,
  createProgram,
  createShader,
  setShaderSource,
} from "./webGL";
import { constant, flip, flow, pipe } from "fp-ts/lib/function";

export enum ShaderType {
  Vertex,
  Fragment,
}

export const shaderTypeToWebGLShaderType =
  (gl: WebGLRenderingContext) => (shaderType: ShaderType) =>
    shaderType === ShaderType.Vertex ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;

export interface YehatProgram {
  webGLRenderingContext: WebGLRenderingContext;
  webGLProgram: WebGLProgram;
}

export interface ShaderSource {
  type: ShaderType;
  source: string;
}

export const buildShader =
  (gl: WebGLRenderingContext) =>
  (shaderSource: ShaderSource): Either<string, WebGLShader> => {
    return pipe(
      shaderSource.type,
      shaderTypeToWebGLShaderType(gl),
      createShader(gl),
      E.map(setShaderSource(gl)(shaderSource.source)),
      E.map(compileShader(gl))
    );
  };

export const initializeShader =
  (yehatProgram: YehatProgram) =>
  (shaderSource: ShaderSource): Either<string, WebGLShader> => {
    return pipe(
      shaderSource,
      buildShader(yehatProgram.webGLRenderingContext),
      E.chain((shader) =>
        pipe(
          attachShader(yehatProgram.webGLRenderingContext)(
            yehatProgram.webGLProgram
          )(shader),
          E.map(constant(shader))
        )
      )
    );
  };

export const buildShaders =
  (shaderSources: ShaderSource[]) =>
  (yehatProgram: YehatProgram): Either<string, YehatProgram> =>
    pipe(
      shaderSources,
      A.map(initializeShader(yehatProgram)),
      A.reduce(E.right([]) as Either<string, WebGLShader[]>, (accE, shaderE) =>
        pipe(
          accE,
          E.chain((acc) => pipe(shaderE, E.map(flip(A.append)(acc))))
        )
      ),
      E.map(constant(yehatProgram))
    );

// Should implement getting the default shaders from TS files
export const getDefaultShaderSources = (): ShaderSource[] => [
  { type: ShaderType.Vertex, source: "" },
];

const createYehatProgram = (
  gl: WebGLRenderingContext
): Either<string, YehatProgram> =>
  pipe(
    gl,
    createProgram,
    E.map((program) => ({
      webGLRenderingContext: gl,
      webGLProgram: program,
    }))
  );

export const initializeYehatProgram =
  (gl: WebGLRenderingContext) =>
  (shaderSources: ShaderSource[]): Either<string, YehatProgram> =>
    pipe(gl, createYehatProgram, E.chain(buildShaders(shaderSources)));
