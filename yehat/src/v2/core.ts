import { constant, flip, flow, pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import { Either } from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import * as T from "fp-ts/lib/Task";
import { Task } from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";

import { vec2, vec4 } from "gl-matrix";

import {
  attachShader,
  compileShader,
  createProgram,
  createShader,
  linkProgram,
  setShaderSource,
} from "./webGL";
import { tap, tapE } from "./utils";
import {
  addLoadEventListenerWithDefaults,
  getCanvasElement,
  getWebGLContext,
  requestAnimationFrameTask,
} from "./web";
import { defaultFs } from "./shaders/defaultFs";
import { defaultVs } from "./shaders/defaultVs";
import { createV4 } from "./math";

export enum ShaderType {
  Vertex,
  Fragment,
}

export enum DrawMode {
  Triangles,
  TriangleFan,
}

export interface ShaderSource {
  type: ShaderType;
  source: string;
}

export interface YehatContext {
  webGLRenderingContext: WebGLRenderingContext;
  webGLProgram: WebGLProgram;
}

export type GameData = Record<string, unknown>;

export const VertexNumComponents2D = 2;

export interface GameObject2DCreated {
  vertices: Float32Array;
  translation: vec2;
  scale: vec2;
  rotation: vec2;
  color: vec4;
  drawMode: DrawMode;
  texture: Option<number>;
  textureCoords: Float32Array;
}

export type GameObject2DInitialized = GameObject2DCreated & {
  vertexBuffer: WebGLBuffer;
  textureCoordBuffer: WebGLBuffer;
};

export type GameObject2D = GameObject2DCreated | GameObject2DInitialized;

export interface Texture {
  url: string;
}

export interface YehatScene2DCreated<T extends GameData = GameData> {
  isInitialized: false;
  clearColor: vec4;
  gameData: T;
  textures: Map<number, Texture>;
  gameObjects: GameObject2DCreated[];
}

export type YehatScene2DInitialized<T extends GameData = GameData> = Omit<
  YehatScene2DCreated<T>,
  "isInitialized" | "gameObjects"
> & {
  isInitialized: true;
  gameObjects: GameObject2DInitialized[];
  context: YehatContext;
};

export type YehatScene2D<T extends GameData = GameData> =
  | YehatScene2DCreated<T>
  | YehatScene2DInitialized<T>;

export const calculateAspectRatio = (gl: WebGLRenderingContext) =>
  gl.canvas.width / gl.canvas.height;

export const calculateVertexCount2D = (gameObject: GameObject2D) =>
  gameObject.vertices.length / VertexNumComponents2D;

export const toWebGLShaderType =
  (gl: WebGLRenderingContext) => (shaderType: ShaderType) =>
    shaderType === ShaderType.Vertex ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;

export const toWebGLDrawMode =
  (gl: WebGLRenderingContext) => (drawMode: DrawMode) => {
    switch (drawMode) {
      case DrawMode.Triangles:
        return gl.TRIANGLES;
      case DrawMode.TriangleFan:
        return gl.TRIANGLE_FAN;
      default:
        throw new Error(`Unsupported draw mode: ${drawMode}`);
    }
  };

export const buildShader =
  (gl: WebGLRenderingContext) =>
  (shaderSource: ShaderSource): Either<string, WebGLShader> => {
    return pipe(
      shaderSource.type,
      toWebGLShaderType(gl),
      createShader(gl),
      E.chain(tapE(setShaderSource(gl)(shaderSource.source))),
      E.chain(tapE(compileShader(gl)))
    );
  };

export const initializeShader =
  (yehatContext: YehatContext) =>
  (shaderSource: ShaderSource): Either<string, WebGLShader> => {
    return pipe(
      shaderSource,
      buildShader(yehatContext.webGLRenderingContext),
      E.chain((shader) =>
        pipe(
          shader,
          attachShader(yehatContext.webGLRenderingContext)(
            yehatContext.webGLProgram
          ),
          E.map(constant(shader))
        )
      )
    );
  };

export const buildShaders =
  (shaderSources: ShaderSource[]) =>
  (yehatContext: YehatContext): Either<string, YehatContext> =>
    pipe(
      shaderSources,
      A.map(initializeShader(yehatContext)),
      A.reduce(E.right([]) as Either<string, WebGLShader[]>, (accE, shaderE) =>
        pipe(
          accE,
          E.chain((acc) => pipe(shaderE, E.map(flip(A.append)(acc))))
        )
      ),
      E.map(constant(yehatContext))
    );

// Should implement getting the default shaders from TS files
export const getDefaultShaderSources = (): ShaderSource[] => [
  { type: ShaderType.Vertex, source: defaultVs },
  { type: ShaderType.Fragment, source: defaultFs },
];

const createYehatContext = (
  gl: WebGLRenderingContext
): Either<string, YehatContext> =>
  pipe(
    gl,
    createProgram,
    E.map((program) => {
      return {
        webGLRenderingContext: gl,
        webGLProgram: program,
      };
    })
  );

export const initializeYehatContext =
  (gl: WebGLRenderingContext) =>
  (shaderSources: ShaderSource[]): Either<string, YehatContext> =>
    pipe(
      gl,
      createYehatContext,
      E.chain(buildShaders(shaderSources)),
      E.map(
        tap((context) => {
          linkProgram(context.webGLRenderingContext)(context.webGLProgram);
        })
      )
    );

export const initializeDefaultYehatContext = (gl: WebGLRenderingContext) =>
  pipe(getDefaultShaderSources(), initializeYehatContext(gl));

const createBuffers =
  (gl: WebGLRenderingContext) =>
  (gameObject: GameObject2DCreated): Either<string, GameObject2DInitialized> =>
    pipe(
      gameObject,
      (go) => {
        return pipe(
          gl.createBuffer(),
          E.fromNullable("Cannot create buffer"),
          E.map((buffer) => [go, buffer] as const)
        );
      },
      E.chain((goAndBuffer) => {
        const [go, firstBuffer] = goAndBuffer;
        return pipe(
          gl.createBuffer(),
          E.fromNullable("Cannot create buffer"),
          E.map((buffer) => [go, firstBuffer, buffer] as const)
        );
      }),
      E.map((result) => {
        const [go, firstBuffer, secondBuffer] = result;
        return {
          ...go,
          vertexBuffer: firstBuffer,
          textureCoordBuffer: secondBuffer,
          initialized: true as const,
        };
      })
    );

const bindBuffers =
  (gl: WebGLRenderingContext) => (gameObject: GameObject2DInitialized) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gameObject.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, gameObject.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, gameObject.textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, gameObject.textureCoords, gl.STATIC_DRAW);
  };

