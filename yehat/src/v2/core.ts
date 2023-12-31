import { constant, flip, flow, pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import { Either } from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";
import * as T from "fp-ts/lib/Task";
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
  addKeydownEventListener,
  addKeyupEventListener,
  addLoadEventListener,
  getCanvasElement,
  getWebGLContext,
  requestAnimationFrameTask,
} from "./web";
import { defaultFs } from "./shaders/defaultFs";
import { defaultVs } from "./shaders/defaultVs";
import {
  addArray,
  createV4,
  equalsV2,
  inverse,
  multiplyArray,
  reciprocal,
  rightV2,
} from "./math";
import type { GameObject2D, Texture } from "./gameObject";
import { DrawMode, bindBuffers, createBuffers } from "./gameObject";
import { Lens } from "monocle-ts";

export enum ShaderType {
  Vertex,
  Fragment,
}

export interface ShaderSource {
  type: ShaderType;
  source: string;
}

export interface YehatContext {
  webGLRenderingContext: WebGLRenderingContext;
  webGLProgram: WebGLProgram;
}

export const VertexNumComponents2D = 2;

export type KeyboardStateMap = Record<string, boolean>;

export interface YehatScene2D<T> {
  gameData: T;
  gameObjects: GameObject2D[];
  textures: Map<number, Texture>;
  clearColor: vec4;
  previousTime: number;
  currentTime: number;
  keysHandled: KeyboardStateMap;
  animationInterval: number;
  webGLRenderingContext: WebGLRenderingContext;
  yehatContext: Option<YehatContext>;
}

export interface YehatScene2DOptions<T> {
  gameData: T;
  gameObjects: GameObject2D[];
  textures?: Map<number, Texture>;
  clearColor?: vec4;
  animationInterval?: number;
}

export interface InitOptions<T> {
  window: Window;
  canvasId: string;
  createScene: CreateScene2DFn<T>;
  updateScene: UpdateScene2DFn<T>;
}

export const previousTime =
  Lens.fromProp<YehatScene2D<unknown>>()("previousTime");

export const currentTime =
  Lens.fromProp<YehatScene2D<unknown>>()("currentTime");

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
      case DrawMode.Points:
        return gl.POINTS;
      default:
        throw new Error(`Unsupported draw mode: ${drawMode}`);
    }
  };

export const createYehat2DScene =
  (gl: WebGLRenderingContext) =>
  <T>(options: YehatScene2DOptions<T>): YehatScene2D<T> => ({
    gameData: options.gameData,
    gameObjects: options.gameObjects,
    textures: options.textures ?? new Map<number, Texture>(),
    clearColor: options.clearColor ?? createV4(0, 0, 0, 1),
    currentTime: 0,
    previousTime: 0,
    keysHandled: {},
    animationInterval: options.animationInterval ?? 1000 / 12,
    webGLRenderingContext: gl,
    yehatContext: O.none,
  });

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

const loadImage = (
  entry: [number, Texture]
): TaskEither<string, [number, Texture, HTMLImageElement]> =>
  TE.tryCatch(
    () =>
      new Promise((resolve, reject) => {
        const [key, { url }] = entry;
        const image = new Image();
        image.onload = () => {
          resolve([key, { url }, image]);
        };
        image.onerror = () => {
          reject(new Error(`Failed to load image ${url} (Texture ${key})`));
        };
        image.src = url;
      }),
    (err) => (err as Error).message
  );

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
  <T>(gl: WebGLRenderingContext) =>
  (scene: YehatScene2D<T>): TaskEither<string, YehatScene2D<T>> =>
    pipe(
      scene.textures.entries(),
      Array.from<[number, Texture]>,
      tap(() => {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      }),
      A.map((entry) =>
        pipe(entry, loadImage, TE.map(tap(initializeTexture(gl))))
      ),
      TE.sequenceArray,
      TE.map(() => scene)
    );

export const initializeDefaultScene2D =
  <T>(gl: WebGLRenderingContext) =>
  (scene: YehatScene2D<T>): TaskEither<string, YehatScene2D<T>> =>
    pipe(
      scene,
      initializeTextures(gl),
      TE.chain((scene) =>
        pipe(
          scene.gameObjects,
          A.map(flow(createBuffers(gl), E.map(tap(bindBuffers(gl))))),
          A.sequence(E.Monad),
          TE.fromEither
        )
      ),
      TE.chain((gameObjects) =>
        pipe(
          initializeDefaultYehatContext(gl),
          TE.fromEither,
          TE.map(
            (context): YehatScene2D<T> => ({
              ...scene,
              clearColor: scene.clearColor,
              gameObjects,
              yehatContext: O.some(context),
            })
          )
        )
      )
    );

