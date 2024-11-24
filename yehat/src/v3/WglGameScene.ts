import { Array, Effect, pipe } from "effect";
import { NoSuchElementException } from "effect/Cause";

import { GameObject, Vector2, Vector4, WglGameObject } from ".";

export interface BaseGameScene {
  bgColor: Vector4.Vector4;
  textures: Map<number, string>;
  gameObjects: GameObject.GameObject[];
}

export type WglGameScene<T extends BaseGameScene> = Omit<T, "gameObjects"> & {
  screenSize: Vector2.Vector2;
  gameObjects: WglGameObject.WglGameObject[];
};

const gameObjectsToWglGameObjects =
  (gl: WebGLRenderingContext) =>
  <T extends BaseGameScene>(
    scene: T
  ): Effect.Effect<WglGameScene<T>, NoSuchElementException, never> =>
    pipe(
      Effect.all(scene.gameObjects.map(WglGameObject.toWglGameObject(gl))),
      Effect.map((gameObjects) => ({
        ...scene,
        screenSize: Vector2.make(gl.canvas.width, gl.canvas.height),
        gameObjects,
      }))
    );

export const toWglGameScene =
  (gl: WebGLRenderingContext) =>
  <T extends BaseGameScene>(
    scene: T
  ): Effect.Effect<WglGameScene<T>, NoSuchElementException, never> =>
    pipe(scene, gameObjectsToWglGameObjects(gl));
