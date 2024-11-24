import { Effect, Option, pipe } from "effect";

import {
  GameObjectContext,
  Vector2,
  WglGameObject,
  WglGameScene,
  WglTexture,
  YehatGlobal,
  YehatHTMLImageElement,
  YehatWglBuffer,
  YehatWglContext,
} from ".";

import { defaultFs } from "./shaders/defaultFs";
import { defaultVs } from "./shaders/defaultVs";
import { YehatWebGLContext } from "./YehatWglContext";

const updateGameObjectWebGLBuffers =
  (gl: WebGLRenderingContext) =>
  (
    gameObject: WglGameObject.WglGameObject
  ): Effect.Effect<WglGameObject.WglGameObject, Error, never> =>
    Effect.all(
      [
        {
          buffer: gameObject.vertexCoordinatesBuffer,
          data: gameObject.vertexCoordinates,
        },
        {
          buffer: gameObject.textureCoordinatesBuffer,
          data: gameObject.textureCoordinates,
        },
      ].map(({ buffer, data }) =>
        YehatWglBuffer.bindBuffer(gl)(WebGLRenderingContext.ARRAY_BUFFER)(
          buffer
        ).pipe(
          Effect.flatMap(
            YehatWglBuffer.bufferData(gl)(WebGLRenderingContext.ARRAY_BUFFER)(
              WebGLRenderingContext.STATIC_DRAW
            )(new Float32Array(data))
          )
        )
      )
    ).pipe(Effect.map(() => gameObject));

const updateSceneWebGLBuffers =
  (gl: WebGLRenderingContext) =>
  <T extends WglGameScene.BaseGameScene>(
    scene: WglGameScene.WglGameScene<T>
  ): Effect.Effect<WglGameScene.WglGameScene<T>, Error, never> =>
    Effect.all(scene.gameObjects.map(updateGameObjectWebGLBuffers(gl))).pipe(
      Effect.map((gameObjects) => ({ ...scene, gameObjects }))
    );

const loadTextures =
  (gl: WebGLRenderingContext) =>
  <T extends WglGameScene.BaseGameScene>(scene: T) => {
    return Effect.all(
      Array.from(scene.textures.entries()).map(([key, url]) => {
        return pipe(
          url,
          YehatHTMLImageElement.load,
          Effect.flatMap((image) =>
            WglTexture.createTexture(gl).pipe(
              Effect.map((texture) => [texture, image] as const)
            )
          ),
          Effect.flatMap(([texture, image]) =>
            WglTexture.activateTexture(gl)(key)(texture).pipe(
              Effect.map(() => [texture, image] as const)
            )
          ),
          Effect.flatMap(([texture, image]) =>
            WglTexture.bindTexture(gl)(texture).pipe(
              Effect.map(() => [texture, image] as const)
            )
          ),
          Effect.flatMap(([texture, image]) =>
            WglTexture.texImage2D(gl)(image)(texture)
          ),
          Effect.flatMap(
            WglTexture.texParameteri(gl)(gl.TEXTURE_WRAP_S)(gl.REPEAT)
          ),
          Effect.flatMap(
            WglTexture.texParameteri(gl)(gl.TEXTURE_WRAP_T)(gl.REPEAT)
          ),
          Effect.flatMap(
            WglTexture.texParameteri(gl)(gl.TEXTURE_MIN_FILTER)(gl.NEAREST)
          ),
          Effect.flatMap(
            WglTexture.texParameteri(gl)(gl.TEXTURE_MAG_FILTER)(gl.NEAREST)
          )
        );
      })
    ).pipe(Effect.map(() => scene));
  };

const createWebGLScene =
  (gl: WebGLRenderingContext) =>
  <T extends WglGameScene.BaseGameScene>(scene: T) =>
    pipe(
      scene,
      WglGameScene.toWglGameScene(gl),
      Effect.flatMap(loadTextures(gl)),
      Effect.flatMap(updateSceneWebGLBuffers(gl))
    );

const sizeToScale = (
  [scaleX, scaleY]: Vector2.Vector2,
  context: GameObjectContext.GameObjectContext
) =>
  Vector2.make(
    scaleX / context.gl.canvas.width,
    scaleY / context.gl.canvas.height
  );