const loadImage =
  (entry: [number, Texture]): Task<[number, Texture, HTMLImageElement]> =>
  () =>
    new Promise((resolve) => {
      const [key, { url }] = entry;
      const image = new Image();
      image.onload = () => {
        resolve([key, { url }, image]);
      };
      image.src = url;
    });

const getUnsafeCastValue = <TObj, TVal>(obj: TObj, key: string): TVal =>
  (obj as unknown as Record<string, TVal>)[key];

const initializeTexture =
  (gl: WebGLRenderingContext) =>
  (entry: [number, Texture, HTMLImageElement]): void => {
    const [key, , image] = entry;
    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    const webGLTexture = gl.createTexture();
    gl.activeTexture(getUnsafeCastValue(gl, `TEXTURE${key}`));
    gl.bindTexture(gl.TEXTURE_2D, webGLTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  };

const initializeTextures =
  <T extends GameData>(gl: WebGLRenderingContext) =>
  (scene: YehatScene2DCreated<T>): Task<YehatScene2DCreated<T>> =>
    pipe(
      scene.textures.entries(),
      Array.from<[number, Texture]>,
      tap(() => {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      }),
      A.map((entry) =>
        pipe(entry, loadImage, T.map(tap(initializeTexture(gl))))
      ),
      T.sequenceArray,
      T.map(() => scene)
    );

export const initializeDefaultScene2D =
  <T extends GameData>(gl: WebGLRenderingContext) =>
  (
    scene: YehatScene2DCreated<T>
  ): TaskEither<string, YehatScene2DInitialized<T>> =>
    pipe(
      scene,
      initializeTextures(gl),
      T.map((scene) => scene.gameObjects),
      T.map(A.map(flow(createBuffers(gl), E.map(tap(bindBuffers(gl)))))),
      T.map(A.sequence(E.Monad)),
      TE.chain((gameObjects) =>
        pipe(
          initializeDefaultYehatContext(gl),
          E.map((context) => ({
            ...scene,
            isInitialized: true as const,
            gameObjects,
            context,
          })),
          TE.fromEither
        )
      )
    );

export const drawScene = <T extends GameData>(
  scene: YehatScene2DInitialized<T>
) => {
  const {
    clearColor = createV4(0, 0, 0, 0),
    context: { webGLRenderingContext: gl, webGLProgram: program },
    gameObjects,
  } = scene;

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  const [r, g, b, a] = clearColor;
  gl.clearColor(r, g, b, a);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // This here is to allow transparency for the textures (sprites mostly)
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  for (const gameObject of gameObjects) {
    gl.useProgram(program);

    const uScalingFactor = gl.getUniformLocation(program, "uScalingFactor");
    const uGlobalColor = gl.getUniformLocation(program, "uGlobalColor");
    const uRotationVector = gl.getUniformLocation(program, "uRotationVector");
    const uTranslationVector = gl.getUniformLocation(
      program,
      "uTranslationVector"
    );
    const uHasTexture = gl.getUniformLocation(program, "uHasTexture");
    const uTexture = gl.getUniformLocation(program, "uTexture");

    gl.uniform2fv(uScalingFactor, gameObject.scale);
    gl.uniform2fv(uRotationVector, gameObject.rotation);
    gl.uniform2fv(uTranslationVector, gameObject.translation);
    gl.uniform4fv(uGlobalColor, gameObject.color);
    gl.uniform1i(uHasTexture, gameObject.texture._tag === "Some" ? 1 : 0);
    gl.uniform1i(
      uTexture,
      gameObject.texture._tag === "Some" ? gameObject.texture.value : 0
    );

    const aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
    const aTextureCoord = gl.getAttribLocation(program, "aTextureCoord");

    gl.bindBuffer(gl.ARRAY_BUFFER, gameObject.vertexBuffer);
    gl.vertexAttribPointer(
      aVertexPosition,
      VertexNumComponents2D,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(aVertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, gameObject.textureCoordBuffer);
    gl.vertexAttribPointer(
      aTextureCoord,
      VertexNumComponents2D,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(aTextureCoord);

    gl.drawArrays(
      toWebGLDrawMode(gl)(gameObject.drawMode),
      0,
      calculateVertexCount2D(gameObject)
    );
  }

  return scene;
};

const updateCurrentTime =
  <T extends GameData>(sceneE: Either<string, YehatScene2DInitialized<T>>) =>
  (currentTime: number) =>
    pipe(
      sceneE,
      E.map(
        (scene): YehatScene2DInitialized<T> => ({
          ...scene,
          gameData: { ...scene.gameData, currentTime },
        })
      )
    );

export const processGameTick =
  <T extends GameData>(
    updateScene: (s: YehatScene2DInitialized<T>) => YehatScene2DInitialized<T>
  ) =>
  (
    sceneTE: Either<string, YehatScene2DInitialized<T>>
  ): TaskEither<string, YehatScene2DInitialized<T>> =>
    pipe(
      sceneTE,
      E.map(updateScene),
      E.map(drawScene),
      TE.fromEither,
      T.chain((sceneE) =>
        pipe(requestAnimationFrameTask, T.map(updateCurrentTime(sceneE)))
      ),
      T.chain(processGameTick(updateScene))
    );

export type Startup = (
  gl: WebGLRenderingContext
) => TaskEither<string, unknown>;

const onLoad =
  (canvasE: Either<string, HTMLCanvasElement>) => (startup: Startup) => () =>
    pipe(
      canvasE,
      E.chain(getWebGLContext),
      TE.fromEither,
      TE.chain(startup),
      TE.mapLeft((error) => {
        throw new Error(error);
      })
    )();

export const loadGame =
  (window: Window) => (canvasSelector: string) => (startup: Startup) =>
    pipe(
      window,
      addLoadEventListenerWithDefaults(
        onLoad(getCanvasElement(canvasSelector)(document))(startup)
      )
    );

// Print and debug

export const printScene = (
  scene: YehatScene2DInitialized
): YehatScene2DInitialized => {
  console.log("HALOO", scene);
  return scene;
};

// Colors

export const rgb = (r: number, b: number, g: number) =>
  createV4(r / 255, b / 255, g / 255, 1.0);
