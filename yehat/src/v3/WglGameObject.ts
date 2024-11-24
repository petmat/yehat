import { Effect } from "effect";
import { GameObject, YehatWglBuffer } from ".";
import { NoSuchElementException } from "effect/Cause";

export type WglGameObject = GameObject.GameObject & {
  vertexCoordinatesBuffer: YehatWglBuffer.YehatWglBuffer;
  textureCoordinatesBuffer: YehatWglBuffer.YehatWglBuffer;
};

export const toWglGameObject =
  (gl: WebGLRenderingContext) =>
  (
    gameObject: GameObject.GameObject
  ): Effect.Effect<WglGameObject, NoSuchElementException, never> =>
    Effect.all([
      YehatWglBuffer.createBuffer(gl)(),
      YehatWglBuffer.createBuffer(gl)(),
    ]).pipe(
      Effect.map(([vertexCoordinatesBuffer, textureCoordinatesBuffer]) => ({
        ...gameObject,
        vertexCoordinatesBuffer,
        textureCoordinatesBuffer,
      }))
    );