const positionToTranslation =
  (size: Vector2.Vector2) =>
  (pos: Vector2.Vector2, context: GameObjectContext.GameObjectContext) =>
    pipe(
      pos,
      ([x, y]) =>
        Vector2.make(
          (x + size[0] / 2) / context.gl.canvas.width,
          (y + size[1] / 2) / context.gl.canvas.height
        ),
      ([x, y]) => Vector2.make(x * 2 - 1, y * 2 - 1)
    );

export const renderScene =
  (context: YehatWglContext.YehatWebGLContext) =>
  <T extends WglGameScene.BaseGameScene>(model: WglGameScene.WglGameScene<T>) =>
    YehatWglContext.viewport({
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
                GameObjectContext.setUniform2fv("uScalingFactor")((ctx) =>
                  sizeToScale(ctx.gameObject.size, ctx)
                )
              ),
              Effect.flatMap(
                GameObjectContext.setUniform4fv("uGlobalColor")(
                  (ctx) => ctx.gameObject.color
                )
              ),
              Effect.flatMap(
                GameObjectContext.setUniform2fv("uRotationVector")(
                  (ctx) => ctx.gameObject.rotation
                )
              ),
              Effect.flatMap(
                GameObjectContext.setUniform2fv("uTranslationVector")((ctx) =>
                  positionToTranslation(ctx.gameObject.size)(
                    ctx.gameObject.position,
                    ctx
                  )
                )
              ),
              Effect.flatMap(
                GameObjectContext.setUniform1i("uHasTexture")((ctx) =>
                  Option.isSome(ctx.gameObject.texture) ? 1 : 0
                )
              ),
              Effect.flatMap(
                GameObjectContext.setUniform1i("uTexture")((ctx) =>
                  Option.isSome(ctx.gameObject.texture)
                    ? ctx.gameObject.texture.value
                    : 0
                )
              ),
              Effect.flatMap(
                GameObjectContext.setUniform4fv("uColor")(
                  (ctx) => ctx.gameObject.color
                )
              ),
              Effect.flatMap(GameObjectContext.enableVertexArray),
              Effect.flatMap(GameObjectContext.enableTextureCoordinateArray),
              Effect.flatMap(GameObjectContext.drawArrays)
            )
          )
        )
      ),
      Effect.map(() => model)
    );

const tick =
  <T extends WglGameScene.BaseGameScene>(
    context: YehatWglContext.YehatWebGLContext
  ) =>
  (updateModel: UpdateSceneFN<T>) =>
  (renderScene: RenderSceneFN<T>) =>
  (
    model: WglGameScene.WglGameScene<T>
  ): Effect.Effect<WglGameScene.WglGameScene<T>, Error, never> =>
    YehatGlobal.getAnimationFrame().pipe(
      Effect.flatMap((timestamp) =>
        pipe(
          model,
          updateModel(timestamp),
          renderScene(context),
          Effect.flatMap(tick<T>(context)(updateModel)(renderScene))
        )
      )
    );

const initializeGame = (gl: WebGLRenderingContext) =>
  YehatWglContext.createYehatWebGLContext(gl).pipe(
    Effect.flatMap(YehatWglContext.addVertexShader(defaultVs)),
    Effect.flatMap(YehatWglContext.addFragmentShader(defaultFs)),
    Effect.flatMap(YehatWglContext.linkProgram)
  );

export type CreateSceneFN<T extends WglGameScene.BaseGameScene> = () => T;

export type UpdateSceneFN<T extends WglGameScene.BaseGameScene> = (
  timestamp: number
) => (model: WglGameScene.WglGameScene<T>) => WglGameScene.WglGameScene<T>;

export type RenderSceneFN<T extends WglGameScene.BaseGameScene> = (
  context: YehatWebGLContext
) => (
  scene: WglGameScene.WglGameScene<T>
) => Effect.Effect<WglGameScene.WglGameScene<T>, Error, never>;

export const runGame =
  <T extends WglGameScene.BaseGameScene>(createScene: CreateSceneFN<T>) =>
  (updateScene: UpdateSceneFN<T>) =>
  (renderScene: RenderSceneFN<T>) =>
  (gl: WebGLRenderingContext) =>
    initializeGame(gl).pipe(
      Effect.flatMap((context) =>
        createWebGLScene(context.gl)(createScene()).pipe(
          Effect.flatMap(tick<T>(context)(updateScene)(renderScene))
        )
      )
    );