export const drawScene = <T>(scene: YehatScene2D<T>) => {
  const {
    clearColor = createV4(0, 0, 0, 0),
    yehatContext: contextOption,
    gameObjects,
  } = scene;

  pipe(
    contextOption,
    O.map((context) => {
      const { webGLRenderingContext: gl, webGLProgram: program } = context;
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
        const uRotationVector = gl.getUniformLocation(
          program,
          "uRotationVector"
        );
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

        const aVertexPosition = gl.getAttribLocation(
          program,
          "aVertexPosition"
        );
        const aTextureCoord = gl.getAttribLocation(program, "aTextureCoord");
        pipe(
          gameObject.vertexBuffer,
          O.fold(
            () => {
              throw new Error("Oh noes");
            },
            (vertexBuffer) => {
              gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            }
          )
        );

        gl.vertexAttribPointer(
          aVertexPosition,
          VertexNumComponents2D,
          gl.FLOAT,
          false,
          0,
          0
        );
        gl.enableVertexAttribArray(aVertexPosition);

        pipe(
          gameObject.textureCoordBuffer,
          O.fold(
            () => {
              throw new Error("Oh noes");
            },
            (textureCoordBuffer) => {
              gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
            }
          )
        );

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
    })
  );

  return scene;
};

const updateTime =
  <T>(scene: YehatScene2D<T>) =>
  (currentTime: number): YehatScene2D<T> => ({
    ...scene,
    previousTime: scene.currentTime,
    currentTime,
  });

export const processGameTick =
  (gl: WebGLRenderingContext) =>
  <T>(
    updateScene: (
      gl: WebGLRenderingContext
    ) => (s: YehatScene2D<T>) => YehatScene2D<T>
  ) =>
  (scene: YehatScene2D<T>): TaskEither<string, YehatScene2D<T>> =>
    pipe(
      scene,
      updateScene(gl),
      drawScene,
      (scene) =>
        pipe(
          requestAnimationFrameTask,
          T.map(updateTime(scene)),
          TE.fromTask<YehatScene2D<T>, string>
        ),
      TE.chain(processGameTick(gl)(updateScene))
    );

export type StartupFn = (
  gl: WebGLRenderingContext
) => TaskEither<string, unknown>;

const onLoad =
  (canvasE: Either<string, HTMLCanvasElement>) => (startup: StartupFn) => () =>
    pipe(
      canvasE,
      E.chain(getWebGLContext),
      TE.fromEither,
      TE.chain(startup),
      TE.mapLeft((error) => {
        console.error(error);
      })
    )();

export const runGame =
  (window: Window) => (canvasSelector: string) => (startup: StartupFn) =>
    pipe(
      window,
      addLoadEventListener(
        onLoad(getCanvasElement(canvasSelector)(document))(startup)
      )
    );

const startup =
  <T>(initOptions: InitOptions<T>) =>
  (gl: WebGLRenderingContext) => {
    return pipe(
      {
        initializeScene: initializeDefaultScene2D,
        updateScene: initOptions.updateScene,
      },
      pipe(initOptions.createScene, createGame(gl))
    );
  };

export const startGame = <T>(initOptions: InitOptions<T>): void => {
  pipe(startup(initOptions), pipe("#glcanvas", runGame(window)));
};

export type CreateScene2DFn<T> = (gl: WebGLRenderingContext) => YehatScene2D<T>;

export type InitializeScene2DFn<T> = (
  gl: WebGLRenderingContext
) => (scene: YehatScene2D<T>) => TE.TaskEither<string, YehatScene2D<T>>;

export type UpdateScene2DFn<T> = (
  gl: WebGLRenderingContext
) => (scene: YehatScene2D<T>) => YehatScene2D<T>;

export interface GameOptions<T> {
  initializeScene: InitializeScene2DFn<T>;
  updateScene: UpdateScene2DFn<T>;
}

export const createGame =
  (gl: WebGLRenderingContext) =>
  <T>(createScene: CreateScene2DFn<T>) =>
  ({ initializeScene, updateScene }: GameOptions<T>) =>
    pipe(
      gl,
      createScene,
      initializeScene(gl),
      TE.chain(pipe(updateScene, processGameTick(gl)))
    );

// Keyboard

let keysDown: KeyboardStateMap = {};

export const isKeyDown = (key: string): boolean => !!keysDown[key];

export const setIsKeyDown =
  (isDown: boolean) =>
  (key: string): void => {
    keysDown = { ...keysDown, [key]: isDown };
  };

export const addKeyListeners = (window: Window) => {
  pipe(
    window,
    addKeydownEventListener((event) => pipe(event.key, setIsKeyDown(true)))
  );
  pipe(
    window,
    addKeyupEventListener((event) => pipe(event.key, setIsKeyDown(false)))
  );
};
