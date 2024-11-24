import { Effect, pipe } from "effect";
import { NoSuchElementException } from "effect/Cause";

import {
  GameObject,
  GameObjectContext,
  Vector4,
  WglGameObject,
  YehatGlobal,
  YehatWglBuffer,
  YehatWglContext,
} from ".";

import { defaultFs } from "./shaders/defaultFs";
import { defaultVs } from "./shaders/defaultVs";

interface BaseModel {
  bgColor: Vector4.Vector4;
  gameObjects: GameObject.GameObject[];
}

export type WebGLModel<T extends BaseModel> = Omit<T, "gameObjects"> & {
  gameObjects: WglGameObject.WglGameObject[];
};

const toWebGLGameObject =
  (gl: WebGLRenderingContext) =>
  (
    gameObject: GameObject.GameObject
  ): Effect.Effect<
    WglGameObject.WglGameObject,
    NoSuchElementException,
    never
  > =>
    YehatWglBuffer.createBuffer(gl)().pipe(
      Effect.map((buffer) => ({
        ...gameObject,
        vertexCoordinatesBuffer: buffer,
      }))
    );

const toWebGLModel =
  (gl: WebGLRenderingContext) =>
  <T extends BaseModel>(
    model: T
  ): Effect.Effect<WebGLModel<T>, NoSuchElementException, never> =>
    Effect.all(model.gameObjects.map(toWebGLGameObject(gl))).pipe(
      Effect.map((gameObjects) => ({ ...model, gameObjects }))
    );

const updateGameObjectWebGLBuffers =
  (gl: WebGLRenderingContext) =>
  (
    gameObject: WglGameObject.WglGameObject
  ): Effect.Effect<WglGameObject.WglGameObject, Error, never> =>
    YehatWglBuffer.bindBuffer(gl)(WebGLRenderingContext.ARRAY_BUFFER)(
      gameObject.vertexCoordinatesBuffer
    ).pipe(
      Effect.flatMap(
        YehatWglBuffer.bufferData(gl)(WebGLRenderingContext.ARRAY_BUFFER)(
          WebGLRenderingContext.STATIC_DRAW
        )(new Float32Array(gameObject.vertexCoordinates))
      ),
      Effect.map((buffer) => ({
        ...gameObject,
        vertexCoordinatesBuffer: buffer,
      }))
    );

const updateModelWebGLBuffers =
  (gl: WebGLRenderingContext) =>
  <T extends BaseModel>(
    model: WebGLModel<T>
  ): Effect.Effect<WebGLModel<T>, Error, never> =>
    Effect.all(model.gameObjects.map(updateGameObjectWebGLBuffers(gl))).pipe(
      Effect.map((gameObjects) => ({ ...model, gameObjects }))
    );

const createWebGLModel =
  (gl: WebGLRenderingContext) =>
  <T extends BaseModel>(model: T) =>
    pipe(model, toWebGLModel(gl), Effect.flatMap(updateModelWebGLBuffers(gl)));

const view =
  (context: YehatWglContext.YehatWebGLContext) =>
  <T extends BaseModel>(model: WebGLModel<T>) => {
    return YehatWglContext.viewport({
      x: 0,
      y: 0,
      width: context.gl.canvas.width,
      height: context.gl.canvas.height,
    })(context).pipe(
      Effect.flatMap(YehatWglContext.clearColor(model.bgColor)),
      Effect.flatMap(
        YehatWglContext.clear(WebGLRenderingContext.COLOR_BUFFER_BIT)
      ),
      Effect.flatMap(YehatWglContext.enable(WebGLRenderingContext.BLEND)),
      Effect.flatMap(
        YehatWglContext.blendFunc(
          WebGLRenderingContext.SRC_ALPHA,
          WebGLRenderingContext.ONE_MINUS_SRC_ALPHA
        )
      ),
      Effect.flatMap((context) =>
        Effect.all(
          model.gameObjects.map((gameObject) =>
            pipe(
              gameObject,
              GameObjectContext.createGameObjectContext(context),
              GameObjectContext.useProgram,
              Effect.flatMap(
                GameObjectContext.setUniform2fv("uScalingFactor")("scale")
              ),
              Effect.flatMap(
                GameObjectContext.setUniform4fv("uGlobalColor")("color")
              ),
              Effect.flatMap(
                GameObjectContext.setUniform2fv("uRotationVector")("rotation")
              ),
              Effect.flatMap(
                GameObjectContext.setUniform2fv("uTranslationVector")(
                  "translation"
                )
              ),
              Effect.flatMap(
                GameObjectContext.setUniformBoolean("uHasTexture")("hasTexture")
              ),
              Effect.flatMap(
                GameObjectContext.setUniform1i("uTexture")("texture")
              ),
              Effect.flatMap(
                GameObjectContext.setUniform4fv("uColor")("color")
              ),
              Effect.flatMap(GameObjectContext.drawVertexArray)
            )
          )
        )
      ),
      Effect.map(() => model)
    );
  };

const tick =
  (context: YehatWglContext.YehatWebGLContext) =>
  <T extends BaseModel>(
    updateModel: (timestamp: number) => (model: WebGLModel<T>) => WebGLModel<T>
  ) =>
  (model: WebGLModel<T>): Effect.Effect<WebGLModel<T>, Error, never> =>
    YehatGlobal.getAnimationFrame().pipe(
      Effect.flatMap((timestamp) =>
        pipe(
          model,
          updateModel(timestamp),
          view(context),
          Effect.flatMap(tick(context)(updateModel))
        )
      )
    );

const start =
  <T extends BaseModel>(
    updateModel: (timestamp: number) => (model: WebGLModel<T>) => WebGLModel<T>
  ) =>
  (model: T) =>
  (context: YehatWglContext.YehatWebGLContext) =>
    createWebGLModel(context.gl)(model).pipe(
      Effect.flatMap(tick(context)(updateModel))
    );

export const initializeGame = (gl: WebGLRenderingContext) =>
  YehatWglContext.createYehatWebGLContext(gl).pipe(
    Effect.flatMap(YehatWglContext.addVertexShader(defaultVs)),
    Effect.flatMap(YehatWglContext.addFragmentShader(defaultFs)),
    Effect.flatMap(YehatWglContext.linkProgram)
  );

export const startGame =
  <T extends BaseModel>(
    updateModel: (timestamp: number) => (model: WebGLModel<T>) => WebGLModel<T>
  ) =>
  (model: T) =>
  (context: YehatWglContext.YehatWebGLContext) =>
    pipe(context, start(updateModel)(model));
